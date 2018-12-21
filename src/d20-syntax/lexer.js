module.exports = (syntaxString) => {
  // these are the built-in methods our simple d20 language supports
  const AVAILABLE_METHODS = [
    'max',
    'min',
    'avg',
    'drop',
    'sum',
    'count',
  ];

  // this are the basic mathematic operators our d20 language supports
  const OPERATOR_MAP = {
    '+': 'add',
    '-': 'subtract',
    '*': 'multiply',
    '/': 'divide',
  };

  // syntax for die roll in the form of NdX where N = number of dice and X = size of die
  const rollRegex = /(\d+)d(\d+)/;

  // syntax for mathematical operators
  const mathRegex = /[-+*/]/;

  // syntax for user-defined variables
  const variableRegex = /\$\w+/;

  // syntax for built-in methods
  const methodRegex = new RegExp(`(${AVAILABLE_METHODS.join('|')})\\((.*)+\\)`);

  // syntax for methods we've already parsed
  const foundMethodRegex = /(\w+)#(\d+)/;

  // store any methods we find so we can replace them in the provided String when lexing
  let methods = [];

  // map over nodes in the syntax string and return a lexical definition of each
  const lexMap = (string) => {
    return string
      .split(/\s+/)
      .filter(node => node.length > 0)
      .map((node, index, nodes) => {
        if (node[node.length - 1] === ',') {
          node = node.substr(0, node.length - 1);
        }

        if (foundMethodRegex.test(node)) {
          const [ match, methodName, methodId ] = foundMethodRegex.exec(node);

          return methods[methodId];
        }

        if (!isNaN(node)) {
          return {
            type: 'number',
            value: parseInt(node, 10),
          };
        }

        if (rollRegex.test(node)) {
          const [ match, numberOfDice, dieSize ] = rollRegex.exec(node);

          return {
            type: 'roll',
            value: node,
            die: parseInt(dieSize, 10),
            dice: parseInt(numberOfDice, 10),
          };
        }

        if (mathRegex.test(node)) {
          return {
            type: 'operator',
            value: node,
            method: OPERATOR_MAP[node],
          };
        }

        if (variableRegex.test(node)) {
          return {
            type: 'variable',
            value: node,
          };
        }

        return {
          type: 'other',
          value: node
        };
      })
    ;
  };

  // find defined methods in syntax string and replace them with lexical definitions
  let parseMethods = (syntax) => {
    while (methodRegex.test(syntax)) {
      const foundMethod = methodRegex.exec(syntax);

      const [ match, methodName, methodParameters ] = foundMethod;

      const parameters = parseMethods(methodParameters);

      methods.push({
        type: 'method',
        value: methodName,
        parameters: lexMap(parameters),
      });

      syntax = syntax.replace(match, `fn#${methods.length - 1}`);
    }

    return syntax;
  }

  const resolveOperands = (nodes) => {
    return nodes
      .map((token, index, tokens) => {
        if (token) {
          if (token.type === 'operator') {
            const leftOperand = tokens.slice(index - 1, index)[0];
            const rightOperand = tokens.slice(index + 1, index + 2)[0];

            token.operands = [
              leftOperand,
              rightOperand
            ];

            nodes[index - 1] = null;
            nodes[index + 1] = null;
          } else {
            if (token.parameters) {
              token.parameters = resolveOperands(token.parameters);
            }
          }
        }

        return token;
      })
      .filter((token, index) => nodes[index] !== null)
    ;
  }

  let syntax = parseMethods(syntaxString);

  const body = lexMap(syntax);

  const formattedBody = resolveOperands(body);

  const AST = {
    type: 'd20',
    body: formattedBody,
  };

  return AST;
};
