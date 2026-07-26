import Link from "next/link"

import { BrandIdentity } from "@/components/brand/brand-identity"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--gorila-canvas)] p-6">
      <section className="gorila-material relative overflow-hidden w-full max-w-xl rounded-[28px] border border-[var(--gorila-line)] bg-[var(--gorila-surface)] p-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:p-10">
        <BrandIdentity className="justify-center" />
        <p className="mt-10 text-xs font-semibold uppercase tracking-[0.18em] text-[#43A972]">
          Página não encontrada
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
          Este caminho não faz parte da sua operação.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[var(--gorila-text-muted)]">
          Volte ao centro de operações para continuar de onde parou.
        </p>
        <Button className="mt-7" render={<Link href="/" />}>
          Voltar ao Dashboard
        </Button>
      </section>
    </main>
  )
}
