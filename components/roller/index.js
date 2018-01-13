const uniq = require('lodash.uniq');

const crypto = require('crypto') || window.crypto || window.msCrypto || {};

const MAX_ITERATIONS = 100;

const MAX_RANGE = 4294967296;

const DEFAULT_ROLLS = 1;

const DEFAULT_OPTIONS = {
  defaultMinRoll: 1,
  defaultMaxRoll: 20,
  defaultRoll: '1d20',
  variableStart: '{',
  variableEnd: '}',
  unresolvedVariableStart: '[',
  unresolvedVariableEnd: ']',
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
   * @memberof Roller
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

    // extend defaults with provided options
    this.options = Object.assign({}, DEFAULT_OPTIONS, options);

    // store roll map Object for this Roller instance
    this.map = map;

    // store variables Object for this Roller instance
    this.variables = variables;
  }

  /**
   * Allows user to pass standard die notation and receive rolled result
   * @desc Can accept simple (1d20) or complex (2d8 + 2) strings
   * @param {String} [notation=this.options.defaultRoll] what should we roll
   * @returns {Number}
   * @memberof Roller
   */
  roll(notation = this.options.defaultRoll) {
    return this.parseNotation(notation);
  }

  /**
   * Parse Roller die notation String
   * @param {String} [notation=this.options.defaultRoll] die notation to parse
   */
  parseNotation(notation) {
    const notationWithVarsReplaced = this.findAndReplaceVariables(notation);

    return notationWithVarsReplaced;
  }

  formatVariableName(variable) {

  }

  findAndReplaceVariables(notation) {
    const variableRegex = /{.*?}/gm;

    const foundVariables = notation.match(variableRegex);

    const uniqueVariables = uniq(foundVariables);

    let replacedVariables = notation;

    uniqueVariables.forEach((item) => {
      const variableKey = item
        .replace(this.options.variableStart, '')
        .replace(this.options.variableEnd, '')
      ;

      const replaceRegEx = new RegExp(`${item}`, 'gm');

      if (this.variables[variableKey]) {
        replacedVariables = replacedVariables.replace(replaceRegEx, this.variables[variableKey]);
      } else {
        replacedVariables = replacedVariables.replace(replaceRegEx, `${this.options.unresolvedVariableStart}${variableKey}${this.options.unresolvedVariableEnd}`);
      }
    });

    return replacedVariables;
  }

  /**
   * Rolls a single die and returns the result
   * @param {Number} [maxRoll=this.options.defaultMaxRoll] number of sides on the die to roll
   * @returns {Number}
   * @memberof Roller
   */
  rollDie(maxRoll = this.options.defaultMaxRoll) {
    return this.generateRoll(this.options.defaultMinRoll, maxRoll);
  }

  /**
   * Gets random bytes from relevant crypto source
   * @returns {Number}
   * @memberof Roller
   */
  getRandomValue() {
    if (crypto.randomBytes) {
      return crypto.randomBytes(4).readUInt32LE();
    } else if(crypto.getRandomValues) {
      return crypto.getRandomValues(new Uint32Array(1))[0];
    } else {
      return false;
    }
  }

  /**
   * Convert random bytes to a die roll between two Integers
   * @param {Number} [minRoll=this.options.defaultMinRoll] mimimum number to roll
   * @param {Number} [maxRoll=this.options.defaultMaxRoll] maximum number to roll
   * @returns {Number}
   * @memberof Roller
   */
  generateRoll(minRoll = this.options.defaultMinRoll, maxRoll = this.options.defaultMaxRoll) {
    // much of this code was borrowed from:
    // http://dimitri.xyz/random-ints-from-random-bits/
    let random;

    const min = Math.ceil(minRoll);
    const max = Math.ceil(maxRoll);

    const range = max - min + 1;

    let counter = 0;

    do {
      random = this.getRandomValue();

      if (counter >= MAX_ITERATIONS) {
        console.warn('Roller iterated too many times trying to ensure randomness');

        break;
      }

      counter++;
    } while (!(random < Math.floor(MAX_RANGE / range) * range));

    return min + random % range;
  }
}

const test = new Roller({
  variables: {
    initiative: 5,
  },
});

console.log(test.roll('{initiative} + 1d20 + {initiative} + 2d8 - {test}'))