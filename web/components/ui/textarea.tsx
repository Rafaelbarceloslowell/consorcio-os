"use client";

import {
  forwardRef,
  useId,
  type ComponentPropsWithoutRef,
  type CSSProperties,
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

type TextareaStyle =
  CSSProperties &
  Record<`--${string}`, string | number>;

interface TextareaProps
  extends ComponentPropsWithoutRef<"textarea"> {
  error?: boolean;
  errorMessage?: string;
  containerClassName?: string;
}

const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaProps
>(
  (
    {
      className,
      containerClassName,
      disabled,
      error = false,
      errorMessage,
      id,
      readOnly,
      style,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();

    const textareaId = id ?? generatedId;

    const hasError =
      error ||
      Boolean(errorMessage);

    const errorId = errorMessage
      ? `${textareaId}-error`
      : undefined;

    const textareaStyle: TextareaStyle = {
      "--textarea-radius": radius.lg,

      "--textarea-background":
        "var(--gorila-material-inset)",

      "--textarea-background-hover":
        "var(--gorila-material-surface-hover)",

      "--textarea-background-readonly":
        "var(--gorila-material-inset)",

      "--textarea-border": hasError
        ? "rgba(248,113,113,.55)"
        : "var(--gorila-material-border)",

      "--textarea-border-hover": hasError
        ? "rgba(248,113,113,.70)"
        : "var(--gorila-material-border-strong)",

      "--textarea-border-focus": hasError
        ? "rgba(248,113,113,.88)"
        : "var(--gorila-green-bright)",

      "--textarea-ring": hasError
        ? "rgba(248,113,113,.14)"
        : "var(--gorila-focus)",

      "--textarea-text":
        "var(--gorila-material-text)",

      "--textarea-placeholder":
        "var(--gorila-material-text-muted)",

      "--textarea-error":
        "#F87171",

      "--textarea-shadow":
        "inset 0 2px 4px rgba(0,0,0,.20), inset 0 -1px 0 rgba(255,255,255,.07), 0 1px 0 rgba(255,255,255,.04)",

      "--textarea-shadow-focus":
        "inset 0 2px 5px rgba(0,0,0,.22), inset 0 -1px 0 rgba(255,255,255,.11), 0 4px 7px rgba(0,0,0,.18), 0 14px 28px rgba(0,0,0,.18)",

      "--textarea-transition":
        animation.button,

      backgroundColor:
        "var(--textarea-background)",

      borderColor:
        "var(--textarea-border)",

      borderRadius:
        "var(--textarea-radius)",

      boxShadow:
        "var(--textarea-shadow)",

      color:
        "var(--textarea-text)",

      fontSize:
        fontSize.sm,

      fontWeight:
        fontWeight.regular,

      transition:
        [
          "border-color var(--textarea-transition)",
          "background-color var(--textarea-transition)",
          "box-shadow var(--textarea-transition)",
        ].join(", "),

      ...style,
    };

    return (
      <div
        data-slot="textarea-container"
        data-error={hasError ? "true" : undefined}
        className={cn(
          "w-full",
          containerClassName,
        )}
      >
        <textarea
          ref={ref}
          id={textareaId}
          data-slot="textarea"
          data-error={hasError ? "true" : undefined}
          aria-invalid={hasError || undefined}
          aria-describedby={errorId}
          disabled={disabled}
          readOnly={readOnly}
          className={cn(
            "min-h-32",
            "w-full",
            "resize-y",
            "border",
            "px-4",
            "py-3",
            "outline-none",
            "transition-[background-color,border-color,box-shadow]",
            "duration-200",
            "placeholder:text-[var(--textarea-placeholder)]",
            "hover:border-[var(--textarea-border-hover)]",
            "hover:bg-[var(--textarea-background-hover)]",
            "focus:border-[var(--textarea-border-focus)]",
            "focus:bg-[var(--textarea-background-hover)]",
            "focus:ring-4",
            "focus:ring-[var(--textarea-ring)]",
            "focus:shadow-[var(--textarea-shadow-focus)]",
            "disabled:cursor-not-allowed",
            "disabled:opacity-45",
            "read-only:cursor-default",
            "read-only:bg-[var(--textarea-background-readonly)]",
            className,
          )}
          style={textareaStyle}
          {...props}
        />

        {errorMessage && (
          <p
            id={errorId}
            role="alert"
            data-slot="textarea-error"
            className="mt-2 leading-relaxed"
            style={{
              color:
                "var(--textarea-error)",
              fontSize:
                fontSize.xs,
              fontWeight:
                fontWeight.medium,
              ...textareaStyle,
            }}
          >
            {errorMessage}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

export {
  Textarea,
};

export type {
  TextareaProps,
};
