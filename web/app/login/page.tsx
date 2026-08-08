import {
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import Image from "next/image"

import {
  GoogleLoginButton,
} from "@/components/auth/google-login-button"
import {
  BrandIdentity,
} from "@/components/brand/brand-identity"
import {
  ThemeToggle,
} from "@/components/ui/theme-toggle"
import {
  getAuthConfigurationState,
} from "@/lib/auth/auth-configuration"

export const metadata = {
  title: "Acesso",
}

function isStagingEnvironment() {
  return process.env.RENDER_SERVICE_NAME
    ?.toLocaleLowerCase()
    .includes("staging") ?? false
}

export default function LoginPage() {
  const configuration = getAuthConfigurationState()
  const isStaging = isStagingEnvironment()

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--gorilla-bg)] px-4 py-4 text-[var(--gorilla-text)] sm:px-6 sm:py-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,var(--gorilla-moss-soft),transparent_34rem),radial-gradient(circle_at_82%_78%,var(--gorila-bronze-soft),transparent_30rem)]"
      />

      <div className="absolute right-7 top-7 z-30">
        <ThemeToggle />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-[1500px] overflow-hidden rounded-[32px] border border-[var(--gorilla-border)] bg-[var(--gorilla-shell)] shadow-[var(--gorilla-shadow-raised)] lg:grid-cols-[minmax(0,1.15fr)_minmax(430px,0.72fr)] sm:min-h-[calc(100vh-3rem)]">
        <section className="gorilla-hero-environment relative isolate flex min-h-[470px] flex-col overflow-hidden border-b border-[var(--gorilla-border)] p-6 sm:min-h-[560px] sm:p-9 lg:min-h-0 lg:border-b-0 lg:border-r xl:p-12">
          <div className="relative z-20 flex items-start justify-between gap-4">
            <BrandIdentity />
            {isStaging ? (
              <span className="mr-14 rounded-full border border-[var(--gorilla-border-strong)] bg-[var(--gorilla-moss-soft)] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--gorilla-moss-strong)] lg:mr-0">
                Staging
              </span>
            ) : null}
          </div>

          <div className="relative z-10 mt-8 grid min-h-0 flex-1 items-end gap-5 sm:grid-cols-[minmax(230px,0.86fr)_minmax(0,1fr)] lg:mt-12">
            <div className="relative mx-auto h-[280px] w-full max-w-[320px] sm:h-[440px] lg:h-[min(58vh,610px)] lg:max-w-[470px]">
              <div className="absolute inset-x-[12%] bottom-[5%] h-20 rounded-full bg-[var(--gorilla-moss)]/20 blur-3xl" />
              <Image
                src="/images/r2/gorila-r2-static-oficial.png"
                alt="R2, copiloto comercial do GorillaOS"
                fill
                priority
                unoptimized
                sizes="(max-width: 640px) 320px, (max-width: 1024px) 42vw, 470px"
                className="object-contain object-bottom drop-shadow-[0_28px_38px_rgba(16,17,13,0.28)]"
              />
            </div>

            <div className="pb-2 sm:pb-10 lg:pb-16">
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--gorilla-moss-strong)]">
                <Sparkles className="size-3.5" />
                Premium Earth OS
              </p>
              <h1 className="mt-4 max-w-xl text-3xl font-semibold leading-[1.06] tracking-[-0.055em] sm:text-4xl xl:text-5xl">
                Seu centro de operações comerciais.
              </h1>
              <p className="mt-5 max-w-lg text-sm leading-7 text-[var(--gorilla-text-secondary)] sm:text-base">
                Contexto, ritmo e inteligência para cada próximo passo, com o R2 acompanhando sua operação.
              </p>
              <div className="mt-7 flex items-center gap-3 text-[10px] uppercase tracking-[0.13em] text-[var(--gorilla-text-muted)]">
                <span className="size-1.5 rounded-full bg-[var(--gorilla-positive)]" />
                R2 monitorando
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center bg-[var(--gorilla-surface-strong)] p-5 sm:p-9 lg:p-10 xl:p-14">
          <div className="gorilla-panel w-full max-w-md overflow-hidden rounded-[28px] p-7 sm:p-9">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--gorilla-moss-strong)]">
              Acesso seguro
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">
              Bem-vindo ao GorillaOS
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--gorilla-text-secondary)]">
              Entre com a conta Google vinculada ao seu perfil autorizado.
            </p>

            <GoogleLoginButton configured={configuration.configured} />

            <div className="mt-6 rounded-2xl border border-[var(--gorilla-border)] bg-[var(--gorilla-surface-subtle)] p-4">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--gorilla-moss-strong)]" />
                <p className="text-xs leading-5 text-[var(--gorilla-text-muted)]">
                  Não existe cadastro público. O acesso depende de vínculo prévio com uma empresa e um perfil ativo.
                </p>
              </div>
            </div>

            {!configuration.configured ? (
              <p className="mt-4 text-center text-xs leading-5 text-[var(--gorilla-text-muted)]">
                A entrada permanecerá desativada até a configuração das credenciais reais do Google.
              </p>
            ) : null}

            <p className="mt-7 text-center text-[9px] uppercase tracking-[0.14em] text-[var(--gorilla-text-muted)]">
              GorillaOS · Centro de operações
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
