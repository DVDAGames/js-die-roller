import { FATE_DIE_SIZE_STRING } from './constants'

// these are the built-in methods our simple d20 language supports
export enum METHODS {
  MAX = 'max',
  MIN = 'min',
  AVG = 'avg',
  DROP = 'drop',
  SUM = 'sum',
  COUNT = 'count',
}

// these are the basic mathematic operators our d20 language supports
export enum OPERATORS {
  ADD = '+',
  SUBTRACT = '-',
  MULTIPLY = '*',
  DIVIDE = '/',
}

// these are the operation names our operators will convert to in the AST
export enum OPERATIONS {
  ADD = 'add',
  SUBTRACT = 'subtract',
  MULTIPLY = 'multiply',
  DIVIDE = 'divide',
}

export enum NodeType {
  METHOD = 'method',
  VARIABLE = 'variable',
  OPERATOR = 'operator',
  ROLL = 'roll',
  NUMBER = 'number',
  OTHER = 'other',
  ROOT = 'd20',
}

export type NodeValue = string | number | null

export type DieSize = number | typeof FATE_DIE_SIZE_STRING

export interface RootNode {
  type: NodeType.ROOT
  body: D20Node[]
}

export interface GenericNode {
  type: NodeType
  value: NodeValue
}

export interface MethodNode extends GenericNode {
  type: NodeType.METHOD
  parameters: D20Node[]
}

export interface VariableNode extends GenericNode {
  type: NodeType.VARIABLE
}

export interface OperatorNode extends GenericNode {
  type: NodeType.OPERATOR
  method: OPERATIONS
  operands?: [D20Node, D20Node]
}

export interface RollNode extends GenericNode {
  type: NodeType.ROLL
  die: DieSize
  dice: number
}

export interface NumberNode extends GenericNode {
  type: NodeType.NUMBER
  value: number
}

export type D20Node =
  | MethodNode
  | VariableNode
  | OperatorNode
  | RollNode
  | NumberNode
  | GenericNode
