"use client"

import dynamic from "next/dynamic"

const R2Lab = dynamic(
  () =>
    import("@/components/dashboard/3d/r2-lab").then(
      (module) => module.R2Lab,
    ),
  {
    ssr: false,
    loading: () => (
      <main className="grid min-h-screen place-items-center bg-neutral-950 text-neutral-100">
        <p>Carregando laboratório do R2...</p>
      </main>
    ),
  },
)

export function R2TestClient() {
  return <R2Lab />
}