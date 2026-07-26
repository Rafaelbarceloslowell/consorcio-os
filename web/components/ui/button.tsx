"use client";

import type {
  CSSProperties,
  ReactNode,
} from "react";

import {
  Button as ButtonPrimitive,
} from "@base-ui/react/button";

import {
  cva,
  type VariantProps,
} from "class-variance-authority";

import {
  animation,
  fontSize,
  fontWeight,
  radius,
} from "@/design-system";

import {
  cn,
} from "@/lib/utils";

const buttonVariants = cva(
  [
    "group/button",
    "relative",
    "inline-flex",
    "shrink-0",
    "items-center",
    "justify-center",
    "whitespace-nowrap",
    "border",
    "font-medium",
    "outline-none",
    "select-none",
    "overflow-hidden",
    "isolate",
    "transition-[background-color,border-color,color,box-shadow,transform]",
    "duration-200",
    "ease-out",
    "disabled:pointer-events-none",
    "disabled:cursor-not-allowed",
    "disabled:opacity-45",
    "focus-visible:ring-4",
    "hover:-translate-y-0.5",
    "hover:scale-[1.015]",
    "hover:shadow-[var(--button-hover-shadow)]",
    "active:not-aria-[haspopup]:translate-y-px",
    "active:not-aria-[haspopup]:scale-[0.985]",
    "active:not-aria-[haspopup]:shadow-[var(--button-active-shadow)]",
    "before:pointer-events-none",
    "before:absolute",
    "before:inset-x-[12%]",
    "before:top-0",
    "before:h-px",
    "before:rounded-full",
    "before:bg-white/25",
    "before:opacity-75",
    "before:transition-[opacity,transform]",
    "before:duration-200",
    "hover:before:scale-x-110",
    "hover:before:opacity-100",
    "active:before:scale-x-90",
    "active:before:opacity-45",
    "[&_svg]:pointer-events-none",
    "[&_svg]:shrink-0",
    "[&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "border-[var(--button-primary-border)]",
          "bg-[var(--button-primary-bg)]",
          "text-[var(--button-primary-text)]",
          "shadow-[var(--button-shadow)]",
          "hover:border-[var(--button-primary-hover-border)]",
          "hover:bg-[var(--button-primary-hover)]",
          "focus-visible:ring-[var(--button-primary-ring)]",
        ].join(" "),

        primary: [
          "border-[var(--button-primary-border)]",
          "bg-[var(--button-primary-bg)]",
          "text-[var(--button-primary-text)]",
          "shadow-[var(--button-shadow)]",
          "hover:border-[var(--button-primary-hover-border)]",
          "hover:bg-[var(--button-primary-hover)]",
          "focus-visible:ring-[var(--button-primary-ring)]",
        ].join(" "),

        secondary: [
          "border-[var(--button-secondary-border)]",
          "bg-[var(--button-secondary-bg)]",
          "text-[var(--button-secondary-text)]",
          "shadow-[var(--button-shadow)]",
          "hover:border-[var(--button-secondary-hover-border)]",
          "hover:bg-[var(--button-secondary-hover)]",
          "focus-visible:ring-[var(--button-secondary-ring)]",
        ].join(" "),

        outline: [
          "border-[var(--button-outline-border)]",
          "bg-[var(--button-outline-bg)]",
          "text-[var(--button-outline-text)]",
          "shadow-[var(--button-shadow)]",
          "hover:border-[var(--button-outline-hover-border)]",
          "hover:bg-[var(--button-outline-hover)]",
          "focus-visible:ring-[var(--button-outline-ring)]",
        ].join(" "),

        ghost: [
          "border-transparent",
          "bg-transparent",
          "text-[var(--button-ghost-text)]",
          "shadow-none",
          "hover:border-[var(--button-ghost-hover-border)]",
          "hover:bg-[var(--button-ghost-hover)]",
          "focus-visible:ring-[var(--button-ghost-ring)]",
        ].join(" "),

        destructive: [
          "border-[var(--button-danger-border)]",
          "bg-[var(--button-danger-bg)]",
          "text-[var(--button-danger-text)]",
          "shadow-[var(--button-shadow)]",
          "hover:border-[var(--button-danger-hover-border)]",
          "hover:bg-[var(--button-danger-hover)]",
          "focus-visible:ring-[var(--button-danger-ring)]",
        ].join(" "),

        danger: [
          "border-[var(--button-danger-border)]",
          "bg-[var(--button-danger-bg)]",
          "text-[var(--button-danger-text)]",
          "shadow-[var(--button-shadow)]",
          "hover:border-[var(--button-danger-hover-border)]",
          "hover:bg-[var(--button-danger-hover)]",
          "focus-visible:ring-[var(--button-danger-ring)]",
        ].join(" "),

        link: [
          "h-auto",
          "border-transparent",
          "bg-transparent",
          "px-0",
          "text-[var(--button-link-text)]",
          "shadow-none",
          "underline-offset-4",
          "hover:shadow-none",
          "hover:underline",
          "focus-visible:ring-[var(--button-link-ring)]",
        ].join(" "),
      },

      size: {
        default: [
          "h-10",
          "gap-2",
          "px-4",
          "py-2",
        ].join(" "),

        xs: [
          "h-7",
          "gap-1.5",
          "px-2.5",
          "text-xs",
        ].join(" "),

        sm: [
          "h-8",
          "gap-1.5",
          "px-3",
          "text-sm",
        ].join(" "),

        md: [
          "h-10",
          "gap-2",
          "px-4",
          "text-sm",
        ].join(" "),

        lg: [
          "h-12",
          "gap-2.5",
          "px-5",
          "text-base",
        ].join(" "),

        icon: "size-10",
        "icon-xs": "size-7",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },

      fullWidth: {
        true: "w-full",
        false: "",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  },
);

