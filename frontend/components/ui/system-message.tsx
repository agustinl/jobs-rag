"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertTriangle, Info, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const systemMessageVariants = cva("flex items-start gap-3 rounded-lg px-4 py-3 text-sm", {
  variants: {
    variant: {
      action: "border border-gray-200 text-gray-600 dark:border-gray-900/50 dark:text-zinc-500",
      warning:
        "border border-amber-200 text-amber-800 dark:border-amber-900/50 dark:text-amber-200",
      error: "border border-red-200 text-red-800 dark:border-red-900/50 dark:text-red-200",
    },
    fill: {
      true: "",
      false: "",
    },
  },
  compoundVariants: [
    {
      variant: "action",
      fill: true,
      className: "bg-gray-100 border-transparent dark:bg-zinc-900 dark:border-transparent",
    },
    {
      variant: "action",
      fill: false,
      className: "bg-transparent",
    },
    {
      variant: "warning",
      fill: true,
      className: "bg-amber-50 border-transparent dark:bg-amber-950/30 dark:border-transparent",
    },
    {
      variant: "warning",
      fill: false,
      className: "bg-transparent",
    },
    {
      variant: "error",
      fill: true,
      className: "bg-red-50 border-transparent dark:bg-red-950/30 dark:border-transparent",
    },
    {
      variant: "error",
      fill: false,
      className: "bg-transparent",
    },
  ],
  defaultVariants: {
    variant: "warning",
    fill: false,
  },
})

const variantIcons = {
  action: Info,
  warning: AlertTriangle,
  error: XCircle,
}

type CTAConfig = {
  label: string
  onClick: () => void
  variant?: "default" | "outline" | "ghost"
}

export type SystemMessageProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof systemMessageVariants> & {
    icon?: React.ReactNode
    isIconHidden?: boolean
    cta?: CTAConfig
  }

function SystemMessage({
  children,
  variant = "action",
  fill = false,
  icon,
  isIconHidden = false,
  cta,
  className,
  ...props
}: SystemMessageProps) {
  const IconComponent = variant ? variantIcons[variant] : variantIcons.warning

  return (
    <div className={cn(systemMessageVariants({ variant, fill }), className)} {...props}>
      {!isIconHidden && (
        <span className="mt-0.5 shrink-0">{icon ?? <IconComponent className="h-4 w-4" />}</span>
      )}
      <div className="flex flex-1 flex-col gap-2">
        <p className="leading-relaxed">{children}</p>
        {cta && (
          <Button
            variant={cta.variant ?? "default"}
            size="sm"
            onClick={cta.onClick}
            className="w-fit"
          >
            {cta.label}
          </Button>
        )}
      </div>
    </div>
  )
}

export { SystemMessage, systemMessageVariants }
