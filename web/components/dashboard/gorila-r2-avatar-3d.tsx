"use client"

import Image from "next/image"

import type { GorilaR2Briefing } from "@/types/dashboard"

type GorilaR2AvatarSize = "hero" | "compact"

type GorilaR2VisualStatus =
  | "online"
  | "thinking"
  | "alert"
  | "offline"

type GorilaR2Avatar3DProps = {
  size?: GorilaR2AvatarSize
  workspaceId?: string
  userId?: string
  briefing?: GorilaR2Briefing
  status?: GorilaR2VisualStatus
}

const statusLabels: Record<GorilaR2VisualStatus, string> = {
  online: "R2 online",
  thinking: "R2 analisando",
  alert: "R2 em alerta",
  offline: "R2 offline",
}

export function GorilaR2Avatar3D({
  size = "hero",
  workspaceId,
  userId,
  briefing,
  status = "online",
}: Readonly<GorilaR2Avatar3DProps>) {
  const isHero = size === "hero"

  return (
    <section
      aria-label="GorilaR2, copiloto comercial inteligente do GorillaOS"
      data-testid="gorila-r2-static-avatar"
      data-r2-render-mode="static-image"
      data-r2-status={status}
      data-workspace-id={workspaceId ?? "unscoped"}
      data-user-id={userId ?? "anonymous"}
      data-has-briefing={Boolean(briefing)}
      className={
        isHero
          ? "relative isolate flex min-h-[320px] w-full items-end justify-center overflow-visible sm:min-h-[360px] xl:min-h-[420px] 2xl:min-h-[460px]"
          : "relative isolate flex h-32 w-32 items-end justify-center overflow-visible"
      }
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[5%] left-1/2 h-[34%] w-[72%] -translate-x-1/2 rounded-full bg-[#2F8F5B]/15 blur-[52px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[2%] left-1/2 h-8 w-[58%] -translate-x-1/2 rounded-[100%] bg-black/45 blur-xl"
      />

      <div
        className={
          isHero
            ? "relative z-10 h-[320px] w-full sm:h-[360px] xl:h-[420px] 2xl:h-[460px]"
            : "relative z-10 h-32 w-32"
        }
      >
        <Image
          src="/images/r2/gorila-r2-static-oficial.png"
          alt="GorilaR2 usando o uniforme verde do GorillaOS"
          fill
          priority={isHero}
          sizes={
            isHero
              ? "(min-width: 1280px) 38vw, (min-width: 768px) 50vw, 92vw"
              : "128px"
          }
          className="select-none object-contain object-bottom drop-shadow-[0_28px_36px_rgba(0,0,0,0.46)]"
          draggable={false}
        />
      </div>

      <span className="sr-only">{statusLabels[status]}</span>
    </section>
  )
}