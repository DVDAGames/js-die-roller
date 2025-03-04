// ES Module imports
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Roller from '../lib/index.js'

// Get the directory name
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration - increased by an order of magnitude (10x) for greater statistical significance
const TEST_CONFIGURATIONS = [
  { sides: 4, rolls: 400000, title: 'D4 Distribution' },
  { sides: 6, rolls: 600000, title: 'D6 Distribution' },
  { sides: 8, rolls: 800000, title: 'D8 Distribution' },
  { sides: 10, rolls: 1000000, title: 'D10 Distribution' },
  { sides: 12, rolls: 1200000, title: 'D12 Distribution' },
  { sides: 20, rolls: 2000000, title: 'D20 Distribution' },
]

// Implementation types
const IMPLEMENTATIONS = {
  ROLLER: 'Roller',
  MATH_RANDOM: 'Math.random()',
}

// Simple Math.random() implementation of dice rolling
function mathRandomDiceRoll(sides) {
  return Math.floor(Math.random() * sides) + 1
}

// Create ASCII bar chart
function createAsciiBarChart(data, maxBarLength = 50) {
  let chart = ''
  const maxValue = Math.max(...Object.values(data))

  for (let i = 1; i <= Object.keys(data).length; i++) {
    const value = data[i]
    const percentage = (value * 100) / maxValue
    const barLength = Math.round((percentage / 100) * maxBarLength)
    const bar = '█'.repeat(barLength)
    chart += `${i.toString().padStart(2)}: ${bar} ${value}\n`
  }

  return chart
}

// Generate dice roll statistics for a specific implementation
async function generateImplementationStats(implementation, config) {
  const roller = new Roller()

  // Track occurrences of each value
  const occurrences = {}
  for (let i = 1; i <= config.sides; i++) {
    occurrences[i] = 0
  }

  // Progress reporting interval - adjust based on total rolls
  const progressInterval = Math.max(1000, Math.floor(config.rolls / 100))
  console.log(`Starting ${implementation} rolls for d${config.sides}...`)

  // Perform rolls based on implementation
  for (let i = 0; i < config.rolls; i++) {
    if (i % progressInterval === 0 && i > 0) {
      const percentComplete = ((i / config.rolls) * 100).toFixed(1)
      process.stdout.write(
        `${implementation} d${
          config.sides
        }: ${percentComplete}% complete (${i.toLocaleString()} of ${config.rolls.toLocaleString()} rolls)\r`
      )
    }

    let value
    if (implementation === IMPLEMENTATIONS.ROLLER) {
      const result = roller.roll(`1d${config.sides}`)
      value = result.total[0]
    } else if (implementation === IMPLEMENTATIONS.MATH_RANDOM) {
      value = mathRandomDiceRoll(config.sides)
    }

    occurrences[value]++
  }

  console.log(
    `\nCompleted ${config.rolls.toLocaleString()} rolls for d${
      config.sides
    } using ${implementation}`
  )

  // Calculate chi-square statistic
  const expectedCount = config.rolls / config.sides
  let chiSquare = 0
  const tableData = []

  for (let i = 1; i <= config.sides; i++) {
    const count = occurrences[i]
    const percentage = (count / config.rolls) * 100
    const expectedPercentage = 100 / config.sides
    const deviation = percentage - expectedPercentage

    // Add to chi-square
    const difference = count - expectedCount
    chiSquare += (difference * difference) / expectedCount

    tableData.push({
      value: i,
      count,
      percentage,
      expectedPercentage,
      deviation,
    })

    console.log(`Die Value ${i}: ${count} (${percentage.toFixed(2)}%)`)
  }

  console.log(`Chi-square value: ${chiSquare.toFixed(2)}`)

  return {
    occurrences,
    chiSquare,
    tableData,
  }
}

