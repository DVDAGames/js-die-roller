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
  rollArrayStart: '[',
  rollArrayEnd: ']',
  resolveRollArrays: false,
};

const AVAILABLE_METHOD_NAMES = [
  'max',
  'min',
  'avg',
];

const max = function max(...rolls) {
  return Math.max(...rolls);
};

const min = function min(...rolls) {
  return Math.min(...rolls);
};

const avg = function avg(...rolls) {
  return Math.floor(rolls.reduce((roll, total) => total + roll ) / rolls.length);
}

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

    this.functions = {
      max,
      min,
      avg
    };
  }

  /**
   * Allows user to pass standard die notation and receive rolled result
   * @desc Can accept simple (1d20) or complex (2d8 + 2) strings
   * @param {String} [notation=this.options.defaultRoll] what should we roll
   * @returns {Number}
   * @memberof Roller
   */
  roll(notation = this.options.defaultRoll) {
    return this.calculateRoll(this.parseNotation(notation));
  }

  calculateRoll(sequence) {
    const unresolvedVariableRegEx = /(\s?.?\s?\{\w*?\}\s?.?\s?\s?)/gm;

    let foundVariables;

    let manipulatedSequence = sequence;

    const parsedRoll = [];

    let lastIndex = 0;

    while (foundVariables = unresolvedVariableRegEx.exec(manipulatedSequence, lastIndex)) {
      if (foundVariables.index !== 0) {
        parsedRoll.push(manipulatedSequence.substr(lastIndex, foundVariables.index - lastIndex));
      }

      lastIndex = unresolvedVariableRegEx.lastIndex;

      parsedRoll.push(foundVariables[0]);
    }

    if (!parsedRoll.length) {
      parsedRoll.push(sequence);
    }

    const resolvedRoll = parsedRoll.map((item) => {
      let returnValue;

      try {
        returnValue = eval(item);
      } catch(e) {
        returnValue = item;
      }

      return returnValue;
    });

    return {
      value: resolvedRoll.join(''),
      sequence: parsedRoll.join(''),
    };
  }

  /**
   * Parse Roller die notation String
   * @param {String} [notation=this.options.defaultRoll] die notation to parse
   */
  parseNotation(notation) {
    const notationWithVarsReplaced = this.findAndReplaceVariables(notation);

    const notationWithRollsReplaced = this.findAndReplaceRolls(notationWithVarsReplaced);

    const notationWithFunctionsReplaced = this.findAndReplaceFunctions(notationWithRollsReplaced);

    return notationWithFunctionsReplaced;
  }

  findAndReplaceRolls(notation) {
    const rollRegex = /\w\d*?d\d?\w/gm;

    const foundRolls = notation.match(rollRegex);

    let replacedRolls = notation;

    foundRolls.forEach((roll) => {
      const [ numberOfRolls, dieSize ] = roll.split('d');

      const rolls = [];

      for (let i = 0; i < numberOfRolls; i++) {
        rolls.push(this.rollDie(dieSize));
      }

      replacedRolls = replacedRolls.replace(roll, this.formatRolls(rolls));
    });

    return replacedRolls;
  }

  formatRolls(rollArray) {
    if (rollArray.length > 1) {
      return `${this.options.rollArrayStart}${rollArray.toString()}${this.options.rollArrayEnd}`
    }

    return `${rollArray.toString()}`;
  }

  findAndReplaceVariables(notation) {
    const variableRegEx = /{.*?}/gm;

    const foundVariables = notation.match(variableRegEx);

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
      }
    });

    return replacedVariables;
  }

  findAndReplaceFunctions(notation) {
    const functionRegEx = new RegExp(`(${AVAILABLE_METHOD_NAMES.join('|')})\\((.*?)\\)`, 'gm');

    let replacedFunctions = notation;

    let foundFunctions;

    while(foundFunctions = functionRegEx.exec(notation)) {
      const [ replacingString, method, args ] = foundFunctions;

      const array = JSON.parse(args);

      if (this.functions[method]) {
        replacedFunctions = replacedFunctions.replace(replacingString, this.functions[method].apply(null, array));
      }
    }

    return replacedFunctions;
  }

  /**
   * Rolls a single die and returns the result
   * @param {Number} [maxRoll=this.options.defaultMaxRoll] number of sides on the die to roll
   * @returns {Number}
   * @memberof Roller
   */
  rollDie(dieSize = this.options.defaultMaxRoll) {
    return this.generateRoll(this.options.defaultMinRoll, dieSize);
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

const test = new Roller({
  variables: {
    initiative: 5,
  },
});

console.log(test.roll('{initiative} + 1d20 + {initiative} + max(2d8) - min(3d4) * avg(2d6)'));

console.log(test.roll('{test1} + {initiative} + 1d20 / {test2} + {initiative} + max(2d8) - min(3d4) * avg(2d6) - {test3}'));

console.log(test.roll('1d20 + {initiative}'));