import type React from "react"
import { AppSidebar } from "@/components/app-sidebar"

export function CalculatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <div className="container max-w-5xl py-8 px-6">{children}</div>
      </main>
    </div>
  )
}
