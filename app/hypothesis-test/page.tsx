"use client"

import { useState } from "react"
import { CalculatorLayout } from "@/components/calculator-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ResultCard } from "@/components/result-card"
import { FormulaDisplay } from "@/components/formula-display"
import { ExplanationSection } from "@/components/explanation-section"
import { zTestProportion, zTestMean, tTestMean, twoSampleTTest, formatNumber } from "@/lib/statistics"
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react"

type TestType = "one-sample-mean" | "one-sample-proportion" | "two-sample-mean"
type AlternativeHypothesis = "two-tailed" | "left-tailed" | "right-tailed"
type SigmaKnowledge = "known" | "unknown"

interface OneSampleMeanResults {
  testType: "one-sample-mean"
  sampleMean: number
  hypothesizedMean: number
  stdDev: number
  n: number
  standardError: number
  testStatistic: number
  statisticType: "z" | "t"
  df?: number
  pValue: number
  alpha: number
  alternative: AlternativeHypothesis
  rejectNull: boolean
}

interface OneSampleProportionResults {
  testType: "one-sample-proportion"
  sampleProportion: number
  hypothesizedProportion: number
  successes: number
  n: number
  standardError: number
  zStatistic: number
  pValue: number
  alpha: number
  alternative: AlternativeHypothesis
  rejectNull: boolean
}

interface TwoSampleMeanResults {
  testType: "two-sample-mean"
  mean1: number
  mean2: number
  s1: number
  s2: number
  n1: number
  n2: number
  standardError: number
  tStatistic: number
  df: number
  pValue: number
  alpha: number
  alternative: AlternativeHypothesis
  rejectNull: boolean
  equalVariance: boolean
}

interface ComparisonResults {
  manualPValue: number
  calculatedPValue: number
  difference: number
  percentDifference: number
  sameConclusion: boolean
  manualRejectNull: boolean
}

type Results = (OneSampleMeanResults | OneSampleProportionResults | TwoSampleMeanResults) & {
  comparison?: ComparisonResults
}

