import Image from "next/image"

type GorilaR2AvatarProps = {
  size?: "sm" | "md" | "lg" | "xl"
  status?: "online" | "thinking" | "alert"
  className?: string
}

const sizeClasses = {
  sm: "size-10",
  md: "size-16",
  lg: "size-24",
  xl: "size-32",
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
        "relative flex shrink-0 items-center justify-center",
        sizeClasses[size],
        className,
      ].join(" ")}
      aria-label={statusLabel}
    >
      <div
        aria-hidden="true"
        className="absolute inset-[-18%] rounded-full bg-[#2F8F5B]/20 blur-2xl"
      />

      <div
        className={[
          "relative size-full overflow-hidden rounded-3xl",
          "border border-[#2F8F5B]/25 bg-[#2F8F5B]/[0.12]",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_18px_40px_rgba(47,143,91,0.18)]",
        ].join(" ")}
      >
        <Image
          src="/brand/GorillaMark_Light.svg"
          alt="GorilaR2"
          fill
          sizes="128px"
          className="object-contain p-3"
          priority
        />

        <span
          aria-hidden="true"
          className={[
            "absolute right-2 top-2 size-3 rounded-full border-2 border-[#15191F]",
            status === "online"
              ? "bg-[#3FB980]"
              : status === "thinking"
                ? "bg-[#E8B04A]"
                : "bg-[#E16A6A]",
          ].join(" ")}
        />
      </div>
    </div>
  )
}