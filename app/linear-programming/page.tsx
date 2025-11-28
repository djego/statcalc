"use client"

import { useState } from "react"
import { CalculatorLayout } from "@/components/calculator-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ExplanationSection } from "@/components/explanation-section"
import { formatNumber } from "@/lib/statistics"
import { AlertCircle, CheckCircle2, Plus, Trash2 } from "lucide-react"

type OptimizationType = "maximize" | "minimize"
type ConstraintType = "<=" | ">=" | "="

interface Constraint {
  id: string
  coeffX: string
  coeffY: string
  type: ConstraintType
  rhs: string
}

interface FeasiblePoint {
  x: number
  y: number
  objectiveValue: number
  isOptimal: boolean
}

interface Results {
  optimalX: number
  optimalY: number
  optimalValue: number
  feasiblePoints: FeasiblePoint[]
  objectiveCoeffX: number
  objectiveCoeffY: number
  optimizationType: OptimizationType
}

export default function LinearProgrammingCalculator() {
  const [optimizationType, setOptimizationType] = useState<OptimizationType>("maximize")
  const [objectiveX, setObjectiveX] = useState("3")
  const [objectiveY, setObjectiveY] = useState("2")
  const [constraints, setConstraints] = useState<Constraint[]>([
    { id: "1", coeffX: "1", coeffY: "1", type: "<=", rhs: "4" },
    { id: "2", coeffX: "2", coeffY: "1", type: "<=", rhs: "6" },
  ])
  const [results, setResults] = useState<Results | null>(null)
  const [error, setError] = useState<string | null>(null)

  const addConstraint = () => {
    setConstraints([...constraints, { id: Date.now().toString(), coeffX: "1", coeffY: "1", type: "<=", rhs: "10" }])
  }

  const removeConstraint = (id: string) => {
    if (constraints.length > 1) {
      setConstraints(constraints.filter((c) => c.id !== id))
    }
  }

  const updateConstraint = (id: string, field: keyof Constraint, value: string) => {
    setConstraints(constraints.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  }

  const findIntersection = (
    a1: number,
    b1: number,
    c1: number,
    a2: number,
    b2: number,
    c2: number,
  ): { x: number; y: number } | null => {
    const det = a1 * b2 - a2 * b1
    if (Math.abs(det) < 1e-10) return null
    const x = (c1 * b2 - c2 * b1) / det
    const y = (a1 * c2 - a2 * c1) / det
    return { x, y }
  }

  const isFeasible = (
    x: number,
    y: number,
    parsedConstraints: { a: number; b: number; type: ConstraintType; rhs: number }[],
  ): boolean => {
    if (x < -1e-10 || y < -1e-10) return false

    for (const c of parsedConstraints) {
      const lhs = c.a * x + c.b * y
      const tolerance = 1e-6
      if (c.type === "<=" && lhs > c.rhs + tolerance) return false
      if (c.type === ">=" && lhs < c.rhs - tolerance) return false
      if (c.type === "=" && Math.abs(lhs - c.rhs) > tolerance) return false
    }
    return true
  }

  const handleCalculate = () => {
    setError(null)
    setResults(null)

    const cx = Number.parseFloat(objectiveX)
    const cy = Number.parseFloat(objectiveY)

    if (isNaN(cx) || isNaN(cy)) {
      setError("Please enter valid objective function coefficients")
      return
    }

    const parsedConstraints: { a: number; b: number; type: ConstraintType; rhs: number }[] = []

    for (const c of constraints) {
      const a = Number.parseFloat(c.coeffX)
      const b = Number.parseFloat(c.coeffY)
      const rhs = Number.parseFloat(c.rhs)

      if (isNaN(a) || isNaN(b) || isNaN(rhs)) {
        setError("Please enter valid constraint coefficients")
        return
      }

      parsedConstraints.push({ a, b, type: c.type, rhs })
    }

    // Add non-negativity constraints as lines
    const allLines: { a: number; b: number; c: number }[] = [
      { a: 1, b: 0, c: 0 }, // x = 0
      { a: 0, b: 1, c: 0 }, // y = 0
    ]

    for (const c of parsedConstraints) {
      allLines.push({ a: c.a, b: c.b, c: c.rhs })
    }

    // Find all intersection points
    const candidatePoints: { x: number; y: number }[] = []

    for (let i = 0; i < allLines.length; i++) {
      for (let j = i + 1; j < allLines.length; j++) {
        const point = findIntersection(
          allLines[i].a,
          allLines[i].b,
          allLines[i].c,
          allLines[j].a,
          allLines[j].b,
          allLines[j].c,
        )
        if (point) {
          candidatePoints.push(point)
        }
      }
    }

    // Filter feasible points
    const feasiblePoints: FeasiblePoint[] = []

    for (const point of candidatePoints) {
      if (isFeasible(point.x, point.y, parsedConstraints)) {
        const objectiveValue = cx * point.x + cy * point.y
        feasiblePoints.push({
          x: Math.max(0, point.x),
          y: Math.max(0, point.y),
          objectiveValue,
          isOptimal: false,
        })
      }
    }

    if (feasiblePoints.length === 0) {
      setError("No feasible solution exists for the given constraints")
      return
    }

    // Remove duplicates
    const uniquePoints: FeasiblePoint[] = []
    for (const p of feasiblePoints) {
      const isDuplicate = uniquePoints.some((u) => Math.abs(u.x - p.x) < 1e-6 && Math.abs(u.y - p.y) < 1e-6)
      if (!isDuplicate) {
        uniquePoints.push(p)
      }
    }

    // Find optimal
    let optimalIndex = 0
    for (let i = 1; i < uniquePoints.length; i++) {
      if (optimizationType === "maximize") {
        if (uniquePoints[i].objectiveValue > uniquePoints[optimalIndex].objectiveValue) {
          optimalIndex = i
        }
      } else {
        if (uniquePoints[i].objectiveValue < uniquePoints[optimalIndex].objectiveValue) {
          optimalIndex = i
        }
      }
    }

    uniquePoints[optimalIndex].isOptimal = true

    setResults({
      optimalX: uniquePoints[optimalIndex].x,
      optimalY: uniquePoints[optimalIndex].y,
      optimalValue: uniquePoints[optimalIndex].objectiveValue,
      feasiblePoints: uniquePoints.sort((a, b) => b.objectiveValue - a.objectiveValue),
      objectiveCoeffX: cx,
      objectiveCoeffY: cy,
      optimizationType,
    })
  }

  return (
    <CalculatorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Linear Programming Calculator</h1>
          <p className="text-muted-foreground mt-1">Solve linear programming problems with two decision variables</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Problem Setup</CardTitle>
              <CardDescription>Define your objective function and constraints</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Optimization Type</Label>
                  <Select value={optimizationType} onValueChange={(v) => setOptimizationType(v as OptimizationType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maximize">Maximize</SelectItem>
                      <SelectItem value="minimize">Minimize</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Objective Function: Z = c₁x + c₂y</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="any"
                      value={objectiveX}
                      onChange={(e) => setObjectiveX(e.target.value)}
                      className="w-20"
                    />
                    <span className="text-muted-foreground">x +</span>
                    <Input
                      type="number"
                      step="any"
                      value={objectiveY}
                      onChange={(e) => setObjectiveY(e.target.value)}
                      className="w-20"
                    />
                    <span className="text-muted-foreground">y</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Constraints</Label>
                  <Button variant="outline" size="sm" onClick={addConstraint}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>

                {constraints.map((constraint, index) => (
                  <div key={constraint.id} className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                    <Input
                      type="number"
                      step="any"
                      value={constraint.coeffX}
                      onChange={(e) => updateConstraint(constraint.id, "coeffX", e.target.value)}
                      className="w-16"
                    />
                    <span className="text-muted-foreground">x +</span>
                    <Input
                      type="number"
                      step="any"
                      value={constraint.coeffY}
                      onChange={(e) => updateConstraint(constraint.id, "coeffY", e.target.value)}
                      className="w-16"
                    />
                    <span className="text-muted-foreground">y</span>
                    <Select value={constraint.type} onValueChange={(v) => updateConstraint(constraint.id, "type", v)}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="<=">≤</SelectItem>
                        <SelectItem value=">=">≥</SelectItem>
                        <SelectItem value="=">=</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      step="any"
                      value={constraint.rhs}
                      onChange={(e) => updateConstraint(constraint.id, "rhs", e.target.value)}
                      className="w-20"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeConstraint(constraint.id)}
                      disabled={constraints.length <= 1}
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}

                <p className="text-xs text-muted-foreground">
                  Non-negativity constraints (x ≥ 0, y ≥ 0) are automatically included.
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
                Solve Problem
              </Button>
            </CardContent>
          </Card>

          {results && (
            <div className="space-y-4">
              <Card className="border-primary/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    Optimal Solution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-muted-foreground">x*</p>
                        <p className="text-2xl font-bold">{formatNumber(results.optimalX, 2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">y*</p>
                        <p className="text-2xl font-bold">{formatNumber(results.optimalY, 2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Z*</p>
                        <p className="text-2xl font-bold text-primary">{formatNumber(results.optimalValue, 2)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Interpretation</h4>
                    <p className="text-sm text-muted-foreground">
                      The {results.optimizationType === "maximize" ? "maximum" : "minimum"} value of{" "}
                      <strong>Z = {formatNumber(results.optimalValue, 2)}</strong> is achieved when{" "}
                      <strong>x = {formatNumber(results.optimalX, 2)}</strong> and{" "}
                      <strong>y = {formatNumber(results.optimalY, 2)}</strong>.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Corner Points (Vertices)</CardTitle>
                  <CardDescription>All feasible corner points of the solution region</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>x</TableHead>
                        <TableHead>y</TableHead>
                        <TableHead className="text-right">
                          Z = {results.objectiveCoeffX}x + {results.objectiveCoeffY}y
                        </TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.feasiblePoints.map((point, i) => (
                        <TableRow key={i} className={point.isOptimal ? "bg-primary/5" : ""}>
                          <TableCell className="font-mono">{formatNumber(point.x, 2)}</TableCell>
                          <TableCell className="font-mono">{formatNumber(point.y, 2)}</TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            {formatNumber(point.objectiveValue, 2)}
                          </TableCell>
                          <TableCell>
                            {point.isOptimal && (
                              <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                                Optimal
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <ExplanationSection>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-foreground mb-1">Graphical Method</h4>
              <p>
                This calculator uses the graphical method for solving linear programming problems with two decision
                variables. It finds all corner points (vertices) of the feasible region and evaluates the objective
                function at each point.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-1">Corner Point Theorem</h4>
              <p>
                If a linear programming problem has an optimal solution, it will occur at one or more corner points of
                the feasible region. This is why we only need to check the vertices to find the optimal solution.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-1">Limitations</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>This calculator handles problems with exactly 2 decision variables</li>
                <li>For problems with more variables, the simplex method is required</li>
                <li>Unbounded or infeasible problems will show an error message</li>
              </ul>
            </div>
          </div>
        </ExplanationSection>
      </div>
    </CalculatorLayout>
  )
}
