"use client"

import { useEffect, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Command, CommandDialog } from "@/components/ui/command"

/**
 * Componente che precarica i componenti UI comuni per migliorare la reattività
 * Questo componente dovrebbe essere aggiunto al layout principale
 */
export function PreloadComponents() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null

  return (
    <div className="preload-ui">
      {/* Precarica Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <div />
        </PopoverTrigger>
        <PopoverContent className="preload-dropdown">
          <div>Preload Popover</div>
        </PopoverContent>
      </Popover>

      {/* Precarica DropdownMenu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="preload-dropdown">
          <div>Preload Dropdown</div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Precarica Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <div />
        </DialogTrigger>
        <DialogContent className="preload-dropdown">
          <div>Preload Dialog</div>
        </DialogContent>
      </Dialog>

      {/* Precarica Tooltip */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div />
          </TooltipTrigger>
          <TooltipContent className="preload-dropdown">
            <div>Preload Tooltip</div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Precarica Command */}
      <CommandDialog open={false}>
        <Command>
          <div>Preload Command</div>
        </Command>
      </CommandDialog>
    </div>
  )
}
