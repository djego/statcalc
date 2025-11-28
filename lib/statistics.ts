// Z-scores for common confidence levels
export const Z_SCORES: Record<number, number> = {
  90: 1.645,
  95: 1.96,
  99: 2.576,
  85: 1.44,
  80: 1.28,
}

// T-distribution critical values (two-tailed) for common confidence levels
// Format: [df][confidence level]
export function getTCritical(df: number, confidenceLevel: number): number {
  // Approximation using the formula for large df
  if (df >= 120) {
    return Z_SCORES[confidenceLevel] || 1.96
  }

  // Common t-values table
  const tTable: Record<number, Record<number, number>> = {
    1: { 90: 6.314, 95: 12.706, 99: 63.657 },
    2: { 90: 2.92, 95: 4.303, 99: 9.925 },
    3: { 90: 2.353, 95: 3.182, 99: 5.841 },
    4: { 90: 2.132, 95: 2.776, 99: 4.604 },
    5: { 90: 2.015, 95: 2.571, 99: 4.032 },
    6: { 90: 1.943, 95: 2.447, 99: 3.707 },
    7: { 90: 1.895, 95: 2.365, 99: 3.499 },
    8: { 90: 1.86, 95: 2.306, 99: 3.355 },
    9: { 90: 1.833, 95: 2.262, 99: 3.25 },
    10: { 90: 1.812, 95: 2.228, 99: 3.169 },
    11: { 90: 1.796, 95: 2.201, 99: 3.106 },
    12: { 90: 1.782, 95: 2.179, 99: 3.055 },
    13: { 90: 1.771, 95: 2.16, 99: 3.012 },
    14: { 90: 1.761, 95: 2.145, 99: 2.977 },
    15: { 90: 1.753, 95: 2.131, 99: 2.947 },
    16: { 90: 1.746, 95: 2.12, 99: 2.921 },
    17: { 90: 1.74, 95: 2.11, 99: 2.898 },
    18: { 90: 1.734, 95: 2.101, 99: 2.878 },
    19: { 90: 1.729, 95: 2.093, 99: 2.861 },
    20: { 90: 1.725, 95: 2.086, 99: 2.845 },
    25: { 90: 1.708, 95: 2.06, 99: 2.787 },
    30: { 90: 1.697, 95: 2.042, 99: 2.75 },
    40: { 90: 1.684, 95: 2.021, 99: 2.704 },
    50: { 90: 1.676, 95: 2.009, 99: 2.678 },
    60: { 90: 1.671, 95: 2.0, 99: 2.66 },
    80: { 90: 1.664, 95: 1.99, 99: 2.639 },
    100: { 90: 1.66, 95: 1.984, 99: 2.626 },
    120: { 90: 1.658, 95: 1.98, 99: 2.617 },
  }

  // Find closest df
  const dfs = Object.keys(tTable)
    .map(Number)
    .sort((a, b) => a - b)
  let closestDf = dfs[0]
  for (const d of dfs) {
    if (d <= df) closestDf = d
    else break
  }

  return tTable[closestDf]?.[confidenceLevel] || Z_SCORES[confidenceLevel] || 1.96
}

// Calculate sample size for proportion (infinite population)
export function sampleSizeProportion(z: number, p: number, marginOfError: number): number {
  return Math.ceil((z * z * p * (1 - p)) / (marginOfError * marginOfError))
}

// Calculate sample size for mean (infinite population)
export function sampleSizeMean(z: number, sigma: number, marginOfError: number): number {
  return Math.ceil((z * z * sigma * sigma) / (marginOfError * marginOfError))
}

// Apply finite population correction
export function finitePopulationCorrection(n0: number, N: number): number {
  return Math.ceil(n0 / (1 + (n0 - 1) / N))
}

// Calculate mean from array
export function calculateMean(data: number[]): number {
  return data.reduce((sum, val) => sum + val, 0) / data.length
}

// Calculate sample standard deviation
export function calculateStdDev(data: number[], isSample = true): number {
  const mean = calculateMean(data)
  const squaredDiffs = data.map((val) => Math.pow(val - mean, 2))
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / (isSample ? data.length - 1 : data.length)
  return Math.sqrt(variance)
}

// Calculate standard error for mean
export function standardErrorMean(stdDev: number, n: number): number {
  return stdDev / Math.sqrt(n)
}

// Calculate standard error for proportion
export function standardErrorProportion(p: number, n: number): number {
  return Math.sqrt((p * (1 - p)) / n)
}

// Confidence interval for mean
export function confidenceIntervalMean(mean: number, criticalValue: number, standardError: number): [number, number] {
  const marginOfError = criticalValue * standardError
  return [mean - marginOfError, mean + marginOfError]
}

// Confidence interval for proportion
export function confidenceIntervalProportion(proportion: number, z: number, n: number): [number, number] {
  const se = standardErrorProportion(proportion, n)
  const marginOfError = z * se
  return [Math.max(0, proportion - marginOfError), Math.min(1, proportion + marginOfError)]
}

