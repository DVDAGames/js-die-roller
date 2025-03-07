import parse from './parse'

import map from './map'

import resolve from './resolve'

import { D20Node, MethodNode } from '../types'

const lex = (source = ''): D20Node[] => {
  const methods: MethodNode[] = []

  const syntax = parse(source, methods)

  const body = map(syntax, methods)

  const nodes = resolve(body)

  if (nodes.length === 0) {
    throw new Error(
      `Roller cannot roll ${source}. Please check your syntax and try again.`
    )
  }

  return nodes
}

export default lex
