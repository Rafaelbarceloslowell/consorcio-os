import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"

const appUrl = process.env.R2_APP_URL
const cdpPort = Number(process.env.R2_CDP_PORT)
const gateDir = process.env.R2_GATE_DIR
const evidenceDir = path.join(gateDir, "evidence-final")
const reportPath = path.join(
  gateDir,
  "R2_BROWSER_RELEASE_GATE_FINAL_V1.json",
)

const expectedClips = {
  neutral: "R2_NEUTRAL",
  idle: "R2_IDLE",
  working: "R2_WORKING",
  listening: "R2_LISTENING",
  thinking: "R2_THINKING",
  awaiting_action: "R2_AWAITING_ACTION",
  alert: "R2_ALERT",
  speaking: "R2_IDLE",
  celebrating_sale: "R2_CELEBRATING_SALE",
  error_attention: "R2_ERROR_ATTENTION",
}

const canonicalStates = Object.keys(expectedClips)

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds))

const sha256 = (buffer) =>
  crypto.createHash("sha256").update(buffer).digest("hex").toUpperCase()

async function waitFor(condition, timeoutMs, description) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const value = await condition()

      if (value) {
        return value
      }
    } catch {
      // A página pode estar compilando ou recarregando.
    }

    await sleep(100)
  }

  throw new Error(`Timeout aguardando: ${description}`)
}

class CdpClient {
  constructor(webSocketUrl) {
    this.webSocketUrl = webSocketUrl
    this.socket = null
    this.nextId = 1
    this.pending = new Map()
    this.handlers = new Map()
  }

  async connect() {
    this.socket = new WebSocket(this.webSocketUrl)

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Timeout conectando ao CDP.")),
        15_000,
      )

      this.socket.addEventListener("open", () => {
        clearTimeout(timeout)
        resolve()
      })

      this.socket.addEventListener("error", (event) => {
        clearTimeout(timeout)
        reject(new Error(`Falha WebSocket CDP: ${String(event)}`))
      })
    })

    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data))

      if (message.id) {
        const pending = this.pending.get(message.id)

        if (!pending) return

        this.pending.delete(message.id)

        if (message.error) {
          pending.reject(
            new Error(
              `${message.error.code}: ${message.error.message}`,
            ),
          )
        } else {
          pending.resolve(message.result)
        }

        return
      }

      const handlers = this.handlers.get(message.method) ?? []

      for (const handler of handlers) {
        handler(message.params)
      }
    })
  }

  on(method, handler) {
    const handlers = this.handlers.get(method) ?? []
    handlers.push(handler)
    this.handlers.set(method, handlers)
  }

  send(method, params = {}) {
    const id = this.nextId++

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })

      this.socket.send(
        JSON.stringify({
          id,
          method,
          params,
        }),
      )
    })
  }

  close() {
    this.socket?.close()
  }
}

