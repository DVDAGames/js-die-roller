import Roller from '../index'

describe('Rolls fate dice', () => {
  test('Rolls 4dF', () => {
    const roller = new Roller('4dF')

    const result = roller.result!

    console.log(result)

    expect(result.total).toBeGreaterThanOrEqual(-4)
    expect(result.total).toBeLessThanOrEqual(4)
    expect(result.rolls.length).toBe(4)
  })

  // TODO: implement this test
  // test('Throws when trying to roll undefined die size', () => {
  //   const roller = new Roller('4dT')

  //   const result = roller.result!

  //   expect(result).toThrowError()
  // })
})
