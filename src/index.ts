import crypto from './utils/crypto'
import d20 from './utils/d20'
import {
  D20Node,
  OperatorNode,
  OPERATIONS,
  MethodNode,
  VariableNode,
  NodeType,
  NumberNode,
  RollNode,
  DieSize,
} from './utils/d20/types'

import { FATE_DIE_SIZE_STRING, FATE_DIE_SIZE_INT } from './utils/d20/constants'

import {
  DEFAULT_OPTIONS,
  DEFAULT_COUNT,
  VARIABLE_REGEX,
  MAX_RANGE,
  MAX_ITERATIONS,
} from './constants'

import {
  RollerConfig,
  RollerMap,
  RollerOptions,
  RollerVariables,
  RollerRollNotation,
  RollerRollResult,
  RollerRoll,
} from './types'

export type RollerMapper = (rolls: number[]) => number[]

export type RollerDropper = (rolls: number[]) => number[]

export type RollerCounter = (count: number, rolls: number[]) => number[]

export type RollerReducer = (rolls: number[]) => number

export interface RollerFunctionMapping {
  [key: string]: RollerMapper | RollerDropper | RollerCounter | RollerReducer
}

export interface RollerInterface {
  functions: RollerFunctionMapping
  options: RollerOptions
  variables: RollerVariables
  map: RollerMap
  rolls: RollerRoll[]
  result?: RollerRollResult
}

export default class Roller implements RollerInterface {
  /**
   * Options for various Roller functionality
   * @desc extend defaults with provided options
   * @type {Object}
   */
  options: RollerInterface['options'] = DEFAULT_OPTIONS
  /**
   * Object containing a map of variables and their values for use in notation
   * @desc store variables Object for this Roller instance
   * @type {Object}
   */
  variables: RollerInterface['variables'] = {}
  /**
   * Object mapping roll notation Strings to convenient names
   * @desc store roll map Object for this Roller instance
   * @type {Object}
   */
  map: RollerInterface['map'] = {}

  /**
   * @desc Array of various rolls that were made
   * @type {Array}
   */
  rolls: RollerInterface['rolls'] = []

  /**
   * @desc Array with final results of all rolls and operations
   * @type {Array}
   */
  result: RollerInterface['result']

