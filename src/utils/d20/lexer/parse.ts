import map from "./map"

import { methodRegex } from "../constants/expressions"

import { MethodNode, NodeType } from "../types"

// find defined methods in syntax string and replace them with lexical definitions
const parse = (syntax: string = "", methods: MethodNode[] = []): string => {
  while (methodRegex.test(syntax)) {
    const foundMethod = methodRegex.exec(syntax)

    if (foundMethod !== null) {
      const [match, methodName, methodParameters] = foundMethod

      const parameters = parse(methodParameters, methods)

      methods.push({
        type: NodeType.METHOD,
        value: methodName,
        parameters: map(parameters, methods),
      })

      syntax = syntax.replace(match, `fn#${methods.length - 1}`)
    }
  }

  return syntax
}

export default parse
