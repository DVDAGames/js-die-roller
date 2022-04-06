import { METHODS } from "../types"

// syntax for die roll in the form of NdX where N = number of dice and X = size of die
export const rollRegex = /(\d+)d(\d+)/

// syntax for mathematical operators
export const mathRegex = /[-+*/]/

// syntax for user-defined variables
export const variableRegex = /\$\w+/

// syntax for built-in methods
export const methodRegex = new RegExp(
  `(${Object.values(METHODS).join("|")})\\((.*)+\\)`
)

// syntax for methods we've already parsed
export const foundMethodRegex = /(\w+)#(\d+)/
