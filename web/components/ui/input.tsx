"use client";

import {
  forwardRef,
  useId,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
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

type InputStyle =
  CSSProperties &
  Record<`--${string}`, string | number>;

interface InputProps
  extends ComponentPropsWithoutRef<"input"> {
  error?: boolean;
  errorMessage?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      disabled,
      error = false,
      errorMessage,
      id,
      leftIcon,
      loading = false,
      readOnly,
      rightIcon,
      style,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    const hasError =
      error ||
      Boolean(errorMessage);

    const errorId = errorMessage
      ? `${inputId}-error`
      : undefined;

    const designSystemStyle: InputStyle = {
      "--input-radius": radius.lg,

      "--input-background":
        "var(--gorila-material-inset)",

      "--input-background-hover":
        "var(--gorila-material-surface-hover)",

      "--input-background-readonly":
        "var(--gorila-material-inset)",

      "--input-border": hasError
        ? "rgba(248, 113, 113, 0.55)"
        : "var(--gorila-material-border)",

      "--input-border-hover": hasError
        ? "rgba(248, 113, 113, 0.70)"
        : "var(--gorila-material-border-strong)",

      "--input-border-focus": hasError
        ? "rgba(248, 113, 113, 0.88)"
        : "var(--gorila-green-bright)",

      "--input-ring": hasError
        ? "rgba(248, 113, 113, 0.14)"
        : "var(--gorila-focus)",

      "--input-text":
        "var(--gorila-material-text)",

      "--input-placeholder":
        "var(--gorila-material-text-muted)",

      "--input-icon":
        "var(--gorila-material-text-muted)",

      "--input-icon-focus":
        "var(--gorila-green-bright)",

      "--input-error":
        "#F87171",

      "--input-shadow":
        "inset 0 2px 4px rgba(0,0,0,.16), inset 0 -1px 0 var(--gorila-material-highlight), 0 1px 0 rgba(255,255,255,.04)",

      "--input-shadow-focus":
        "inset 0 2px 5px rgba(0,0,0,.18), inset 0 -1px 0 var(--gorila-material-highlight), 0 4px 7px rgba(0,0,0,.14), 0 14px 28px rgba(0,0,0,.14)",

      "--input-transition":
        animation.button,

      backgroundColor:
        "var(--input-background)",

      borderColor:
        "var(--input-border)",

      borderRadius:
        "var(--input-radius)",

      boxShadow:
        "var(--input-shadow)",

      color:
        "var(--input-text)",

      fontSize:
        fontSize.sm,

      fontWeight:
        fontWeight.regular,

      transition:
        [
          "border-color var(--input-transition)",
          "box-shadow var(--input-transition)",
          "background-color var(--input-transition)",
        ].join(", "),

      ...style,
    };

    return (
      <div
        data-slot="input-container"
        data-error={hasError ? "true" : undefined}
        data-loading={loading ? "true" : undefined}
        className={cn(
          "group/input",
          "w-full",
          containerClassName,
        )}
      >
        <div
          className={cn(
            "relative",
            "flex",
            "w-full",
            "items-center",
          )}
        >
          {leftIcon && (
            <span
              aria-hidden="true"
              data-slot="input-left-icon"
              className={cn(
                "pointer-events-none",
                "absolute",
                "left-3.5",
                "flex",
                "items-center",
                "justify-center",
                "transition-colors",
                "duration-200",
                "[&_svg]:size-4",
                hasError
                  ? "text-[var(--input-error)]"
                  : [
                      "text-[var(--input-icon)]",
                      "group-focus-within/input:text-[var(--input-icon-focus)]",
                    ],
              )}
              style={designSystemStyle}
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            data-slot="input"
            data-error={hasError ? "true" : undefined}
            data-loading={loading ? "true" : undefined}
            aria-invalid={hasError || undefined}
            aria-describedby={errorId}
            disabled={disabled || loading}
            readOnly={readOnly}
            className={cn(
              "h-11",
              "w-full",
              "border",
              "px-3.5",
              "py-2.5",
              "outline-none",
              "transition-[background-color,border-color,box-shadow]",
              "duration-200",
              "ease-out",
              "placeholder:text-[var(--input-placeholder)]",
              "hover:border-[var(--input-border-hover)]",
              "hover:bg-[var(--input-background-hover)]",
              "focus:border-[var(--input-border-focus)]",
              "focus:bg-[var(--input-background-hover)]",
              "focus:shadow-[var(--input-shadow-focus)]",
              "focus:ring-4",
              "focus:ring-[var(--input-ring)]",
              "disabled:cursor-not-allowed",
              "disabled:opacity-45",
              "read-only:cursor-default",
              "read-only:bg-[var(--input-background-readonly)]",
              leftIcon && "pl-10",
              (rightIcon || loading) && "pr-10",
              className,
            )}
            style={designSystemStyle}
            {...props}
          />

          {loading ? (
            <span
              aria-hidden="true"
              data-slot="input-loading"
              className={cn(
                "pointer-events-none",
                "absolute",
                "right-3.5",
                "flex",
                "items-center",
                "justify-center",
                "text-[var(--input-icon)]",
              )}
              style={designSystemStyle}
            >
              <LoadingSpinner />
            </span>
          ) : (
            rightIcon && (
              <span
                aria-hidden="true"
                data-slot="input-right-icon"
                className={cn(
                  "absolute",
                  "right-3.5",
                  "flex",
                  "items-center",
                  "justify-center",
                  "text-[var(--input-icon)]",
                  "transition-colors",
                  "duration-200",
                  "group-focus-within/input:text-[var(--input-icon-focus)]",
                  "[&_svg]:size-4",
                )}
                style={designSystemStyle}
              >
                {rightIcon}
              </span>
            )
          )}
        </div>

        {errorMessage && (
          <p
            id={errorId}
            role="alert"
            data-slot="input-error"
            className={cn(
              "mt-2",
              "leading-relaxed",
            )}
            style={{
              color: "var(--input-error)",
              fontSize: fontSize.xs,
              fontWeight: fontWeight.medium,
              ...designSystemStyle,
            }}
          >
            {errorMessage}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

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
  Input,
};

export type {
  InputProps,
};
