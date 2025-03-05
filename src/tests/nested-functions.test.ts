import Roller from '..'

describe('Roller - Nested Functions', () => {
  const roller = new Roller()

  test('supports basic function with single parameter', () => {
    const result = roller.roll('drop(4d6)')

    expect(result.total).toBeGreaterThanOrEqual(3)
    expect(result.total).toBeLessThanOrEqual(18)
    // The breakdown contains all dice rolled
    expect(result.breakdown.length).toBe(4)
  })

  test('supports sum function with nested drop function', () => {
    const result = roller.roll('sum(drop(4d6))')
    expect(result.total).toBeGreaterThanOrEqual(3)
    expect(result.total).toBeLessThanOrEqual(18)
  })

  test('supports multiple parameters in drop function', () => {
    const result = roller.roll('drop(1d20, 1d20, 1d20)')
    expect(Array.isArray(result.rolls)).toBe(true)
    expect(result.rolls.length).toBe(2)
    expect(result.total).toBeGreaterThanOrEqual(2)
    expect(result.total).toBeLessThanOrEqual(40)
  })

  test('supports complex nested functions for character stat generation', () => {
    // Standard D&D 5e ability score generation:
    // Roll 4d6, drop the lowest, sum the remaining 3
    // Do this 6 times for each ability score
    const result = roller.roll(
      'drop(sum(drop(4d6)), sum(drop(4d6)), sum(drop(4d6)), sum(drop(4d6)), sum(drop(4d6)), sum(drop(4d6)), sum(drop(4d6)))'
    )

    expect(Array.isArray(result.rolls)).toBe(true)
    expect(result.rolls.length).toBe(6)

    // Each ability score should be between 3 and 18
    result.rolls.forEach((roll) => {
      expect(roll).toBeGreaterThanOrEqual(3)
      expect(roll).toBeLessThanOrEqual(18)
    })
  })
})