  /**
   * @desc Object containing convenience functions that can be used in roll notation
   * @type {Object}
   */
  functions: RollerInterface['functions'] = {
    /**
     * Method for returning the maximum value from an Array of rolls
     * or the array with the maximum sum when multiple arrays are provided
     * @param {...Number} rolls Any number of rolled values
     * @returns {Number[]} The maximum value or array with maximum sum
     * @memberof Roller.functions
     */
    max: (...rolls: number[][]): number[] => {
      // Ensure we're working with arrays of numbers
      const processedRolls = rolls.map((set) => {
        // If the set contains arrays, flatten it
        if (set.some((item) => Array.isArray(item))) {
          return set.flat().filter((item) => typeof item === 'number')
        }
        return set
      })

      // If we have only one array, return the maximum value
      if (processedRolls.length === 1) {
        const maxValue = Math.max(...processedRolls[0])
        return [maxValue]
      }

      // If we have multiple arrays, return the array with the highest sum
      const sums = processedRolls.map((set) =>
        set.reduce(
          (total, roll) => total + (typeof roll === 'number' ? roll : 0),
          0
        )
      )
      const highestSumIndex = sums.indexOf(Math.max(...sums))

      return processedRolls[highestSumIndex]
    },

    /**
     * Method for returning the minimum value from an Array of rolls
     * or the array with the minimum sum when multiple arrays are provided
     * @param {...Number} rolls Any number of rolled values
     * @returns {Number[]} The minimum value or array with minimum sum
     * @memberof Roller.functions
     */
    min: (...rolls: number[][]): number[] => {
      // If we have only one array, return the minimum value
      if (rolls.length === 1) {
        return [Math.min(...rolls[0])]
      }

      // If we have multiple arrays, return the array with the lowest sum
      const sums = rolls.map((set) =>
        set.reduce((total, roll) => total + roll, 0)
      )
      const lowestSumIndex = sums.indexOf(Math.min(...sums))

      return rolls[lowestSumIndex]
    },

    /**
     * Simple method for returning the average value from an Array of rolls
     * @param {...Number} rolls Any number of rolled values
     * @returns {Number}
     * @memberof Roller.functions
     */
    avg: (...rolls: number[][]): number[] => {
      return rolls.map((set) =>
        Math.floor(set.reduce((total, roll) => total + roll, 0) / set.length)
      )
    },

    /**
     * Method for dropping the lowest value from each array of rolls or
     * returning all but the lowest value when multiple arrays are provided
     * @param {...Number} rolls Any number of rolled values
     * @returns {Array} The rolls with the lowest value(s) dropped
     * @memberof Roller.functions
     */
    drop: (...rolls: number[][]): number[] => {
      // Process the rolls to ensure we're working with numbers
      const processedRolls = rolls.map((set) => {
        // If the set contains arrays or non-numeric values, process it
        if (
          set.some((item) => Array.isArray(item) || typeof item !== 'number')
        ) {
          // Flatten arrays and convert to numbers where possible
          return set.flat().map((item) => {
            if (typeof item === 'number') {
              return item
            }

            // Try to convert strings to numbers
            if (typeof item === 'string') {
              const num = Number(item)
              return isNaN(num) ? 0 : num
            }
            return 0
          })
        }
        return set
      })

      // If we have only one array, drop the lowest value from it
      if (processedRolls.length === 1) {
        return [...processedRolls[0]].sort().reverse().slice(0, -1)
      }

      // If we have multiple arrays, return all arrays except the one with the lowest sum
      return processedRolls
        .map((set) =>
          set.reduce(
            (total, roll) => total + (typeof roll === 'number' ? roll : 0),
            0
          )
        )
        .sort()
        .reverse()
        .slice(0, -1)
        .flat()
    },

    /**
     * Method for summing values in an Array of rolls
     * @param {...Number} rolls Any number of rolled values
     * @returns {Array} Array containing the sum of each parameter
     * @memberof Roller.functions
     */
    sum: (...rolls: number[][]): number[] => {
      // Manually flatten nested arrays since we can't use this.flattenRolls from arrow function
      const flattenedSet = rolls
        .flat()
        .filter((item) => typeof item === 'number') as number[]

      // If we have numbers, sum them
      if (flattenedSet.length > 0) {
        const result = [
          flattenedSet.reduce((total, current) => total + current, 0),
        ]
        return result
      }

      // Fall back to original behavior
      const result = rolls.map((set) => {
        if (Array.isArray(set) && set.length > 0) {
          if (typeof set[0] === 'number') {
            return set[0]
          } else if (Array.isArray(set[0])) {
            // Recursively flatten and sum nested arrays
            const flattened = set
              .flat(Infinity)
              .filter((item) => typeof item === 'number')
            return flattened.reduce((sum, val) => sum + val, 0)
          }
        }
        return set as unknown as number
      })
      return result
    },

    /**
     * Simple method for counting the number of occurences of a specific value in an Array of rolls
     * @param {Number} number The number to count occurences of
     * @param {...Number} rolls Any number of rolled values
     * @returns {Array}
     * @memberof Roller.functions
     */
    count: (
      number: number = this?.options?.defaultCount ??
        DEFAULT_OPTIONS?.defaultCount ??
        DEFAULT_COUNT,
      ...rolls: number[][]
    ): number[] => {
      const numberToCount = Array.isArray(number) ? number[0] : number

      // Fall back to the original behavior if there are no dice rolls
      return rolls.map((set) =>
        set.reduce(
          (totalCount, roll) =>
            roll === numberToCount ? totalCount + 1 : totalCount,
          0
        )
      )
    },
  }

