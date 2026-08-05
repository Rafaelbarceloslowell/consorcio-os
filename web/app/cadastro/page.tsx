import Link from "next/link"

import {
  Building2,
  ArrowLeft,
} from "lucide-react"

import {
  BrandIdentity,
} from "@/components/brand/brand-identity"

import {
  Button,
} from "@/components/ui/button"

export const metadata = {
  title: "Solicitar acesso",
}

export default function CadastroPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--gorila-canvas)] p-6">
      <section className="gorila-material w-full max-w-lg rounded-[28px] border border-[var(--gorila-line)] bg-[var(--gorila-surface)] p-8 text-center">
        <BrandIdentity className="justify-center" />

        <Building2 className="mx-auto mt-10 size-10 text-[#43A972]" />

        <h1 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">
          O acesso é liberado pela empresa
        </h1>

        <p className="mt-3 text-sm leading-6 text-[var(--gorila-text-muted)]">
          O Gorila OS não possui cadastro público. Seu perfil precisa ser autorizado e vinculado a um workspace e a um consultor ativo.
        </p>

        <p className="mt-4 text-sm leading-6 text-[var(--gorila-text-muted)]">
          Procure o responsável da sua operação para solicitar a liberação do seu e-mail Google.
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
