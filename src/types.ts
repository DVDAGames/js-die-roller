export type RollerRollNotation = string

export type RollerStandardDieSize = 4 | 6 | 8 | 10 | 12 | 20

export type RollerEsotericDieSize = 100 | number

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
  notation: string
  breakdown: RollerRoll[]
}

export interface RollerOptions {
  defaultMinRoll: number
  defaultMaxRoll: number
  defaultRoll: string
  defaultCount: number
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
