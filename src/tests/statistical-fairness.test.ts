import Roller from '../index'

/**
 * This test looks at the statistical fairness of the dice roller.
 * It performs many rolls and verifies that the results have the
 * expected distribution.
 *
 * For dice with different sizes and numbers, we calculate:
 * 1. The expected average result
 * 2. The standard deviation around that average
 *
 * Then we perform many rolls and verify that:
 * 1. The actual average is close to the expected average
 * 2. The standard deviation of actual rolls is close to the expected
 */
describe('Dice Rolling - Statistical Fairness', () => {
  // Number of rolls to perform for each test
  // Higher numbers give more accurate results but slow down the test
  const ROLL_COUNT = 1000

  // The following tests will verify that the distribution
  // is within this many standard deviations of the expected value
  const TOLERANCE_STDDEV = 2.5

  // Test basic rolling for single dice with different sizes
  test.each([
    // [size, count]
    [4, 1],
    [6, 1],
    [8, 1],
    [10, 1],
    [12, 1],
    [20, 1],
    [100, 1],
  ])('statistically fair distribution for %id%i', (size, count) => {
    const roller = new Roller()
    const notation = `${count}d${size}`

    // Expected values for uniform dice distribution
    const expectedMean = ((size + 1) / 2) * count
    const expectedVariance = ((size ** 2 - 1) / 12) * count
    const expectedStdDev = Math.sqrt(expectedVariance)

    // Perform rolls
    const results: number[] = []
    for (let i = 0; i < ROLL_COUNT; i++) {
      const result = roller.roll(notation)
      const value = result.total
      results.push(value)
    }

    // Calculate actual statistics
    const actualMean = results.reduce((sum, val) => sum + val, 0) / ROLL_COUNT
    const actualVariance =
      results.reduce((sum, val) => sum + (val - actualMean) ** 2, 0) /
      ROLL_COUNT
    const actualStdDev = Math.sqrt(actualVariance)

    // Calculate z-score of difference between expected and actual mean
    const meanZScore = Math.abs(actualMean - expectedMean) / expectedStdDev

    // Verify statistics are within expected ranges
    expect(meanZScore).toBeLessThan(TOLERANCE_STDDEV)
    expect(actualStdDev).toBeGreaterThan(expectedStdDev * 0.7)
    expect(actualStdDev).toBeLessThan(expectedStdDev * 1.3)
  })

  // Test rolling multiple dice
  test.each([
    // [size, count]
    [6, 2],
    [6, 3],
    [6, 4],
    [20, 2],
    [20, 3],
  ])('statistically fair distribution for %id%i', (size, count) => {
    const roller = new Roller()
    const notation = `${count}d${size}`

    // Expected values for uniform dice distribution
    const expectedMean = ((size + 1) / 2) * count
    const expectedVariance = ((size ** 2 - 1) / 12) * count
    const expectedStdDev = Math.sqrt(expectedVariance)

    // Perform rolls
    const results: number[] = []
    for (let i = 0; i < ROLL_COUNT; i++) {
      const result = roller.roll(notation)
      const value = result.total
      results.push(value)
    }

    // Calculate actual statistics
    const actualMean = results.reduce((sum, val) => sum + val, 0) / ROLL_COUNT
    const actualVariance =
      results.reduce((sum, val) => sum + (val - actualMean) ** 2, 0) /
      ROLL_COUNT
    const actualStdDev = Math.sqrt(actualVariance)

    // Calculate z-score of difference between expected and actual mean
    const meanZScore = Math.abs(actualMean - expectedMean) / expectedStdDev

    // Verify statistics are within expected ranges
    expect(meanZScore).toBeLessThan(TOLERANCE_STDDEV)
    expect(actualStdDev).toBeGreaterThan(expectedStdDev * 0.7)
    expect(actualStdDev).toBeLessThan(expectedStdDev * 1.3)
  })
})
