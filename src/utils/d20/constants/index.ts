import { RollerFateDieSymbol } from '../../../types'

export const ROOT_NODE_TYPE = 'd20'

export const FATE_DIE_SIZE_STRING = 'F'
export const FATE_DIE_SIZE_INT = 6

export const FATE_DIE_SYMBOLS = ['-', '□', '+'] as const
export const FATE_DIE_SYMBOL_VALUES = [-1, 0, 1] as const

export const FATE_DIE_SYMBOL_MAP = FATE_DIE_SYMBOLS.reduce(
  (acc, symbol, index) => {
    acc[symbol] = FATE_DIE_SYMBOL_VALUES[index]
    return acc
  },
  {} as Record<RollerFateDieSymbol, number>
)

export const FATE_DIE_SYMBOL_VALUES_MAP = FATE_DIE_SYMBOL_VALUES.reduce(
  (acc, value, index) => {
    acc[value] = FATE_DIE_SYMBOLS[index]
    return acc
  },
  {} as Record<number, RollerFateDieSymbol>
)
