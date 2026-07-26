import { ImageResponse } from "next/og"

export const alt = "Gorila OS — Inteligência para operações de consórcio"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#0C0F0D",
          color: "#F3F5F3",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div
            style={{
              width: 66,
              height: 66,
              borderRadius: 20,
              border: "2px solid rgba(67,169,114,.42)",
              background: "rgba(47,143,91,.10)",
            }}
          />
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.04em" }}>
            Gorila OS
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 920 }}>
          <div style={{ color: "#43A972", fontSize: 20, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase" }}>
            Centro de operações
          </div>
          <div style={{ marginTop: 22, fontSize: 64, lineHeight: 1.04, fontWeight: 700, letterSpacing: "-0.055em" }}>
            Inteligência para operações de consórcio.
          </div>
        </div>
      </div>
    ),
    size
  )
}
