# Roller

Simple, intuitive die rolling in a JavaScript Class with better random seeding
for all of your Tabletop Roleplaying Game (TTRPG) needs.

**NOTE**: Roller is currently in a Beta state and should be used with that in
mind. Please file an [Issue](https://github.com/DVDAGames/js-die-roller/issues)
for any bugs you discover.

## Getting Started

Install the Roller library from npm:

```sh
npm install --save @dvdagames/js-die-roller
```

Import the Roller class and start slinging some dice:

```ts
import Roller, type { RollerDieNotation } from '@dvdagames/js-die-roller'

const dice = new Roller()

dice.roll('1d20');
```

### Basic Rolls

Roller supports basic rolling of dice of **any** size, can perform basic
arithmetic with modifiers, and comes with out of the box support for several
common TTRPG functions.

```ts
const d20 = () => dice.roll('1d20').result

const magicMissiles = () => dice.roll('3d4 + 1').result

const rollForStat = () => dice.roll('drop(4d6)').result

const advantage = () => dice.roll('max(2d20)').result

const disadvantage = () => dice.roll('min(2d20)').result

const fireball = () => dice.roll('8d6').result

const successes = () => dice.roll('count(6, 6d6)').result

const damage = (dieSize, numberOfDice, modifier) =>
  dice.roll(`sum(${numberOfDice}${dieSize} + ${modifier})`).result

const average = (dieSize: RollerDieNotation, numberOfDice = 1) =>
  dice.roll(`avg(${numberOfDice}${dieSize})`).result
```

**Note**: Roller comes with support for the standard array of TTRPG dice ()`d4`,
`d6`, `d8`, `d10`, `d12`, & `d20`), as well as support for any arbitrary number
prefixed with `d`, like `d2` for a coin flip or `d37` for whatever reason you
might need it.

### Functions

Roller comes loaded with several utility functions:

- `min`: Take the minimum roll from a set of dice rolls: `min(2d20)`
- `max`: Take the maximum roll from a set of dice rolls: `max(2d20)`
- `sum`: Calculate the sum of a set of dice rolls: `sum(8d6)`
- `avg`: Calculate the average of a set of dice rolls: `avg(4d6)`
- `drop`: Drop the lowest value from a set of dice rolls: `drop(4d6)`
- `count`: Count the number of times a specific value appears: `count(6, 8d6)`
- `fate`: **COMING SOON** Roll fate dice

### Constructor Overloading

You can also roll from the `Roller()` constructor directly if you won't need to
reuse the Roller instance:

```ts
const roll = new Roller('1d20').result
```

### Advanced Interface

You can also use the `Roller()` constructor to generate an advanced interface
for a Tabletop Roleplaying Game (TTRPG) character or game mechanics by defining
variables and named rolls.

Let's see an exmaple of creating a Level 1 Fighter (DnD Fifth Edition) from
scratch:

```ts
const statsGenerator = new Roller();

// our character's stats
const statNames = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']

// roll 4d6 drop the lowest to get a stat
const stat = () => statsGenerator.roll('drop(4d6)').result

// roll 7 stats
const statRolls = Array(statNames.length + 1).fill().map(() => stat().total[0]).sort()

// drop the lowest roll
statRolls.pop()

// get map value Array to stats
const stats = statRolls.reduce((statsObject, statValue, index) => {
  statsObject[index] = statValue
}, {})

// dnd5e stat modifiers are floor((STAT - 10) / 2)
const calculateModifier = (stat: number): number => Math.floor((stat - 10) / 2)

const Fighter = new Roller({
  variables: {
    level: 1,
    proficiency: 2,
    ...statsObject,
    strMod: calculateModifer(statsObject.STR),
    dexMod: calculateModifer(statsObject.DEX),
    conMod: calculateModifer(statsObject.CON),
    intMod: calculateModifer(statsObject.INT),
    wisMod: calculateModifer(statsObject.WIS),
    chaMod: calculateModifer(statsObject.CHA),
  },
  map: {
    // when we use a variable in our roll, we always prefix it
    // with a `$` so Roller knows to look it up in the variables object
    initiative: '1d20 + $dexMod',
    longsword: {
      hit: '1d20 + $strMod + $proficiency',
      dmg: {
        '1h': '1d8 + $strMod',
        '2h': '1d10 + $strMod',
      }
    }
    saves: {
      STR: '1d20 + $strMod + $proficiency',
      DEX: '1d20 + $conMod',
      CON: '1d20 + $conMod + $proficiency',
      INT: '1d20 + $intMod',
      WIS: '1d20 + $wisMod',
      CHA: '1d20 + $chaMod',
    }
  }
})
```

