import { LockKeyhole, Mail } from "lucide-react"

import { BrandIdentity } from "@/components/brand/brand-identity"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export const metadata = {
  title: "Acesso",
}

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-[var(--gorila-canvas)] lg:grid-cols-[minmax(0,0.9fr)_minmax(480px,0.55fr)]">
      <section className="hidden flex-col justify-between border-r border-[var(--gorila-line)] p-10 lg:flex xl:p-14">
        <BrandIdentity />
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#43A972]">
            Centro de operações
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.05em] xl:text-5xl">
            Decisões comerciais com contexto, ritmo e inteligência.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-[var(--gorila-text-muted)]">
            Entre no ambiente que organiza sua operação e mantém o R2 acompanhando cada oportunidade.
          </p>
        </div>
        <p className="text-xs text-[var(--gorila-text-muted)]">
          Ambiente seguro · Gorila OS
        </p>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="gorila-material relative overflow-hidden w-full max-w-md rounded-[28px] border border-[var(--gorila-line)] bg-[var(--gorila-surface)] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.24),0_4px_7px_rgba(0,0,0,0.20),0_26px_62px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:p-9">
          <BrandIdentity className="lg:hidden" />
          <div className="mt-8 lg:mt-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#43A972]">
              Acesso seguro
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
              Bem-vindo ao Gorila OS
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--gorila-text-muted)]">
              Use suas credenciais corporativas para continuar.
            </p>
          </div>

          <form className="mt-7 space-y-5">
            <label className="block space-y-2">
              <span className="text-xs font-medium text-[var(--gorila-text-soft)]">E-mail</span>
              <Input type="email" autoComplete="email" placeholder="nome@empresa.com.br" leftIcon={<Mail />} />
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-medium text-[var(--gorila-text-soft)]">Senha</span>
              <Input type="password" autoComplete="current-password" placeholder="Sua senha" leftIcon={<LockKeyhole />} />
            </label>
            <Button type="button" fullWidth size="lg">
              Entrar no Gorila OS
            </Button>
          </form>

          <p className="mt-6 text-center text-xs leading-5 text-[var(--gorila-text-muted)]">
            A autenticação será conectada ao provedor corporativo na etapa de infraestrutura.
          </p>
        </div>
      </section>
    </main>
  )
}
