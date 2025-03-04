import Roller from '../index'

/**
 * Helper function to run a fairness test for a specific die type
 * Returns true if the test passes, false if it fails
 */
function runFairnessTest(
  sides: number,
  totalRolls: number,
  tolerance: number,
  criticalValue: number,
  verbose = true
): boolean {
  try {
    // Create roller
    const roller = new Roller()

    // Track occurrences of each value
    const occurrences: Record<number, number> = {}
    for (let i = 1; i <= sides; i++) {
      occurrences[i] = 0
    }

    // Expected percentage for each value
    const expectedPercentage = 100 / sides

    // Perform rolls
    for (let i = 0; i < totalRolls; i++) {
      const result = roller.roll(`1d${sides}`)
      const value = result.total[0]
      occurrences[value]++
    }

    // Calculate chi-square statistic
    const expectedCount = totalRolls / sides
    let chiSquare = 0
    let allWithinTolerance = true

    for (let i = 1; i <= sides; i++) {
      const percentage = (occurrences[i] / totalRolls) * 100

      if (verbose) {
        console.log(
          `d${sides} Value ${i}: ${
            occurrences[i]
          } occurrences (${percentage.toFixed(2)}%)`
        )
      }

      // Calculate chi-square contribution
      const difference = occurrences[i] - expectedCount
      chiSquare += (difference * difference) / expectedCount

      // Check if percentage is within tolerance
      if (
        percentage < expectedPercentage - tolerance ||
        percentage > expectedPercentage + tolerance
      ) {
        allWithinTolerance = false
      }
    }

    if (verbose) {
      console.log(
        `d${sides} Chi-square value: ${chiSquare.toFixed(
          2
        )} (critical value: ${criticalValue})`
      )
    }

    // Test passes if chi-square is below critical value and all percentages are within tolerance
    return chiSquare < criticalValue && allWithinTolerance
  } catch (error) {
    console.error(`Error in d${sides} test:`, error)
    return false
  }
}

/**
 * Runs a test multiple times and requires a majority of passing results
 */
function runWithRetries(
  testName: string,
  sides: number,
  totalRolls: number,
  tolerance: number,
  criticalValue: number
): void {
  test(testName, () => {
    const MAX_ATTEMPTS = 3
    const REQUIRED_PASSES = 2
    let passCount = 0
    let attempts = 0

    // console.log(`\n===== Starting fairness test for d${sides} =====`)

    while (attempts < MAX_ATTEMPTS && passCount < REQUIRED_PASSES) {
      attempts++
      // console.log(`\nAttempt ${attempts} of ${MAX_ATTEMPTS} for d${sides}...`)

      const passed = runFairnessTest(
        sides,
        totalRolls,
        tolerance,
        criticalValue,
        false
      )

      if (passed) {
        passCount++
        // console.log(
        //   `d${sides} test PASSED on attempt ${attempts}. (${passCount} of ${REQUIRED_PASSES} required passes)`
        // )
        // } else {
        //   console.log(
        //     `d${sides} test FAILED on attempt ${attempts}. (${passCount} of ${REQUIRED_PASSES} required passes)`
        //   )
      }

      // If we've already got enough passes, or if it's impossible to get enough passes with remaining attempts, stop
      if (
        passCount >= REQUIRED_PASSES ||
        passCount + (MAX_ATTEMPTS - attempts) < REQUIRED_PASSES
      ) {
        break
      }
    }

    // console.log(`\n===== Fairness test for d${sides} complete =====`)
    // console.log(`Results: ${passCount} passes out of ${attempts} attempts`)

    // Test passes if we got at least REQUIRED_PASSES successes
    expect(passCount).toBeGreaterThanOrEqual(REQUIRED_PASSES)
  })
}

describe('Dice Roller - Statistical Fairness', () => {
  // Run tests for all standard dice with retries
  runWithRetries(
    '1d4 rolls have an even distribution over large sample',
    4,
    40000,
    2.0,
    7.81
  )
  runWithRetries(
    '1d6 rolls have an even distribution over large sample',
    6,
    60000,
    2.0,
    11.07
  )
  runWithRetries(
    '1d8 rolls have an even distribution over large sample',
    8,
    80000,
    1.8,
    14.07
  )
  runWithRetries(
    '1d10 rolls have an even distribution over large sample',
    10,
    100000,
    1.5,
    16.92
  )
  runWithRetries(
    '1d12 rolls have an even distribution over large sample',
    12,
    120000,
    1.5,
    19.68
  )
  runWithRetries(
    '1d20 rolls have an even distribution over large sample',
    20,
    200000,
    1.2,
    30.14
  )
})
