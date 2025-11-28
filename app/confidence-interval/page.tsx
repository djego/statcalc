"use client"

import { useState } from "react"
import { CalculatorLayout } from "@/components/calculator-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResultCard } from "@/components/result-card"
import { FormulaDisplay } from "@/components/formula-display"
import { ExplanationSection } from "@/components/explanation-section"
import {
  Z_SCORES,
  getTCritical,
  parseDataInput,
  calculateMean,
  calculateStdDev,
  standardErrorMean,
  standardErrorProportion,
  confidenceIntervalMean,
  confidenceIntervalProportion,
  formatNumber,
} from "@/lib/statistics"
import { AlertCircle, CheckCircle2 } from "lucide-react"

type StatisticType = "mean" | "proportion"
type InputMode = "raw" | "summary"
type SigmaKnowledge = "known" | "unknown"

interface MeanResults {
  type: "mean"
  mean: number
  stdDev: number
  n: number
  standardError: number
  criticalValue: number
  criticalType: "z" | "t"
  df?: number
  marginOfError: number
  lowerBound: number
  upperBound: number
  confidenceLevel: number
}

interface ProportionResults {
  type: "proportion"
  proportion: number
  successes: number
  n: number
  standardError: number
  criticalValue: number
  marginOfError: number
  lowerBound: number
  upperBound: number
  confidenceLevel: number
}

type Results = MeanResults | ProportionResults