  flattenRolls(rolls: number[][] | number[]): number[] {
    return rolls
      .map((set) => {
        if (Array.isArray(set)) {
          return set.flat()
        }

        return set
      })
      .flat()
  }

  constructor(config: RollerConfig | RollerRollNotation = {}) {
    // polymorphic handing of Roller to allow user to just pass a simple die
    // notation and receive a result as this.result
    if (typeof config === 'string') {
      this.options = DEFAULT_OPTIONS

      this.result = this.roll(config)

      return this
    }

    // get relevant configuration properties so we can extend our defaults and
    // store our roll map
    const { map = {}, options = {}, variables = {} } = config

    // extend defaults with provided options
    this.options = Object.assign({}, DEFAULT_OPTIONS, options)
    this.map = Object.assign({}, this.map, map)
    this.variables = Object.assign({}, this.variables, variables)
  }

  /**
   * Allows user to pass standard die notation and receive rolled result
   * @desc Can accept simple (1d20) or complex (2d8 + 2) strings
   * @param {String} [notation=this.options.defaultRoll] what should we roll
   * @returns {Number}
   */
  roll(notation: RollerRollNotation): RollerRollResult {
    this.rolls = []

    console.log('Roll Notation:', notation)

    const rollNotation = this.checkRollMap(notation)

    // Replace variables in the roll notation before executing
    const processedRoll = this.replaceVariables(rollNotation)

    const breakdown = this.rolls

    // Use the processed roll with variables replaced
    const executionResult = this.execute(d20(processedRoll).body)

    // Normalize total to be an array of numbers
    let totalNumbers: number[] = []

    // Keep track of all original dice rolls before any modifications
    let originalRolls: number[] = []

    // Collect all original dice rolls from the breakdown
    breakdown.forEach((roll) => {
      Object.values(roll).forEach((value) => {
        if (typeof value === 'number') {
          originalRolls.push(value)
        }
      })
    })

    // Handle different types of return values from execution
    if (Array.isArray(executionResult)) {
      // Recursively extract numbers from nested arrays
      const extractNumbers = (arr: any[]): void => {
        arr.forEach((item) => {
          if (Array.isArray(item)) {
            extractNumbers(item)
          } else if (typeof item === 'number') {
            totalNumbers.push(item)
          }
        })
      }

      extractNumbers(executionResult)
    } else if (typeof executionResult === 'number') {
      totalNumbers = [executionResult]
    }

    // If there's no numbers, default to [0]
    if (totalNumbers.length === 0) {
      totalNumbers = [0] // Default to 0 if somehow we got no valid numbers
    }

    // Calculate the final total by summing all values in totalNumbers
    const finalTotal = totalNumbers.reduce((sum, num) => sum + num, 0)

    return {
      notation: processedRoll,
      breakdown,
      total: finalTotal,
      rolls: totalNumbers,
      originalRolls: originalRolls,
    }
  }

  replaceVariables(notation: RollerRollNotation): RollerRollNotation {
    const newNotation = notation

    // Use the global flag to find all variables in a single pass
    const regex = new RegExp(VARIABLE_REGEX, 'g')

    // Find all variables and replace them
    return newNotation.replace(regex, (match: string, variableName: string) => {
      // Check if the variable exists
      if (typeof this.variables?.[variableName] === 'undefined') {
        throw new Error(`Variable "${variableName}" is not defined`)
      }

      // Return the variable value
      return this.variables[variableName].toString()
    })
  }

