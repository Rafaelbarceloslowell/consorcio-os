import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..", "..");
const webRequire = createRequire(resolve(projectRoot, "web", "package.json"));
const sharp = webRequire("sharp");

const masterPath = resolve(
  projectRoot,
  "brand",
  "assets",
  "source",
  "GorillaMark_Master.svg",
);
const assetsDirectory = resolve(projectRoot, "brand", "assets");
const outputDirectories = {
  svg: resolve(assetsDirectory, "svg"),
  png: resolve(assetsDirectory, "png"),
  favicon: resolve(assetsDirectory, "favicon"),
  pwa: resolve(assetsDirectory, "pwa"),
};
const manifestPath = resolve(assetsDirectory, "manifest.json");

const pngSizes = [32, 64, 128, 256, 512, 1024] as const;
const variants = {
  Light: {
    green: "#163F35",
    gray: "#818487",
    description: "Cores oficiais sobre fundo transparente.",
  },
  Dark: {
    green: "#FFFFFF",
    gray: "#818487",
    description: "Cabeça branca e moldura oficial sobre fundo transparente.",
  },
  Monochrome: {
    green: "#163F35",
    gray: "#163F35",
    description: "Aplicação monocromática no verde oficial.",
  },
} as const;

type VariantName = keyof typeof variants;
type AssetKind = "svg" | "png" | "favicon" | "pwa" | "apple-touch";
type ManifestAsset = {
  path: string;
  kind: AssetKind;
  variant: VariantName;
  mediaType: string;
  bytes: number;
  sha256: string;
  width?: number;
  height?: number;
  purpose?: "any" | "maskable";
};

const generatedAssets: ManifestAsset[] = [];

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/");
}

function sha256(content: string | Buffer): string {
  return createHash("sha256").update(content).digest("hex");
}

function validateMaster(svg: string): void {
  const requiredFragments = [
    'viewBox="0 0 1024 1024"',
    'id="gorilla-mark-frame"',
    'id="gorilla-mark-head"',
    "--gorilla-green:#163F35",
    "--gorilla-gray:#818487",
  ];

  for (const fragment of requiredFragments) {
    if (!svg.includes(fragment)) {
      throw new Error(`Master SVG inválido: trecho obrigatório ausente: ${fragment}`);
    }
  }

  if (/<(?:image|filter|mask|clipPath|linearGradient|radialGradient)\b/i.test(svg)) {
    throw new Error("Master SVG inválido: contém recurso vetorial não permitido.");
  }
}

function createVariantSvg(masterSvg: string, variantName: VariantName): string {
  const variant = variants[variantName];
  return masterSvg
    .replace("--gorilla-green:#163F35", `--gorilla-green:${variant.green}`)
    .replace("--gorilla-gray:#818487", `--gorilla-gray:${variant.gray}`)
    .replace(
      "<title>GorillaMark</title>",
      `<title>GorillaMark ${variantName}</title>`,
    );
}

function materializeSvgColors(svg: string, variantName: VariantName): Buffer {
  const variant = variants[variantName];
  return Buffer.from(
    svg
      .replaceAll("var(--gorilla-green)", variant.green)
      .replaceAll("var(--gorilla-gray)", variant.gray),
  );
}

async function writeAsset(
  absolutePath: string,
  content: string | Buffer,
  metadata: Omit<ManifestAsset, "path" | "bytes" | "sha256">,
): Promise<void> {
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, content);
  generatedAssets.push({
    path: normalizePath(relative(projectRoot, absolutePath)),
    bytes: Buffer.byteLength(content),
    sha256: sha256(content),
    ...metadata,
  });
}

async function renderTransparentPng(
  svg: Buffer,
  size: number,
): Promise<Buffer> {
  return sharp(svg, { density: 192 })
    .resize(size, size, { fit: "contain" })
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();
}

async function renderAppIcon(
  svg: Buffer,
  size: number,
  scale: number,
): Promise<Buffer> {
  const markSize = Math.round(size * scale);
  const mark = await sharp(svg, { density: 192 })
    .resize(markSize, markSize, { fit: "contain" })
    .png()
    .toBuffer();
  const offset = Math.floor((size - markSize) / 2);

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: "#163F35",
    },
  })
    .composite([{ input: mark, left: offset, top: offset }])
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();
}

function createIco(images: Array<{ size: number; png: Buffer }>): Buffer {
  const headerSize = 6;
  const entrySize = 16;
  let dataOffset = headerSize + entrySize * images.length;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(entrySize);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(dataOffset, 12);
    dataOffset += png.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...images.map(({ png }) => png)]);
}

async function cleanOutputs(): Promise<void> {
  for (const directory of Object.values(outputDirectories)) {
    const relativeOutput = relative(assetsDirectory, directory);
    if (
      relativeOutput === "" ||
      relativeOutput.startsWith("..") ||
      isAbsolute(relativeOutput)
    ) {
      throw new Error(`Diretório de saída inseguro: ${directory}`);
    }
    await rm(directory, { recursive: true, force: true });
    await mkdir(directory, { recursive: true });
  }
  await rm(manifestPath, { force: true });
}

