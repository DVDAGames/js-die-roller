import readline from "readline"

import Roller from "../lib/index.js"

const prompt = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

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
    initiative: "1d20 + $init",
    whip: {
      dmg: "1d4 + $prof",
      hit: "1d20 + 8",
      crit: "2d4 + $prof",
    },
    xbow: {
      dmg: "1d6 + $prof",
      hit: "1d20 + 10",
      crit: "2d6 + $prof",
    },
    "guiding-bolt": {
      dmg: "sum(4d6)",
      hit: "1d20 + 8",
      crit: "sum(8d6)",
    },
    "sacred-flame": {
      dmg: "sum(3d8)",
    },
    "word-of-radiance": {
      dmg: "3d6",
    },
    save: {
      str: "1d20 + 0",
      dex: "1d20 + 4",
      con: "1d20 + 4",
      int: "1d20 + 1",
      wis: "1d20 + 9",
      cha: "1d20 + 4",
    },
  },
})

const execute = () => {
  prompt.question("What do you want to roll?\n", (roll) => {
    if (roll) {
      if (roll === "exit") {
        prompt.close()
      } else {
        console.log(Character.roll(roll))

        execute()
      }
    }
  })
}

console.log("JS Die Roller Demo")
console.log("You can quit this demo using the `exit` command.")

execute()
