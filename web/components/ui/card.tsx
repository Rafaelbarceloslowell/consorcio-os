"use client";

import type {
  CSSProperties,
  ComponentProps,
} from "react";

import {
  animation,
  fontSize,
  fontWeight,
  radius,
} from "@/design-system";

import {
  cn,
} from "@/lib/utils";

type CardStyle =
  CSSProperties &
  Record<`--${string}`, string | number>;

interface CardProps extends ComponentProps<"div"> {
  glass?: boolean;
  hover?: boolean;
}

function Card({
  className,
  glass = false,
  hover = false,
  style,
  ...props
}: CardProps) {
  const designSystemStyle: CardStyle = {
    "--card-radius": radius.xl,

    "--card-bg": glass
      ? "var(--gorila-material-surface)"
      : "var(--gorila-material-surface-solid)",

    "--card-border":
      "var(--gorila-material-border)",

    "--card-border-hover":
      "var(--gorila-material-border-strong)",

    "--card-shadow":
      "var(--gorila-material-shadow)",

    "--card-shadow-hover":
      "var(--gorila-material-shadow-raised)",

    "--card-transition": animation.card,

    "--card-divider":
      "var(--gorila-material-border)",

    "--card-title":
      "var(--gorila-material-text)",

    "--card-description":
      "var(--gorila-material-text-muted)",

    borderRadius: "var(--card-radius)",
    background: "var(--card-bg)",
    borderColor: "var(--card-border)",
    boxShadow: "var(--card-shadow)",

    transition:
      "border-color var(--card-transition), box-shadow var(--card-transition), background-color var(--card-transition)",

    ...(glass
      ? {
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }
      : {}),

    ...style,
  };

  return (
    <div
      data-slot="card"
      data-glass={glass || undefined}
      data-hover={hover || undefined}
      className={cn(
        "flex",
        "flex-col",
        "overflow-hidden",
        "border",
        "text-foreground",
        hover && [
          "hover:border-[var(--card-border-hover)]",
          "hover:shadow-[var(--card-shadow-hover)]",
        ],
        className,
      )}
      style={designSystemStyle}
      {...props}
    />
  );
}

function CardHeader({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex",
        "items-start",
        "justify-between",
        "gap-5",
        "border-b",
        "border-[var(--card-divider)]",
        "px-7",
        "py-6",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({
  className,
  style,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "leading-tight",
        "tracking-[-0.02em]",
        className,
      )}
      style={{
        fontSize: fontSize.xl,
        fontWeight: fontWeight.semibold,
        color: "var(--card-title)",
        ...style,
      }}
      {...props}
    />
  );
}

function CardDescription({
  className,
  style,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn(
        "mt-2",
        "max-w-2xl",
        "leading-relaxed",
        className,
      )}
      style={{
        fontSize: fontSize.sm,
        color: "var(--card-description)",
        ...style,
      }}
      {...props}
    />
  );
}

function CardContent({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        "flex-1",
        "px-7",
        "py-6",
        className,
      )}
      {...props}
    />
  );
}

function CardFooter({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex",
        "items-center",
        "justify-end",
        "gap-3",
        "border-t",
        "border-[var(--card-divider)]",
        "px-7",
        "py-5",
        className,
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};

export type {
  CardProps,
};
