import { OPERATIONS, OPERATORS } from "../types"

const getOperation = (operatorString: string): string | null => {
  const operatorType = Object.entries(OPERATORS).find(
    ([_, operator]) => operator === operatorString
  )

  if (typeof operatorType !== "undefined") {
    const [operationKey] = operatorType

    return OPERATIONS[operationKey]
  }

  return null
}

export default getOperation