export default function HypothesisTestCalculator() {
  const [testType, setTestType] = useState<TestType>("one-sample-mean")
  const [alternative, setAlternative] = useState<AlternativeHypothesis>("two-tailed")
  const [alpha, setAlpha] = useState("0.05")
  const [sigmaKnowledge, setSigmaKnowledge] = useState<SigmaKnowledge>("unknown")

  // One-sample mean inputs
  const [sampleMean, setSampleMean] = useState("")
  const [hypothesizedMean, setHypothesizedMean] = useState("")
  const [stdDev, setStdDev] = useState("")
  const [sampleSize, setSampleSize] = useState("")

  // One-sample proportion inputs
  const [successes, setSuccesses] = useState("")
  const [proportionN, setProportionN] = useState("")
  const [hypothesizedProportion, setHypothesizedProportion] = useState("")

  // Two-sample mean inputs
  const [mean1, setMean1] = useState("")
  const [mean2, setMean2] = useState("")
  const [s1, setS1] = useState("")
  const [s2, setS2] = useState("")
  const [n1, setN1] = useState("")
  const [n2, setN2] = useState("")
  const [equalVariance, setEqualVariance] = useState("no")

  const [results, setResults] = useState<Results | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [manualPValue, setManualPValue] = useState("")

  const adjustPValueForAlternative = (twoTailedP: number, statistic: number, alt: AlternativeHypothesis): number => {
    if (alt === "two-tailed") return twoTailedP
    if (alt === "left-tailed") {
      return statistic < 0 ? twoTailedP / 2 : 1 - twoTailedP / 2
    }
    // right-tailed
    return statistic > 0 ? twoTailedP / 2 : 1 - twoTailedP / 2
  }

  const calculateComparison = (pValue: number, alpha: number): ComparisonResults | undefined => {
    if (manualPValue && !isNaN(Number.parseFloat(manualPValue))) {
      const manualP = Number.parseFloat(manualPValue)
      if (manualP >= 0 && manualP <= 1) {
        return {
          manualPValue: manualP,
          calculatedPValue: pValue,
          difference: Math.abs(manualP - pValue),
          percentDifference: pValue !== 0 ? Math.abs((manualP - pValue) / pValue) * 100 : 0,
          sameConclusion: (manualP < alpha) === (pValue < alpha),
          manualRejectNull: manualP < alpha,
        }
      }
    }
    return undefined
  }

  const handleCalculate = () => {
    setError(null)
    setResults(null)

    const a = Number.parseFloat(alpha)
    if (isNaN(a) || a <= 0 || a >= 1) {
      setError("Significance level (α) must be between 0 and 1")
      return
    }

    if (testType === "one-sample-mean") {
      const xBar = Number.parseFloat(sampleMean)
      const mu0 = Number.parseFloat(hypothesizedMean)
      const s = Number.parseFloat(stdDev)
      const n = Number.parseInt(sampleSize)

      if (isNaN(xBar)) {
        setError("Please enter a valid sample mean")
        return
      }
      if (isNaN(mu0)) {
        setError("Please enter a valid hypothesized mean")
        return
      }
      if (isNaN(s) || s <= 0) {
        setError("Standard deviation must be positive")
        return
      }
      if (isNaN(n) || n < 2) {
        setError("Sample size must be at least 2")
        return
      }

      let testStatistic: number
      let pValue: number
      let statisticType: "z" | "t"
      let df: number | undefined
      let se: number

      if (sigmaKnowledge === "known") {
        const result = zTestMean(xBar, mu0, s, n)
        testStatistic = result.zStatistic
        pValue = adjustPValueForAlternative(result.pValue, testStatistic, alternative)
        statisticType = "z"
        se = s / Math.sqrt(n)
      } else {
        const result = tTestMean(xBar, mu0, s, n)
        testStatistic = result.tStatistic
        pValue = adjustPValueForAlternative(result.pValue, testStatistic, alternative)
        statisticType = "t"
        df = result.df
        se = s / Math.sqrt(n)
      }

      setResults({
        testType: "one-sample-mean",
        sampleMean: xBar,
        hypothesizedMean: mu0,
        stdDev: s,
        n,
        standardError: se,
        testStatistic,
        statisticType,
        df,
        pValue,
        alpha: a,
        alternative,
        rejectNull: pValue < a,
        comparison: calculateComparison(pValue, a),
      })
    } else if (testType === "one-sample-proportion") {
      const x = Number.parseInt(successes)
      const n = Number.parseInt(proportionN)
      const p0 = Number.parseFloat(hypothesizedProportion)

      if (isNaN(x) || x < 0) {
        setError("Number of successes must be non-negative")
        return
      }
      if (isNaN(n) || n < 1) {
        setError("Sample size must be positive")
        return
      }
      if (x > n) {
        setError("Successes cannot exceed sample size")
        return
      }
      if (isNaN(p0) || p0 <= 0 || p0 >= 1) {
        setError("Hypothesized proportion must be between 0 and 1")
        return
      }

      const pHat = x / n
      const result = zTestProportion(pHat, p0, n)
      const pValue = adjustPValueForAlternative(result.pValue, result.zStatistic, alternative)
      const se = Math.sqrt((p0 * (1 - p0)) / n)

      setResults({
        testType: "one-sample-proportion",
        sampleProportion: pHat,
        hypothesizedProportion: p0,
        successes: x,
        n,
        standardError: se,
        zStatistic: result.zStatistic,
        pValue,
        alpha: a,
        alternative,
        rejectNull: pValue < a,
        comparison: calculateComparison(pValue, a),
      })
    } else {
      // Two-sample mean test
      const m1 = Number.parseFloat(mean1)
      const m2 = Number.parseFloat(mean2)
      const sd1 = Number.parseFloat(s1)
      const sd2 = Number.parseFloat(s2)
      const size1 = Number.parseInt(n1)
      const size2 = Number.parseInt(n2)

      if (isNaN(m1) || isNaN(m2)) {
        setError("Please enter valid sample means")
        return
      }
      if (isNaN(sd1) || sd1 <= 0 || isNaN(sd2) || sd2 <= 0) {
        setError("Standard deviations must be positive")
        return
      }
      if (isNaN(size1) || size1 < 2 || isNaN(size2) || size2 < 2) {
        setError("Sample sizes must be at least 2")
        return
      }

      const result = twoSampleTTest(m1, m2, sd1, sd2, size1, size2, equalVariance === "yes")
      const pValue = adjustPValueForAlternative(result.pValue, result.tStatistic, alternative)

      let se: number
      if (equalVariance === "yes") {
        const sp2 = ((size1 - 1) * sd1 * sd1 + (size2 - 1) * sd2 * sd2) / (size1 + size2 - 2)
        se = Math.sqrt(sp2 * (1 / size1 + 1 / size2))
      } else {
        se = Math.sqrt((sd1 * sd1) / size1 + (sd2 * sd2) / size2)
      }

      setResults({
        testType: "two-sample-mean",
        mean1: m1,
        mean2: m2,
        s1: sd1,
        s2: sd2,
        n1: size1,
        n2: size2,
        standardError: se,
        tStatistic: result.tStatistic,
        df: result.df,
        pValue,
        alpha: a,
        alternative,
        rejectNull: pValue < a,
        equalVariance: equalVariance === "yes",
        comparison: calculateComparison(pValue, a),
      })
    }
  }

  const getAlternativeSymbol = () => {
    if (alternative === "two-tailed") return "≠"
    if (alternative === "left-tailed") return "<"
    return ">"
  }

  return (
    <CalculatorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hypothesis Test Calculator</h1>
          <p className="text-muted-foreground mt-1">Test statistical hypotheses and calculate p-values</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Test Parameters</CardTitle>
              <CardDescription>Select the type of test and enter your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Type of Test</Label>
                <Select value={testType} onValueChange={(v) => setTestType(v as TestType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-sample-mean">One-Sample Mean Test</SelectItem>
                    <SelectItem value="one-sample-proportion">One-Sample Proportion Test</SelectItem>
                    <SelectItem value="two-sample-mean">Two-Sample Mean Test</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Alternative Hypothesis</Label>
                <RadioGroup value={alternative} onValueChange={(v) => setAlternative(v as AlternativeHypothesis)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="two-tailed" id="two-tailed" />
                    <Label htmlFor="two-tailed" className="font-normal">
                      Two-tailed (≠)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="left-tailed" id="left-tailed" />
                    <Label htmlFor="left-tailed" className="font-normal">
                      {"Left-tailed (<)"}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="right-tailed" id="right-tailed" />
                    <Label htmlFor="right-tailed" className="font-normal">
                      {"Right-tailed (>)"}
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alpha">Significance Level (α)</Label>
                <Select value={alpha} onValueChange={setAlpha}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.01">0.01 (1%)</SelectItem>
                    <SelectItem value="0.05">0.05 (5%)</SelectItem>
                    <SelectItem value="0.10">0.10 (10%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manualPValue">Manual P-Value (Optional)</Label>
                <Input
                  id="manualPValue"
                  type="number"
                  step="0.0001"
                  min="0"
                  max="1"
                  value={manualPValue}
                  onChange={(e) => setManualPValue(e.target.value)}
                  placeholder="e.g., 0.0234"
                />
                <p className="text-xs text-muted-foreground">
                  Optional: Enter an externally calculated p-value to verify results
                </p>
              </div>

              {testType === "one-sample-mean" && (
                <>
                  <div className="space-y-2">
                    <Label>Standard Deviation Type</Label>
                    <Select value={sigmaKnowledge} onValueChange={(v) => setSigmaKnowledge(v as SigmaKnowledge)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unknown">Unknown σ (t-test)</SelectItem>
                        <SelectItem value="known">Known σ (z-test)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sampleMean">Sample Mean (x̄)</Label>
                      <Input
                        id="sampleMean"
                        type="number"
                        step="any"
                        value={sampleMean}
                        onChange={(e) => setSampleMean(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hypothesizedMean">Hypothesized Mean (μ₀)</Label>
                      <Input
                        id="hypothesizedMean"
                        type="number"
                        step="any"
                        value={hypothesizedMean}
                        onChange={(e) => setHypothesizedMean(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stdDev">{sigmaKnowledge === "known" ? "Population σ" : "Sample s"}</Label>
                      <Input
                        id="stdDev"
                        type="number"
                        step="any"
                        value={stdDev}
                        onChange={(e) => setStdDev(e.target.value)}
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
                      />
                    </div>
                  </div>
                </>
              )}

              {testType === "one-sample-proportion" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="successes">Successes (x)</Label>
                      <Input
                        id="successes"
                        type="number"
                        min="0"
                        value={successes}
                        onChange={(e) => setSuccesses(e.target.value)}
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
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hypothesizedProportion">Hypothesized Proportion (p₀)</Label>
                    <Input
                      id="hypothesizedProportion"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={hypothesizedProportion}
                      onChange={(e) => setHypothesizedProportion(e.target.value)}
                      placeholder="e.g., 0.5"
                    />
                  </div>
                </>
              )}

              {testType === "two-sample-mean" && (
                <>
                  <div className="space-y-2">
                    <Label>Assume Equal Variances?</Label>
                    <RadioGroup value={equalVariance} onValueChange={setEqualVariance}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="no-equal" />
                        <Label htmlFor="no-equal" className="font-normal">
                          {"No (Welch's t-test)"}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="yes-equal" />
                        <Label htmlFor="yes-equal" className="font-normal">
                          Yes (Pooled t-test)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mean1">Mean 1 (x̄₁)</Label>
                      <Input
                        id="mean1"
                        type="number"
                        step="any"
                        value={mean1}
                        onChange={(e) => setMean1(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="s1">Std Dev 1 (s₁)</Label>
                      <Input id="s1" type="number" step="any" value={s1} onChange={(e) => setS1(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="n1">Size (n₁)</Label>
                      <Input id="n1" type="number" min="2" value={n1} onChange={(e) => setN1(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mean2">Mean 2 (x̄₂)</Label>
                      <Input
                        id="mean2"
                        type="number"
                        step="any"
                        value={mean2}
                        onChange={(e) => setMean2(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="s2">Std Dev 2 (s₂)</Label>
                      <Input id="s2" type="number" step="any" value={s2} onChange={(e) => setS2(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="n2">Size (n₂)</Label>
                      <Input id="n2" type="number" min="2" value={n2} onChange={(e) => setN2(e.target.value)} />
                    </div>
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
                Perform Hypothesis Test
              </Button>
            </CardContent>
          </Card>

          {results && (
            <div className="space-y-4">
              <Card className={results.rejectNull ? "border-destructive/50" : "border-accent/50"}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {results.rejectNull ? (
                      <XCircle className="w-5 h-5 text-destructive" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-accent" />
                    )}
                    Test Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="text-sm">
                      <strong>Hypotheses:</strong>
                    </div>
                    <div className="font-mono text-sm">
                      {results.testType === "one-sample-mean" && (
                        <>
                          <p>H₀: μ = {results.hypothesizedMean}</p>
                          <p>
                            H₁: μ {getAlternativeSymbol()} {results.hypothesizedMean}
                          </p>
                        </>
                      )}
                      {results.testType === "one-sample-proportion" && (
                        <>
                          <p>H₀: p = {results.hypothesizedProportion}</p>
                          <p>
                            H₁: p {getAlternativeSymbol()} {results.hypothesizedProportion}
                          </p>
                        </>
                      )}
                      {results.testType === "two-sample-mean" && (
                        <>
                          <p>H₀: μ₁ - μ₂ = 0</p>
                          <p>H₁: μ₁ - μ₂ {getAlternativeSymbol()} 0</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <ResultCard
                      title="Test Statistic"
                      value={formatNumber(
                        results.testType === "one-sample-proportion"
                          ? results.zStatistic
                          : results.testType === "one-sample-mean"
                            ? results.testStatistic
                            : results.tStatistic,
                        3,
                      )}
                      description={
                        results.testType === "one-sample-mean"
                          ? results.statisticType === "z"
                            ? "z-statistic"
                            : `t-statistic (df = ${results.df})`
                          : results.testType === "one-sample-proportion"
                            ? "z-statistic"
                            : `t-statistic (df = ${formatNumber(results.df, 2)})`
                      }
                    />
                    <ResultCard
                      title="p-value"
                      value={results.pValue < 0.0001 ? "< 0.0001" : formatNumber(results.pValue)}
                      variant={results.rejectNull ? "default" : "accent"}
                    />
                  </div>

                  <Alert
                    variant={results.rejectNull ? "destructive" : "default"}
                    className={!results.rejectNull ? "border-accent/50 bg-accent/5" : ""}
                  >
                    {results.rejectNull ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                    )}
                    <AlertTitle>{results.rejectNull ? "Reject H₀" : "Fail to Reject H₀"}</AlertTitle>
                    <AlertDescription>
                      {results.rejectNull ? (
                        <>
                          At α = {results.alpha}, there is sufficient evidence to{" "}
                          {results.testType === "two-sample-mean"
                            ? "conclude that the population means are different."
                            : `reject the claim that the population ${results.testType === "one-sample-mean" ? "mean" : "proportion"} equals the hypothesized value.`}
                        </>
                      ) : (
                        <>
                          At α = {results.alpha}, there is insufficient evidence to{" "}
                          {results.testType === "two-sample-mean"
                            ? "conclude that the population means are different."
                            : `reject the claim that the population ${results.testType === "one-sample-mean" ? "mean" : "proportion"} equals the hypothesized value.`}
                        </>
                      )}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Calculation Steps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {results.testType === "one-sample-mean" && (
                    <>
                      <FormulaDisplay
                        title="Standard Error"
                        formula={results.statisticType === "z" ? "SE = σ / √n" : "SE = s / √n"}
                        substituted={`${formatNumber(results.stdDev)} / √${results.n}`}
                        result={formatNumber(results.standardError)}
                      />
                      <FormulaDisplay
                        title="Test Statistic"
                        formula={`${results.statisticType} = (x̄ - μ₀) / SE`}
                        substituted={`(${formatNumber(results.sampleMean)} - ${results.hypothesizedMean}) / ${formatNumber(results.standardError)}`}
                        result={formatNumber(results.testStatistic, 3)}
                      />
                    </>
                  )}
                  {results.testType === "one-sample-proportion" && (
                    <>
                      <div className="text-sm">
                        <p>
                          <strong>Sample proportion:</strong> p̂ = {results.successes}/{results.n} ={" "}
                          {formatNumber(results.sampleProportion)}
                        </p>
                      </div>
                      <FormulaDisplay
                        title="Standard Error (under H₀)"
                        formula="SE = √[p₀(1-p₀)/n]"
                        substituted={`√[${results.hypothesizedProportion}(1-${results.hypothesizedProportion})/${results.n}]`}
                        result={formatNumber(results.standardError)}
                      />
                      <FormulaDisplay
                        title="Test Statistic"
                        formula="z = (p̂ - p₀) / SE"
                        substituted={`(${formatNumber(results.sampleProportion)} - ${results.hypothesizedProportion}) / ${formatNumber(results.standardError)}`}
                        result={formatNumber(results.zStatistic, 3)}
                      />
                    </>
                  )}
                  {results.testType === "two-sample-mean" && (
                    <>
                      <FormulaDisplay
                        title="Test Statistic"
                        formula="t = (x̄₁ - x̄₂) / SE"
                        substituted={`(${formatNumber(results.mean1)} - ${formatNumber(results.mean2)}) / ${formatNumber(results.standardError)}`}
                        result={formatNumber(results.tStatistic, 3)}
                      />
                      <div className="text-sm text-muted-foreground">
                        <p>
                          <strong>Degrees of freedom:</strong> {formatNumber(results.df, 2)}
                        </p>
                        <p>
                          <strong>Method:</strong>{" "}
                          {results.equalVariance
                            ? "Pooled variance (equal variances assumed)"
                            : "Welch's t-test (unequal variances)"}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {results.comparison && (
                <Card className="border-blue-500/50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-500" />
                      P-Value Verification
                    </CardTitle>
                    <CardDescription>
                      Comparison between calculated and manually provided p-values
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <ResultCard
                        title="Calculated P-Value"
                        value={
                          results.comparison.calculatedPValue < 0.0001
                            ? "< 0.0001"
                            : formatNumber(results.comparison.calculatedPValue, 4)
                        }
                        description="By this application"
                      />
                      <ResultCard
                        title="Manual P-Value"
                        value={formatNumber(results.comparison.manualPValue, 4)}
                        description="User provided"
                      />
                    </div>

                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Absolute Difference</p>
                          <p className="font-mono font-semibold">{formatNumber(results.comparison.difference, 5)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Relative Difference</p>
                          <p className="font-mono font-semibold">
                            {formatNumber(results.comparison.percentDifference, 2)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <Alert
                      variant={results.comparison.sameConclusion ? "default" : "destructive"}
                      className={results.comparison.sameConclusion ? "border-green-500/50 bg-green-500/5" : ""}
                    >
                      {results.comparison.sameConclusion ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      <AlertTitle>
                        {results.comparison.sameConclusion ? "✓ Conclusions Match" : "⚠ Different Conclusions"}
                      </AlertTitle>
                      <AlertDescription>
                        {results.comparison.sameConclusion ? (
                          <>
                            Both p-values lead to the same decision:{" "}
                            {results.rejectNull ? "Reject" : "Fail to reject"} H₀ at α = {results.alpha}.
                            {results.comparison.percentDifference < 1
                              ? " The values are nearly identical, confirming the calculation."
                              : results.comparison.percentDifference < 5
                                ? " The small difference is within acceptable numerical precision."
                                : " The difference may be due to rounding or different calculation methods."}
                          </>
                        ) : (
                          <>
                            The p-values lead to different conclusions. The calculated p-value suggests to{" "}
                            {results.rejectNull ? "reject" : "fail to reject"} H₀, while the manual p-value suggests to{" "}
                            {results.comparison.manualRejectNull ? "reject" : "fail to reject"} H₀. Please verify your
                            calculations and ensure correct test parameters.
                          </>
                        )}
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <ExplanationSection>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-foreground mb-1">Understanding p-values</h4>
              <p>
                The p-value is the probability of observing a test statistic as extreme as (or more extreme than) the
                one calculated, assuming the null hypothesis is true. A small p-value (typically ≤ α) suggests the data
                is inconsistent with H₀.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-1">Decision Rule</h4>
              <p>
                Compare the p-value to your significance level (α). If p-value ≤ α, reject H₀. If p-value {">"} α, fail
                to reject H₀. Remember: failing to reject H₀ is not the same as accepting H₀.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-1">One-tailed vs Two-tailed Tests</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>Two-tailed:</strong> Tests if the parameter is different from the hypothesized value (either
                  direction)
                </li>
                <li>
                  <strong>Left-tailed:</strong> Tests if the parameter is less than the hypothesized value
                </li>
                <li>
                  <strong>Right-tailed:</strong> Tests if the parameter is greater than the hypothesized value
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-1">P-Value Verification</h4>
              <p>
                The optional verification feature allows you to compare a manually calculated or externally sourced
                p-value with this calculator&apos;s result. Small differences ({"<"}1%) are normal due to numerical
                approximations and rounding. Larger discrepancies may indicate different calculation methods, rounding
                errors, or incorrect input parameters.
              </p>
            </div>
          </div>
        </ExplanationSection>
      </div>
    </CalculatorLayout>
  )
}
