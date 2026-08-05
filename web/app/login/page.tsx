import {
  ShieldCheck,
} from "lucide-react"

import {
  BrandIdentity,
} from "@/components/brand/brand-identity"

import {
  GoogleLoginButton,
} from "@/components/auth/google-login-button"

import {
  getAuthConfigurationState,
} from "@/lib/auth/auth-configuration"

export const metadata = {
  title: "Acesso",
}

export default function LoginPage() {
  const configuration =
    getAuthConfigurationState()

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
        <div className="gorila-material relative w-full max-w-md overflow-hidden rounded-[28px] border border-[var(--gorila-line)] bg-[var(--gorila-surface)] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.24),0_4px_7px_rgba(0,0,0,0.20),0_26px_62px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:p-9">
          <BrandIdentity className="lg:hidden" />

          <div className="mt-8 lg:mt-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#43A972]">
              Acesso seguro
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
              Bem-vindo ao Gorila OS
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--gorila-text-muted)]">
              Use a conta Google vinculada ao seu perfil autorizado na empresa.
            </p>
          </div>

          <GoogleLoginButton
            configured={
              configuration.configured
            }
          />

          <div className="mt-6 rounded-2xl border border-[var(--gorila-line)] bg-black/10 p-4">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#43A972]" />
              <p className="text-xs leading-5 text-[var(--gorila-text-muted)]">
                Não existe cadastro público. O acesso depende de vínculo prévio com uma empresa e um perfil ativo.
              </p>
            </div>
          </div>

          {!configuration.configured ? (
            <p className="mt-4 text-center text-xs leading-5 text-[var(--gorila-text-muted)]">
              A entrada permanecerá desativada até a configuração das credenciais reais do Google.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  )
}
