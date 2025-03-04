import Roller from '../index'

// TODO: add more tests for various roll types and add test for a full Roller
// class instance with variables and mapped actions.

describe('Dice Roller - Basic Rolls', () => {
  test('rolls a single die correctly', () => {
    const roller = new Roller()
    const roll = roller.roll('1d20')
    expect(typeof roll.total).toBe('number')
    expect(roll.total).toBeGreaterThanOrEqual(1)
    expect(roll.total).toBeLessThanOrEqual(20)
  })

  test('rolls multiple dice correctly', () => {
    const roller = new Roller()
    const roll = roller.roll('4d6')
    expect(typeof roll.total).toBe('number')
    expect(roll.total).toBeGreaterThanOrEqual(4)
    expect(roll.total).toBeLessThanOrEqual(24)
  })
})

describe('Dice Roller - Modifiers', () => {
  test('adds positive modifiers correctly', () => {
    const roller = new Roller()
    const roll = roller.roll('1d20 + 4')
    expect(typeof roll.total).toBe('number')
    expect(roll.total).toBeGreaterThanOrEqual(5)
    expect(roll.total).toBeLessThanOrEqual(24)
  })

  test('subtracts negative modifiers correctly', () => {
    const roller = new Roller()
    const roll = roller.roll('4d6 - 2')
    expect(typeof roll.total).toBe('number')
    expect(roll.total).toBeGreaterThanOrEqual(2)
    expect(roll.total).toBeLessThanOrEqual(22)
  })
})

