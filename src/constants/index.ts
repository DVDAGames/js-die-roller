import { RollerOptions } from '../types'

// Maximum number of times to check for valid random data
export const MAX_ITERATIONS = 100

// Maximum range for random data
export const MAX_RANGE = 4294967296

export const DEFAULT_COUNT = 6

export const DEFAULT_MIN = 1

export const DEFAULT_MAX = 20

// Default configuration options for Roller class
export const DEFAULT_OPTIONS: RollerOptions = {
  defaultMinRoll: DEFAULT_MIN,
  defaultMaxRoll: DEFAULT_MAX,
  defaultRoll: '1d20',
  defaultCount: DEFAULT_COUNT,
  defaultFateNeutralCount: 2,
}

// Regular Expression to identify variable strings like `$AGI`
export const VARIABLE_REGEX = /\$(\w+)/
