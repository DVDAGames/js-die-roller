const Lexer = require('./lexer');

test('Parse Standard Die Notation', () => {
  expect(Lexer('1d20 + 4')).toEqual([{"type": "roll", "value": "1d20"}, {"type": "math", "value":"+"}, {"type": "number", "value": 4}]);
});

test('Parse Die Notation w/ Variable', () => {
  expect(Lexer('1d20 + $initiative')).toEqual([{"type": "roll", "value": "1d20"}, {"type": "math", "value":"+"}, {"type": "variable", "value": "$initiative"}]);
});

test('Parse Die Notation w/ Function & Variable', () => {
  expect(Lexer('max(1d20 + $initiative)')).toEqual([{"type": "method", "value": "max", parameters: [{"type": "roll", "value": "1d20"}, {"type": "math", "value":"+"}, {"type": "variable", "value": "$initiative"}]}]);
});

test('Parse Die Notation w/ Nested Functions', () => {
  expect(Lexer('max(drop(4d6))')).toEqual([
    {
      "type": "method",
      "value": "max",
      parameters: [
        {
          "type": "method",
          "value": "drop", 
          "parameters": [
            {
              "type": "roll",
              "value": "4d6"
            }
          ],
        }
      ],
    }
  ]);
});