async function build(): Promise<void> {
  const masterSvg = await readFile(masterPath, "utf8");
  validateMaster(masterSvg);
  const masterHash = sha256(masterSvg);
  await cleanOutputs();

  const variantSvgs = new Map<VariantName, string>();
  for (const variantName of Object.keys(variants) as VariantName[]) {
    const variantSvg = createVariantSvg(masterSvg, variantName);
    variantSvgs.set(variantName, variantSvg);
    await writeAsset(
      resolve(outputDirectories.svg, `GorillaMark_${variantName}.svg`),
      variantSvg,
      {
        kind: "svg",
        variant: variantName,
        mediaType: "image/svg+xml",
        width: 1024,
        height: 1024,
      },
    );

    const rasterSource = materializeSvgColors(variantSvg, variantName);
    for (const size of pngSizes) {
      const png = await renderTransparentPng(rasterSource, size);
      await writeAsset(
        resolve(
          outputDirectories.png,
          variantName.toLowerCase(),
          `GorillaMark_${variantName}_${size}.png`,
        ),
        png,
        {
          kind: "png",
          variant: variantName,
          mediaType: "image/png",
          width: size,
          height: size,
        },
      );
    }
  }

  const lightSvg = materializeSvgColors(
    variantSvgs.get("Light")!,
    "Light",
  );
  const faviconSvg = variantSvgs.get("Light")!;
  await writeAsset(
    resolve(outputDirectories.favicon, "favicon.svg"),
    faviconSvg,
    {
      kind: "favicon",
      variant: "Light",
      mediaType: "image/svg+xml",
      width: 1024,
      height: 1024,
    },
  );

  const icoImages: Array<{ size: number; png: Buffer }> = [];
  for (const size of [16, 32, 48] as const) {
    const png = await renderTransparentPng(lightSvg, size);
    icoImages.push({ size, png });
    await writeAsset(
      resolve(outputDirectories.favicon, `favicon-${size}x${size}.png`),
      png,
      {
        kind: "favicon",
        variant: "Light",
        mediaType: "image/png",
        width: size,
        height: size,
      },
    );
  }
  await writeAsset(
    resolve(outputDirectories.favicon, "favicon.ico"),
    createIco(icoImages),
    {
      kind: "favicon",
      variant: "Light",
      mediaType: "image/x-icon",
    },
  );

  const darkSvg = materializeSvgColors(variantSvgs.get("Dark")!, "Dark");
  for (const size of [192, 512] as const) {
    const icon = await renderAppIcon(darkSvg, size, 1);
    await writeAsset(
      resolve(outputDirectories.pwa, `pwa-icon-${size}x${size}.png`),
      icon,
      {
        kind: "pwa",
        variant: "Dark",
        mediaType: "image/png",
        width: size,
        height: size,
        purpose: "any",
      },
    );

    const maskable = await renderAppIcon(darkSvg, size, 0.8);
    await writeAsset(
      resolve(outputDirectories.pwa, `pwa-maskable-${size}x${size}.png`),
      maskable,
      {
        kind: "pwa",
        variant: "Dark",
        mediaType: "image/png",
        width: size,
        height: size,
        purpose: "maskable",
      },
    );
  }

  for (const size of [120, 152, 167, 180] as const) {
    const appleTouchIcon = await renderAppIcon(darkSvg, size, 0.9);
    await writeAsset(
      resolve(outputDirectories.pwa, `apple-touch-icon-${size}x${size}.png`),
      appleTouchIcon,
      {
        kind: "apple-touch",
        variant: "Dark",
        mediaType: "image/png",
        width: size,
        height: size,
      },
    );
  }

  const sourceAfterBuild = await readFile(masterPath, "utf8");
  if (sha256(sourceAfterBuild) !== masterHash) {
    throw new Error("O Master SVG foi alterado durante o build.");
  }

  generatedAssets.sort((a, b) => a.path.localeCompare(b.path));
  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source: {
      path: normalizePath(relative(projectRoot, masterPath)),
      sha256: masterHash,
      viewBox: "0 0 1024 1024",
    },
    colors: {
      gorillaGreen: "#163F35",
      gorillaGray: "#818487",
      darkForeground: "#FFFFFF",
    },
    variants: Object.fromEntries(
      Object.entries(variants).map(([name, variant]) => [
        name,
        variant.description,
      ]),
    ),
    assets: generatedAssets,
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(
    `Brand build concluído: ${generatedAssets.length} ativos + manifesto.`,
  );
  for (const asset of generatedAssets) {
    console.log(asset.path);
  }
  console.log(normalizePath(relative(projectRoot, manifestPath)));
}

await build();
