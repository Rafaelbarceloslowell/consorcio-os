import Link from "next/link"

import {
  ShieldX,
  ArrowLeft,
} from "lucide-react"

import {
  BrandIdentity,
} from "@/components/brand/brand-identity"

import {
  Button,
} from "@/components/ui/button"

export const metadata = {
  title: "Acesso negado",
}

export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--gorila-canvas)] p-6">
      <section className="gorila-material w-full max-w-lg rounded-[28px] border border-[var(--gorila-line)] bg-[var(--gorila-surface)] p-8 text-center">
        <BrandIdentity className="justify-center" />

        <ShieldX className="mx-auto mt-10 size-10 text-red-300" />

        <h1 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">
          Acesso não autorizado
        </h1>

        <p className="mt-3 text-sm leading-6 text-[var(--gorila-text-muted)]">
          A conta Google utilizada não corresponde a um perfil ativo e autorizado no Gorila OS.
        </p>

        <p className="mt-4 text-sm leading-6 text-[var(--gorila-text-muted)]">
          Confirme o e-mail com o responsável da sua empresa antes de tentar novamente.
        </p>

        <Button
          fullWidth
          size="lg"
          className="mt-8"
          render={
            <Link href="/login" />
          }
        >
          <ArrowLeft />
          Voltar ao acesso
        </Button>
      </section>
    </main>
  )
}
