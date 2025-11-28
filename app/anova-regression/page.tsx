"use client"

import { useState } from "react"
import { CalculatorLayout } from "@/components/calculator-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ResultCard } from "@/components/result-card"
import { ExplanationSection } from "@/components/explanation-section"
import { oneWayAnova, linearRegression, parseDataInput, formatNumber, calculateMean } from "@/lib/statistics"
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react"

interface AnovaResults {
  fStatistic: number
  pValue: number
  dfBetween: number
  dfWithin: number
  ssBetween: number
  ssWithin: number
  ssTotal: number
  msBetween: number
  msWithin: number
  grandMean: number
  groupMeans: number[]
  groupData: number[][]
  alpha: number
  rejectNull: boolean
}

interface RegressionResults {
  slope: number
  intercept: number
  rSquared: number
  standardErrorSlope: number
  standardErrorIntercept: number
  predictions: number[]
  residuals: number[]
  xData: number[]
  yData: number[]
  n: number
  meanX: number
  meanY: number
}

export default function AnovaRegressionCalculator() {
  const [activeTab, setActiveTab] = useState("anova")

  // ANOVA inputs
  const [group1, setGroup1] = useState("")
  const [group2, setGroup2] = useState("")
  const [group3, setGroup3] = useState("")
  const [anovaResults, setAnovaResults] = useState<AnovaResults | null>(null)

  // Regression inputs
  const [xData, setXData] = useState("")
  const [yData, setYData] = useState("")
  const [regressionResults, setRegressionResults] = useState<RegressionResults | null>(null)

  const [error, setError] = useState<string | null>(null)

  const handleAnovaCalculate = () => {
    setError(null)
    setAnovaResults(null)

    const groups = [parseDataInput(group1), parseDataInput(group2), parseDataInput(group3)].filter((g) => g.length > 0)

    if (groups.length < 2) {
      setError("Please enter at least 2 groups with data")
      return
    }

    if (groups.some((g) => g.length < 2)) {
      setError("Each group must have at least 2 observations")
      return
    }

    const result = oneWayAnova(groups)
    const alpha = 0.05

    setAnovaResults({
      ...result,
      groupData: groups,
      alpha,
      rejectNull: result.pValue < alpha,
    })
  }

  const handleRegressionCalculate = () => {
    setError(null)
    setRegressionResults(null)

    const x = parseDataInput(xData)
    const y = parseDataInput(yData)

    if (x.length < 3) {
      setError("Please enter at least 3 data points for X")
      return
    }

    if (x.length !== y.length) {
      setError("X and Y must have the same number of values")
      return
    }

    const result = linearRegression(x, y)

    setRegressionResults({
      ...result,
      xData: x,
      yData: y,
      n: x.length,
      meanX: calculateMean(x),
      meanY: calculateMean(y),
    })
  }

  return (
    <CalculatorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ANOVA & Regression</h1>
          <p className="text-muted-foreground mt-1">Perform one-way ANOVA and simple linear regression analysis</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="anova">One-Way ANOVA</TabsTrigger>
            <TabsTrigger value="regression">Linear Regression</TabsTrigger>
          </TabsList>

          <TabsContent value="anova" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Group Data</CardTitle>
                  <CardDescription>Enter data for each group (2-3 groups supported)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="group1">Group 1</Label>
                    <Textarea
                      id="group1"
                      value={group1}
                      onChange={(e) => setGroup1(e.target.value)}
                      placeholder="Enter values separated by commas (e.g., 23, 25, 27, 24)"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="group2">Group 2</Label>
                    <Textarea
                      id="group2"
                      value={group2}
                      onChange={(e) => setGroup2(e.target.value)}
                      placeholder="Enter values separated by commas"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="group3">Group 3 (optional)</Label>
                    <Textarea
                      id="group3"
                      value={group3}
                      onChange={(e) => setGroup3(e.target.value)}
                      placeholder="Enter values separated by commas"
                      rows={2}
                    />
                  </div>

                  {error && activeTab === "anova" && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button onClick={handleAnovaCalculate} className="w-full">
                    Perform ANOVA Test
                  </Button>
                </CardContent>
              </Card>

              {anovaResults && (
                <div className="space-y-4">
                  <Card className={anovaResults.rejectNull ? "border-destructive/50" : "border-accent/50"}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {anovaResults.rejectNull ? (
                          <XCircle className="w-5 h-5 text-destructive" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-accent" />
                        )}
                        ANOVA Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <ResultCard
                          title="F-Statistic"
                          value={formatNumber(anovaResults.fStatistic, 3)}
                          description={`df = (${anovaResults.dfBetween}, ${anovaResults.dfWithin})`}
                        />
                        <ResultCard
                          title="p-value"
                          value={anovaResults.pValue < 0.0001 ? "< 0.0001" : formatNumber(anovaResults.pValue)}
                          variant={anovaResults.rejectNull ? "default" : "accent"}
                        />
                      </div>

                      <Alert
                        variant={anovaResults.rejectNull ? "destructive" : "default"}
                        className={!anovaResults.rejectNull ? "border-accent/50 bg-accent/5" : ""}
                      >
                        {anovaResults.rejectNull ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                        )}
                        <AlertTitle>
                          {anovaResults.rejectNull ? "Significant Difference" : "No Significant Difference"}
                        </AlertTitle>
                        <AlertDescription>
                          {anovaResults.rejectNull
                            ? `At α = ${anovaResults.alpha}, there is sufficient evidence to conclude that at least one group mean is different from the others.`
                            : `At α = ${anovaResults.alpha}, there is insufficient evidence to conclude that the group means are different.`}
                        </AlertDescription>
                      </Alert>

                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Group Summary</h4>
                        <div className="text-sm space-y-1">
                          <p>
                            <strong>Grand Mean:</strong> {formatNumber(anovaResults.grandMean)}
                          </p>
                          {anovaResults.groupMeans.map((mean, i) => (
                            <p key={i}>
                              <strong>Group {i + 1} Mean:</strong> {formatNumber(mean)} (n ={" "}
                              {anovaResults.groupData[i].length})
                            </p>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">ANOVA Table</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Source</TableHead>
                            <TableHead className="text-right">SS</TableHead>
                            <TableHead className="text-right">df</TableHead>
                            <TableHead className="text-right">MS</TableHead>
                            <TableHead className="text-right">F</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>Between Groups</TableCell>
                            <TableCell className="text-right font-mono">
                              {formatNumber(anovaResults.ssBetween, 2)}
                            </TableCell>
                            <TableCell className="text-right">{anovaResults.dfBetween}</TableCell>
                            <TableCell className="text-right font-mono">
                              {formatNumber(anovaResults.msBetween, 2)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatNumber(anovaResults.fStatistic, 3)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Within Groups</TableCell>
                            <TableCell className="text-right font-mono">
                              {formatNumber(anovaResults.ssWithin, 2)}
                            </TableCell>
                            <TableCell className="text-right">{anovaResults.dfWithin}</TableCell>
                            <TableCell className="text-right font-mono">
                              {formatNumber(anovaResults.msWithin, 2)}
                            </TableCell>
                            <TableCell className="text-right">—</TableCell>
                          </TableRow>
                          <TableRow className="font-medium">
                            <TableCell>Total</TableCell>
                            <TableCell className="text-right font-mono">
                              {formatNumber(anovaResults.ssTotal, 2)}
                            </TableCell>
                            <TableCell className="text-right">
                              {anovaResults.dfBetween + anovaResults.dfWithin}
                            </TableCell>
                            <TableCell className="text-right">—</TableCell>
                            <TableCell className="text-right">—</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="regression" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Data Input</CardTitle>
                  <CardDescription>Enter X (independent) and Y (dependent) variable values</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="xData">X Values (Independent Variable)</Label>
                    <Textarea
                      id="xData"
                      value={xData}
                      onChange={(e) => setXData(e.target.value)}
                      placeholder="Enter values separated by commas (e.g., 1, 2, 3, 4, 5)"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yData">Y Values (Dependent Variable)</Label>
                    <Textarea
                      id="yData"
                      value={yData}
                      onChange={(e) => setYData(e.target.value)}
                      placeholder="Enter values separated by commas (e.g., 2.1, 4.0, 5.8, 8.1, 9.9)"
                      rows={3}
                    />
                  </div>

                  {error && activeTab === "regression" && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button onClick={handleRegressionCalculate} className="w-full">
                    Perform Regression Analysis
                  </Button>
                </CardContent>
              </Card>

              {regressionResults && (
                <div className="space-y-4">
                  <Card className="border-primary/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                        Regression Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <h4 className="font-medium mb-2">Regression Equation</h4>
                        <p className="font-mono text-lg">
                          ŷ = {formatNumber(regressionResults.intercept, 4)} {regressionResults.slope >= 0 ? "+" : ""}{" "}
                          {formatNumber(regressionResults.slope, 4)}x
                        </p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <ResultCard
                          title="Slope (b₁)"
                          value={formatNumber(regressionResults.slope, 4)}
                          description={`SE = ${formatNumber(regressionResults.standardErrorSlope, 4)}`}
                        />
                        <ResultCard
                          title="Intercept (b₀)"
                          value={formatNumber(regressionResults.intercept, 4)}
                          description={`SE = ${formatNumber(regressionResults.standardErrorIntercept, 4)}`}
                        />
                        <ResultCard
                          title="R² (Coefficient of Determination)"
                          value={formatNumber(regressionResults.rSquared, 4)}
                          description={`${formatNumber(regressionResults.rSquared * 100, 1)}% of variance explained`}
                          variant="primary"
                        />
                        <ResultCard
                          title="Sample Size"
                          value={regressionResults.n}
                          description={`Mean X = ${formatNumber(regressionResults.meanX, 2)}, Mean Y = ${formatNumber(regressionResults.meanY, 2)}`}
                        />
                      </div>

                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Interpretation</h4>
                        <p className="text-sm text-muted-foreground">
                          For every one-unit increase in X, Y is expected to{" "}
                          {regressionResults.slope >= 0 ? "increase" : "decrease"} by{" "}
                          <strong>{formatNumber(Math.abs(regressionResults.slope), 4)}</strong> units. The model
                          explains <strong>{formatNumber(regressionResults.rSquared * 100, 1)}%</strong> of the
                          variability in Y.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Data & Predictions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>X</TableHead>
                              <TableHead className="text-right">Y (Actual)</TableHead>
                              <TableHead className="text-right">ŷ (Predicted)</TableHead>
                              <TableHead className="text-right">Residual</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {regressionResults.xData.map((x, i) => (
                              <TableRow key={i}>
                                <TableCell className="font-mono">{formatNumber(x, 2)}</TableCell>
                                <TableCell className="text-right font-mono">
                                  {formatNumber(regressionResults.yData[i], 2)}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {formatNumber(regressionResults.predictions[i], 2)}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  <span
                                    className={regressionResults.residuals[i] >= 0 ? "text-accent" : "text-destructive"}
                                  >
                                    {formatNumber(regressionResults.residuals[i], 3)}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <ExplanationSection>
          <div className="space-y-4">
            {activeTab === "anova" ? (
              <>
                <div>
                  <h4 className="font-medium text-foreground mb-1">One-Way ANOVA</h4>
                  <p>
                    Analysis of Variance (ANOVA) tests whether there are statistically significant differences between
                    the means of three or more independent groups. It compares the variance between groups to the
                    variance within groups.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-1">F-Statistic</h4>
                  <p>
                    F = MS(Between) / MS(Within). A larger F-statistic indicates greater differences between group means
                    relative to the variation within groups.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-1">Assumptions</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Independence of observations</li>
                    <li>Normality of residuals (or large sample sizes)</li>
                    <li>Homogeneity of variances across groups</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h4 className="font-medium text-foreground mb-1">Simple Linear Regression</h4>
                  <p>
                    Linear regression models the relationship between a dependent variable (Y) and an independent
                    variable (X) using a straight line: ŷ = b₀ + b₁x
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-1">R² (Coefficient of Determination)</h4>
                  <p>
                    R² measures the proportion of variance in Y that is explained by X. Values range from 0 to 1, with
                    higher values indicating a better fit.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-1">Residuals</h4>
                  <p>
                    Residuals are the differences between observed and predicted values. Analyzing residuals helps
                    assess model fit and identify potential issues.
                  </p>
                </div>
              </>
            )}
          </div>
        </ExplanationSection>
      </div>
    </CalculatorLayout>
  )
}
