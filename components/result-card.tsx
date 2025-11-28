import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ResultCardProps {
  title: string
  value: string | number
  description?: string
  variant?: "default" | "primary" | "accent"
  className?: string
}

export function ResultCard({ title, value, description, variant = "default", className }: ResultCardProps) {
  return (
    <Card
      className={cn(
        variant === "primary" && "border-primary/50 bg-primary/5",
        variant === "accent" && "border-accent/50 bg-accent/5",
        className,
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            "text-2xl font-bold",
            variant === "primary" && "text-primary",
            variant === "accent" && "text-accent",
          )}
        >
          {value}
        </p>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  )
}
