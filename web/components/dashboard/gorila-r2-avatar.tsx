import Image from "next/image"

type GorilaR2AvatarProps = {
  size?: "sm" | "md" | "lg"
  status?: "online" | "thinking" | "alert"
  className?: string
}

const sizeClasses = {
  sm: "size-10",
  md: "size-16",
  lg: "size-24",
}

export function GorilaR2Avatar({
  size = "md",
  status = "online",
  className = "",
}: GorilaR2AvatarProps) {
  const statusLabel = {
    online: "R2 online",
    thinking: "R2 analisando",
    alert: "R2 em alerta",
  }[status]

  return (
    <div
      className={[
        "relative shrink-0 overflow-hidden rounded-2xl",
        "border border-[#2F8F5B]/20 bg-[#2F8F5B]/[0.10]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_24px_rgba(0,0,0,0.16)]",
        sizeClasses[size],
        className,
      ].join(" ")}
      aria-label={statusLabel}
    >
      <Image
        src="/brand/GorillaMark_Light.svg"
        alt="GorilaR2"
        fill
        sizes="96px"
        className="object-contain p-2"
        priority
      />

      <span
        aria-hidden="true"
        className={[
          "absolute right-1.5 top-1.5 size-2.5 rounded-full border-2 border-[#15191F]",
          status === "online"
            ? "bg-[#3FB980]"
            : status === "thinking"
              ? "bg-[#E8B04A]"
              : "bg-[#E16A6A]",
        ].join(" ")}
      />
    </div>
  )
}
