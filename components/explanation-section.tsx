"use client"

import type React from "react"

import { useState } from "react"
import { ChevronDown, ChevronUp, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ExplanationSectionProps {
  title?: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export function ExplanationSection({
  title = "How this is calculated",
  children,
  defaultOpen = false,
}: ExplanationSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Card className="mt-6 border-dashed">
      <CardHeader className="pb-2">
        <Button
          variant="ghost"
          className="w-full justify-between p-0 h-auto hover:bg-transparent"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </Button>
      </CardHeader>
      {isOpen && <CardContent className="pt-2 text-sm text-muted-foreground space-y-4">{children}</CardContent>}
    </Card>
  )
}
