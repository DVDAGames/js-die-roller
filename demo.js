const Roller = require('./src/index.js');

const Character = new Roller({
  variables: {
    init: 3,
    prof: 4,
    str: -1,
    dex: 3,
    con: 3,
    int: 0,
    wis: 4,
    cha: -1,
  },
  map: {
    initiative: '1d20 + {init}',
    whip: {
      dmg: '1d4 + {prof}',
      hit: '1d20 + 8',
    },
    xbow: {
      dmg: '1d6 + {prof}',
      hit: '1d20 + 10',
    },
    'guiding-bolt': {
      dmg: '4d6',
      hit: '1d20 + 8',
    },
    'sacred-flame': {
      dmg: '3d8',
    },
    'word-of-radiance': {
      dmg: '3d6',
    },
  },
});

var stdin = process.openStdin();

console.log("What do you want to roll?");

stdin.addListener("data", function(roll) {
  // note:  d is an object, and when converted to a string it will
  // end with a linefeed.  so we (rather crudely) account for that  
  // with toString() and then trim() 
  console.log(Character.roll(roll.toString().trim()));
});


