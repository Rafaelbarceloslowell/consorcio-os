import type {
    ComponentProps,
    CSSProperties,
  } from "react"
  
  import {
    cva,
    type VariantProps,
  } from "class-variance-authority"
  
  import { Card } from "@/components/ui/card"
  import { cn } from "@/lib/utils"
  
  type GlassCardStyle =
    CSSProperties &
    Record<`--${string}`, string | number>
  
  const glassCardVariants = cva(
    [
      "relative",
      "isolate",
      "overflow-hidden",
      "border",
      "backdrop-blur-xl",
    ],
    {
      variants: {
        elevation: {
          flat: [
            "[--card-shadow:none]",
            "[--card-shadow-hover:none]",
          ],
  
          resting: [
            "[--card-shadow:var(--glass-card-shadow-resting)]",
            "[--card-shadow-hover:var(--glass-card-shadow-resting)]",
          ],
  
          raised: [
            "[--card-shadow:var(--glass-card-shadow-raised)]",
            "[--card-shadow-hover:var(--glass-card-shadow-raised)]",
          ],
  
          floating: [
            "[--card-shadow:var(--glass-card-shadow-floating)]",
            "[--card-shadow-hover:var(--glass-card-shadow-floating)]",
          ],
        },
  
        interactive: {
          false: "",
  
          true: [
            "cursor-pointer",
            "will-change-transform",
  
            "transition-[transform,box-shadow,border-color,background-color]",
            "duration-300",
            "ease-out",
  
            "hover:-translate-y-1",
            "hover:[--card-shadow:var(--glass-card-shadow-hover)]",
  
            "focus-visible:outline-none",
            "focus-visible:ring-2",
            "focus-visible:ring-ring/60",
            "focus-visible:ring-offset-2",
            "focus-visible:ring-offset-background",
  
            "active:translate-y-0",
            "active:scale-[0.99]",
            "active:[--card-shadow:var(--glass-card-shadow-pressed)]",
  
            "motion-reduce:transform-none",
            "motion-reduce:transition-none",
          ],
        },
  
        padding: {
          none: "",
  
          compact:
            "[&>[data-slot=card-content]]:p-4",
  
          default:
            "[&>[data-slot=card-content]]:p-6",
  
          spacious:
            "[&>[data-slot=card-content]]:p-8",
        },
      },
  
      defaultVariants: {
        elevation: "resting",
        interactive: false,
        padding: "default",
      },
    }
  )
  
  type GlassCardProps =
    ComponentProps<typeof Card> &
    VariantProps<typeof glassCardVariants>
  
  function GlassCard({
    className,
    elevation,
    interactive,
    padding,
    style,
    ...props
  }: GlassCardProps) {
    const glassCardStyle: GlassCardStyle = {
      "--glass-card-shadow-resting": `
        inset 0 1px 0 rgba(255,255,255,.14),
        inset 0 -1px 0 rgba(0,0,0,.24),
        0 3px 5px rgba(0,0,0,.20),
        0 16px 36px rgba(0,0,0,.18)
      `,
  
      "--glass-card-shadow-raised": `
        inset 0 1px 0 rgba(255,255,255,.17),
        inset 0 -2px 1px rgba(0,0,0,.25),
        0 4px 6px rgba(0,0,0,.22),
        0 22px 48px rgba(0,0,0,.22)
      `,
  
      "--glass-card-shadow-floating": `
        inset 0 1px 0 rgba(255,255,255,.19),
        inset 0 -2px 1px rgba(0,0,0,.28),
        0 5px 8px rgba(0,0,0,.24),
        0 32px 72px rgba(0,0,0,.28)
      `,
  
      "--glass-card-shadow-hover": `
        inset 0 1px 0 rgba(255,255,255,.22),
        inset 0 -3px 2px rgba(0,0,0,.28),
        0 6px 8px rgba(0,0,0,.26),
        0 34px 74px rgba(0,0,0,.30)
      `,
  
      "--glass-card-shadow-pressed": `
        inset 0 3px 7px rgba(0,0,0,.30),
        inset 0 1px 0 rgba(255,255,255,.07),
        0 2px 4px rgba(0,0,0,.18)
      `,
  
      ...style,
    }
  
    return (
      <Card
        glass
        hover={false}
        data-slot="glass-card"
        data-elevation={
          elevation ?? "resting"
        }
        data-interactive={
          interactive || undefined
        }
        className={cn(
          glassCardVariants({
            elevation,
            interactive,
            padding,
          }),
          className
        )}
        style={glassCardStyle}
        {...props}
      />
    )
  }
  
  export {
    GlassCard,
    glassCardVariants,
  }
  
  export type {
    GlassCardProps,
  }
