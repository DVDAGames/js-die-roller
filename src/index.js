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
  variableStart: '{',
  variableEnd: '}',
  rollArrayStart: '[',
  rollArrayEnd: ']',
};

/**
 * Array of available method names for in-notation method calls
 * @type {Array}
 * @const
 */
const AVAILABLE_METHOD_NAMES = [
  'max',
  'min',
  'avg',
  'drop',
  'sum',
];

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
    this.variables = variables;

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
        return Math.max(...rolls);
      },

      /**
       * Simple method for returning the minimum value from an Array of rolls
       * @param {...Number} rolls Any number of rolled values
       * @returns {Number}
       * @memberof Roller.functions
       */
      min: (...rolls) => {
        return Math.min(...rolls);
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
        return rolls.sort((a, b) => b - a).slice(0, rolls.length - 1);
      },

      /**
       * Simple method for add values in an Array of rolls
       * @param {...Number} rolls Any number of rolled values
       * @returns {Number}
       * @memberof Roller.functions
       */
      sum: (...rolls) => {
        return rolls.reduce((total, current) => total + current, 0);
      }
    };
  }

  /**
   * Allows user to pass standard die notation and receive rolled result
   * @desc Can accept simple (1d20) or complex (2d8 + 2) strings
   * @param {String} [notation=this.options.defaultRoll] what should we roll
   * @returns {Number}
   */
  roll(notation = this.options.defaultRoll) {
    this.rolls = [];

    return this.calculateRoll(this.parseNotation(this.checkRollMap(notation)));
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
   * Take a sequence of resolved rolls and variables and calculate the total
   * @param {String} sequence The roll sequence to calculate
   * @returns {Object} Object with calculated roll and breakdown of what was rolled { value: {Number}, breakdown: {String} }
   */
  calculateRoll(sequence) {
    // this RegEx will find strings like {variable} and [1, 2, 3] inside of our 
    // current sequence so that we can pull them out of the String and resolve the
    // simple math that we can resolve
    const unresolvableStringsRegEx = /((\s?.?\s?\{\w*?\}\s?.?\s?\s?)|\s?.?\s?\[.*?\]\s?.?\s?\s?)/gm;

    // this Array will store the individual parts of our breakdown
    const parsedRoll = [];

    // by default we'll start at the first character in the String
    let lastIndex = 0;

    let foundVariables;

    // iterate through the String and check for any matches to our variable and array regex
    while (foundVariables = unresolvableStringsRegEx.exec(sequence, lastIndex)) {
      // if we aren't at the start of the String, we'll clip out whatever
      // exists between the end of our last unresolvable String and the start
      // of our current unresolvable String
      if (foundVariables.index !== 0) {
        parsedRoll.push(sequence.substr(lastIndex, foundVariables.index - lastIndex));
      }

      // reset our lastIndex to start from the end of the previous unresolvable
      // String for the next iteration
      lastIndex = unresolvableStringsRegEx.lastIndex;

      // add the found unresolvable String to our breakdown Array
      parsedRoll.push(foundVariables[0]);
    }

    // if there is anything left in our sequence, add it to the breakdown Array
    if (sequence.substr(lastIndex)) {
      parsedRoll.push(sequence.substr(lastIndex));
    }

    // now that we've got our sequence separated into resolvable and
    // unresolvable parts, we need to process what we can resolve and stich
    // the pieces back together
    const resolvedRoll = parsedRoll.map((item) => {
      let returnValue;

      // we'll see if we can just eval the current part
      // which will work for math sequences like "17 + 3",
      // but won't work for unresolvable pieces like "{Initiative}"
      // or roll Arrays like: "[17, 4, 16]"
      try {
        returnValue = eval(item);
      } catch(e) {
        returnValue = item;
      }

      return returnValue;
    });

    const { rolls } = this;

    // return our calculated roll and a breakdown of what went into that calculation
    return {
      value: resolvedRoll.join(''),
      breakdown: parsedRoll.join(''),
      rolls,
    };
  }

  /**
   * Parse Roller die notation String
   * @param {String} [notation=this.options.defaultRoll] die notation to parse
   * @returns {String}
   */
  parseNotation(notation) {
    // replace variables with values first
    const notationWithVarsReplaced = this.findAndReplaceVariables(notation);

    // replace roll notation, like 1d20, with rolled values second
    const notationWithRollsReplaced = this.findAndReplaceRolls(notationWithVarsReplaced);

    // replace roll Arrays in function calls with the result of the
    // convenience function last
    const notationWithFunctionsReplaced = this.findAndReplaceFunctions(notationWithRollsReplaced);

    return notationWithFunctionsReplaced;
  }

  /**
   * Take a sequence of roll notation and replace rolls with values
   * @param {String} notation The notation for this roll
   * @returns {String}
   */
  findAndReplaceRolls(notation) {
    // this will identify roll notation like 1d20, 2d6, 3d4, etc.
    const rollRegex = /\w\d*?d\d?\w/gm;

    // find all of our the rolls we need to resolve
    const foundRolls = notation.match(rollRegex);

    // generate a new String so we aren't making changes to the function param
    let replacedRolls = notation;

    // iterate through our rolls and resolve them
    foundRolls.forEach((roll) => {
      // get the number of dice to roll and the size of die to use
      const [ numberOfRolls, dieSize ] = roll.split('d');

      const rolls = [];

      // roll the necessary dice
      for (let i = 0; i < numberOfRolls; i++) {
        const rolledValue = this.rollDie(dieSize);

        this.rolls.push({ [roll] : rolledValue });

        rolls.push(rolledValue);
      }

      // replace roll notation in our String with the result of the roll
      replacedRolls = replacedRolls.replace(roll, this.formatRolls(rolls));
    });

    // return roll String with our roll notation replaced with values
    return replacedRolls;
  }

  /**
   * Take a roll sequence and format it if necessary
   * @param {Array} [rollArray=[]] Array of rolled values
   * @returns {String}
   * @example 3d20 -> [17. 4. 11] || 1d20 -> 16
   */
  formatRolls(rollArray = []) {
    // if we only have one role, we'll give the user back a visual
    // Array of roles, like 3d20 -> [17, 4, 11]
    if (rollArray.length > 1) {
      return `${this.options.rollArrayStart}${rollArray.join(', ')}${this.options.rollArrayEnd}`
    }

    return rollArray[0];
  }

  /**
   * Take a sequence of roll notation and replace variables with values
   * @desc if the variable was never provided it will still be a String
   * @param {String} notation Roll notation with included variables
   * @returns {String}
   * @example 1d20 + {init} -> 1d20 + 2 || 1d8 + {unknown} -> 8 + {unknown}
   */
  findAndReplaceVariables(notation) {
    // this will find any variables in the format {variable}
    const variableRegEx = /{.*?}/gm;

    console.log(notation);

    // collect our variables from the notation String
    const foundVariables = notation.match(variableRegEx) || [];

    let replacedVariables = notation;

    foundVariables
      // get rid of any duplicates as we're only need to replace each
      // variable once regardless of how many times it is used in the notation
      .filter((item, index, array) => {
        if (array.indexOf(item) !== index) {
          return false;
        }

        return true;
      })

      // replace variable with it's value
      .forEach((item) => {
        // strip the delimiters from our variable name
        const variableKey = item
          .replace(this.options.variableStart, '')
          .replace(this.options.variableEnd, '')
        ;

        // create a regex for globally replacing this variable
        const replaceRegEx = new RegExp(`${item}`, 'gm');

        // if the variable exists, we'll replace it with the relevant value
        if (this.variables[variableKey]) {
          replacedVariables = replacedVariables.replace(replaceRegEx, this.variables[variableKey]);
        }
      })
    ;

    // return our new String with any resolvable variables replaced with values
    return replacedVariables;
  }

  /**
   * Take a sequence of roll notation and replace roll Array functions with values
   * @param {String} notation Roll notation with included function calls
   * @returns {String}
   */
  findAndReplaceFunctions(notation) {
    // this will find our available convenience functions
    const functionRegEx = new RegExp(`(${AVAILABLE_METHOD_NAMES.join('|')})\\((.*)\\)`, 'gm');

    let replacedFunctions = notation;

    let foundFunctions;

    // iterate through any functions that are found
    while(foundFunctions = functionRegEx.exec(replacedFunctions)) {
      // try to execute calling the desired function
      try {
        let [ replacingString, method, args ] = foundFunctions;

        if (functionRegEx.test(args)) {
          args = this.findAndReplaceFunctions(args);
        }

        // this will give us an actual Array from a String representation
        const array = JSON.parse(args);

        // make sure the function exists before trying to call it
        if (this.functions[method] && typeof this.functions[method] === 'function') {
          replacedFunctions = replacedFunctions.replace(replacingString, this.functions[method].apply(null, array));
        }
      } catch(e) {
        console.error('Roller encountered invalid syntax.');

        break;
      }
    }

    // return our new String with roll Array functions resolved
    return replacedFunctions;
  }

  /**
   * Rolls a single die and returns the result
   * @param {Number} [dieSize=this.options.defaultMaxRoll] Number of sides on the die to roll
   * @returns {Number}
   */
  rollDie(dieSize = this.options.defaultMaxRoll) {
    return this.generateRoll(this.options.defaultMinRoll, dieSize);
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