// Generate comparative statistics
async function generateComparisonStats() {
  let markdownContent = `# Dice Roller Implementation Comparison - Statistical Fairness (High-Volume Testing)

This document compares the statistical fairness of two dice rolling implementations with an extremely large sample size:
1. \`Math.random()\` - JavaScript's built-in pseudo-random number generator
2. \`Roller\` - Our custom implementation using cryptographically secure random values

## Test Methodology

Each die type was rolled a very large number of times with both implementations to ensure high statistical significance. 
This high-volume testing (using millions of total dice rolls) allows us to detect even small deviations from the ideal distribution.

| Die Type | Number of Rolls | Expected Occurrences Per Value |
|----------|----------------|--------------------------------|
`

  // Add roll counts to the markdown with expected occurrences
  for (const config of TEST_CONFIGURATIONS) {
    const expectedPerValue = Math.floor(
      config.rolls / config.sides
    ).toLocaleString()
    markdownContent += `| d${
      config.sides
    } | ${config.rolls.toLocaleString()} | ${expectedPerValue} |\n`
  }

  markdownContent += `
We measured the distribution of each possible value and calculated the chi-square test values to measure 
goodness of fit against an ideal distribution. Lower chi-square values indicate a distribution closer to the ideal.

With such large sample sizes, we can draw more definitive conclusions about the statistical fairness of each implementation.

## Distribution Results

`

  // Generate comparative stats for each die type
  for (const config of TEST_CONFIGURATIONS) {
    console.log(`\n=== Testing d${config.sides} with ${config.rolls} rolls ===`)

    // Get stats for both implementations
    const mathRandomStats = await generateImplementationStats(
      IMPLEMENTATIONS.MATH_RANDOM,
      config
    )
    const rollerStats = await generateImplementationStats(
      IMPLEMENTATIONS.ROLLER,
      config
    )

    // Add comparison to markdown
    markdownContent += `### ${config.title}\n\n`
    markdownContent += `#### Chi-Square Comparison\n\n`
    markdownContent += `| Implementation | Chi-Square Value |\n`
    markdownContent += `|----------------|------------------|\n`
    markdownContent += `| Math.random() | ${mathRandomStats.chiSquare.toFixed(
      2
    )} |\n`
    markdownContent += `| Roller | ${rollerStats.chiSquare.toFixed(2)} |\n\n`

    // Add detailed distribution tables
    markdownContent += `#### Math.random() Distribution\n\n`
    markdownContent += `| Value | Count | Percentage | Expected % | Deviation |\n`
    markdownContent += `|-------|-------|------------|------------|----------|\n`

    for (const row of mathRandomStats.tableData) {
      markdownContent += `| ${
        row.value
      } | ${row.count.toLocaleString()} | ${row.percentage.toFixed(
        2
      )}% | ${row.expectedPercentage.toFixed(2)}% | ${
        row.deviation > 0 ? '+' : ''
      }${row.deviation.toFixed(2)}% |\n`
    }

    markdownContent += `\n\`\`\`\n${createAsciiBarChart(
      mathRandomStats.occurrences
    )}\`\`\`\n\n`

    markdownContent += `#### Roller Distribution\n\n`
    markdownContent += `| Value | Count | Percentage | Expected % | Deviation |\n`
    markdownContent += `|-------|-------|------------|------------|----------|\n`

    for (const row of rollerStats.tableData) {
      markdownContent += `| ${
        row.value
      } | ${row.count.toLocaleString()} | ${row.percentage.toFixed(
        2
      )}% | ${row.expectedPercentage.toFixed(2)}% | ${
        row.deviation > 0 ? '+' : ''
      }${row.deviation.toFixed(2)}% |\n`
    }

    markdownContent += `\n\`\`\`\n${createAsciiBarChart(
      rollerStats.occurrences
    )}\`\`\`\n\n`
  }

  // Add conclusion
  markdownContent += `## Conclusion

The statistical analysis compares the fairness of two dice rolling implementations:

1. \`Math.random()\` - JavaScript's built-in pseudo-random number generator
2. \`Roller\` - Our custom implementation using cryptographically secure random values

The chi-square values tell us how closely each implementation matches the expected theoretical distribution for fair dice. Lower chi-square values indicate a distribution closer to the ideal.

| Die Type | Math.random() Chi-Square | Roller Chi-Square | Critical Value (p=0.05) | Result |
|----------|--------------------------|-------------------|------------------------|--------|
`

  // Add summary table
  for (const config of TEST_CONFIGURATIONS) {
    let criticalValue = 0

    // Approximate critical values for common die sizes at p=0.05
    switch (config.sides) {
      case 4:
        criticalValue = 7.81
        break // 3 degrees of freedom
      case 6:
        criticalValue = 11.07
        break // 5 degrees of freedom
      case 8:
        criticalValue = 14.07
        break // 7 degrees of freedom
      case 10:
        criticalValue = 16.92
        break // 9 degrees of freedom
      case 12:
        criticalValue = 19.68
        break // 11 degrees of freedom
      case 20:
        criticalValue = 30.14
        break // 19 degrees of freedom
      default:
        criticalValue = 0
    }

    markdownContent += `| d${config.sides} | Varies per run | Varies per run | ${criticalValue} | Compare values |\n`
  }

  markdownContent += `
The critical values represent the chi-square threshold at a 95% confidence level (p=0.05). Values below the critical threshold indicate the distribution is statistically consistent with a fair die.

### Key Findings

1. Both implementations generally produce fair distributions for all common die types
2. The Roller implementation typically produces [RESULTS WILL VARY] chi-square values compared to Math.random()
3. This difference is particularly notable for [RESULTS WILL VARY] sided dice

These results demonstrate that [CONCLUSION BASED ON RESULTS]
`

  // Write to file
  const outputPath = path.join(__dirname, '..', 'IMPLEMENTATION_COMPARISON.md')
  fs.writeFileSync(outputPath, markdownContent)
  console.log(`\nComparison statistics saved to ${outputPath}`)
}

// Run the script
;(async () => {
  try {
    await generateComparisonStats()
    console.log('\nComparison statistics generation completed successfully!')
  } catch (error) {
    console.error('Error generating comparison statistics:', error)
  }
})()
