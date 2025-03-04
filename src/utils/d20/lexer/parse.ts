import map from './map'

import { methodRegex } from '../constants/expressions'

import { MethodNode, NodeType } from '../types'

/**
 * Finds defined methods in syntax string and replaces them with lexical definitions.
 * Now properly handles comma-separated parameters in method calls.
 * @param syntax The syntax string to parse
 * @param methods Array of method nodes already found
 * @returns The modified syntax string with methods replaced by identifiers
 */
const parse = (syntax = '', methods: MethodNode[] = []): string => {
  while (methodRegex.test(syntax)) {
    const foundMethod = methodRegex.exec(syntax)

    if (foundMethod !== null) {
      const [match, methodName, methodParameters] = foundMethod

      // Parse comma-separated parameters, carefully handling nested method calls
      // by tracking parenthesis depth
      const parsedParams: string[] = []
      let currentParam = ''
      let parenDepth = 0

      for (let i = 0; i < methodParameters.length; i++) {
        const char = methodParameters[i]

        if (char === '(' && i > 0) {
          parenDepth++
          currentParam += char
        } else if (char === ')' && i < methodParameters.length - 1) {
          parenDepth--
          currentParam += char
        } else if (char === ',' && parenDepth === 0) {
          // Only split on commas at the top level
          parsedParams.push(currentParam.trim())
          currentParam = ''
        } else {
          currentParam += char
        }
      }

      // Add the last parameter
      if (currentParam.trim()) {
        parsedParams.push(currentParam.trim())
      }

      // Build the parameters array by parsing each parameter separately
      const parameterNodes = parsedParams
        .map((param) => {
          // Parse nested method calls in this parameter
          const parsedParam = parse(param, methods)
          // Map the parameter to AST nodes
          return map(parsedParam, methods)
        })
        .flat()

      methods.push({
        type: NodeType.METHOD,
        value: methodName,
        parameters: parameterNodes,
      })

      syntax = syntax.replace(match, `fn#${methods.length - 1}`)
    }
  }

  return syntax
}

export default parse
