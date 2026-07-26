import type {
    ComponentProps,
  } from "react";
  
  import {
    cva,
    type VariantProps,
  } from "class-variance-authority";
  
  import {
    cn,
  } from "@/lib/utils";
  
  const badgeVariants = cva(
    [
      "inline-flex",
      "shrink-0",
      "items-center",
      "justify-center",
      "gap-1.5",
      "whitespace-nowrap",
      "border",
      "font-medium",
      "leading-none",
      "transition-colors",
      "duration-200",
      "[&_svg]:pointer-events-none",
      "[&_svg]:shrink-0",
    ].join(" "),
    {
      variants: {
        variant: {
          default: [
            "border-[var(--gorila-material-border)]",
            "bg-[var(--gorila-surface-subtle)]",
            "text-[var(--gorila-material-text-soft)]",
          ].join(" "),
  
          success: [
            "border-[var(--gorila-green-bright)]/25",
            "bg-[var(--gorila-green-soft)]",
            "text-[var(--gorila-green-bright)]",
          ].join(" "),
  
          warning: [
            "border-[var(--gorila-material-border-strong)]",
            "bg-[var(--gorila-material-inset)]",
            "text-[var(--gorila-material-text)]",
          ].join(" "),
  
          danger: [
            "border-[var(--gorila-material-border-strong)]",
            "bg-[var(--gorila-material-inset)]",
            "text-[var(--gorila-material-text)]",
          ].join(" "),
  
          info: [
            "border-[var(--gorila-green-bright)]/20",
            "bg-[var(--gorila-green-soft)]",
            "text-[var(--gorila-green-bright)]",
          ].join(" "),
  
          neutral: [
            "border-[var(--gorila-material-border)]",
            "bg-[var(--gorila-surface-subtle)]",
            "text-[var(--gorila-material-text-muted)]",
          ].join(" "),
  
          premium: [
            "border-[var(--gorila-green-bright)]/30",
            "bg-[var(--gorila-green-soft)]",
            "text-[var(--gorila-material-text)]",
          ].join(" "),
        },
  
        size: {
          sm: [
            "h-5",
            "rounded-md",
            "px-2",
            "text-[11px]",
            "[&_svg]:size-3",
          ].join(" "),
  
          md: [
            "h-6",
            "rounded-lg",
            "px-2.5",
            "text-xs",
            "[&_svg]:size-3.5",
          ].join(" "),
  
          lg: [
            "h-7",
            "rounded-lg",
            "px-3",
            "text-sm",
            "[&_svg]:size-4",
          ].join(" "),
        },
  
        dot: {
          true: [
            "before:size-1.5",
            "before:shrink-0",
            "before:rounded-full",
            "before:bg-current",
          ].join(" "),
  
          false: "",
        },
      },
  
      defaultVariants: {
        variant: "default",
        size: "md",
        dot: false,
      },
    },
  );
  
  type BadgeProps =
    ComponentProps<"span"> &
    VariantProps<typeof badgeVariants>;
  
  function Badge({
    className,
    variant,
    size,
    dot,
    ...props
  }: BadgeProps) {
    return (
      <span
        data-slot="badge"
        data-variant={variant ?? "default"}
        data-size={size ?? "md"}
        data-dot={dot ? "true" : undefined}
        className={cn(
          badgeVariants({
            variant,
            size,
            dot,
          }),
          className,
        )}
        {...props}
      />
    );
  }
  
  export {
    Badge,
    badgeVariants,
  };
  
  export type {
    BadgeProps,
  };
