"use client"

import type React from "react"

import { useState, useRef, useEffect, type ComponentProps, type ElementType } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Check, X, Edit3 } from "lucide-react"
import { cn } from "@/lib/utils"

type PageKeys =
  | "id"
  | "modifica"
  | "id_utente"
  | "attivo"
  | "titolo"
  | "estratto"
  | "contenuto"
  | "categoria"
  | "tags"
  | "immagine"
  | "pubblicato"
  | "privato"

interface EditableFieldProps extends ComponentProps<"div"> {
  pageId: number
  fieldName: PageKeys
  value: any
  canEdit: boolean
  onUpdate: (field: PageKeys, value: any) => Promise<void>
  label: string
  as?: ElementType
  isTextarea?: boolean
  displayComponent?: React.ReactNode
}

export default function EditableField({
  pageId,
  fieldName,
  value,
  canEdit,
  onUpdate,
  label,
  as: Component = "div",
  isTextarea = false,
  displayComponent,
  className,
  ...props
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [currentValue, setCurrentValue] = useState(value)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    setCurrentValue(value)
  }, [value])

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const handleSave = () => {
    if (currentValue !== value) {
      onUpdate(fieldName, currentValue)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setCurrentValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isTextarea && !(e.nativeEvent.target instanceof HTMLButtonElement)) {
      handleSave()
    } else if (e.key === "Escape") {
      handleCancel()
    }
  }

  const renderInput = () => {
    const commonProps = {
      ref: inputRef as any,
      value: currentValue ?? "",
      onChange: (e: any) => setCurrentValue(e.target.value),
      onBlur: handleSave,
      onKeyDown: handleKeyDown,
      className: "text-base",
    }

    switch (typeof value) {
      case "boolean":
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={currentValue}
              onCheckedChange={(checked) => {
                setCurrentValue(checked)
                onUpdate(fieldName, checked)
                setIsEditing(false)
              }}
            />
            <span className="text-sm">{currentValue ? "Sì" : "No"}</span>
          </div>
        )
      case "string":
      default:
        if (isTextarea) {
          return <Textarea {...commonProps} rows={Math.max(5, (currentValue?.split("\n").length || 1) + 2)} />
        }
        return <Input {...commonProps} />
    }
  }

  if (isEditing) {
    return (
      <div className="relative group" onKeyDown={handleKeyDown}>
        <label className="text-xs font-semibold text-gray-500">{label}</label>
        {renderInput()}
        {!isTextarea && typeof value !== "boolean" && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSave}>
              <Check className="h-4 w-4 text-green-500" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancel}>
              <X className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <Component
      className={cn(
        "relative group transition-all",
        canEdit && "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-2 -m-2 rounded-md",
        className,
      )}
      onClick={() => canEdit && setIsEditing(true)}
      {...props}
    >
      {displayComponent ? displayComponent : <>{value}</>}
      {canEdit && (
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1">
          <Edit3 className="h-4 w-4 text-gray-500" />
        </div>
      )}
    </Component>
  )
}
