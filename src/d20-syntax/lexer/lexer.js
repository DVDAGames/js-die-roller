module.exports = (syntaxString) => {
  const AVAILABLE_METHODS = [
    'max',
    'min',
    'avg',
    'drop',
    'sum',
  ];

  const rollRegex = /\w\d*?d\d?\w/;
  const mathRegex = /[-+*/]/;
  const variableRegex = /\$\w+/;
  const methodRegex = new RegExp(`(${AVAILABLE_METHODS.join('|')})\\((.*)+\\)`);
  const foundMethodRegex = /(\w+)#(\d+)/;

  let methods = [];

  const lexMap = (string) => {
    return string
      .split(/\s+/)
      .filter(node => node.length > 0)
      .map((node) => {
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
          return {
            type: 'roll',
            value: node,
          }
        }

        if (mathRegex.test(node)) {
          return {
            type: 'math',
            value: node,
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

  let syntax = syntaxString;

  syntax = parseMethods(syntax);

  return lexMap(syntax);
};
