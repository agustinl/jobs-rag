"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function ModeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = resolvedTheme === "dark"

  const handleToggle = React.useCallback(
    (checked: boolean) => {
      setTheme(checked ? "dark" : "light")
    },
    [setTheme]
  )

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <Sun className="h-4 w-4" />
        <Switch disabled />
        <Moon className="h-4 w-4" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="theme-toggle" className="sr-only">
        Toggle theme
      </Label>
      <Sun className="text-muted-foreground h-4 w-4" />
      <Switch
        id="theme-toggle"
        checked={isDark}
        onCheckedChange={handleToggle}
        aria-label="Toggle dark mode"
      />
      <Moon className="text-muted-foreground h-4 w-4" />
    </div>
  )
}