export default function ConfidenceIntervalCalculator() {
  const [statisticType, setStatisticType] = useState<StatisticType>("mean")
  const [inputMode, setInputMode] = useState<InputMode>("summary")
  const [sigmaKnowledge, setSigmaKnowledge] = useState<SigmaKnowledge>("unknown")
  const [confidenceLevel, setConfidenceLevel] = useState("95")

  // Mean inputs
  const [rawData, setRawData] = useState("")
  const [sampleMean, setSampleMean] = useState("")
  const [sampleStdDev, setSampleStdDev] = useState("")
  const [sampleSize, setSampleSize] = useState("")
  const [populationSigma, setPopulationSigma] = useState("")

  // Proportion inputs
  const [successes, setSuccesses] = useState("")
  const [proportionN, setProportionN] = useState("")

  const [results, setResults] = useState<Results | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCalculate = () => {
    setError(null)
    setResults(null)

    const conf = Number.parseInt(confidenceLevel)
    const z = Z_SCORES[conf]

    if (!z) {
      setError("Invalid confidence level")
      return
    }

    if (statisticType === "mean") {
      let mean: number
      let stdDev: number
      let n: number

      if (inputMode === "raw") {
        const data = parseDataInput(rawData)
        if (data.length < 2) {
          setError("Please enter at least 2 data points")
          return
        }
        mean = calculateMean(data)
        stdDev = sigmaKnowledge === "known" ? Number.parseFloat(populationSigma) : calculateStdDev(data)
        n = data.length

        if (sigmaKnowledge === "known" && (isNaN(stdDev) || stdDev <= 0)) {
          setError("Please enter a valid population standard deviation")
          return
        }
      } else {
        mean = Number.parseFloat(sampleMean)
        n = Number.parseFloat(sampleSize)

        if (sigmaKnowledge === "known") {
          stdDev = Number.parseFloat(populationSigma)
        } else {
          stdDev = Number.parseFloat(sampleStdDev)
        }

        if (isNaN(mean)) {
          setError("Please enter a valid sample mean")
          return
        }
        if (isNaN(n) || n < 2 || !Number.isInteger(n)) {
          setError("Sample size must be an integer >= 2")
          return
        }
        if (isNaN(stdDev) || stdDev <= 0) {
          setError("Please enter a valid standard deviation")
          return
        }
      }

      const se = standardErrorMean(stdDev, n)
      let criticalValue: number
      let criticalType: "z" | "t"
      let df: number | undefined

      if (sigmaKnowledge === "known") {
        criticalValue = z
        criticalType = "z"
      } else {
        df = n - 1
        criticalValue = getTCritical(df, conf)
        criticalType = "t"
      }

      const [lower, upper] = confidenceIntervalMean(mean, criticalValue, se)
      const marginOfError = criticalValue * se

      setResults({
        type: "mean",
        mean,
        stdDev,
        n,
        standardError: se,
        criticalValue,
        criticalType,
        df,
        marginOfError,
        lowerBound: lower,
        upperBound: upper,
        confidenceLevel: conf,
      })
    } else {
      // Proportion
      const x = Number.parseFloat(successes)
      const n = Number.parseFloat(proportionN)

      if (isNaN(x) || x < 0 || !Number.isInteger(x)) {
        setError("Number of successes must be a non-negative integer")
        return
      }
      if (isNaN(n) || n < 1 || !Number.isInteger(n)) {
        setError("Sample size must be a positive integer")
        return
      }
      if (x > n) {
        setError("Number of successes cannot exceed sample size")
        return
      }

      const p = x / n
      const se = standardErrorProportion(p, n)
      const [lower, upper] = confidenceIntervalProportion(p, z, n)
      const marginOfError = z * se

      setResults({
        type: "proportion",
        proportion: p,
        successes: x,
        n,
        standardError: se,
        criticalValue: z,
        marginOfError,
        lowerBound: lower,
        upperBound: upper,
        confidenceLevel: conf,
      })
    }
  }

  return (
    <CalculatorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Confidence Interval Calculator</h1>
          <p className="text-muted-foreground mt-1">
            Calculate confidence intervals for population means and proportions
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Input Parameters</CardTitle>
              <CardDescription>Select the type of statistic and enter your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Type of Statistic</Label>
                <Select value={statisticType} onValueChange={(v) => setStatisticType(v as StatisticType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mean">Mean</SelectItem>
                    <SelectItem value="proportion">Proportion</SelectItem>
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

              {statisticType === "mean" ? (
                <>
                  <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as InputMode)}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="summary">Summary Data</TabsTrigger>
                      <TabsTrigger value="raw">Raw Data</TabsTrigger>
                    </TabsList>
                    <TabsContent value="summary" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="sampleMean">Sample Mean (x̄)</Label>
                        <Input
                          id="sampleMean"
                          type="number"
                          step="any"
                          value={sampleMean}
                          onChange={(e) => setSampleMean(e.target.value)}
                          placeholder="Enter sample mean"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sampleSize">Sample Size (n)</Label>
                        <Input
                          id="sampleSize"
                          type="number"
                          min="2"
                          value={sampleSize}
                          onChange={(e) => setSampleSize(e.target.value)}
                          placeholder="Enter sample size"
                        />
                      </div>
                    </TabsContent>
                    <TabsContent value="raw" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="rawData">Raw Data</Label>
                        <Textarea
                          id="rawData"
                          value={rawData}
                          onChange={(e) => setRawData(e.target.value)}
                          placeholder="Enter values separated by commas or spaces (e.g., 23, 45, 67, 89)"
                          rows={4}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="space-y-2">
                    <Label>Population Standard Deviation (σ)</Label>
                    <Select value={sigmaKnowledge} onValueChange={(v) => setSigmaKnowledge(v as SigmaKnowledge)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unknown">Unknown (use t-interval)</SelectItem>
                        <SelectItem value="known">Known (use z-interval)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {sigmaKnowledge === "known" ? (
                    <div className="space-y-2">
                      <Label htmlFor="populationSigma">Population σ</Label>
                      <Input
                        id="populationSigma"
                        type="number"
                        step="any"
                        value={populationSigma}
                        onChange={(e) => setPopulationSigma(e.target.value)}
                        placeholder="Enter known population σ"
                      />
                    </div>
                  ) : inputMode === "summary" ? (
                    <div className="space-y-2">
                      <Label htmlFor="sampleStdDev">Sample Standard Deviation (s)</Label>
                      <Input
                        id="sampleStdDev"
                        type="number"
                        step="any"
                        value={sampleStdDev}
                        onChange={(e) => setSampleStdDev(e.target.value)}
                        placeholder="Enter sample std dev"
                      />
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="successes">Number of Successes (x)</Label>
                    <Input
                      id="successes"
                      type="number"
                      min="0"
                      value={successes}
                      onChange={(e) => setSuccesses(e.target.value)}
                      placeholder="Enter number of successes"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proportionN">Sample Size (n)</Label>
                    <Input
                      id="proportionN"
                      type="number"
                      min="1"
                      value={proportionN}
                      onChange={(e) => setProportionN(e.target.value)}
                      placeholder="Enter total sample size"
                    />
                  </div>
                </>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button onClick={handleCalculate} className="w-full">
                Calculate Confidence Interval
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
                      title="Point Estimate"
                      value={
                        results.type === "mean"
                          ? formatNumber(results.mean)
                          : `${formatNumber(results.proportion * 100, 2)}%`
                      }
                      description={results.type === "mean" ? "Sample mean (x̄)" : "Sample proportion (p̂)"}
                    />
                    <ResultCard
                      title="Standard Error"
                      value={formatNumber(results.standardError)}
                      description={
                        results.type === "mean" ? (results.criticalType === "z" ? "σ / √n" : "s / √n") : "√[p̂(1-p̂)/n]"
                      }
                    />
                    <ResultCard
                      title="Critical Value"
                      value={formatNumber(results.criticalValue, 3)}
                      description={
                        results.type === "mean" && results.criticalType === "t"
                          ? `t₍${results.df}₎`
                          : `z for ${results.confidenceLevel}%`
                      }
                    />
                    <ResultCard
                      title="Margin of Error"
                      value={
                        results.type === "proportion"
                          ? `±${formatNumber(results.marginOfError * 100, 2)}%`
                          : `±${formatNumber(results.marginOfError)}`
                      }
                    />
                  </div>

                  <Alert className="border-primary/50 bg-primary/5">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <AlertTitle>{results.confidenceLevel}% Confidence Interval</AlertTitle>
                    <AlertDescription className="text-lg font-semibold mt-2">
                      {results.type === "proportion" ? (
                        <>
                          [{formatNumber(results.lowerBound * 100, 2)}%, {formatNumber(results.upperBound * 100, 2)}%]
                        </>
                      ) : (
                        <>
                          [{formatNumber(results.lowerBound)}, {formatNumber(results.upperBound)}]
                        </>
                      )}
                    </AlertDescription>
                  </Alert>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Interpretation</h4>
                    <p className="text-sm text-muted-foreground">
                      {results.type === "mean" ? (
                        <>
                          With {results.confidenceLevel}% confidence, the true population mean lies between{" "}
                          <strong>{formatNumber(results.lowerBound)}</strong> and{" "}
                          <strong>{formatNumber(results.upperBound)}</strong>.
                        </>
                      ) : (
                        <>
                          With {results.confidenceLevel}% confidence, the true population proportion lies between{" "}
                          <strong>{formatNumber(results.lowerBound * 100, 2)}%</strong> and{" "}
                          <strong>{formatNumber(results.upperBound * 100, 2)}%</strong>.
                        </>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Calculation Steps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {results.type === "mean" ? (
                    <>
                      <div className="text-sm space-y-1">
                        <p>
                          <strong>Sample size:</strong> n = {results.n}
                        </p>
                        <p>
                          <strong>Sample mean:</strong> x̄ = {formatNumber(results.mean)}
                        </p>
                        <p>
                          <strong>{results.criticalType === "z" ? "Population" : "Sample"} std dev:</strong>{" "}
                          {results.criticalType === "z" ? "σ" : "s"} = {formatNumber(results.stdDev)}
                        </p>
                      </div>

                      <FormulaDisplay
                        title="Standard Error"
                        formula={results.criticalType === "z" ? "SE = σ / √n" : "SE = s / √n"}
                        substituted={`${formatNumber(results.stdDev)} / √${results.n}`}
                        result={formatNumber(results.standardError)}
                      />

                      <FormulaDisplay
                        title="Confidence Interval"
                        formula={`x̄ ± ${results.criticalType}* × SE`}
                        substituted={`${formatNumber(results.mean)} ± ${formatNumber(results.criticalValue, 3)} × ${formatNumber(results.standardError)}`}
                        result={`[${formatNumber(results.lowerBound)}, ${formatNumber(results.upperBound)}]`}
                      />
                    </>
                  ) : (
                    <>
                      <div className="text-sm space-y-1">
                        <p>
                          <strong>Successes:</strong> x = {results.successes}
                        </p>
                        <p>
                          <strong>Sample size:</strong> n = {results.n}
                        </p>
                        <p>
                          <strong>Sample proportion:</strong> p̂ = {results.successes}/{results.n} ={" "}
                          {formatNumber(results.proportion)}
                        </p>
                      </div>

                      <FormulaDisplay
                        title="Standard Error"
                        formula="SE = √[p̂(1-p̂)/n]"
                        substituted={`√[${formatNumber(results.proportion)}(1-${formatNumber(results.proportion)})/${results.n}]`}
                        result={formatNumber(results.standardError)}
                      />

                      <FormulaDisplay
                        title="Confidence Interval"
                        formula="p̂ ± z* × SE"
                        substituted={`${formatNumber(results.proportion)} ± ${formatNumber(results.criticalValue, 3)} × ${formatNumber(results.standardError)}`}
                        result={`[${formatNumber(results.lowerBound)}, ${formatNumber(results.upperBound)}]`}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <ExplanationSection>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-foreground mb-1">Z-interval vs T-interval</h4>
              <p>
                Use a <strong>z-interval</strong> when the population standard deviation (σ) is known. Use a{" "}
                <strong>t-interval</strong> when σ is unknown and you use the sample standard deviation (s) as an
                estimate. The t-distribution has heavier tails, resulting in wider intervals that account for the
                additional uncertainty.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-1">Interpreting Confidence Intervals</h4>
              <p>
                A 95% confidence interval means that if we repeated this sampling process many times, about 95% of the
                calculated intervals would contain the true population parameter. It does NOT mean there is a 95%
                probability the true value is in this specific interval.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-1">Assumptions</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  For means: The sample should be randomly selected, and either the population is normally distributed
                  or n ≥ 30 (Central Limit Theorem).
                </li>
                <li>For proportions: np ≥ 10 and n(1-p) ≥ 10 for the normal approximation to be valid.</li>
              </ul>
            </div>
          </div>
        </ExplanationSection>
      </div>
    </CalculatorLayout>
  )
}
