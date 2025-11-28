import Link from "next/link"
import { CalculatorLayout } from "@/components/calculator-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, BarChart3, FlaskConical, Calendar, TrendingUp, GitBranch, ArrowRight } from "lucide-react"

const calculators = [
  {
    title: "Sample Size Calculator",
    description:
      "Determine the required sample size for surveys and experiments with support for both finite and infinite populations.",
    href: "/sample-size",
    icon: Target,
  },
  {
    title: "Confidence Interval Calculator",
    description: "Calculate confidence intervals for means and proportions using z or t distributions.",
    href: "/confidence-interval",
    icon: BarChart3,
  },
  {
    title: "Hypothesis Test Calculator",
    description: "Perform hypothesis tests for means and proportions with p-value calculations.",
    href: "/hypothesis-test",
    icon: FlaskConical,
  },
  {
    title: "Seasonal Index Calculator",
    description: "Calculate seasonal indices using the ratio-to-moving-average method for time series analysis.",
    href: "/seasonal-index",
    icon: Calendar,
  },
  {
    title: "ANOVA & Regression",
    description: "Perform one-way ANOVA tests and simple linear regression analysis.",
    href: "/anova-regression",
    icon: TrendingUp,
  },
  {
    title: "Linear Programming",
    description: "Solve linear programming problems with multiple constraints using the graphical or simplex method.",
    href: "/linear-programming",
    icon: GitBranch,
  },
]

export default function HomePage() {
  return (
    <CalculatorLayout>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Statistical Calculator</h1>
          <p className="text-muted-foreground text-lg max-w-2xl text-pretty">
            A comprehensive suite of statistical tools for students and professionals. Each calculator shows formulas,
            step-by-step calculations, and plain English interpretations.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {calculators.map((calc) => (
            <Link key={calc.href} href={calc.href} className="group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                      <calc.icon className="w-5 h-5 text-primary" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <CardTitle className="text-lg">{calc.title}</CardTitle>
                  <CardDescription className="text-sm">{calc.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">Educational Focus</h3>
            <p className="text-sm text-muted-foreground">
              Each calculator is designed to be educational. You will see the formulas used with actual numbers
              substituted, along with clear interpretations of results. This helps you understand not just the answer,
              but how it was calculated and what it means.
            </p>
          </CardContent>
        </Card>
      </div>
    </CalculatorLayout>
  )
}