  operate(syntax: OperatorNode): number[] {
    if (typeof syntax?.operands !== 'undefined') {
      const operands = this.execute(syntax.operands)

      if (operands.length === 2) {
        let operand1 = (operands as [unknown, unknown])[0]
        let operand2 = (operands as [unknown, unknown])[1]

        // Handle deeply nested arrays by recursively flattening
        const flattenDeep = (arr: any): number[] => {
          if (!Array.isArray(arr)) {
            return [Number(arr)]
          }

          let result: number[] = []
          arr.forEach((item) => {
            if (Array.isArray(item)) {
              result = result.concat(flattenDeep(item))
            } else if (typeof item === 'number') {
              result.push(item)
            }
          })
          return result
        }

        // Flatten and sum operands if they're arrays
        if (Array.isArray(operand1)) {
          const flattened = flattenDeep(operand1)
          operand1 = flattened.reduce((sum, val) => sum + val, 0)
        }

        if (Array.isArray(operand2)) {
          const flattened = flattenDeep(operand2)
          operand2 = flattened.reduce((sum, val) => sum + val, 0)
        }

        return this.performOperation(
          syntax.method,
          operand1 as number,
          operand2 as number
        )
      }
    }

    return [0]
  }

  performOperation(
    operation: OPERATIONS,
    operandOne: number | number[],
    operandTwo: number | number[]
  ): number[] {
    // Ensure we're working with numbers
    let op1 = operandOne
    let op2 = operandTwo

    // Handle array operands
    if (Array.isArray(op1)) {
      op1 = op1.reduce((total, value) => total + value, 0)
    } else if (typeof op1 !== 'number') {
      op1 = Number(op1) || 0
    }

    if (Array.isArray(op2)) {
      op2 = op2.reduce((total, value) => total + value, 0)
    } else if (typeof op2 !== 'number') {
      op2 = Number(op2) || 0
    }

    switch (operation) {
      case OPERATIONS.ADD:
        return [op1 + op2]
      case OPERATIONS.SUBTRACT:
        return [op1 - op2]
      case OPERATIONS.MULTIPLY:
        return [op1 * op2]
      case OPERATIONS.DIVIDE:
        return [op1 / op2]
      default:
        return [op1] // Default to just returning the first operand
    }
  }

  numerate(node: NumberNode | VariableNode): unknown {
    switch (node.type) {
      case NodeType.VARIABLE: {
        const variableName = node.value?.toString().substring(1)

        if (typeof variableName !== 'undefined') {
          if (typeof this.variables[variableName] !== 'undefined') {
            return [this.variables[variableName]]
          }

          throw new Error(`Variable "${variableName}" is not defined`)
        }

        throw new Error('Invalid variable name')
      }
      case NodeType.NUMBER:
      default:
        return [node.value]
    }
  }

  /**
   * Process a method node by executing its parameters and applying the appropriate function
   * @param {MethodNode} node The method node to process
   * @returns {Array} The results of the method call
   */
  useMethod(node: MethodNode): number[][] {
    const parameters = this.execute(node.parameters)

    if (node.value !== null && Array.isArray(parameters)) {
      // Each parameter might be a single number or an array of numbers
      // Make sure each parameter is an array before spreading
      const processedParams = parameters.map((param) =>
        Array.isArray(param) ? param : [param as number]
      ) as number[][]

      // Apply the function with all parameters
      // @ts-ignore - We know this is valid based on our function definitions
      const result = this.functions[node.value.toString()](...processedParams)

      // Make sure we return as number[][]
      if (Array.isArray(result)) {
        return [result]
      } else {
        return [[result]]
      }
    }

    return []
  }

  execute(syntax: D20Node[]): unknown[] {
    return syntax.map((node) => {
      switch (node.type) {
        case NodeType.ROLL:
          return this.rollDie(node as RollNode)
        case NodeType.METHOD:
          const result = this.useMethod(node as MethodNode)
          return result
        case NodeType.NUMBER:
          return this.numerate(node as NumberNode)
        case NodeType.VARIABLE:
          return this.numerate(node as VariableNode)
        case NodeType.OPERATOR:
          return this.operate(node as OperatorNode)
        default:
          return node.value
      }
    })
  }

