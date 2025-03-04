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
} from './utils/d20/types'

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
     * Simple method for returning the maximum value from an Array of rolls
     * @param {...Number} rolls Any number of rolled values
     * @returns {Number}
     * @memberof Roller.functions
     */
    max: (...rolls: number[][]): number => {
      return Math.max(...rolls.flat())
    },

    /**
     * Simple method for returning the minimum value from an Array of rolls
     * @param {...Number} rolls Any number of rolled values
     * @returns {Number}
     * @memberof Roller.functions
     */
    min: (...rolls: number[][]): number => {
      return Math.min(...rolls.flat())
    },

    /**
     * Simple method for returning the average value from an Array of rolls
     * @param {...Number} rolls Any number of rolled values
     * @returns {Number}
     * @memberof Roller.functions
     */
    avg: (...rolls: number[][]): number[] => {
      return rolls.map((set) =>
        Math.floor(
          set.reduce((total, roll) => total + roll, 0) / rolls[0].length
        )
      )
    },

    /**
     * Simple method for dropping the lowest value from an Array of rolls
     * @param {...Number} rolls Any number of rolled values
     * @returns {Array}
     * @memberof Roller.functions
     */
    drop: (...rolls: number[][]): number[] => {
      return this.flattenRolls(
        rolls.map((set) => set.sort((a, z) => z - a).slice(0, set.length - 1))
      )
    },

    /**
     * Simple method for adding values in an Array of rolls
     * @param {...Number} rolls Any number of rolled values
     * @returns {Array}
     * @memberof Roller.functions
     */
    sum: (...rolls: number[][]): number[] => {
      return this.flattenRolls(
        rolls.map((set) => set.reduce((total, current) => total + current, 0))
      )
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

    const roll = this.checkRollMap(notation)

    // Replace variables in the roll notation before executing
    const processedRoll = this.replaceVariables(roll)

    const breakdown = this.rolls

    // Use the processed roll with variables replaced
    const total = this.execute(d20(processedRoll).body)

    // Normalize total to be an array of numbers
    let totalNumbers: number[] = []

    if (Array.isArray(total)) {
      // Check if this is a multi-operation result that needs to be flattened and summed
      if (total.length > 1) {
        // For operations like '1d20 + 3 + 5', we get an array of operation results
        // We need to sum all these values
        const sum = total.reduce((acc: number, val: unknown) => {
          if (Array.isArray(val)) {
            // Sum the array values
            return (
              acc +
              val.reduce((subAcc: number, subVal: unknown) => {
                return subAcc + (typeof subVal === 'number' ? subVal : 0)
              }, 0)
            )
          } else if (typeof val === 'number') {
            return acc + val
          }
          return acc
        }, 0)

        totalNumbers.push(sum)
      } else {
        // Process each item in the array
        total.forEach((item) => {
          if (Array.isArray(item)) {
            // If it's an array, sum it up
            const sum = item.reduce((acc: number, val: unknown) => {
              return acc + (typeof val === 'number' ? val : 0)
            }, 0)
            totalNumbers.push(sum)
          } else if (typeof item === 'number') {
            // If it's a number, add directly
            totalNumbers.push(item)
          }
        })
      }
    } else if (typeof total === 'number') {
      // If it's a single number, wrap in array
      totalNumbers = [total]
    }

    // If there's only one roll, just return it directly
    if (totalNumbers.length === 0) {
      totalNumbers = [0] // Default to 0 if somehow we got no valid numbers
    }

    return {
      total: totalNumbers,
      roll: processedRoll,
      breakdown,
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
        const operand1 = (operands as [number, number])[0]

        const operand2 = (operands as [number, number])[1]

        return this.performOperation(syntax.method, operand1, operand2)
      }
    }

    return [0]
  }

  performOperation(
    operation: OPERATIONS,
    operandOne: number | number[],
    operandTwo: number | number[]
  ): number[] {
    if (Array.isArray(operandOne)) {
      operandOne = operandOne.reduce((total, value) => total + value, 0)
    }

    if (Array.isArray(operandTwo)) {
      operandTwo = operandTwo.reduce((total, value) => total + value, 0)
    }

    switch (operation) {
      case OPERATIONS.ADD:
        return [operandOne + operandTwo]
      case OPERATIONS.SUBTRACT:
        return [operandOne - operandTwo]
      case OPERATIONS.MULTIPLY:
        return [operandOne * operandTwo]
      case OPERATIONS.DIVIDE:
        return [operandOne / operandTwo]
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

  useMethod(node: MethodNode): number[][] {
    const parameters = this.execute(node.parameters)

    if (node.value !== null && Array.isArray(parameters)) {
      // @ts-expect-error figure out why we can't spread here
      return this.functions[node.value.toString()](...parameters)
    }

    return []
  }

  execute(syntax: D20Node[]): unknown[] {
    return syntax.map((definition) => {
      switch (definition.type) {
        case NodeType.OPERATOR:
          return this.operate(definition as OperatorNode)
        case NodeType.ROLL:
          return this.rollDie(definition as RollNode)
        case NodeType.METHOD:
          return this.useMethod(definition as MethodNode)
        case NodeType.NUMBER:
        case NodeType.VARIABLE:
        default:
          return this.numerate(definition as VariableNode | NumberNode)
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

    for (let roll = 0; roll < node.dice; roll++) {
      const thisRoll = this.generateRoll(this.options.defaultMinRoll, node.die)

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
