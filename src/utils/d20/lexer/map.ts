import getOperation from '../utils/getOperation'

import {
  foundMethodRegex,
  rollRegex,
  mathRegex,
  variableRegex,
} from '../constants/expressions'

import { D20Node, NodeType, MethodNode } from '../types'
import { FATE_DIE_SIZE_STRING } from '../constants'
import { FATE_DIE_SIZE_INT } from '../constants'

// map over nodes in the syntax string and return a lexical definition of each
const map = (syntax = '', methods: MethodNode[] = []): D20Node[] => {
  return syntax
    .split(/\s+/)
    .filter((node) => node.length > 0)
    .map((node) => {
      // clear trailing commas
      if (node[node.length - 1] === ',') {
        node = node.substr(0, node.length - 1)
      }

      if (foundMethodRegex.test(node)) {
        const methodMatch = foundMethodRegex.exec(node)

        if (methodMatch !== null) {
          const [, , methodId] = methodMatch

          return methods[parseInt(methodId, 10)]
        }
      }

      if (!isNaN(Number(node))) {
        return {
          type: NodeType.NUMBER,
          value: parseInt(node, 10),
        }
      }

      if (rollRegex.test(node)) {
        const rollMatch = rollRegex.exec(node)

        if (rollMatch !== null) {
          const [, numberOfDice, dieSize] = rollMatch

          let parsedDieSize = parseInt(dieSize, 10)

          if (Number.isNaN(parsedDieSize)) {
            if (dieSize !== FATE_DIE_SIZE_STRING) {
              console.error('BAD DIE SIZE')

              throw new Error(
                `Roller cannot roll ${dieSize} dice. Pleae check your syntax and try again.`
              )
            }
          }

          return {
            type: NodeType.ROLL,
            value: node,
            die: Number.isNaN(parsedDieSize) ? dieSize : parsedDieSize,
            dice: parseInt(numberOfDice, 10),
          }
        }
      }

      if (mathRegex.test(node)) {
        return {
          type: NodeType.OPERATOR,
          value: node,
          method: getOperation(node),
        }
      }

      if (variableRegex.test(node)) {
        return {
          type: NodeType.VARIABLE,
          value: node,
        }
      }

      return {
        type: NodeType.OTHER,
        value: node,
      }
    })
}

export default map
