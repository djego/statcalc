"use client"

import { useState } from "react"
import { CalculatorLayout } from "@/components/calculator-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ExplanationSection } from "@/components/explanation-section"
import { calculateSeasonalIndices, parseDataInput, formatNumber } from "@/lib/statistics"
import { AlertCircle, CheckCircle2 } from "lucide-react"

interface Results {
  indices: number[]
  deseasonalized: number[]
  movingAverages: (number | null)[]
  ratios: (number | null)[]
  originalData: number[]
  periodsPerSeason: number
}

export default function SeasonalIndexCalculator() {
  const [rawData, setRawData] = useState("")
  const [periodsPerSeason, setPeriodsPerSeason] = useState("4")
  const [results, setResults] = useState<Results | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCalculate = () => {
    setError(null)
    setResults(null)

    const data = parseDataInput(rawData)
    const periods = Number.parseInt(periodsPerSeason)

    if (data.length < periods * 2) {
      setError(`Please enter at least ${periods * 2} data points (2 complete seasons)`)
      return
    }

    if (periods < 2) {
      setError("Periods per season must be at least 2")
      return
    }

    const result = calculateSeasonalIndices(data, periods)
    setResults({
      ...result,
      originalData: data,
      periodsPerSeason: periods,
    })
  }

  const getSeasonLabel = (index: number, total: number): string => {
    if (total === 4) {
      return ["Q1", "Q2", "Q3", "Q4"][index]
    } else if (total === 12) {
      return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][index]
    } else {
      return `Period ${index + 1}`
    }
  }

  return (
    <CalculatorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Seasonal Index Calculator</h1>
          <p className="text-muted-foreground mt-1">
            Calculate seasonal indices using the ratio-to-moving-average method
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Input Data</CardTitle>
              <CardDescription>Enter your time series data in chronological order</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Periods per Season</Label>
                <Select value={periodsPerSeason} onValueChange={setPeriodsPerSeason}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4 (Quarterly)</SelectItem>
                    <SelectItem value="12">12 (Monthly)</SelectItem>
                    <SelectItem value="2">2 (Semi-annual)</SelectItem>
                    <SelectItem value="7">7 (Weekly - days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rawData">Time Series Data</Label>
                <Textarea
                  id="rawData"
                  value={rawData}
                  onChange={(e) => setRawData(e.target.value)}
                  placeholder="Enter values separated by commas or spaces (e.g., 120, 135, 150, 110, 125, 140, 155, 115)"
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Enter data in chronological order. For quarterly data, start with Q1.
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button onClick={handleCalculate} className="w-full">
                Calculate Seasonal Indices
              </Button>
            </CardContent>
          </Card>

          {results && (
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Seasonal Indices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Season</TableHead>
                      <TableHead className="text-right">Index</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.indices.map((index, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{getSeasonLabel(i, results.periodsPerSeason)}</TableCell>
                        <TableCell className="text-right font-mono">{formatNumber(index, 4)}</TableCell>
                        <TableCell className="text-right">
                          <span className={index > 1 ? "text-accent" : index < 1 ? "text-destructive" : ""}>
                            {index > 1 ? "+" : ""}
                            {formatNumber((index - 1) * 100, 1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Interpretation</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {results.indices.map((index, i) => {
                      const label = getSeasonLabel(i, results.periodsPerSeason)
                      const diff = (index - 1) * 100
                      return (
                        <li key={i}>
                          <strong>{label}:</strong>{" "}
                          {diff > 0
                            ? `Typically ${formatNumber(diff, 1)}% above average`
                            : diff < 0
                              ? `Typically ${formatNumber(Math.abs(diff), 1)}% below average`
                              : "At average level"}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {results && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detailed Calculations</CardTitle>
              <CardDescription>Moving averages, ratios, and deseasonalized values</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Original</TableHead>
                      <TableHead className="text-right">Moving Avg</TableHead>
                      <TableHead className="text-right">Ratio</TableHead>
                      <TableHead className="text-right">Deseasonalized</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.originalData.map((val, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">
                          {getSeasonLabel(i % results.periodsPerSeason, results.periodsPerSeason)}{" "}
                          <span className="text-muted-foreground">
                            (Year {Math.floor(i / results.periodsPerSeason) + 1})
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">{formatNumber(val, 2)}</TableCell>
                        <TableCell className="text-right font-mono">
                          {results.movingAverages[i] !== null ? formatNumber(results.movingAverages[i]!, 2) : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {results.ratios[i] !== null ? formatNumber(results.ratios[i]!, 4) : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatNumber(results.deseasonalized[i], 2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        <ExplanationSection>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-foreground mb-1">Ratio-to-Moving-Average Method</h4>
              <p>This method calculates seasonal indices by:</p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Computing a centered moving average to smooth out seasonal and irregular variations</li>
                <li>Dividing each original value by its corresponding moving average to get ratios</li>
                <li>Averaging the ratios for each season across all years</li>
                <li>Normalizing so the indices average to 1.0</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-1">Using Seasonal Indices</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>Deseasonalizing:</strong> Divide actual values by the seasonal index to remove seasonal
                  effects
                </li>
                <li>
                  <strong>Forecasting:</strong> Multiply a trend forecast by the seasonal index to add seasonality
                </li>
                <li>
                  <strong>Comparison:</strong> An index {">"} 1 means that period is above average; {"<"} 1 means below
                  average
                </li>
              </ul>
            </div>
          </div>
        </ExplanationSection>
      </div>
    </CalculatorLayout>
  )
}
