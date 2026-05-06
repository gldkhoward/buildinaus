"use client"

import * as React from "react"
import { cn } from "@buildinaus/ui/lib/utils"
import { focusCommandBar } from "@/lib/intake-focus"

interface CommandBarTriggerProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  prefill?: string
}

export function CommandBarTrigger({
  prefill,
  className,
  children,
  type,
  ...rest
}: CommandBarTriggerProps) {
  return (
    <button
      type={type ?? "button"}
      onClick={() => focusCommandBar(prefill)}
      className={cn(className)}
      {...rest}
    >
      {children}
    </button>
  )
}
