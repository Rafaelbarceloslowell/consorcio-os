"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

import {
  createPortal,
} from "react-dom";

import {
  animation,
  fontSize,
  fontWeight,
  radius,
} from "@/design-system";

import {
  cn,
} from "@/lib/utils";

type DialogStyle =
  CSSProperties &
  Record<`--${string}`, string | number>;

interface DialogProps {
  open: boolean;
  onOpenChange: (
    open: boolean,
  ) => void;
  children: ReactNode;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

interface DialogContentProps
  extends ComponentPropsWithoutRef<"section"> {
  title?: string;
  description?: string;
  footer?: ReactNode;
  showCloseButton?: boolean;
  onClose?: () => void;
  size?:
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "full";
}

type DialogHeaderProps =
  ComponentPropsWithoutRef<"header">;

type DialogTitleProps =
  ComponentPropsWithoutRef<"h2">;

type DialogDescriptionProps =
  ComponentPropsWithoutRef<"p">;

type DialogBodyProps =
  ComponentPropsWithoutRef<"div">;

type DialogFooterProps =
  ComponentPropsWithoutRef<"footer">;

const dialogSizeClasses: Record<
  NonNullable<DialogContentProps["size"]>,
  string
> = {
  sm:
    "max-w-md",

  md:
    "max-w-xl",

  lg:
    "max-w-3xl",

  xl:
    "max-w-5xl",

  full:
    "max-w-[calc(100vw-2rem)]",
};

function subscribeToPortalContainer() {
  return () => {};
}

function getPortalContainer() {
  return document.body;
}

function getServerPortalContainer() {
  return null;
}

function Dialog({
  open,
  onOpenChange,
  children,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
}: DialogProps) {
  const portalContainer =
    useSyncExternalStore(
      subscribeToPortalContainer,
      getPortalContainer,
      getServerPortalContainer,
    );

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(
      event: globalThis.KeyboardEvent,
    ) {
      if (
        closeOnEscape &&
        event.key === "Escape"
      ) {
        onOpenChange(false);
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [
    closeOnEscape,
    onOpenChange,
    open,
  ]);

  if (!open) {
    return null;
  }

  function handleOverlayClick(
    event: MouseEvent<HTMLDivElement>,
  ) {
    if (
      closeOnOverlayClick &&
      event.target === event.currentTarget
    ) {
      onOpenChange(false);
    }
  }

  const dialogRoot = (
    <div
      data-slot="dialog-root"
      data-state="open"
      className={cn(
        "fixed",
        "inset-0",
        "z-50",
        "flex",
        "items-center",
        "justify-center",
        "overflow-y-auto",
        "p-4",
        "sm:p-6",
        className,
      )}
    >
      <div
        aria-hidden="true"
        data-slot="dialog-overlay"
        className={cn(
          "absolute",
          "inset-0",
          "bg-black/72",
          "backdrop-blur-md",
          "animate-in",
          "fade-in",
          "duration-200",
        )}
      />

      <div
        data-slot="dialog-interaction-layer"
        className="absolute inset-0"
        onMouseDown={handleOverlayClick}
      />

      {children}
    </div>
  );

  return portalContainer
    ? createPortal(
        dialogRoot,
        portalContainer,
      )
    : dialogRoot;
}

const DialogContent = forwardRef<
  HTMLElement,
  DialogContentProps
>(
  (
    {
      children,
      className,
      description,
      footer,
      id,
      onClose,
      showCloseButton = true,
      size = "md",
      title,
      style,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const dialogId =
      id ?? generatedId;

    const titleId = title
      ? `${dialogId}-title`
      : undefined;

    const descriptionId =
      description
        ? `${dialogId}-description`
        : undefined;

    const contentRef =
      useRef<HTMLElement | null>(
        null,
      );

    const dialogStyle: DialogStyle = {
      "--dialog-background":
        "rgba(18,18,18,.96)",

      "--dialog-border":
        "rgba(255,255,255,.10)",

      "--dialog-text":
        "#F5F3EE",

      "--dialog-muted":
        "#989898",

      "--dialog-close":
        "#8A8A8A",

      "--dialog-close-hover":
        "#F5F3EE",

      "--dialog-close-background-hover":
        "rgba(255,255,255,.07)",

      "--dialog-shadow":
        [
          "0 32px 80px rgba(0,0,0,.52)",
          "0 8px 24px rgba(0,0,0,.28)",
          "inset 0 1px 0 rgba(255,255,255,.03)",
        ].join(", "),

      "--dialog-radius":
        radius.xl,

      "--dialog-transition":
        animation.button,

      backgroundColor:
        "var(--dialog-background)",

      borderColor:
        "var(--dialog-border)",

      borderRadius:
        "var(--dialog-radius)",

      boxShadow:
        "var(--dialog-shadow)",

      color:
        "var(--dialog-text)",

      ...style,
    };

    function setRefs(
      node: HTMLElement | null,
    ) {
      contentRef.current = node;

      if (
        typeof ref === "function"
      ) {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    }

    function handleKeyDown(
      event: KeyboardEvent<HTMLElement>,
    ) {
      if (
        event.key !== "Tab"
      ) {
        props.onKeyDown?.(event);

        return;
      }

      const focusableElements =
        contentRef.current?.querySelectorAll<HTMLElement>(
          [
            "button:not([disabled])",
            "[href]",
            "input:not([disabled])",
            "select:not([disabled])",
            "textarea:not([disabled])",
            '[tabindex]:not([tabindex="-1"])',
          ].join(","),
        );

      if (
        !focusableElements ||
        focusableElements.length === 0
      ) {
        event.preventDefault();

        props.onKeyDown?.(event);

        return;
      }

      const firstElement =
        focusableElements[0];

      const lastElement =
        focusableElements[
          focusableElements.length - 1
        ];

      const activeElement =
        document.activeElement;

      if (
        event.shiftKey &&
        activeElement === firstElement
      ) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        activeElement === lastElement
      ) {
        event.preventDefault();
        firstElement.focus();
      }

      props.onKeyDown?.(event);
    }

    return (
      <section
        ref={setRefs}
        id={dialogId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={
          descriptionId
        }
        tabIndex={-1}
        data-slot="dialog-content"
        data-size={size}
        className={cn(
          "relative",
          "z-10",
          "flex",
          "max-h-[calc(100vh-2rem)]",
          "w-full",
          "flex-col",
          "overflow-hidden",
          "border",
          "animate-in",
          "fade-in",
          "zoom-in-95",
          "slide-in-from-bottom-3",
          "duration-200",
          dialogSizeClasses[size],
          className,
        )}
        style={dialogStyle}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {showCloseButton && (
          <button
            type="button"
            aria-label="Fechar diálogo"
            data-slot="dialog-close"
            onClick={onClose}
            className={cn(
              "absolute",
              "right-4",
              "top-4",
              "z-20",
              "flex",
              "size-9",
              "items-center",
              "justify-center",
              "rounded-lg",
              "text-[var(--dialog-close)]",
              "outline-none",
              "transition-[background-color,color,box-shadow,transform]",
              "duration-200",
              "ease-out",
              "hover:-translate-y-0.5",
              "hover:bg-[var(--dialog-close-background-hover)]",
              "hover:text-[var(--dialog-close-hover)]",
              "hover:shadow-[0_8px_20px_rgba(0,0,0,.22)]",
              "focus-visible:ring-2",
              "focus-visible:ring-white/15",
            )}
          >
            <CloseIcon />
          </button>
        )}

        {(title ||
          description) && (
          <DialogHeader>
            {title && (
              <DialogTitle
                id={titleId}
              >
                {title}
              </DialogTitle>
            )}

            {description && (
              <DialogDescription
                id={descriptionId}
              >
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        )}

        {children}

        {footer && (
          <DialogFooter>
            {footer}
          </DialogFooter>
        )}
      </section>
    );
  },
);

DialogContent.displayName =
  "DialogContent";

const DialogHeader = forwardRef<
  HTMLElement,
  DialogHeaderProps
>(
  (
    {
      children,
      className,
      style,
      ...props
    },
    ref,
  ) => (
    <header
      ref={ref}
      data-slot="dialog-header"
      className={cn(
        "flex",
        "shrink-0",
        "flex-col",
        "gap-2",
        "border-b",
        "border-white/[0.07]",
        "px-6",
        "py-5",
        "pr-16",
        "sm:px-7",
        "sm:py-6",
        "sm:pr-16",
        className,
      )}
      style={style}
      {...props}
    >
      {children}
    </header>
  ),
);

DialogHeader.displayName =
  "DialogHeader";

const DialogTitle = forwardRef<
  HTMLHeadingElement,
  DialogTitleProps
>(
  (
    {
      children,
      className,
      style,
      ...props
    },
    ref,
  ) => (
    <h2
      ref={ref}
      data-slot="dialog-title"
      className={cn(
        "leading-tight",
        "tracking-[-0.02em]",
        className,
      )}
      style={{
        color:
          "var(--dialog-text)",

        fontSize:
          fontSize.lg,

        fontWeight:
          fontWeight.semibold,

        ...style,
      }}
      {...props}
    >
      {children}
    </h2>
  ),
);

DialogTitle.displayName =
  "DialogTitle";

const DialogDescription =
  forwardRef<
    HTMLParagraphElement,
    DialogDescriptionProps
  >(
    (
      {
        children,
        className,
        style,
        ...props
      },
      ref,
    ) => (
      <p
        ref={ref}
        data-slot="dialog-description"
        className={cn(
          "max-w-2xl",
          "leading-relaxed",
          className,
        )}
        style={{
          color:
            "var(--dialog-muted)",

          fontSize:
            fontSize.sm,

          fontWeight:
            fontWeight.regular,

          ...style,
        }}
        {...props}
      >
        {children}
      </p>
    ),
  );

DialogDescription.displayName =
  "DialogDescription";

const DialogBody = forwardRef<
  HTMLDivElement,
  DialogBodyProps
>(
  (
    {
      children,
      className,
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      data-slot="dialog-body"
      className={cn(
        "min-h-0",
        "flex-1",
        "overflow-y-auto",
        "px-6",
        "py-6",
        "sm:px-7",
        "sm:py-7",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);

DialogBody.displayName =
  "DialogBody";

const DialogFooter = forwardRef<
  HTMLElement,
  DialogFooterProps
>(
  (
    {
      children,
      className,
      ...props
    },
    ref,
  ) => (
    <footer
      ref={ref}
      data-slot="dialog-footer"
      className={cn(
        "flex",
        "shrink-0",
        "flex-col-reverse",
        "gap-3",
        "border-t",
        "border-white/[0.07]",
        "px-6",
        "py-5",
        "sm:flex-row",
        "sm:items-center",
        "sm:justify-end",
        "sm:px-7",
        className,
      )}
      {...props}
    >
      {children}
    </footer>
  ),
);

DialogFooter.displayName =
  "DialogFooter";

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
};

export type {
  DialogBodyProps,
  DialogContentProps,
  DialogDescriptionProps,
  DialogFooterProps,
  DialogHeaderProps,
  DialogProps,
  DialogTitleProps,
};
