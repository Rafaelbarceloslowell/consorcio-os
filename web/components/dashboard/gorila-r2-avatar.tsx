import Image from "next/image"
import { gorilaR2Images, type GorilaR2Mood } from "@/components/dashboard/gorila-r2-moods"

type GorilaR2AvatarProps = {
  size?: "sm" | "md" | "lg" | "xl" | "hero"
  status?: "online" | "thinking" | "alert"
  mood?: GorilaR2Mood
  className?: string
}

const sizeClasses = {
  sm: "size-10",
  md: "size-16",
  lg: "size-24",
  xl: "size-32",
  hero: "size-80",
}

export function GorilaR2Avatar({
  size = "md",
  status = "online",
  mood = "idle",
  className = "",
}: GorilaR2AvatarProps) {
  const characterImage = gorilaR2Images[mood]

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
          "relative size-full animate-[pulse_4s_ease-in-out_infinite]",
          "",
          "drop-shadow-[0_20px_30px_rgba(47,143,91,0.25)]",
        ].join(" ")}
      >
        <Image
          src={characterImage}
          alt="GorilaR2"
          fill
          sizes="320px"
          className="object-contain scale-[1.6] translate-y-4"

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
