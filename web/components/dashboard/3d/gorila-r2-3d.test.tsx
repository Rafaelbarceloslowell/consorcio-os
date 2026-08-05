// @vitest-environment jsdom
/// <reference types="vitest/globals" />

import {
  act,
  Children,
  isValidElement,
} from "react"
import type {
  ReactNode,
} from "react"
import {
  hydrateRoot,
} from "react-dom/client"
import {
  renderToString,
} from "react-dom/server"
import {
  render,
  waitFor,
} from "@testing-library/react"

const mocks = vi.hoisted(() => ({
  canvasProps: null as unknown,
}))

vi.mock("@react-three/fiber", () => ({
  Canvas: (props: unknown) => {
    mocks.canvasProps = props
    return <div data-testid="r2-canvas" />
  },
}))

vi.mock("./r2/real/r2-full-character-model", () => ({
  R2FullCharacterErrorBoundary: ({
    children,
  }: Readonly<{
    children: React.ReactNode
  }>) => children,
  R2FullCharacterModel: () => null,
}))

import {
  GorilaR23D,
} from "./gorila-r2-3d"

describe("GorilaR23D hydration boundary", () => {
  it("keeps the server markup and first client render identical before mounting Canvas", async () => {
    const originalResizeObserver =
      globalThis.ResizeObserver

    class ResizeObserverStub {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    globalThis.ResizeObserver = ResizeObserverStub

    const serverMarkup = renderToString(
      <GorilaR23D />,
    )
    expect(serverMarkup).toBe(
      '<div aria-label="Visualiza\u00e7\u00e3o 3D do R2 indispon\u00edvel" class="h-full w-full bg-transparent"></div>',
    )

    const container =
      document.createElement("div")
    container.innerHTML = serverMarkup
    document.body.append(container)

    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined)

    const root = hydrateRoot(
      container,
      <GorilaR23D />,
    )

    await waitFor(() => {
      expect(
        container.querySelector(
          '[data-testid="r2-canvas"]',
        ),
      ).not.toBeNull()
    })

    expect(consoleError).not.toHaveBeenCalled()

    act(() => root.unmount())
    container.remove()
    consoleError.mockRestore()
    globalThis.ResizeObserver =
      originalResizeObserver
  })

  it("creates deterministic lights and renderer settings", async () => {
    const originalResizeObserver =
      globalThis.ResizeObserver

    class ResizeObserverStub {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    globalThis.ResizeObserver = ResizeObserverStub
    const view = render(<GorilaR23D />)

    await waitFor(() => {
      expect(mocks.canvasProps).not.toBeNull()
    })

    const canvasProps = mocks.canvasProps as {
      children: ReactNode
      onCreated: (state: {
        gl: {
          toneMapping: number
          toneMappingExposure: number
          outputColorSpace: string
          shadowMap: { enabled: boolean }
          setClearColor: ReturnType<typeof vi.fn>
        }
      }) => void
    }
    const lightElements = Children
      .toArray(canvasProps.children)
      .filter(isValidElement)
      .filter((element) =>
        typeof element.type === "string" &&
        element.type.endsWith("Light"),
      )
    const lightNames = lightElements.map(
      (element) =>
        (element.props as { name: string }).name,
    )

    expect(lightNames).toEqual([
      "r2-hemisphere-light",
      "r2-key-light",
      "r2-fill-light",
      "r2-rim-light",
    ])

    const renderer = {
      toneMapping: 0,
      toneMappingExposure: 0,
      outputColorSpace: "",
      shadowMap: { enabled: true },
      setClearColor: vi.fn(),
    }
    canvasProps.onCreated({ gl: renderer })

    expect(renderer.toneMapping).not.toBe(0)
    expect(renderer.toneMappingExposure).toBe(1)
    expect(renderer.outputColorSpace).not.toBe("")
    expect(renderer.shadowMap.enabled).toBe(false)
    expect(renderer.setClearColor).toHaveBeenCalledWith(
      0x000000,
      0,
    )

    view.unmount()
    globalThis.ResizeObserver =
      originalResizeObserver
  })
})