// Parse raw data input (comma or space separated)
export function parseDataInput(input: string): number[] {
  return input
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter((s) => s !== "")
    .map((s) => Number.parseFloat(s))
    .filter((n) => !isNaN(n))
}

// Format number with specified decimal places
export function formatNumber(num: number, decimals = 4): string {
  return num.toFixed(decimals)
}

// Hypothesis testing - z-test for proportion
export function zTestProportion(
  sampleProportion: number,
  hypothesizedProportion: number,
  n: number,
): { zStatistic: number; pValue: number } {
  const se = Math.sqrt((hypothesizedProportion * (1 - hypothesizedProportion)) / n)
  const zStatistic = (sampleProportion - hypothesizedProportion) / se
  const pValue = 2 * (1 - normalCDF(Math.abs(zStatistic)))
  return { zStatistic, pValue }
}

// Hypothesis testing - z-test for mean (known sigma)
export function zTestMean(
  sampleMean: number,
  hypothesizedMean: number,
  sigma: number,
  n: number,
): { zStatistic: number; pValue: number } {
  const se = sigma / Math.sqrt(n)
  const zStatistic = (sampleMean - hypothesizedMean) / se
  const pValue = 2 * (1 - normalCDF(Math.abs(zStatistic)))
  return { zStatistic, pValue }
}

// Hypothesis testing - t-test for mean (unknown sigma)
export function tTestMean(
  sampleMean: number,
  hypothesizedMean: number,
  sampleStdDev: number,
  n: number,
): { tStatistic: number; pValue: number; df: number } {
  const se = sampleStdDev / Math.sqrt(n)
  const tStatistic = (sampleMean - hypothesizedMean) / se
  const df = n - 1
  const pValue = 2 * (1 - tCDF(Math.abs(tStatistic), df))
  return { tStatistic, pValue, df }
}

// Two-sample t-test
export function twoSampleTTest(
  mean1: number,
  mean2: number,
  s1: number,
  s2: number,
  n1: number,
  n2: number,
  equalVariance = false,
): { tStatistic: number; pValue: number; df: number } {
  let se: number
  let df: number

  if (equalVariance) {
    // Pooled variance
    const sp2 = ((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / (n1 + n2 - 2)
    se = Math.sqrt(sp2 * (1 / n1 + 1 / n2))
    df = n1 + n2 - 2
  } else {
    // Welch's t-test
    const v1 = (s1 * s1) / n1
    const v2 = (s2 * s2) / n2
    se = Math.sqrt(v1 + v2)
    df = Math.pow(v1 + v2, 2) / (Math.pow(v1, 2) / (n1 - 1) + Math.pow(v2, 2) / (n2 - 1))
  }

  const tStatistic = (mean1 - mean2) / se
  const pValue = 2 * (1 - tCDF(Math.abs(tStatistic), df))

  return { tStatistic, pValue, df }
}

// Standard normal CDF approximation
export function normalCDF(z: number): number {
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911

  const sign = z < 0 ? -1 : 1
  z = Math.abs(z) / Math.sqrt(2)

  const t = 1.0 / (1.0 + p * z)
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-z * z)

  return 0.5 * (1.0 + sign * y)
}

// Student's t CDF approximation
export function tCDF(t: number, df: number): number {
  // Use normal approximation for large df
  if (df > 100) {
    return normalCDF(t)
  }

  // Beta function approximation for smaller df
  const x = df / (df + t * t)
  return 1 - 0.5 * incompleteBeta(df / 2, 0.5, x)
}

// Incomplete beta function approximation
function incompleteBeta(a: number, b: number, x: number): number {
  if (x === 0) return 0
  if (x === 1) return 1

  // Simple continued fraction approximation
  const bt = Math.exp(gammaLn(a + b) - gammaLn(a) - gammaLn(b) + a * Math.log(x) + b * Math.log(1 - x))

  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betaCF(a, b, x)) / a
  } else {
    return 1 - (bt * betaCF(b, a, 1 - x)) / b
  }
}

// Beta continued fraction
function betaCF(a: number, b: number, x: number): number {
  const maxIterations = 100
  const epsilon = 1e-10

  const qab = a + b
  const qap = a + 1
  const qam = a - 1
  let c = 1
  let d = 1 - (qab * x) / qap

  if (Math.abs(d) < epsilon) d = epsilon
  d = 1 / d
  let h = d

  for (let m = 1; m <= maxIterations; m++) {
    const m2 = 2 * m
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2))
    d = 1 + aa * d
    if (Math.abs(d) < epsilon) d = epsilon
    c = 1 + aa / c
    if (Math.abs(c) < epsilon) c = epsilon
    d = 1 / d
    h *= d * c
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2))
    d = 1 + aa * d
    if (Math.abs(d) < epsilon) d = epsilon
    c = 1 + aa / c
    if (Math.abs(c) < epsilon) c = epsilon
    d = 1 / d
    const del = d * c
    h *= del
    if (Math.abs(del - 1) < epsilon) break
  }

  return h
}