  /**
   * See if the provided roll is in the roll map
   * @param {String} action The name and/or path of the action to roll
   * @returns {String}
   * @example this.checkRollMap('test') || this.checkRollMap('test.action')
   */
  checkRollMap(action: RollerRollNotation): RollerRollNotation {
    // in case we were given an action with a nested path
    // we'll want to split that path into its parts and resolve it
    const actionMapPathArray = action.split('.')

    // by default we'll be searching this.map for the provided path
    let currentPath: Record<string, unknown> | unknown = this.map

    // iterate through every part of the path and ensure we can resolve it
    // we use an every() here so we can short-circuit out if the path can't be resolved
    actionMapPathArray.every((path) => {
      if (
        typeof currentPath !== 'undefined' &&
        Object.prototype.hasOwnProperty.call(currentPath, path)
      ) {
        currentPath = (currentPath as Record<string, unknown>)[path]

        return true
      }

      currentPath = false

      return false
    })

    if (currentPath !== false && typeof currentPath === 'string') {
      return currentPath
    }

    // Check if this looks like a named roll but wasn't found in the map
    if (
      action.includes('.') || // If it has a dot notation like "xbow.hit"
      (actionMapPathArray.length === 1 && // If it's a simple name
        !/\d|[+\-*/()]/.test(action)) // And doesn't contain numbers or operators
    ) {
      throw new Error(`Roll mapping "${action}" is not defined`)
    }

    // if we didn't find a path that could be resolved, we'll just return the provided String
    // this likely means we weren't given an action path, but just regular roll notation
    return action
  }

  /**
   * Rolls a single die and returns the result
   * @param {Number} [dieSize=this.options.defaultMaxRoll] Number of sides on the die to roll
   * @returns {Number}
   */
  rollDie(node: RollNode): number[] {
    const rolls: number[] = []

    let dieSize = node.die

    if (typeof node.die !== 'number') {
      if (dieSize === FATE_DIE_SIZE_STRING) {
        dieSize = FATE_DIE_SIZE_INT
      } else {
        console.error('Unexpected die size')
        throw new Error(
          `Roller cannot roll ${dieSize} dice. Pleae check your syntax and try again.`
        )
      }
    }

    for (let roll = 0; roll < node.dice; roll++) {
      const thisRoll = this.generateRoll(
        this.options.defaultMinRoll,
        dieSize as number
      )
      rolls.push(thisRoll)

      this.rolls.push({
        [`${node.dice}d${node.die}: ${this.rolls.length}`]: thisRoll,
      })
    }

    return rolls
  }

  /**
   * Gets random bytes from relevant crypto source
   * @returns {Number}
   */
  getRandomValue(): number {
    // basic idea here was borrowed from:
    // http://dimitri.xyz/random-ints-from-random-bits/
    if (typeof crypto !== 'undefined') {
      if (typeof crypto?.randomBytes !== 'undefined') {
        return crypto.randomBytes(4).readUInt32LE(0)
      } else if (typeof crypto?.getRandomValues !== 'undefined') {
        return crypto.getRandomValues(new Uint32Array(1))[0]
      } else {
        return Math.floor(Math.random() * (MAX_RANGE - 1) + 1)
      }
    } else {
      return Math.floor(Math.random() * (MAX_RANGE - 1) + 1)
    }
  }

  /**
   * Convert random bytes to a die roll between two Integers
   * @param {Number} [minRoll=this.options.defaultMinRoll] Mimimum number to roll
   * @param {Number} [maxRoll=this.options.defaultMaxRoll] Maximum number to roll
   * @returns {Number}
   */
  generateRoll(
    minRoll = this.options.defaultMinRoll,
    maxRoll = this.options.defaultMaxRoll
  ): number {
    // much of this code was borrowed from:
    // http://dimitri.xyz/random-ints-from-random-bits/
    let random = this.getRandomValue()

    const min = Math.ceil(minRoll)
    const max = Math.ceil(maxRoll)

    const range = max - min + 1

    let counter = 0

    while (!(random < Math.floor(MAX_RANGE / range) * range)) {
      random = this.getRandomValue()

      if (counter >= MAX_ITERATIONS) {
        console.warn(
          'Roller iterated too many times trying to ensure randomness'
        )

        break
      }

      counter++
    }

    return min + (random % range)
  }
}
