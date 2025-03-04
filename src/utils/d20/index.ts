import lexer from './lexer'

import { RootNode, NodeType } from './types'

const d20AST = (source = ''): RootNode => ({
  type: NodeType.ROOT,
  body: lexer(source),
})

export default d20AST
