"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Calculator,
  Target,
  BarChart3,
  TrendingUp,
  FlaskConical,
  Calendar,
  GitBranch,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const navItems = [
  {
    title: "Sample Size",
    href: "/sample-size",
    icon: Target,
    description: "Calculate required sample sizes",
  },
  {
    title: "Confidence Interval",
    href: "/confidence-interval",
    icon: BarChart3,
    description: "Estimate population parameters",
  },
  {
    title: "Hypothesis Test",
    href: "/hypothesis-test",
    icon: FlaskConical,
    description: "Test statistical hypotheses",
  },
  {
    title: "Seasonal Index",
    href: "/seasonal-index",
    icon: Calendar,
    description: "Calculate seasonal patterns",
  },
  {
    title: "ANOVA & Regression",
    href: "/anova-regression",
    icon: TrendingUp,
    description: "Analyze variance and relationships",
  },
  {
    title: "Linear Programming",
    href: "/linear-programming",
    icon: GitBranch,
    description: "Optimize linear constraints",
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 border-r border-border bg-sidebar transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="p-4 border-b border-border flex items-center justify-between">
        <Link href="/" className={cn("flex items-center gap-2", collapsed && "justify-center")}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Calculator className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && <span className="font-semibold text-foreground">StatCalc</span>}
        </Link>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                "hover:bg-sidebar-accent",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70",
                collapsed && "justify-center px-2",
              )}
              title={collapsed ? item.title : undefined}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-sm truncate">{item.title}</span>
                  <span className="text-xs text-muted-foreground truncate">{item.description}</span>
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">Statistical Calculator v1.0</p>
        </div>
      )}
    </aside>
  )
}
