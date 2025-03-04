import { D20Node, NodeType, OperatorNode, MethodNode } from '../types'

/**
 * Resolves nodes by setting up proper relationships between operators and their operands,
 * and recursively resolving nested method parameters.
 * @param nodes Array of D20Nodes to resolve
 * @returns Resolved array of D20Nodes
 */
const resolve = (nodes: D20Node[]): D20Node[] => {
  return nodes
    .map((node, index, nodes) => {
      if (node) {
        if (node.type === NodeType.OPERATOR) {
          const leftOperand = nodes.slice(index - 1, index)[0]
          const rightOperand = nodes.slice(index + 1, index + 2)[0]

          ;(node as OperatorNode).operands = [leftOperand, rightOperand]

          const nullNode = {
            type: NodeType.OTHER,
            value: null,
          }

          nodes[index - 1] = nullNode
          nodes[index + 1] = nullNode
        } else if (
          node.type === NodeType.METHOD &&
          Array.isArray((node as MethodNode)?.parameters)
        ) {
          // Recursively resolve all parameters within the method
          ;(node as MethodNode).parameters = resolve(
            (node as MethodNode).parameters
          )
        }
      }

      return node
    })
    .filter(
      (_, index) =>
        nodes[index].type !== NodeType.OTHER && nodes[index].value !== null
    )
}

export default resolve
