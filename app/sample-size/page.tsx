"use client"

import { useState } from "react"
import { CalculatorLayout } from "@/components/calculator-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ResultCard } from "@/components/result-card"
import { FormulaDisplay } from "@/components/formula-display"
import { ExplanationSection } from "@/components/explanation-section"
import { Z_SCORES, sampleSizeProportion, sampleSizeMean, finitePopulationCorrection } from "@/lib/statistics"
import { AlertCircle, CheckCircle2 } from "lucide-react"

type ParameterType = "proportion" | "mean"

interface Results {
  n0: number
  nAdjusted: number | null
  z: number
  populationSize: number | null
  confidenceLevel: number
  marginOfError: number
  parameterType: ParameterType
  proportion?: number
  sigma?: number
}

export default function SampleSizeCalculator() {
  const [parameterType, setParameterType] = useState<ParameterType>("proportion")
  const [confidenceLevel, setConfidenceLevel] = useState("95")
  const [marginOfError, setMarginOfError] = useState("0.05")
  const [proportion, setProportion] = useState("0.5")
  const [sigma, setSigma] = useState("")
  const [populationSize, setPopulationSize] = useState("")
  const [results, setResults] = useState<Results | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCalculate = () => {
    setError(null)
    setResults(null)

    const e = Number.parseFloat(marginOfError)
    const conf = Number.parseInt(confidenceLevel)
    const z = Z_SCORES[conf]

    if (!z) {
      setError("Invalid confidence level")
      return
    }

    if (isNaN(e) || e <= 0 || e >= 1) {
      setError("Margin of error must be between 0 and 1")
      return
    }

    let n0: number

    if (parameterType === "proportion") {
      const p = Number.parseFloat(proportion)
      if (isNaN(p) || p < 0 || p > 1) {
        setError("Proportion must be between 0 and 1")
        return
      }
      n0 = sampleSizeProportion(z, p, e)
    } else {
      const s = Number.parseFloat(sigma)
      if (isNaN(s) || s <= 0) {
        setError("Standard deviation must be a positive number")
        return
      }
      n0 = sampleSizeMean(z, s, e)
    }

    let nAdjusted: number | null = null
    const N = populationSize ? Number.parseFloat(populationSize) : null

    if (N !== null && !isNaN(N) && N > 0) {
      if (n0 > N) {
        setError("Required sample size exceeds population size")
        return
      }
      nAdjusted = finitePopulationCorrection(n0, N)
    }

    setResults({
      n0,
      nAdjusted,
      z,
      populationSize: N,
      confidenceLevel: conf,
      marginOfError: e,
      parameterType,
      proportion: parameterType === "proportion" ? Number.parseFloat(proportion) : undefined,
      sigma: parameterType === "mean" ? Number.parseFloat(sigma) : undefined,
    })
  }

  return (
    <CalculatorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sample Size Calculator</h1>
          <p className="text-muted-foreground mt-1">Calculate the required sample size for surveys and experiments</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Input Parameters</CardTitle>
              <CardDescription>Enter your study parameters to calculate the required sample size</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Type of Parameter</Label>
                <Select value={parameterType} onValueChange={(v) => setParameterType(v as ParameterType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proportion">Proportion</SelectItem>
                    <SelectItem value="mean">Mean</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Confidence Level</Label>
                <Select value={confidenceLevel} onValueChange={setConfidenceLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="80">80%</SelectItem>
                    <SelectItem value="85">85%</SelectItem>
                    <SelectItem value="90">90%</SelectItem>
                    <SelectItem value="95">95%</SelectItem>
                    <SelectItem value="99">99%</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="marginOfError">Margin of Error (E)</Label>
                <Input
                  id="marginOfError"
                  type="number"
                  step="0.01"
                  value={marginOfError}
                  onChange={(e) => setMarginOfError(e.target.value)}
                  placeholder="e.g., 0.05 for 5%"
                />
                <p className="text-xs text-muted-foreground">Enter as decimal (e.g., 0.05 for 5%)</p>
              </div>

              {parameterType === "proportion" ? (
                <div className="space-y-2">
                  <Label htmlFor="proportion">Estimated Proportion (p)</Label>
                  <Input
                    id="proportion"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={proportion}
                    onChange={(e) => setProportion(e.target.value)}
                    placeholder="0.5 if unknown"
                  />
                  <p className="text-xs text-muted-foreground">Use 0.5 if unknown (most conservative)</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="sigma">Estimated Standard Deviation (σ)</Label>
                  <Input
                    id="sigma"
                    type="number"
                    step="0.01"
                    value={sigma}
                    onChange={(e) => setSigma(e.target.value)}
                    placeholder="Enter estimated std dev"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="populationSize">Population Size (N) - Optional</Label>
                <Input
                  id="populationSize"
                  type="number"
                  value={populationSize}
                  onChange={(e) => setPopulationSize(e.target.value)}
                  placeholder="Leave empty for infinite population"
                />
                <p className="text-xs text-muted-foreground">Leave empty to assume infinite population</p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button onClick={handleCalculate} className="w-full">
                Calculate Sample Size
              </Button>
            </CardContent>
          </Card>

          {results && (
            <div className="space-y-4">
              <Card className="border-primary/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ResultCard
                      title="Initial Sample Size (n₀)"
                      value={results.n0}
                      description="Assuming infinite population"
                    />
                    {results.nAdjusted !== null && (
                      <ResultCard
                        title="Adjusted Sample Size"
                        value={results.nAdjusted}
                        description={`For N = ${results.populationSize?.toLocaleString()}`}
                        variant="primary"
                      />
                    )}
                  </div>

                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Recommended Sample Size</AlertTitle>
                    <AlertDescription>
                      <span className="font-bold text-lg">{results.nAdjusted ?? results.n0}</span> participants are
                      needed to estimate the {results.parameterType === "proportion" ? "proportion" : "mean"} with a{" "}
                      {results.confidenceLevel}% confidence level and a margin of error of{" "}
                      {(results.marginOfError * 100).toFixed(1)}%.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Calculation Steps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Z-score for {results.confidenceLevel}% confidence:
                    </p>
                    <p className="font-mono text-sm">Z = {results.z}</p>
                  </div>

                  {results.parameterType === "proportion" ? (
                    <FormulaDisplay
                      title="Sample Size Formula (Proportion)"
                      formula="n₀ = Z² × p(1-p) / E²"
                      substituted={`${results.z}² × ${results.proportion}(1-${results.proportion}) / ${results.marginOfError}²`}
                      result={results.n0.toString()}
                    />
                  ) : (
                    <FormulaDisplay
                      title="Sample Size Formula (Mean)"
                      formula="n₀ = Z² × σ² / E²"
                      substituted={`${results.z}² × ${results.sigma}² / ${results.marginOfError}²`}
                      result={results.n0.toString()}
                    />
                  )}

                  {results.nAdjusted !== null && results.populationSize !== null && (
                    <FormulaDisplay
                      title="Finite Population Correction"
                      formula="n = n₀ / (1 + (n₀ - 1) / N)"
                      substituted={`${results.n0} / (1 + (${results.n0} - 1) / ${results.populationSize})`}
                      result={results.nAdjusted.toString()}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <ExplanationSection>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-foreground mb-1">When to use this calculator</h4>
              <p>
                Use this calculator when planning surveys, experiments, or studies to determine how many participants or
                observations you need to achieve your desired precision.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-1">Infinite vs Finite Population</h4>
              <p>
                If your population is very large (e.g., all adults in a country) or you are sampling with replacement,
                use the infinite population formula. If your population is small and known (e.g., employees at a
                company), apply the finite population correction to reduce the required sample size.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-1">Choosing Parameters</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>Confidence Level:</strong> Higher confidence requires larger samples. 95% is standard for most
                  research.
                </li>
                <li>
                  <strong>Margin of Error:</strong> Smaller margins require larger samples. 5% is common for surveys.
                </li>
                <li>
                  <strong>Proportion (p):</strong> Use 0.5 if unknown, as this gives the most conservative (largest)
                  estimate.
                </li>
              </ul>
            </div>
          </div>
        </ExplanationSection>
      </div>
    </CalculatorLayout>
  )
}
