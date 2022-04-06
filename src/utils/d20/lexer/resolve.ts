import { D20Node, NodeType, OperatorNode, MethodNode } from "../types"

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
          typeof (node as MethodNode)?.parameters !== "undefined"
        ) {
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