// Log gamma function
function gammaLn(x: number): number {
  const cof = [
    76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.001208650973866179,
    -0.000005395239384953,
  ]

  let y = x
  let tmp = x + 5.5
  tmp -= (x + 0.5) * Math.log(tmp)
  let ser = 1.000000000190015

  for (let j = 0; j < 6; j++) {
    ser += cof[j] / ++y
  }

  return -tmp + Math.log((2.5066282746310005 * ser) / x)
}

// One-way ANOVA
export function oneWayAnova(groups: number[][]): {
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
} {
  const k = groups.length
  const allData = groups.flat()
  const N = allData.length
  const grandMean = calculateMean(allData)

  const groupMeans = groups.map((g) => calculateMean(g))
  const groupSizes = groups.map((g) => g.length)

  // Sum of squares between groups
  const ssBetween = groupMeans.reduce((sum, mean, i) => sum + groupSizes[i] * Math.pow(mean - grandMean, 2), 0)

  // Sum of squares within groups
  const ssWithin = groups.reduce(
    (sum, group, i) => sum + group.reduce((s, val) => s + Math.pow(val - groupMeans[i], 2), 0),
    0,
  )

  const ssTotal = ssBetween + ssWithin

  const dfBetween = k - 1
  const dfWithin = N - k

  const msBetween = ssBetween / dfBetween
  const msWithin = ssWithin / dfWithin

  const fStatistic = msBetween / msWithin
  const pValue = 1 - fCDF(fStatistic, dfBetween, dfWithin)

  return {
    fStatistic,
    pValue,
    dfBetween,
    dfWithin,
    ssBetween,
    ssWithin,
    ssTotal,
    msBetween,
    msWithin,
    grandMean,
    groupMeans,
  }
}

// F-distribution CDF approximation
function fCDF(f: number, d1: number, d2: number): number {
  const x = d2 / (d2 + d1 * f)
  return 1 - incompleteBeta(d2 / 2, d1 / 2, x)
}

// Simple linear regression
export function linearRegression(
  x: number[],
  y: number[],
): {
  slope: number
  intercept: number
  rSquared: number
  standardErrorSlope: number
  standardErrorIntercept: number
  predictions: number[]
  residuals: number[]
} {
  const n = x.length
  const meanX = calculateMean(x)
  const meanY = calculateMean(y)

  const ssXX = x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0)
  const ssYY = y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0)
  const ssXY = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0)

  const slope = ssXY / ssXX
  const intercept = meanY - slope * meanX

  const predictions = x.map((xi) => intercept + slope * xi)
  const residuals = y.map((yi, i) => yi - predictions[i])

  const ssResidual = residuals.reduce((sum, r) => sum + r * r, 0)
  const rSquared = 1 - ssResidual / ssYY

  const mse = ssResidual / (n - 2)
  const standardErrorSlope = Math.sqrt(mse / ssXX)
  const standardErrorIntercept = Math.sqrt(mse * (1 / n + (meanX * meanX) / ssXX))

  return {
    slope,
    intercept,
    rSquared,
    standardErrorSlope,
    standardErrorIntercept,
    predictions,
    residuals,
  }
}

// Seasonal index calculation (ratio-to-moving-average method)
export function calculateSeasonalIndices(
  data: number[],
  periodsPerSeason: number,
): {
  indices: number[]
  deseasonalized: number[]
  movingAverages: (number | null)[]
  ratios: (number | null)[]
} {
  const n = data.length
  const movingAverages: (number | null)[] = []
  const ratios: (number | null)[] = []

  // Calculate centered moving averages
  const halfPeriod = Math.floor(periodsPerSeason / 2)

  for (let i = 0; i < n; i++) {
    if (i < halfPeriod || i >= n - halfPeriod) {
      movingAverages.push(null)
      ratios.push(null)
    } else {
      let sum = 0
      for (let j = i - halfPeriod; j <= i + halfPeriod; j++) {
        if (periodsPerSeason % 2 === 0) {
          if (j === i - halfPeriod || j === i + halfPeriod) {
            sum += data[j] / 2
          } else {
            sum += data[j]
          }
        } else {
          sum += data[j]
        }
      }
      const ma = sum / periodsPerSeason
      movingAverages.push(ma)
      ratios.push(data[i] / ma)
    }
  }

  // Calculate seasonal indices
  const seasonalSums: number[] = new Array(periodsPerSeason).fill(0)
  const seasonalCounts: number[] = new Array(periodsPerSeason).fill(0)

  ratios.forEach((ratio, i) => {
    if (ratio !== null) {
      const seasonIndex = i % periodsPerSeason
      seasonalSums[seasonIndex] += ratio
      seasonalCounts[seasonIndex]++
    }
  })

  const rawIndices = seasonalSums.map((sum, i) => (seasonalCounts[i] > 0 ? sum / seasonalCounts[i] : 1))

  // Normalize indices to average 1 (or sum to periodsPerSeason)
  const avgIndex = rawIndices.reduce((a, b) => a + b, 0) / periodsPerSeason
  const indices = rawIndices.map((idx) => idx / avgIndex)

  // Calculate deseasonalized data
  const deseasonalized = data.map((val, i) => val / indices[i % periodsPerSeason])

  return { indices, deseasonalized, movingAverages, ratios }
}
