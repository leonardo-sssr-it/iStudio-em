"use client"

import * as React from "react"
import { X, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface TagInputProps {
  value?: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
}

export function TagInput({
  value = [],
  onChange,
  placeholder = "Aggiungi tag...",
  disabled = false,
  className,
  id,
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("")
  const [tags, setTags] = React.useState<string[]>(value)

  // Sincronizza con il valore esterno
  React.useEffect(() => {
    setTags(value)
  }, [value])

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      const newTags = [...tags, trimmedTag]
      setTags(newTags)
      onChange(newTags)
    }
    setInputValue("")
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove)
    setTags(newTags)
    onChange(newTags)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Se l'utente digita una virgola, aggiungi il tag
    if (value.includes(",")) {
      const newTags = value
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag)
      newTags.forEach((tag) => {
        if (!tags.includes(tag)) {
          addTag(tag)
        }
      })
    } else {
      setInputValue(value)
    }
  }

  const parseFromString = (str: string) => {
    // Prova a parsare come JSON
    try {
      const parsed = JSON.parse(str)
      if (Array.isArray(parsed)) {
        const newTags = parsed.filter((item) => typeof item === "string")
        setTags(newTags)
        onChange(newTags)
        return
      }
    } catch (e) {
      // Non è JSON valido, tratta come lista separata da virgole
    }

    // Tratta come lista separata da virgole
    const newTags = str
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag)
    setTags(newTags)
    onChange(newTags)
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-2 border rounded-md bg-background">
        {tags.map((tag, index) => (
          <Badge key={index} variant="secondary" className="flex items-center gap-1">
            {tag}
            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-0 w-4 h-4 hover:bg-transparent"
                onClick={() => removeTag(tag)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </Badge>
        ))}
        {!disabled && (
          <Input
            id={id}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            placeholder={tags.length === 0 ? placeholder : ""}
            className="border-0 shadow-none focus-visible:ring-0 flex-1 min-w-[120px] h-6 p-0"
            disabled={disabled}
          />
        )}
      </div>

      {!disabled && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addTag(inputValue)}
            disabled={!inputValue.trim()}
            className="flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            Aggiungi
          </Button>
          <Input
            type="text"
            placeholder="Incolla lista separata da virgole o JSON"
            className="flex-1 text-xs"
            onPaste={(e) => {
              e.preventDefault()
              const pastedText = e.clipboardData.getData("text")
              parseFromString(pastedText)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                parseFromString(e.currentTarget.value)
                e.currentTarget.value = ""
              }
            }}
          />
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        Premi Enter o virgola per aggiungere. Incolla liste separate da virgole o JSON.
      </div>
    </div>
  )
}
