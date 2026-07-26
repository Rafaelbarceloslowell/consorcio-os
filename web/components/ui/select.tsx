"use client";

import {
  forwardRef,
  useId,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
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

type SelectStyle =
  CSSProperties &
  Record<`--${string}`, string | number>;

interface SelectProps
  extends ComponentPropsWithoutRef<"select"> {
  error?: boolean;
  errorMessage?: string;
  containerClassName?: string;
  placeholder?: string;
  readOnly?: boolean;
}

const Select = forwardRef<
  HTMLSelectElement,
  SelectProps
>(
  (
    {
      children,
      className,
      containerClassName,
      disabled,
      error = false,
      errorMessage,
      id,
      placeholder,
      readOnly = false,
      style,
      value,
      defaultValue,
      onPointerDown,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;

    const hasError =
      error ||
      Boolean(errorMessage);

    const errorId = errorMessage
      ? `${selectId}-error`
      : undefined;

    const selectStyle: SelectStyle = {
      "--select-radius":
        radius.lg,

      "--select-background":
        "var(--gorila-material-inset)",

      "--select-background-hover":
        "var(--gorila-material-surface-hover)",

      "--select-background-readonly":
        "var(--gorila-material-inset)",

      "--select-border": hasError
        ? "rgba(248,113,113,.55)"
        : "var(--gorila-material-border)",

      "--select-border-hover": hasError
        ? "rgba(248,113,113,.70)"
        : "var(--gorila-material-border-strong)",

      "--select-border-focus": hasError
        ? "rgba(248,113,113,.88)"
        : "var(--gorila-green-bright)",

      "--select-ring": hasError
        ? "rgba(248,113,113,.14)"
        : "var(--gorila-focus)",

      "--select-text":
        "var(--gorila-material-text)",

      "--select-placeholder":
        "var(--gorila-material-text-muted)",

      "--select-icon":
        "var(--gorila-material-text-muted)",

      "--select-icon-focus":
        "var(--gorila-green-bright)",

      "--select-error":
        "#F87171",

      "--select-option-background":
        "var(--gorila-material-surface-solid)",

      "--select-shadow":
        "inset 0 2px 4px rgba(0,0,0,.20), inset 0 -1px 0 rgba(255,255,255,.07), 0 1px 0 rgba(255,255,255,.04)",

      "--select-shadow-focus":
        "inset 0 2px 5px rgba(0,0,0,.22), inset 0 -1px 0 rgba(255,255,255,.11), 0 4px 7px rgba(0,0,0,.18), 0 14px 28px rgba(0,0,0,.18)",

      "--select-transition":
        animation.button,

      backgroundColor:
        "var(--select-background)",

      borderColor:
        "var(--select-border)",

      borderRadius:
        "var(--select-radius)",

      boxShadow:
        "var(--select-shadow)",

      color:
        "var(--select-text)",

      fontSize:
        fontSize.sm,

      fontWeight:
        fontWeight.regular,

      transition:
        [
          "border-color var(--select-transition)",
          "background-color var(--select-transition)",
          "box-shadow var(--select-transition)",
        ].join(", "),

      ...style,
    };

    function handlePointerDown(
      event: PointerEvent<HTMLSelectElement>,
    ) {
      if (readOnly) {
        event.preventDefault();
      }

      onPointerDown?.(event);
    }

    function handleKeyDown(
      event: KeyboardEvent<HTMLSelectElement>,
    ) {
      if (
        readOnly &&
        [
          "ArrowDown",
          "ArrowUp",
          "Enter",
          " ",
          "Home",
          "End",
        ].includes(event.key)
      ) {
        event.preventDefault();
      }

      onKeyDown?.(event);
    }

    return (
      <div
        data-slot="select-container"
        data-error={hasError ? "true" : undefined}
        data-readonly={readOnly ? "true" : undefined}
        className={cn(
          "group/select",
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
          <select
            ref={ref}
            id={selectId}
            data-slot="select"
            data-error={hasError ? "true" : undefined}
            data-readonly={readOnly ? "true" : undefined}
            aria-invalid={hasError || undefined}
            aria-describedby={errorId}
            aria-readonly={readOnly || undefined}
            disabled={disabled}
            value={value}
            defaultValue={defaultValue}
            onPointerDown={handlePointerDown}
            onKeyDown={handleKeyDown}
            className={cn(
              "h-11",
              "w-full",
              "appearance-none",
              "border",
              "px-3.5",
              "pr-10",
              "outline-none",
              "transition-[background-color,border-color,box-shadow]",
              "duration-200",
              "ease-out",
              "hover:border-[var(--select-border-hover)]",
              "hover:bg-[var(--select-background-hover)]",
              "focus:border-[var(--select-border-focus)]",
              "focus:bg-[var(--select-background-hover)]",
              "focus:ring-4",
              "focus:ring-[var(--select-ring)]",
              "focus:shadow-[var(--select-shadow-focus)]",
              "disabled:cursor-not-allowed",
              "disabled:opacity-45",
              "[&>option]:bg-[var(--select-option-background)]",
              "[&>option]:text-[var(--select-text)]",
              readOnly && [
                "cursor-default",
                "bg-[var(--select-background-readonly)]",
              ],
              className,
            )}
            style={selectStyle}
            {...props}
          >
            {placeholder && (
              <option
                value=""
                disabled
              >
                {placeholder}
              </option>
            )}

            {children}
          </select>

          <span
            aria-hidden="true"
            data-slot="select-icon"
            className={cn(
              "pointer-events-none",
              "absolute",
              "right-3.5",
              "flex",
              "items-center",
              "justify-center",
              "text-[var(--select-icon)]",
              "transition-colors",
              "duration-200",
              "group-focus-within/select:text-[var(--select-icon-focus)]",
            )}
            style={selectStyle}
          >
            <ChevronDownIcon />
          </span>
        </div>

        {errorMessage && (
          <p
            id={errorId}
            role="alert"
            data-slot="select-error"
            className="mt-2 leading-relaxed"
            style={{
              color:
                "var(--select-error)",

              fontSize:
                fontSize.xs,

              fontWeight:
                fontWeight.medium,

              ...selectStyle,
            }}
          >
            {errorMessage}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";

function ChevronDownIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="m7 10 5 5 5-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export {
  Select,
};

export type {
  SelectProps,
};
