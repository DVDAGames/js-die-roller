import Roller from '../index'

// TODO: add more tests for various roll types and add test for a full Roller
// class instance with variables and mapped actions.

const testCases = [
  {
    roll: 'sum(2d6)',
    min: 2,
    max: 12,
  },
  {
    roll: '1d20',
    min: 1,
    max: 20,
  },
  {
    roll: '1d20 + 2',
    min: 3,
    max: 23,
  },
]

describe('Rolls dice based on basic notation', () => {
  testCases.forEach((testCase) => {
    test(`Rolling ${testCase.roll}`, () => {
      const roll = new Roller(testCase.roll)

      expect(roll?.result?.total[0]).toBeGreaterThanOrEqual(testCase.min)
      expect(roll?.result?.total[0]).toBeLessThanOrEqual(testCase.max)
    })
  })
})