type ButtonStyle =
  CSSProperties &
  Record<`--${string}`, string | number>;

type ButtonProps =
  ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
    loadingText?: ReactNode;
  };

function Button({
  children,
  className,
  disabled,
  fullWidth = false,
  loading = false,
  loadingText,
  size = "default",
  style,
  variant = "default",
  ...props
}: ButtonProps) {
  const designSystemStyle: ButtonStyle = {
    "--button-radius": radius.lg,
    "--button-shadow": "var(--gorila-control-shadow)",
    "--button-hover-shadow": "var(--gorila-control-shadow-hover)",
    "--button-active-shadow": "var(--gorila-control-shadow-pressed)",
    "--button-transition": animation.button,

    "--button-primary-bg": "rgba(47, 143, 91, 0.88)",
    "--button-primary-hover": "rgba(47, 143, 91, 0.88)",
    "--button-primary-border": "rgba(105, 207, 147, 0.22)",
    "--button-primary-hover-border": "rgba(105, 207, 147, 0.36)",
    "--button-primary-text": "#F7FFF9",
    "--button-primary-ring": "rgba(47, 143, 91, 0.22)",

    "--button-secondary-bg": "var(--gorila-material-surface)",
    "--button-secondary-hover": "var(--gorila-material-surface)",
    "--button-secondary-border": "var(--gorila-material-border)",
    "--button-secondary-hover-border": "var(--gorila-material-border-strong)",
    "--button-secondary-text": "var(--gorila-material-text)",
    "--button-secondary-ring": "var(--gorila-focus)",

    "--button-outline-bg": "var(--gorila-material-inset)",
    "--button-outline-hover": "var(--gorila-material-inset)",
    "--button-outline-border": "var(--gorila-material-border)",
    "--button-outline-hover-border": "var(--gorila-material-border-strong)",
    "--button-outline-text": "var(--gorila-material-text)",
    "--button-outline-ring": "var(--gorila-focus)",

    "--button-ghost-hover": "var(--gorila-surface-subtle)",
    "--button-ghost-hover-border": "var(--gorila-material-border)",
    "--button-ghost-text": "var(--gorila-material-text-soft)",
    "--button-ghost-ring": "var(--gorila-focus)",

    "--button-danger-bg": "rgba(220, 38, 38, 0.88)",
    "--button-danger-hover": "rgba(239, 68, 68, 0.94)",
    "--button-danger-border": "rgba(248, 113, 113, 0.18)",
    "--button-danger-hover-border": "rgba(248, 113, 113, 0.34)",
    "--button-danger-text": "#FFFFFF",
    "--button-danger-ring": "rgba(248, 113, 113, 0.18)",

    "--button-link-text": "#63C68C",
    "--button-link-ring": "rgba(47, 143, 91, 0.18)",

    borderRadius: "var(--button-radius)",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    transitionDuration: "200ms",
    transitionTimingFunction:
      "cubic-bezier(0.22, 1, 0.36, 1)",

    ...style,
  };

  return (
    <ButtonPrimitive
      data-loading={loading || undefined}
      data-slot="button"
      data-size={size ?? "default"}
      data-variant={variant ?? "default"}
      data-full-width={fullWidth ? "true" : undefined}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(
        buttonVariants({
          variant,
          size,
          fullWidth,
        }),
        className,
      )}
      style={designSystemStyle}
      {...props}
    >
      {loading && <LoadingSpinner />}

      <span
        className={cn(
          "inline-flex",
          "items-center",
          "justify-center",
          loading && "gap-2",
        )}
      >
        {loading && loadingText
          ? loadingText
          : children}
      </span>
    </ButtonPrimitive>
  );
}

function LoadingSpinner() {
  return (
    <svg
      aria-hidden="true"
      className="size-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.25"
      />

      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export {
  Button,
  buttonVariants,
};

export type {
  ButtonProps,
};
