import Roller from '../index'
import {
  FATE_DIE_SYMBOLS,
  FATE_DIE_SYMBOL_VALUES,
  FATE_DIE_SYMBOL_MAP,
  FATE_DIE_SYMBOL_VALUES_MAP,
} from '../utils/d20/constants'

import { RollerFateDieSymbol, RollerFateDieValue } from '../types'

describe('Rolls fate dice', () => {
  test('Rolls 4dF', () => {
    const roller = new Roller('4dF')

    const result = roller.result!

    expect(result.total).toBeGreaterThanOrEqual(-4)
    expect(result.total).toBeLessThanOrEqual(4)

    expect(result.rolls.length).toBe(4)
    expect(result.fateRolls.length).toBe(4)

    expect(result.notation).toBe('4dF')

    expect(
      result.rolls.every((roll) =>
        FATE_DIE_SYMBOL_VALUES.includes(roll as RollerFateDieValue)
      )
    ).toBe(true)

    expect(
      result.fateRolls.every((roll) =>
        FATE_DIE_SYMBOLS.includes(roll as RollerFateDieSymbol)
      )
    ).toBe(true)

    expect(
      result.fateRolls.every(
        (roll, index) => FATE_DIE_SYMBOL_MAP[roll] === result.rolls[index]
      )
    ).toBe(true)

    expect(
      result.rolls.every(
        (roll, index) =>
          FATE_DIE_SYMBOL_VALUES_MAP[roll] === result.fateRolls[index]
      )
    ).toBe(true)
  })

  test('Throws when trying to roll undefined die size', () => {
    expect(() => {
      new Roller('4dT')
    }).toThrow()
  })
})
