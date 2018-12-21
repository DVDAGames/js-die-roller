const d20Lexer = require('./lexer');

test('Parse Standard Die Notation', () => {
  expect(d20Lexer('1d20 + 4')).toEqual({
    type: 'd20',
    'body': [
      {
        "type": "operator",
        "value":"+",
        "method": "add",
        "operands": [
          {
            "type": "roll",
            "value": "1d20",
            "die": 20,
            "dice": 1
          },
          {
            "type": "number",
            "value": 4
          }
        ]
      }
    ]
  });
});

test('Parse Die Notation w/ Variable', () => {
  expect(d20Lexer('1d20 + $initiative')).toEqual({
    type: 'd20',
    body: [
      {
        "type": "operator",
        "value":"+",
        "method": "add",
        "operands": [
          {
            "type": "roll",
            "value": "1d20",
            "die": 20,
            "dice": 1
          },
          {
            "type": "variable",
            "value": "$initiative"
          }
        ]
      }
    ]
  });
});

test('Parse Die Notation w/ Function & Variable', () => {
  expect(d20Lexer('max(1d20 + $initiative)')).toEqual({
    type: 'd20',
    body: [
      {
        "type": "method",
        "value": "max",
        parameters: [
          {
            "type": "operator",
            "value":"+",
            "method": "add",
            "operands": [
              {
                "type": "roll",
                "value": "1d20",
                "die": 20,
                "dice": 1
              },
              {
                "type": "variable",
                "value": "$initiative"
              }
            ]
          }
        ]
      }
    ]
  });
});

test('Parse Die Notation w/ Nested Functions', () => {
  expect(d20Lexer('max(drop(4d6))')).toEqual({
    type: 'd20',
    body: [
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
                "value": "4d6",
                "die": 6,
                "dice": 4
              },
            ],
          }
        ],
      }
    ]
  });
});
