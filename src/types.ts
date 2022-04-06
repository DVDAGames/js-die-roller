export type RollerRollNotation = string

export interface RollerRoll {
  [key: string]: number
}

export interface RollerRollResult {
  total: number | number[]
  roll: string
  breakdown: RollerRoll[]
}

export interface RollerOptions {
  defaultMinRoll: number
  defaultMaxRoll: number
  defaultRoll: string
  defaultCount: number
}

export interface RollerMap {
  [key: string]: RollerRollNotation
}

export interface RollerVariables {
  [key: string]: number
}

export interface RollerConfig {
  options?: RollerOptions
  map?: RollerMap
  variables?: RollerVariables
}