Now we can call the rolls defined in our `map` object directly and Roller will
substitute the necessary variables from our `variables` object, roll the
appropriate dice, and calculate the total for us.

Here are some examples:

```ts
// something came up that we're proficient at, but don't have a specific stat tied to
Fighter.roll('1d20 + $proficiency').result.total[0]

// it's time for some combat; roll initiative
Fighter.roll('initiative').result.total[0]

// let's try to hit the enemy
Fighter.roll('longsword.hit').result.total[0]

// we hit; roll for damage
Fighter.roll('longsword.dmg.2h').result.total[0]

// the enemy druid is trying to entangle us; make a saving throw
Fighter.roll('saves.STR').result.total[0]
```

## Why another die rolling implementation?

I found a lot of other die rolling libraries lacking in features and unable to
explain how their random numbers were obtained. I wanted to try my hand at
making the kind of program I wanted to use and also at learning a bit more about
how well I could generate random numbers.

## What's different about Roller?

### Basic Features

- **Better Random Values**: Roller attempts to reduces bias and leverages the
  `crypto` API to generate it's random rolls
- **Standard Die Notation**: Roller parses and executes almost all standard die
  notation, it leverages a light Abstract Syntax Tree (AST) implementation to
  achieve this and make it easier to adjust in the future

Roller supports some pretty advanced features along with parsing most standard
die notation (`NdX + B` where `N` is how many dice to roll, `X` is the size of
the die being rolled, and `B` is some other modifier to add to the roll).

Roller attempts to use the `crypto` API to attempt to generate better random
values and then further attempts to reduce bias in the randomly generated
values, based on the great research about
[Generating random integers from random bytes](http://dimitri.xyz/random-ints-from-random-bits/)
from [Dimitri DeFigueiredo Ph.D.](http://dimitri.xyz/about/)

### Limitations

Complex function nesting with multiple parameters is not currently supported,
but will be available in a future release. For example, the following pattern
_could_ be used to generate a character's stat block using a common rolling
methodology, but is not currently supported:
`drop(sum(drop(4d6)), sum(drop(4d6)), sum(drop(4d6)), sum(drop(4d6)), sum(drop(4d6)), sum(drop(4d6)), sum(drop(4d6)))`

## Playground

You can check out the example Character implemented in the `examples/demo.js`
file by cloning this repo and running `npm run demo` and trying out some of his
saved rolls and sling some regular dice, too.

Here are some examples rolls to test:

- `xbow.hit`
- `sacred-flame.dmg`
- `initiative`
- `whip.crit`
- `max(2d20)`

## Roll Fairness

This library undergoes extensive statistical testing to ensure fair and random
dice rolls. We use
[chi-square goodness-of-fit](https://www.statology.org/chi-square-goodness-of-fit-test/)
tests to verify that the distribution of results matches theoretical
expectation.

To view detailed statistical analysis:

```
npm run fairness
```

This generates a [`FAIRNESS.md`](./FAIRNESS.md) file with detailed distribution
charts and chi-square test results for all the common die sizes (`d4`, `d6`,
`d8`, `d10`, `d12`, `d20`).
