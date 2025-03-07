import { FATE_DIE_SYMBOL_VALUES, FATE_DIE_SYMBOLS } from './utils/d20/constants'

export type RollerRollNotation = string

export type RollerStandardDieSize = 4 | 6 | 8 | 10 | 12 | 20

export type RollerEsotericDieSize = 100 | number

export type RollerFateDieSymbol = (typeof FATE_DIE_SYMBOLS)[number]
export type RollerFateDieValue = (typeof FATE_DIE_SYMBOL_VALUES)[number]

export type RollerDieNotation =
  | `d${RollerStandardDieSize}`
  | `d${RollerEsotericDieSize}`

export type RollerDieSize = RollerStandardDieSize | RollerEsotericDieSize

export interface RollerRoll {
  [key: string]: number
}

export interface RollerRollResult {
  total: number
  rolls: number[]
  originalRolls: number[]
  fateRolls: RollerFateDieSymbol[]
  notation: string
  breakdown: RollerRoll[]
}

export interface RollerOptions {
  defaultMinRoll: number
  defaultMaxRoll: number
  defaultRoll: string
  defaultCount: number
  defaultFateNeutralCount: 2 | 4
}

export interface RollerMap {
  [key: string]: RollerRollNotation | RollerMap
}

export interface RollerVariables {
  [key: string]: number
}

export interface RollerConfig {
  options?: RollerOptions
  map?: RollerMap
  variables?: RollerVariables
}