async function getJson(url) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${url}`)
  }

  return response.json()
}

async function captureScreenshot(client, name, clip = null) {
  const result = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
    ...(clip
      ? {
          clip: {
            x: clip.x,
            y: clip.y,
            width: clip.width,
            height: clip.height,
            scale: 1,
          },
        }
      : {}),
  })

  const buffer = Buffer.from(result.data, "base64")
  const filePath = path.join(evidenceDir, name)

  fs.writeFileSync(filePath, buffer)

  return {
    path: path.relative(gateDir, filePath).replaceAll("\\", "/"),
    bytes: buffer.length,
    sha256: sha256(buffer),
  }
}

async function main() {
  fs.mkdirSync(evidenceDir, { recursive: true })

  const browserVersion = await waitFor(
    () =>
      getJson(
        `http://127.0.0.1:${cdpPort}/json/version`,
      ),
    30_000,
    "endpoint CDP",
  )

  const targets = await getJson(
    `http://127.0.0.1:${cdpPort}/json/list`,
  )

  const pageTarget = targets.find(
    (target) =>
      target.type === "page" &&
      target.webSocketDebuggerUrl,
  )

  if (!pageTarget) {
    throw new Error("Nenhum target de página encontrado no Edge.")
  }

  const client = new CdpClient(
    pageTarget.webSocketDebuggerUrl,
  )

  await client.connect()

  const consoleErrors = []
  const failedRequests = []
  const glbResponses = []

  client.on("Runtime.exceptionThrown", (params) => {
    consoleErrors.push({
      type: "exception",
      description:
        params.exceptionDetails?.exception?.description ??
        params.exceptionDetails?.text ??
        "Runtime exception",
    })
  })

  client.on("Runtime.consoleAPICalled", (params) => {
    if (params.type !== "error") return

    consoleErrors.push({
      type: "console.error",
      values: params.args.map(
        (argument) =>
          argument.value ??
          argument.description ??
          argument.type,
      ),
    })
  })

  client.on("Log.entryAdded", (params) => {
    if (params.entry.level !== "error") return

    consoleErrors.push({
      type: "log",
      text: params.entry.text,
      url: params.entry.url ?? null,
    })
  })

  client.on("Network.loadingFailed", (params) => {
    failedRequests.push({
      requestId: params.requestId,
      errorText: params.errorText,
      canceled: Boolean(params.canceled),
    })
  })

  client.on("Network.responseReceived", (params) => {
    const url = params.response.url

    if (!url.endsWith(".glb")) return

    glbResponses.push({
      url,
      status: params.response.status,
      mimeType: params.response.mimeType,
      fromDiskCache: params.response.fromDiskCache,
    })
  })

  await Promise.all([
    client.send("Page.enable"),
    client.send("Runtime.enable"),
    client.send("Network.enable"),
    client.send("Log.enable"),
  ])

  const evaluate = async (expression) => {
    const response = await client.send(
      "Runtime.evaluate",
      {
        expression,
        awaitPromise: true,
        returnByValue: true,
      },
    )

    if (response.exceptionDetails) {
      throw new Error(
        response.exceptionDetails.exception?.description ??
          response.exceptionDetails.text,
      )
    }

    return response.result.value
  }

  await client.send("Page.navigate", {
    url: appUrl,
  })

  await waitFor(
    () =>
      evaluate(`
        Boolean(
          window.__GORILLA_R2_DIAGNOSTICS__ &&
          document.querySelector("canvas")
        )
      `),
    120_000,
    "canvas e API do R2",
  )

  await sleep(1_000)

  const getBrowserSnapshot = () =>
    evaluate(`
      (() => {
        const diagnostics =
          window.__GORILLA_R2_DIAGNOSTICS__

        const canvases = Array.from(
          document.querySelectorAll("canvas")
        ).map((canvas, index) => {
          const rect = canvas.getBoundingClientRect()
          const style = getComputedStyle(canvas)

          return {
            index,
            width: canvas.width,
            height: canvas.height,
            clientWidth: canvas.clientWidth,
            clientHeight: canvas.clientHeight,
            rect: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            },
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity,
            visible:
              rect.width > 0 &&
              rect.height > 0 &&
              style.display !== "none" &&
              style.visibility !== "hidden" &&
              Number(style.opacity) > 0,
          }
        })

        const fallbackElements = Array.from(
          document.querySelectorAll("[aria-label]")
        )
          .filter((element) =>
            String(
              element.getAttribute("aria-label") ?? ""
            )
              .toLowerCase()
              .includes("indispon")
          )
          .map((element) => {
            const rect = element.getBoundingClientRect()
            const style = getComputedStyle(element)

            return {
              label: element.getAttribute("aria-label"),
              rect: {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
              },
              display: style.display,
              visibility: style.visibility,
              opacity: style.opacity,
              visible:
                rect.width > 0 &&
                rect.height > 0 &&
                style.display !== "none" &&
                style.visibility !== "hidden" &&
                Number(style.opacity) > 0,
            }
          })

        const visibleCanvas = canvases.find(
          (canvas) => canvas.visible
        )

        const visibleFallbacks = fallbackElements.filter(
          (fallback) => fallback.visible
        )

        const diagnosticsSnapshot =
          diagnostics?.getSnapshot?.() ?? null

        return {
          resizeObserver:
            typeof ResizeObserver !== "undefined",
          fetch: typeof fetch === "function",
          resourceTiming:
            typeof performance.getEntriesByType ===
            "function",
          webgl:
            Boolean(
              document
                .createElement("canvas")
                .getContext("webgl2") ||
              document
                .createElement("canvas")
                .getContext("webgl")
            ),
          diagnosticsAvailable: Boolean(diagnostics),
          canvases,
          visibleCanvas: visibleCanvas ?? null,
          fallbackElements,
          visibleFallbackCount: visibleFallbacks.length,

          // Um fallback só bloqueia o produto quando não há
          // canvas funcional ou runtime diagnóstico ativo.
          blockingFallback:
            visibleFallbacks.length > 0 &&
            (!visibleCanvas || !diagnosticsSnapshot),

          diagnostics: diagnosticsSnapshot,
          innerWidth,
          innerHeight,
          devicePixelRatio,
        }
      })()
    `)

  const waitForState = async (
    state,
    expectedClip,
    timeoutMs = 8_000,
  ) =>
    waitFor(
      async () => {
        const snapshot = await evaluate(`
          window.__GORILLA_R2_DIAGNOSTICS__
            .getSnapshot()
        `)

        if (
          snapshot.effectiveState === state &&
          snapshot.activeClip === expectedClip &&
          snapshot.pendingState === null
        ) {
          return snapshot
        }

        return false
      },
      timeoutMs,
      `${state} / ${expectedClip}`,
    )

  const resetNeutral = async () => {
    await evaluate(`
      (() => {
        const api =
          window.__GORILLA_R2_DIAGNOSTICS__

        const reducedMotion =
          api.getSnapshot().reducedMotion

        /*
         * resetNeutral intentionally stops all actions and
         * clears currentAction. Toggling reduced motion forces
         * applyState(state, true), reactivating R2_NEUTRAL,
         * and then restores the original user preference.
         */
        api.resetNeutral()
        api.setReducedMotion(!reducedMotion)
        api.setReducedMotion(reducedMotion)
        api.setState("neutral")
      })()
    `)

    return waitForState(
      "neutral",
      expectedClips.neutral,
      8_000,
    )
  }

  const initial = await getBrowserSnapshot()

  const capabilitiesPassed =
    initial.resizeObserver === true &&
    initial.fetch === true &&
    initial.resourceTiming === true &&
    initial.webgl === true &&
    initial.diagnosticsAvailable === true &&
    Boolean(initial.visibleCanvas) &&
    initial.blockingFallback === false

  const stateResults = []

  for (const state of canonicalStates) {
    if (state === "neutral") {
      await resetNeutral()
    } else {
      await resetNeutral()

      await evaluate(`
        window.__GORILLA_R2_DIAGNOSTICS__
          .setState(${JSON.stringify(state)})
      `)

      await waitForState(
        state,
        expectedClips[state],
        10_000,
      )
    }

    const snapshot = await evaluate(`
      window.__GORILLA_R2_DIAGNOSTICS__
        .getSnapshot()
    `)

    const browserSnapshot =
      await getBrowserSnapshot()

    const screenshot = await captureScreenshot(
      client,
      `state-${state}.png`,
      browserSnapshot.visibleCanvas.rect,
    )

    const result = {
      state,
      expectedClip: expectedClips[state],
      snapshot,
      screenshot,
      activated:
        snapshot.effectiveState === state &&
        snapshot.activeClip ===
          expectedClips[state] &&
        snapshot.pendingState === null,
      completion: null,
    }

    if (state === "celebrating_sale") {
      result.completion = await waitForState(
        "idle",
        expectedClips.idle,
        8_000,
      )
    }

    if (state === "error_attention") {
      result.completion = await waitForState(
        "neutral",
        expectedClips.neutral,
        8_000,
      )
    }

    stateResults.push(result)
  }

  const statesPassed =
    stateResults.every((result) => result.activated) &&
    stateResults.find(
      (result) =>
        result.state === "celebrating_sale"
    )?.completion?.effectiveState === "idle" &&
    stateResults.find(
      (result) =>
        result.state === "error_attention"
    )?.completion?.effectiveState === "neutral"

  await resetNeutral()

  await evaluate(`
    window.__GORILLA_R2_DIAGNOSTICS__
      .setState("working")
  `)

  const workingStart = await waitForState(
    "working",
    expectedClips.working,
    8_000,
  )

  const workingBrowserSnapshot =
    await getBrowserSnapshot()

  const movementFrames = []

  for (let index = 0; index < 10; index += 1) {
    const screenshot = await captureScreenshot(
      client,
      `movement-working-${String(index).padStart(2, "0")}.png`,
      workingBrowserSnapshot.visibleCanvas.rect,
    )

    const diagnostics = await evaluate(`
      window.__GORILLA_R2_DIAGNOSTICS__
        .getSnapshot()
    `)

    movementFrames.push({
      index,
      screenshot,
      elapsedInStateMs:
        diagnostics.elapsedInStateMs,
      effectiveState:
        diagnostics.effectiveState,
      activeClip:
        diagnostics.activeClip,
    })

    await sleep(150)
  }

  const workingEnd = await evaluate(`
    window.__GORILLA_R2_DIAGNOSTICS__
      .getSnapshot()
  `)

  const uniqueMovementHashes = new Set(
    movementFrames.map(
      (frame) => frame.screenshot.sha256,
    ),
  ).size

  const movementPassed =
    workingEnd.elapsedInStateMs >
      workingStart.elapsedInStateMs &&
    uniqueMovementHashes >= 2

  const viewportSizes = [
    [1440, 900],
    [1366, 768],
    [1024, 768],
    [768, 1024],
    [390, 844],
  ]

  const viewportResults = []

  for (const [width, height] of viewportSizes) {
    await client.send(
      "Emulation.setDeviceMetricsOverride",
      {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: false,
      },
    )

    await sleep(600)
    await resetNeutral()
    await sleep(300)

    const snapshot = await getBrowserSnapshot()

    const fullScreenshot =
      await captureScreenshot(
        client,
        `viewport-${width}x${height}.png`,
      )

    const canvasScreenshot =
      await captureScreenshot(
        client,
        `viewport-${width}x${height}-r2.png`,
        snapshot.visibleCanvas.rect,
      )

    const passed =
      snapshot.innerWidth === width &&
      snapshot.innerHeight === height &&
      Boolean(snapshot.visibleCanvas) &&
      snapshot.visibleCanvas.rect.width > 0 &&
      snapshot.visibleCanvas.rect.height > 0 &&
      snapshot.blockingFallback === false &&
      snapshot.diagnostics?.effectiveState ===
        "neutral" &&
      snapshot.diagnostics?.activeClip ===
        expectedClips.neutral &&
      snapshot.diagnostics?.pendingState === null

    viewportResults.push({
      requested: { width, height },
      actual: {
        width: snapshot.innerWidth,
        height: snapshot.innerHeight,
      },
      canvas: snapshot.visibleCanvas,
      fallbackElements:
        snapshot.fallbackElements,
      blockingFallback:
        snapshot.blockingFallback,
      diagnostics: snapshot.diagnostics,
      fullScreenshot,
      canvasScreenshot,
      passed,
    })
  }

  const viewportsPassed =
    viewportResults.length === 5 &&
    viewportResults.every(
      (viewport) => viewport.passed,
    )

  const existingVisualPath = path.join(
    gateDir,
    "R2_BROWSER_COMPATIBLE_VALIDATION_V1_VISUAL_METRICS.json",
  )

  let existingVisualMetrics = null
  let visualBaselinePassed = false

  if (fs.existsSync(existingVisualPath)) {
    existingVisualMetrics = JSON.parse(
      fs.readFileSync(existingVisualPath, "utf8"),
    )

    const visualMetrics = Array.isArray(
      existingVisualMetrics.metrics,
    )
      ? existingVisualMetrics.metrics
      : []

    const blackScreenCount =
      visualMetrics.filter(
        (metric) =>
          metric.blackScreen === true,
      ).length

    visualBaselinePassed =
      visualMetrics.length === 5 &&
      blackScreenCount === 0 &&
      visualMetrics.every(
        (metric) =>
          metric.blackScreen === false &&
          metric.paletteBandsPresent === true,
      )
  }

  const correctGlbResponses =
    glbResponses.filter(
      (response) =>
        response.url.includes(
          "/models/r2/r2-full-character-color-readable-ready-v2.glb"
        ) &&
        response.status === 200,
    )

  const networkPassed =
    correctGlbResponses.length > 0 &&
    failedRequests.length === 0

  const consolePassed =
    consoleErrors.length === 0

  const finalPassed =
    capabilitiesPassed &&
    statesPassed &&
    movementPassed &&
    viewportsPassed &&
    visualBaselinePassed &&
    networkPassed &&
    consolePassed

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    browser: browserVersion,
    appUrl,
    capabilities: {
      ...initial,
      passed: capabilitiesPassed,
    },
    states: {
      results: stateResults,
      passed: statesPassed,
    },
    movement: {
      state: "working",
      start: workingStart,
      end: workingEnd,
      uniqueHashes: uniqueMovementHashes,
      frames: movementFrames,
      passed: movementPassed,
    },
    viewports: {
      results: viewportResults,
      passed: viewportsPassed,
    },
    visualBaseline: {
      report: existingVisualMetrics,
      passed: visualBaselinePassed,
    },
    network: {
      glbResponses,
      correctGlbResponses,
      failedRequests,
      passed: networkPassed,
    },
    console: {
      errors: consoleErrors,
      passed: consolePassed,
    },
    gates: {
      capabilitiesPassed,
      statesPassed,
      movementPassed,
      viewportsPassed,
      visualBaselinePassed,
      networkPassed,
      consolePassed,
    },
    verdict: finalPassed
      ? "APROVADO"
      : "REPROVADO",
  }

  fs.writeFileSync(
    reportPath,
    JSON.stringify(report, null, 2),
  )

  console.log("")
  console.log("============================================================")
  console.log(" R2 BROWSER RELEASE GATE FINAL")
  console.log("============================================================")
  console.log(`CAPABILITIES_PASSED=${capabilitiesPassed}`)
  console.log(`STATES_PASSED=${statesPassed}`)
  console.log(`MOVEMENT_PASSED=${movementPassed}`)
  console.log(`MOVEMENT_UNIQUE_HASHES=${uniqueMovementHashes}`)
  console.log(`VIEWPORTS_PASSED=${viewportsPassed}`)
  console.log(`VISUAL_BASELINE_PASSED=${visualBaselinePassed}`)
  console.log(`NETWORK_PASSED=${networkPassed}`)
  console.log(`CONSOLE_PASSED=${consolePassed}`)
  console.log(`REPORT=${reportPath}`)
  console.log(`VEREDITO=${report.verdict}`)
  console.log("============================================================")

  client.close()

  process.exitCode = finalPassed ? 0 : 2
}

main().catch((error) => {
  const failure = {
    generatedAt: new Date().toISOString(),
    verdict: "REPROVADO",
    fatalError: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
  }

  fs.writeFileSync(
    reportPath,
    JSON.stringify(failure, null, 2),
  )

  console.error(error)
  process.exitCode = 1
})
