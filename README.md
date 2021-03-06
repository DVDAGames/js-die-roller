# Roller

Simple, intuitive die rolling in a JavaScript Class with better random seeding.

**NOTE**: Roller is currently in a Beta state and should be used with that in mind.
Please file an [Issue](https://github.com/DVDAGames/js-die-roller/issues) for any
bugs you discover.

## Why another die rolling implementation?

I found a lot of other die rolling libraries lacking in features and unable to
explain how their random numbers were obtained. I wanted to try my hand at making
the kind of program I wanted to use and also at learning a bit more about how
well I could generate random numbers.

## What's different about Roller?

### Basic Features

- **Better Random Values**: Roller attempts to reduces bias and leverages the
`crypto` API to generate it's random rolls
- **Standard Die Notation**: Roller parses and executes almost all standard die
notation, it leverages a light Abstract Syntax Tree (AST) implementation to achieve
this and make it easier to adjust in the future

Roller supports some pretty advanced features along with parsing most standard
die notation (`NdX + B` where `N` is how many dice to roll, `X` is the size of
the die being rolled, and `B` is some other modifier to add to the roll).

Roller attempts to use the `crypto` API to attempt to generate better random
values and then further attempts to reduce bias in the randomly generated values,
based on the great research about
[Generating random integers from random bytes](http://dimitri.xyz/random-ints-from-random-bits/)
from [Dimitri DeFigueiredo Ph.D.](http://dimitri.xyz/about/)

### Advanced Features

- **variables**: You can assign variables to a Roller instance and reference those
variables when performing a roll, for example: `1d20 + $initiative`
- **functions**: You can work with some built-in Roller functions; (*Nested
functions are coming soon!*):
  - `min`: Take the minimum roll from a set of dice rolls: `min(2d20)`
  - `max`: Take the maximum roll from a set of dice rolls: `max(2d20)`
  - `sum`: Calculate the sum of a set of dice rolls: `sum(8d6)`
  - `avg`: Calculate the average of a set of dice rolls: `avg(4d6)`
  - `drop`: Drop the lowest value from a set of dice rolls: `drop(4d6)`
  - `count`: Count the number of times a specific value appears: `count(6, 8d6)`
  - *nesting functions*: You can nest functions to achieve even more advanced
combinations: `sum(drop(4d6))`
- **named rolls**: You can define your own named rolls and call them directly
by name,  for example: `whip: '1d4 + $proficiency'` -> called via `whip`

Roller allows you to basically define a whole character sheet as a set of variables
and a map of functions and then use readable names to call and execute the various
die rolls.

**NOTE**: Complex function nesting with multiple parameters is not currently
supported, but will be available in a future release. For example, the following
pattern *could* be used to generate a character's stat block using a common rolling
methodology, but is not currently supported: `drop(sum(drop(4d6)), sum(drop(4d6)), sum(drop(4d6)), sum(drop(4d6)), sum(drop(4d6)), sum(drop(4d6)), sum(drop(4d6)))`

## Examples

You can check out the example Character implemented in the `examples/demo.js` file
by running `yarn demo` and trying out some of his attacks, saves, and other rolls.

Here are some examples rolls to test:
- `xbow.hit`
- `sacred-flame.dmg`
- `initiative`
- `whip.crit`
