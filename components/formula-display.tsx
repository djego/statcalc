interface FormulaDisplayProps {
  title: string
  formula: string
  substituted?: string
  result?: string
}

export function FormulaDisplay({ title, formula, substituted, result }: FormulaDisplayProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <div className="formula space-y-1">
        <p className="text-foreground">{formula}</p>
        {substituted && <p className="text-muted-foreground">= {substituted}</p>}
        {result && <p className="formula-highlight">= {result}</p>}
      </div>
    </div>
  )
}
