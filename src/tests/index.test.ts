import Roller from '../index'

// TODO: add more tests for various roll types and add test for a full Roller
// class instance with variables and mapped actions.

describe('Dice Roller - Basic Rolls', () => {
  test('rolls a single die correctly', () => {
    const roll = new Roller('1d20')
    expect(Array.isArray(roll?.result?.total)).toBe(true)
    expect(roll?.result?.total[0]).toBeGreaterThanOrEqual(1)
    expect(roll?.result?.total[0]).toBeLessThanOrEqual(20)
  })

  test('rolls multiple dice correctly', () => {
    const roll = new Roller('4d6')
    expect(Array.isArray(roll?.result?.total)).toBe(true)
    expect(roll?.result?.total[0]).toBeGreaterThanOrEqual(4)
    expect(roll?.result?.total[0]).toBeLessThanOrEqual(24)
  })
})

describe('Dice Roller - Modifiers', () => {
  test('adds positive modifiers correctly', () => {
    const roll = new Roller('1d20 + 4')
    expect(Array.isArray(roll?.result?.total)).toBe(true)
    expect(roll?.result?.total[0]).toBeGreaterThanOrEqual(5)
    expect(roll?.result?.total[0]).toBeLessThanOrEqual(24)
  })

  test('subtracts negative modifiers correctly', () => {
    const roll = new Roller('4d6 - 2')
    expect(Array.isArray(roll?.result?.total)).toBe(true)
    expect(roll?.result?.total[0]).toBeGreaterThanOrEqual(2)
    expect(roll?.result?.total[0]).toBeLessThanOrEqual(22)
  })
})

describe('Dice Roller - Functions', () => {
  describe('drop function', () => {
    test('drops lowest value from rolls', () => {
      const roller = new Roller({})
      const result = roller.roll('drop(4d6)')
      expect(Array.isArray(result.total)).toBe(true)
      expect(result.total).toHaveLength(1)
      // We should have 4 original rolls in the breakdown
      expect(result.breakdown.length).toBe(4)
      // We can verify the drop function behavior by independently checking
      // since we can't predict the exact rolls with crypto-based randomization
      const allRolls = result.breakdown.map((item) => {
        // Each item is an object with a single key like '8d6: 0' and the value is the roll
        return Object.values(item)[0]
      })
      const minRoll = Math.min(...allRolls)
      // Ensure the sum doesn't include the minimum roll
      let sumWithoutMin = 0
      let foundMin = false
      for (const roll of allRolls) {
        if (!foundMin && roll === minRoll) {
          foundMin = true
          continue
        }
        sumWithoutMin += roll
      }
      expect(result.total[0]).toBe(sumWithoutMin)
    })
  })
  describe('sum function', () => {
    test('sums multiple dice rolls', () => {
      const roll = new Roller('sum(4d10)')
      expect(Array.isArray(roll?.result?.total)).toBe(true)
      expect(roll?.result?.total[0]).toBeGreaterThanOrEqual(4)
      expect(roll?.result?.total[0]).toBeLessThanOrEqual(40)
    })
  })
  describe('count function', () => {
    test('count function works through roll method', () => {
      const roller = new Roller()

      const result = roller.roll('count(6, 8d6)')

      const actualCount = result.breakdown.reduce((count, item) => {
        const value = Object.values(item)[0]

        if (value === 6) {
          return count + 1
        }

        return count
      }, 0)

      // Verify the structure is correct
      expect(Array.isArray(result.total)).toBe(true)
      expect(typeof result.total[0]).toBe('number')
      expect(result.total[0]).toBe(actualCount)
      expect(result.total[0]).toBeGreaterThanOrEqual(0)
      expect(result.total[0]).toBeLessThanOrEqual(8) // Can't have more 6s than dice rolled
    })
  })
  describe('max function', () => {
    test('returns maximum value from rolls', () => {
      const roll = new Roller('max(3d8)')
      expect(Array.isArray(roll?.result?.total)).toBe(true)
      expect(roll?.result?.total[0]).toBeGreaterThanOrEqual(1)
      expect(roll?.result?.total[0]).toBeLessThanOrEqual(8)
    })
  })
  describe('min function', () => {
    test('returns minimum value from rolls', () => {
      const roll = new Roller('min(3d8)')
      expect(Array.isArray(roll?.result?.total)).toBe(true)
      expect(roll?.result?.total[0]).toBeGreaterThanOrEqual(1)
      expect(roll?.result?.total[0]).toBeLessThanOrEqual(8)
    })
  })
  describe('avg function', () => {
    test('returns average value from rolls', () => {
      const roll = new Roller('avg(2d20)')
      expect(Array.isArray(roll?.result?.total)).toBe(true)
      expect(roll?.result?.total[0]).toBeGreaterThanOrEqual(1)
      expect(roll?.result?.total[0]).toBeLessThanOrEqual(20)
    })
  })
})

