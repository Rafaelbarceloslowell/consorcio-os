/**
 * -----------------------------------------------------------------------------
 * IconContainer
 * -----------------------------------------------------------------------------
 * Superfície visual para ícones da GORILA OS.
 *
 * Centraliza tamanho, borda, fundo, raio e comportamento de interação.
 * Componentes de negócio não devem conhecer esses detalhes visuais.
 * -----------------------------------------------------------------------------
 */

import type { ComponentProps } from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const iconContainerVariants = cva(
  `
    inline-flex
    shrink-0
    items-center
    justify-center
    border
    transition-transform
    duration-300
    ease-out
    [&>svg]:shrink-0
  `,
  {
    variants: {
      size: {
        sm: `
          size-9
          rounded-xl
          [&>svg]:size-4
        `,
        md: `
          size-12
          rounded-2xl
          [&>svg]:size-5
        `,
        lg: `
          size-14
          rounded-2xl
          [&>svg]:size-6
        `,
      },
      tone: {
        default: `
          border-[var(--gorila-material-border)]
          bg-[var(--gorila-surface-subtle)]
          text-[var(--gorila-material-text)]
        `,
        success: `
          border-[var(--gorila-green-bright)]/25
          bg-[var(--gorila-green-soft)]
          text-[var(--gorila-green-bright)]
        `,
        warning: `
          border-[var(--gorila-material-border-strong)]
          bg-[var(--gorila-material-inset)]
          text-[var(--gorila-material-text)]
        `,
        danger: `
          border-[var(--gorila-material-border-strong)]
          bg-[var(--gorila-material-inset)]
          text-[var(--gorila-material-text)]
        `,
        info: `
          border-[var(--gorila-green-bright)]/20
          bg-[var(--gorila-green-soft)]
          text-[var(--gorila-green-bright)]
        `,
      },
      interactive: {
        true: `
          group-hover:scale-105
          group-active:scale-100
        `,
        false: "",
      },
    },
    defaultVariants: {
      size: "md",
      tone: "default",
      interactive: false,
    },
  }
)

type IconContainerProps =
  ComponentProps<"div"> &
  VariantProps<typeof iconContainerVariants>

function IconContainer({
  className,
  size,
  tone,
  interactive,
  children,
  ...props
}: IconContainerProps) {
  return (
    <div
      data-slot="icon-container"
      data-size={size ?? "md"}
      data-tone={tone ?? "default"}
      data-interactive={interactive ? "true" : undefined}
      className={cn(
        iconContainerVariants({
          size,
          tone,
          interactive,
        }),
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export {
  IconContainer,
  iconContainerVariants,
}

export type {
  IconContainerProps,
}
