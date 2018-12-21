const d20Syntax = require('./d20-syntax');

let crypto;

// use Node or Browser crypto as necessary
if (require && module) {
  crypto = require('crypto');
} else {
  crypto = window.crypto || window.msCrypto || {};
}

/**
 * Maximum number of times to check for valid random data
 * @type {Number}
 * @const
 */
const MAX_ITERATIONS = 100;

/**
 * Maximum range for random data
 * @type {Number}
 * @const
 */
const MAX_RANGE = 4294967296;

/**
 * Default configuration options for Roller class
 * @type {Object}
 * @const
 */
const DEFAULT_OPTIONS = {
  defaultMinRoll: 1,
  defaultMaxRoll: 20,
  defaultRoll: '1d20',
};

/**
 * Handles rolling of dice using Standard AdX notation
 * @class Roller
 */
class Roller {
  /**
   * Instantiates a new Roller
   * @param {Object} [config={}] configuration Object for Roller class
   * @returns {Object}
   * @constructor
   */
  constructor(config = {}) {
    // polymorphic handing of Roller to allow user to just pass a simple die
    // notation and receive a result as this.result
    if (typeof config === 'string') {
      this.result = this.roll(config);

      return this;
    }

    // get relevant configuration properties so we can extend our defaults and
    // store our roll map
    const { map, options, variables } = config;

    /**
     * Options for various Roller functionality
     * @desc extend defaults with provided options
     * @type {Object}
     */
    this.options = Object.assign({}, DEFAULT_OPTIONS, options);

    /**
     * Object mapping roll notation Strings to convenient names
     * @desc store roll map Object for this Roller instance
     * @type {Object}
     */
    this.map = map || {};

    /**
     * Object containing a map of variables and their values for use in notation
     * @desc store variables Object for this Roller instance
     * @type {Object}
     */
    this.variables = variables || {};

    /**
     * Object containing convenience functions that can be used in roll notation
     * @type {Object}
     */
    this.functions = {
      /**
       * Simple method for returning the maximum value from an Array of rolls
       * @param {...Number} rolls Any number of rolled values
       * @returns {Number}
       * @memberof Roller.functions
       */
      max: (...rolls) => {
        return Math.max(...rolls[0]);
      },

      /**
       * Simple method for returning the minimum value from an Array of rolls
       * @param {...Number} rolls Any number of rolled values
       * @returns {Number}
       * @memberof Roller.functions
       */
      min: (...rolls) => {
        return Math.min(...rolls[0]);
      },

      /**
       * Simple method for returning the average value from an Array of rolls
       * @param {...Number} rolls Any number of rolled values
       * @returns {Number}
       * @memberof Roller.functions
       */
      avg: (...rolls) => {
        return Math.floor(rolls.reduce((total, roll) => total + roll, 0) / rolls.length);
      },

      /**
       * Simple method for dropping the lowest value from an Array of rolls
       * @param {...Number} rolls Any number of rolled values
       * @returns {Array}
       * @memberof Roller.functions
       */
      drop: (...rolls) => {
        return rolls[0].sort((a, b) => b - a).slice(0, rolls[0].length - 1);
      },

      /**
       * Simple method for add values in an Array of rolls
       * @param {...Number} rolls Any number of rolled values
       * @returns {Number}
       * @memberof Roller.functions
       */
      sum: (...rolls) => {
        return rolls[0].reduce((total, current) => total + current, 0);
      }
    };
  }

  /**
   * Allows user to pass standard die notation and receive rolled result
   * @desc Can accept simple (1d20) or complex (2d8 + 2) strings
   * @param {String} [notation=this.options.defaultRoll] what should we roll
   * @returns {Number}
   */
  roll(notation) {
    this.rolls = [];

    const roll = this.checkRollMap(notation);

    const breakdown = this.rolls;

    let total = this.execute(d20Syntax(roll).body);

    if (Array.isArray(total)) {
      if (total.length > 1) {
        total = this.functions.sum(...total);
      } else {
        total = total[0];
      }
    }

    return {
      total,
      roll,
      breakdown,
    };
  }

  operate(syntax) {
    const operands = this.execute(syntax.operands);

    const operand1 = operands[0];

    const operand2 = operands[1];

    return this.performOperation(syntax.method, operand1, operand2);
  }