describe('Dice Roller - Variables', () => {
  test('uses variables in rolls', () => {
    const roller = new Roller({
      variables: {
        dex: 3,
        str: 5,
      },
    })

    const roll = roller.roll('1d20 + $dex')
    expect(Array.isArray(roll.total)).toBe(true)
    expect(roll.total[0]).toBeGreaterThanOrEqual(4) // 1 + 3
    expect(roll.total[0]).toBeLessThanOrEqual(23) // 20 + 3
  })

  test('handles multiple variables in one roll', () => {
    const roller = new Roller({
      variables: {
        dex: 3,
        str: 5,
      },
    })

    const roll = roller.roll('1d20 + $dex + $str')
    expect(Array.isArray(roll.total)).toBe(true)

    console.log(roll)

    // The result should include the dex (3) and str (5) modifiers
    // plus a die roll of 1-20
    expect(roll.total[0]).toBeGreaterThanOrEqual(9) // Die value should be at least 1
    expect(roll.total[0]).toBeLessThanOrEqual(28) // Die value should be at most 20

    // Verify the values in the roll string
    expect(roll.roll).toBe('1d20 + 3 + 5')
  })
})

describe('Dice Roller - Complex Combinations', () => {
  test('handles nested functions', () => {
    const roll = new Roller('max(drop(4d6))')
    expect(Array.isArray(roll?.result?.total)).toBe(true)
    expect(roll?.result?.total[0]).toBeGreaterThanOrEqual(1)
    expect(roll?.result?.total[0]).toBeLessThanOrEqual(6)
  })

  test('combines functions and modifiers', () => {
    const roll = new Roller('sum(4d6) + 2')
    expect(Array.isArray(roll?.result?.total)).toBe(true)
    expect(roll?.result?.total[0]).toBeGreaterThanOrEqual(6) // 4 + 2
    expect(roll?.result?.total[0]).toBeLessThanOrEqual(26) // 24 + 2
  })

  test('handles functions with variables', () => {
    const roller = new Roller({
      variables: {
        bonus: 2,
      },
    })

    const roll = roller.roll('max(2d20) + $bonus')

    expect(Array.isArray(roll.total)).toBe(true)
    expect(roll.total[0]).toBeGreaterThanOrEqual(3) // 1 + 2
    expect(roll.total[0]).toBeLessThanOrEqual(22) // 20 + 2
  })
})

describe('Dice Roller - Edge Cases', () => {
  test('handles single die with max value', () => {
    const roll = new Roller('1d1')
    expect(Array.isArray(roll?.result?.total)).toBe(true)
    expect(roll?.result?.total[0]).toBe(1)
  })

  test('handles zero modifier', () => {
    const roll = new Roller('1d20 + 0')
    expect(Array.isArray(roll?.result?.total)).toBe(true)
    expect(roll?.result?.total[0]).toBeGreaterThanOrEqual(1)
    expect(roll?.result?.total[0]).toBeLessThanOrEqual(20)
  })

  test('throws error for missing variable', () => {
    const roller = new Roller({
      variables: {},
    })

    expect(() => {
      roller.roll('1d20 + $missing')
    }).toThrow('Variable "missing" is not defined')
  })
})

describe('Dice Roller - Result Format', () => {
  test('returns correct result structure', () => {
    const roll = new Roller('2d6')
    expect(roll.result).toHaveProperty('total')
    expect(roll.result).toHaveProperty('roll')
    expect(roll.result).toHaveProperty('breakdown')
    expect(Array.isArray(roll.result?.total)).toBe(true)
    expect(Array.isArray(roll.result?.breakdown)).toBe(true)
  })

  test('breakdown contains individual rolls', () => {
    const roll = new Roller('2d6')
    expect(Array.isArray(roll.result?.breakdown)).toBe(true)
    expect(roll.result?.breakdown).toHaveLength(2)
    roll.result?.breakdown.forEach((rollResult) => {
      const value = Object.values(rollResult)[0]
      expect(typeof value).toBe('number')
      expect(value).toBeGreaterThanOrEqual(1)
      expect(value).toBeLessThanOrEqual(6)
    })
  })
})
