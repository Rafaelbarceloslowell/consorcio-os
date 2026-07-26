"use client";

import {
  createContext,
  forwardRef,
  useContext,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import {
  cn,
} from "@/lib/utils";

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
};

const TabsContext =
  createContext<TabsContextValue | null>(
    null,
  );

function useTabsContext() {
  const context =
    useContext(TabsContext);

  if (!context) {
    throw new Error(
      "Tabs components must be used inside <Tabs>.",
    );
  }

  return context;
}

export interface TabsProps
  extends Omit<
    HTMLAttributes<HTMLDivElement>,
    "defaultValue"
  > {
  value?: string;
  defaultValue?: string;
  onValueChange?: (
    value: string,
  ) => void;
}

export function Tabs({
  value,
  defaultValue = "",
  onValueChange,
  children,
  className,
  ...props
}: TabsProps) {
  const [
    internalValue,
    setInternalValue,
  ] = useState(defaultValue);

  const currentValue =
    value ?? internalValue;

  const context =
    useMemo<TabsContextValue>(
      () => ({
        value: currentValue,
        setValue: (
          nextValue,
        ) => {
          if (
            value === undefined
          ) {
            setInternalValue(
              nextValue,
            );
          }

          onValueChange?.(
            nextValue,
          );
        },
      }),
      [
        currentValue,
        onValueChange,
        value,
      ],
    );

  return (
    <TabsContext.Provider
      value={context}
    >
      <div
        data-slot="tabs-root"
        className={cn(
          "w-full",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export const TabsList =
  forwardRef<
    HTMLDivElement,
    ComponentPropsWithoutRef<"div">
  >(
    (
      {
        className,
        ...props
      },
      ref,
    ) => (
      <div
        ref={ref}
        role="tablist"
        data-slot="tabs-list"
        className={cn(
          "inline-flex",
          "rounded-xl",
          "border",
          "border-white/10",
          "bg-white/[0.03]",
          "p-1",
          "gap-1",
          className,
        )}
        {...props}
      />
    ),
  );

TabsList.displayName =
  "TabsList";

export interface TabsTriggerProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const TabsTrigger =
  forwardRef<
    HTMLButtonElement,
    TabsTriggerProps
  >(
    (
      {
        value,
        className,
        children,
        onClick,
        ...props
      },
      ref,
    ) => {
      const context =
        useTabsContext();

      const active =
        context.value ===
        value;

      return (
        <button
          ref={ref}
          type="button"
          role="tab"
          data-slot="tabs-trigger"
          data-state={
            active
              ? "active"
              : "inactive"
          }
          aria-selected={
            active
          }
          onClick={(
            event,
          ) => {
            context.setValue(
              value,
            );

            onClick?.(
              event,
            );
          }}
          className={cn(
            "rounded-lg",
            "px-4",
            "py-2.5",
            "text-sm",
            "font-medium",
            "transition-all",
            "duration-200",
            "outline-none",
            "border",
            active
              ? [
                  "border-white/10",
                  "bg-white/[0.08]",
                  "text-white",
                  "shadow-[0_8px_20px_rgba(0,0,0,.25)]",
                ]
              : [
                  "border-transparent",
                  "bg-transparent",
                  "text-neutral-400",
                  "hover:bg-white/[0.04]",
                  "hover:text-white",
                ],
            className,
          )}
          {...props}
        >
          {children}
        </button>
      );
    },
  );

TabsTrigger.displayName =
  "TabsTrigger";

export interface TabsContentProps
  extends ComponentPropsWithoutRef<"div"> {
  value: string;
}

export const TabsContent =
  forwardRef<
    HTMLDivElement,
    TabsContentProps
  >(
    (
      {
        value,
        className,
        children,
        ...props
      },
      ref,
    ) => {
      const context =
        useTabsContext();

      if (
        context.value !==
        value
      ) {
        return null;
      }

      return (
        <div
          ref={ref}
          role="tabpanel"
          data-slot="tabs-content"
          data-state="active"
          className={cn(
            "mt-6",
            "animate-in",
            "fade-in",
            "duration-200",
            className,
          )}
          {...props}
        >
          {children}
        </div>
      );
    },
  );

TabsContent.displayName =
  "TabsContent";