describe('Dice Roller - Functions', () => {
  describe('drop function', () => {
    test('drops lowest value from rolls', () => {
      const roller = new Roller({})
      const result = roller.roll('drop(4d6)')
      expect(typeof result.total).toBe('number')
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
      expect(result.total).toBe(sumWithoutMin)
    })
  })
  describe('sum function', () => {
    test('sums multiple dice rolls', () => {
      const roller = new Roller()
      const roll = roller.roll('sum(4d10)')
      expect(typeof roll.total).toBe('number')
      expect(roll.total).toBeGreaterThanOrEqual(4)
      expect(roll.total).toBeLessThanOrEqual(40)
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
      expect(typeof result.total).toBe('number')
      expect(result.total).toBe(actualCount)
      expect(result.total).toBeGreaterThanOrEqual(0)
      expect(result.total).toBeLessThanOrEqual(8) // Can't have more 6s than dice rolled
    })
  })
  describe('max function', () => {
    test('returns maximum value from rolls', () => {
      const roller = new Roller()
      const roll = roller.roll('max(3d8)')
      expect(typeof roll.total).toBe('number')
      expect(roll.total).toBeGreaterThanOrEqual(1)
      expect(roll.total).toBeLessThanOrEqual(8)
    })
  })
  describe('min function', () => {
    test('returns minimum value from rolls', () => {
      const roller = new Roller()
      const roll = roller.roll('min(3d8)')
      expect(typeof roll.total).toBe('number')
      expect(roll.total).toBeGreaterThanOrEqual(1)
      expect(roll.total).toBeLessThanOrEqual(8)
    })
  })
  describe('avg function', () => {
    test('returns average value from rolls', () => {
      const roller = new Roller()
      const roll = roller.roll('avg(2d20)')
      expect(typeof roll.total).toBe('number')
      expect(roll.total).toBeGreaterThanOrEqual(1)
      expect(roll.total).toBeLessThanOrEqual(20)
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
    expect(typeof roll.total).toBe('number')
    expect(roll.total).toBeGreaterThanOrEqual(4) // 1 + 3
    expect(roll.total).toBeLessThanOrEqual(23) // 20 + 3
  })

  test('handles multiple variables in one roll', () => {
    const roller = new Roller({
      variables: {
        dex: 3,
        str: 5,
      },
    })

    const roll = roller.roll('1d20 + $dex + $str')
    expect(typeof roll.total).toBe('number')

    // The result should include the dex (3) and str (5) modifiers
    // plus a die roll of 1-20
    expect(roll.total).toBeGreaterThanOrEqual(9) // Die value should be at least 1
    expect(roll.total).toBeLessThanOrEqual(28) // Die value should be at most 20

    // Verify the values in the roll string
    expect(roll.notation).toBe('1d20 + 3 + 5')
  })
})

describe('Dice Roller - Complex Combinations', () => {
  test('handles nested functions', () => {
    const roller = new Roller()
    const roll = roller.roll('max(drop(4d6))')
    expect(typeof roll.total).toBe('number')
    expect(roll.total).toBeGreaterThanOrEqual(1)
    expect(roll.total).toBeLessThanOrEqual(6)
  })

  test('combines functions and modifiers', () => {
    const roller = new Roller()
    const roll = roller.roll('sum(4d6) + 2')
    expect(typeof roll.total).toBe('number')
    expect(roll.total).toBeGreaterThanOrEqual(6) // 4 + 2
    expect(roll.total).toBeLessThanOrEqual(26) // 24 + 2
  })

  test('handles functions with variables', () => {
    const roller = new Roller({
      variables: {
        bonus: 2,
      },
    })

    const roll = roller.roll('max(2d20) + $bonus')

    expect(typeof roll.total).toBe('number')
    expect(roll.total).toBeGreaterThanOrEqual(3) // 1 + 2
    expect(roll.total).toBeLessThanOrEqual(22) // 20 + 2
  })
})

describe('Dice Roller - Edge Cases', () => {
  test('handles single die with max value', () => {
    const roller = new Roller()
    const roll = roller.roll('1d1')
    expect(typeof roll.total).toBe('number')
    expect(roll.total).toBe(1)
  })

  test('handles zero modifier', () => {
    const roller = new Roller()
    const roll = roller.roll('1d20 + 0')
    expect(typeof roll.total).toBe('number')
    expect(roll.total).toBeGreaterThanOrEqual(1)
    expect(roll.total).toBeLessThanOrEqual(20)
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
    const roller = new Roller()
    const roll = roller.roll('2d6')
    expect(roll).toHaveProperty('total')
    expect(roll).toHaveProperty('notation')
    expect(roll).toHaveProperty('breakdown')
    expect(typeof roll.total).toBe('number')
    expect(Array.isArray(roll.breakdown)).toBe(true)
  })

  test('breakdown contains individual rolls', () => {
    const roller = new Roller()
    const roll = roller.roll('2d6')
    expect(Array.isArray(roll.breakdown)).toBe(true)
    expect(roll.breakdown).toHaveLength(2)
    roll.breakdown.forEach((rollResult) => {
      const value = Object.values(rollResult)[0]
      expect(typeof value).toBe('number')
      expect(value).toBeGreaterThanOrEqual(1)
      expect(value).toBeLessThanOrEqual(6)
    })
  })
})

test('handles 1d20 from factory', () => {
  const roller = new Roller()
  const roll = roller.roll('1d20')
  expect(roll).toBeDefined()
  expect(roll.breakdown.length).toBe(1)
  expect(typeof roll.total).toBe('number')
  expect(roll.total).toBeGreaterThanOrEqual(1)
  expect(roll.total).toBeLessThanOrEqual(20)
})

test('handles 1d20 + 3 with modifier', () => {
  const roller = new Roller()
  const roll = roller.roll('1d20 + 3')
  expect(roll).toBeDefined()
  expect(roll.breakdown.length).toBe(1)
  expect(typeof roll.total).toBe('number')
  expect(roll.total).toBeGreaterThanOrEqual(4)
  expect(roll.total).toBeLessThanOrEqual(23)
})

test('handles multiple additions: 1d20 + 3 + 2', () => {
  const roller = new Roller()
  const roll = roller.roll('1d20 + 3 + 2')
  expect(roll).toBeDefined()
  expect(roll.breakdown.length).toBe(1)
  expect(typeof roll.total).toBe('number')
  expect(roll.total).toBeGreaterThanOrEqual(6)
  expect(roll.total).toBeLessThanOrEqual(25)
})

test('handles addition and subtraction: 1d20 + 3 - 1', () => {
  const roller = new Roller()
  const roll = roller.roll('1d20 + 3 - 1')
  expect(roll).toBeDefined()
  expect(roll.breakdown.length).toBe(1)
  expect(typeof roll.total).toBe('number')
  expect(roll.total).toBeGreaterThanOrEqual(3)
  expect(roll.total).toBeLessThanOrEqual(22)
})

test('can access minimum function', () => {
  jest.spyOn(global.Math, 'random').mockReturnValue(0.5)
  const roller = new Roller()

  // When using Math.random() fixed at 0.5 with 4d6, we get the values [3, 3, 3]
  // after dropping the lowest value which is also 3
  const result = roller.roll('drop(4d6)')

  // Check the structure is correct
  expect(result.breakdown.length).toBe(4) // Total rolls before dropping
  expect(result.rolls.length).toBe(3) // Rolls after dropping lowest
  expect(result.total).toBe(9) // Sum of [3, 3, 3]
})

test('handles more complex operations: (4d6)', () => {
  const roll = new Roller('4d8 + 2d4')
  expect(roll?.result).toBeDefined()
  expect(roll?.result?.breakdown.length).toBe(6)
  expect(roll?.result?.total).toBeGreaterThanOrEqual(6)
  expect(roll?.result?.total).toBeLessThanOrEqual(40)
})

test('can count values: count(6, 8d6)', () => {
  jest.spyOn(global.Math, 'random').mockReturnValue(0.5)
  const roller = new Roller()

  const result = roller.roll('count(6, 8d6)')

  // All dice should roll 3 (when Math.random() is fixed at 0.5)
  // So there should be 0 6s counted
  const actualCount = 0

  expect(typeof result.total).toBe('number')
  expect(result.total).toBe(actualCount)
  expect(result.total).toBeGreaterThanOrEqual(0)
  expect(result.total).toBeLessThanOrEqual(8) // Can't have more 6s than dice rolled
})

test('handles 2d4', () => {
  const roll = new Roller('2d4')
  expect(roll?.result).toBeDefined()
  expect(roll?.result?.breakdown.length).toBe(2)
  expect(roll?.result?.total).toBeGreaterThanOrEqual(2)
  expect(roll?.result?.total).toBeLessThanOrEqual(8)
})

test('handles mixed 2d4 + 2d2', () => {
  const roll = new Roller('2d4 + 2d2')
  expect(roll?.result).toBeDefined()
  expect(roll?.result?.breakdown.length).toBe(4)
  expect(roll?.result?.total).toBeGreaterThanOrEqual(4)
  expect(roll?.result?.total).toBeLessThanOrEqual(12)
})

test('handles percentile 1d100', () => {
  const roll = new Roller('1d100')
  expect(roll?.result).toBeDefined()
  expect(roll?.result?.breakdown.length).toBe(1)
  expect(roll?.result?.total).toBeGreaterThanOrEqual(1)
  expect(roll?.result?.total).toBeLessThanOrEqual(100)
})

test('handles variables in roll: 1d20 + $dex', () => {
  const roller = new Roller({
    variables: {
      dex: 3,
    },
  })

  const roll = roller.roll('1d20 + $dex')
  expect(roll.breakdown.length).toBe(1)
  expect(roll.total).toBeGreaterThanOrEqual(4) // 1 + 3
  expect(roll.total).toBeLessThanOrEqual(23) // 20 + 3

  // Verify the values in the roll string
  expect(roll.notation).toBe('1d20 + 3')
})

test('handles multiple variables in roll: 1d20 + $dex + $str', () => {
  const roller = new Roller({
    variables: {
      dex: 3,
      str: 5,
    },
  })

  const roll = roller.roll('1d20 + $dex + $str')
  expect(roll.breakdown.length).toBe(1)

  // The result should include the dex (3) and str (5) modifiers
  // plus a die roll of 1-20
  expect(roll.total).toBeGreaterThanOrEqual(9) // Die value should be at least 1
  expect(roll.total).toBeLessThanOrEqual(28) // Die value should be at most 20

  // Verify the values in the roll string
  expect(roll.notation).toBe('1d20 + 3 + 5')
})

test('handles variables with function rolls: max(2d20) + $bonus', () => {
  const roller = new Roller({
    variables: {
      bonus: 2,
    },
  })

  const roll = roller.roll('max(2d20) + $bonus')
  expect(roll.breakdown.length).toBe(2)
  expect(roll.total).toBeGreaterThanOrEqual(3) // 1 + 2
  expect(roll.total).toBeLessThanOrEqual(22) // 20 + 2

  // Verify the values in the roll string
  expect(roll.notation).toBe('max(2d20) + 2')
})

test('works with static values', () => {
  const roller = new Roller()
  const roll = roller.roll('1')
  expect(roll.breakdown.length).toBe(0)
  expect(roll.total).toBe(1)
})

test('works with multiple dice', () => {
  jest.spyOn(global.Math, 'random').mockReturnValue(0.5)
  const roller = new Roller()
  const roll = roller.roll('1d20')
  expect(roll.total).toBeGreaterThanOrEqual(1)
  expect(roll.total).toBeLessThanOrEqual(20)
})