  performOperation(method, operandOne, operandTwo) {
    if (Array.isArray(operandOne)) {
      operandOne = operandOne.reduce((total, value) => total + value, 0);
    }

    if (Array.isArray(operandTwo)) {
      operandTwo = operandTwo.reduce((total, value) => total + value, 0);
    }

    switch (method) {
      case 'add':
        return operandOne + operandTwo;
      case 'subtract':
        return operandOne - operandTwo;
      case 'multiply':
        return operandOne * operandTwo;
      case 'divide':
        return operandOne / operandTwo;
    }
  }

  numerate(syntax) {
    switch (syntax.type) {
      case 'variable':
        return this.variables[syntax.value];
      case 'number':
      default:
        return syntax.value;
    }
  }

  useMethod(syntax) {
    const parameters = this.execute(syntax.parameters);

    return this.functions[syntax.value](...parameters);
  }

  execute(syntax) {
    return syntax.map((definition) => {
      switch (definition.type) {
        case 'operator':
          return this.operate(definition);
        case 'roll':
          return this.rollDie(definition);
        case 'method':
          return this.useMethod(definition);
        case 'number':
        case 'variable':
        default:
          return this.numerate(definition);
      }
    });
  }

  /**
   * See if the provided roll is in the roll map
   * @param {String} action The name and/or path of the action to roll
   * @returns {String}
   * @example this.checkRollMap('test') || this.checkRollMap('test.action')
   */
  checkRollMap(action) {
    // in case we were given an action with a nested path
    // we'll want to split that path into its parts and resolve it
    const actionMapPathArray = action.split('.');

    // by default we'll be searching this.map for the provided path
    let currentPath = this.map;

    // iterate through every part of the path and ensure we can resolve it
    // we use an every() here so we can short-circuit out if the path can't be resolved
    actionMapPathArray.every((path) => {
      if (currentPath.hasOwnProperty(path)) {
        currentPath = currentPath[path];

        return true;
      }

      currentPath = false;

      return false;
    });

    // if we didn't find a path that could be resolved, we'll just return the provided String
    // this likely means we weren't given an action path, but just regular roll notation
    return currentPath || action;
  }

  /**
   * Rolls a single die and returns the result
   * @param {Number} [dieSize=this.options.defaultMaxRoll] Number of sides on the die to roll
   * @returns {Number}
   */
  rollDie(syntax) {
    const rolls = [];

    for(let roll = 0; roll < syntax.dice; roll++) {
      const thisRoll = this.generateRoll(this.options.defaultMinRoll, syntax.die);

      rolls.push(thisRoll);

      this.rolls.push({
        [`${syntax.dice}d${syntax.die}: ${roll + 1}`]: thisRoll,
      });
    }

    return rolls;
  }

  /**
   * Gets random bytes from relevant crypto source
   * @returns {Number}
   */
  getRandomValue() {
    // basic idea here was borrowed from:
    // http://dimitri.xyz/random-ints-from-random-bits/
    if (crypto.randomBytes) {
      return crypto.randomBytes(4).readUInt32LE();
    } else if(crypto.getRandomValues) {
      return crypto.getRandomValues(new Uint32Array(1))[0];
    } else {
      return Math.floor(Math.random() * (MAX_RANGE - 1) + 1);
    }
  }

  /**
   * Convert random bytes to a die roll between two Integers
   * @param {Number} [minRoll=this.options.defaultMinRoll] Mimimum number to roll
   * @param {Number} [maxRoll=this.options.defaultMaxRoll] Maximum number to roll
   * @returns {Number}
   */
  generateRoll(minRoll = this.options.defaultMinRoll, maxRoll = this.options.defaultMaxRoll) {
    // much of this code was borrowed from:
    // http://dimitri.xyz/random-ints-from-random-bits/
    let random = this.getRandomValue();

    const min = Math.ceil(minRoll);
    const max = Math.ceil(maxRoll);

    const range = max - min + 1;

    let counter = 0;

    while (!(random < Math.floor(MAX_RANGE / range) * range)) {
      random = this.getRandomValue();

      if (counter >= MAX_ITERATIONS) {
        console.warn('Roller iterated too many times trying to ensure randomness');

        break;
      }

      counter++;
    }

    return min + random % range;
  }
}

module.exports = Roller;
