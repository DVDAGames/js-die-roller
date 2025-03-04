import Roller from '../index'
import type { RollerDieNotation, RollerMap, RollerRollNotation } from '../types'

describe('README - Basic Rolls Examples', () => {
  // Create a single shared instance of Roller for all basic examples
  const dice = new Roller()

  test('d20 roll function example', () => {
    const d20 = () => dice.roll('1d20')

    const result = d20()
    expect(result).toBeDefined()
    expect(Array.isArray(result.total)).toBe(true)
    expect(result.total[0]).toBeGreaterThanOrEqual(1)
    expect(result.total[0]).toBeLessThanOrEqual(20)
  })

  test('magic missiles example', () => {
    const magicMissiles = () => dice.roll('3d4 + 1')

    const result = magicMissiles()
    expect(result).toBeDefined()
    expect(Array.isArray(result.total)).toBe(true)
    expect(result.total[0]).toBeGreaterThanOrEqual(4) // min: 3 × 1 + 1
    expect(result.total[0]).toBeLessThanOrEqual(13) // max: 3 × 4 + 1
  })

  test('roll for stat example', () => {
    const rollForStat = () => dice.roll('drop(4d6)')

    const result = rollForStat()
    expect(result).toBeDefined()
    expect(Array.isArray(result.total)).toBe(true)

    // The sum of the highest 3 values from 4d6
    // Min: 3 (1+1+1 after dropping lowest 1)
    // Max: 18 (6+6+6 after dropping lowest 6 or any other value)
    expect(result.total[0]).toBeGreaterThanOrEqual(3)
    expect(result.total[0]).toBeLessThanOrEqual(18)

    // Check breakdown has 4 original rolls
    expect(result.breakdown.length).toBe(4)

    // Verify drop logic by checking that the total equals sum of all rolls minus the lowest
    const allRolls = result.breakdown.map((item) => Object.values(item)[0])
    const minRoll = Math.min(...allRolls)
    const sumWithoutMin =
      allRolls.reduce((sum, roll) => sum + roll, 0) - minRoll
    expect(result.total[0]).toBe(sumWithoutMin)
  })

  test('advantage example', () => {
    const advantage = () => dice.roll('max(2d20)')

    const result = advantage()
    expect(result).toBeDefined()
    expect(Array.isArray(result.total)).toBe(true)
    expect(result.total[0]).toBeGreaterThanOrEqual(1)
    expect(result.total[0]).toBeLessThanOrEqual(20)

    // Verify max logic by checking that the total equals the highest of the rolls
    const allRolls = result.breakdown.map((item) => Object.values(item)[0])
    const maxRoll = Math.max(...allRolls)
    expect(result.total[0]).toBe(maxRoll)
  })

  test('disadvantage example', () => {
    const disadvantage = () => dice.roll('min(2d20)')

    const result = disadvantage()
    expect(result).toBeDefined()
    expect(Array.isArray(result.total)).toBe(true)
    expect(result.total[0]).toBeGreaterThanOrEqual(1)
    expect(result.total[0]).toBeLessThanOrEqual(20)

    // Verify min logic by checking that the total equals the lowest of the rolls
    const allRolls = result.breakdown.map((item) => Object.values(item)[0])
    const minRoll = Math.min(...allRolls)
    expect(result.total[0]).toBe(minRoll)
  })

  test('fireball example', () => {
    const fireball = () => dice.roll('8d6')

    const result = fireball()
    expect(result).toBeDefined()
    expect(Array.isArray(result.total)).toBe(true)
    expect(result.total[0]).toBeGreaterThanOrEqual(8) // min: 8 × 1
    expect(result.total[0]).toBeLessThanOrEqual(48) // max: 8 × 6
    expect(result.breakdown.length).toBe(8) // Check we have 8 individual rolls
  })

  test('successes example', () => {
    const successes = () => dice.roll('count(6, 6d6)')

    const result = successes()
    expect(result).toBeDefined()
    expect(Array.isArray(result.total)).toBe(true)
    expect(result.total[0]).toBeGreaterThanOrEqual(0) // min: no 6s rolled
    expect(result.total[0]).toBeLessThanOrEqual(6) // max: all 6s rolled

    // Verify count logic by counting actual 6s in the breakdown
    const sixCount = result.breakdown.filter(
      (item) => Object.values(item)[0] === 6
    ).length
    expect(result.total[0]).toBe(sixCount)
  })

  test('damage example', () => {
    const damage = (dieSize: string, numberOfDice: number, modifier: number) =>
      dice.roll(`sum(${numberOfDice}${dieSize} + ${modifier})`)

    const result = damage('d8', 2, 3)
    expect(result).toBeDefined()
    expect(Array.isArray(result.total)).toBe(true)
    expect(result.total[0]).toBeGreaterThanOrEqual(5) // min: 2 × 1 + 3
    expect(result.total[0]).toBeLessThanOrEqual(19) // max: 2 × 8 + 3
  })

  test('average example', () => {
    const average = (dieSize: RollerDieNotation, numberOfDice = 1) =>
      dice.roll(`avg(${numberOfDice}${dieSize})`)

    const result = average('d6', 4)
    expect(result).toBeDefined()
    expect(Array.isArray(result.total)).toBe(true)
    // Average of 4d6 should be between 1 and 6
    expect(result.total[0]).toBeGreaterThanOrEqual(1)
    expect(result.total[0]).toBeLessThanOrEqual(6)
  })

  // This test specifically needs its own instance to test constructor overloading
  test('constructor overloading example', () => {
    const roller = new Roller('1d20')

    // The result is stored directly on the instance when using constructor overloading
    expect(roller.result).toBeDefined()
    if (roller.result) {
      expect(Array.isArray(roller.result.total)).toBe(true)
      expect(roller.result.total[0]).toBeGreaterThanOrEqual(1)
      expect(roller.result.total[0]).toBeLessThanOrEqual(20)
    }
  })
})

describe('README - Advanced Interface Example', () => {
  test('Fighter character creation with DnD 5e example', () => {
    // Setup phase - creating character stats as shown in README
    const statsGenerator = new Roller()
    const statNames = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']

    // Use a predetermined set of stats for testing instead of random rolls
    // This makes tests predictable while still validating the API
    const statRolls = [15, 14, 13, 12, 10, 8]

    // Create the stats object
    const statsObject = statNames.reduce((obj, name, index) => {
      obj[name] = statRolls[index]
      return obj
    }, {} as Record<string, number>)

    // Calculate modifiers as per DnD 5e rules
    const calculateModifier = (stat: number): number =>
      Math.floor((stat - 10) / 2)

    // Define custom map type that matches the Fighter config structure
    type FighterMap = {
      initiative: RollerRollNotation
      longsword: {
        hit: RollerRollNotation
        dmg: {
          '1h': RollerRollNotation
          '2h': RollerRollNotation
        }
      }
      saves: {
        STR: RollerRollNotation
        DEX: RollerRollNotation
        CON: RollerRollNotation
        INT: RollerRollNotation
        WIS: RollerRollNotation
        CHA: RollerRollNotation
      }
    }

    // Create the Fighter
    const Fighter = new Roller({
      variables: {
        level: 1,
        proficiency: 2,
        ...statsObject,
        strMod: calculateModifier(statsObject.STR),
        dexMod: calculateModifier(statsObject.DEX),
        conMod: calculateModifier(statsObject.CON),
        intMod: calculateModifier(statsObject.INT),
        wisMod: calculateModifier(statsObject.WIS),
        chaMod: calculateModifier(statsObject.CHA),
      },
      map: {
        initiative: '1d20 + $dexMod',
        longsword: {
          hit: '1d20 + $strMod + $proficiency',
          dmg: {
            '1h': '1d8 + $strMod',
            '2h': '1d10 + $strMod',
          },
        },
        saves: {
          STR: '1d20 + $strMod + $proficiency',
          DEX: '1d20 + $dexMod',
          CON: '1d20 + $conMod + $proficiency',
          INT: '1d20 + $intMod',
          WIS: '1d20 + $wisMod',
          CHA: '1d20 + $chaMod',
        },
      } as unknown as RollerMap,
    })

    // Test 1: Roll using variables directly (proficiency check)
    const profCheck = Fighter.roll('1d20 + $proficiency')
    expect(profCheck.total[0]).toBeGreaterThanOrEqual(3) // min: 1 + 2
    expect(profCheck.total[0]).toBeLessThanOrEqual(22) // max: 20 + 2

    // Test 2: Initiative roll
    const initiative = Fighter.roll('initiative')
    expect(initiative.total[0]).toBeGreaterThanOrEqual(3) // min: 1 + 2 (dexMod)
    expect(initiative.total[0]).toBeLessThanOrEqual(22) // max: 20 + 2

    // Test 3: Longsword hit roll
    const longswordHit = Fighter.roll('longsword.hit')
    expect(longswordHit.total[0]).toBeGreaterThanOrEqual(5) // min: 1 + 2 (proficiency) + 2 (strMod)
    expect(longswordHit.total[0]).toBeLessThanOrEqual(24) // max: 20 + 2 + 2

    // Test 4: Longsword 2h damage roll
    const longsword2h = Fighter.roll('longsword.dmg.2h')
    expect(longsword2h.total[0]).toBeGreaterThanOrEqual(3) // min: 1 + 2 (strMod)
    expect(longsword2h.total[0]).toBeLessThanOrEqual(12) // max: 10 + 2

    // Test 5: STR saving throw
    const strSave = Fighter.roll('saves.STR')
    expect(strSave.total[0]).toBeGreaterThanOrEqual(5) // min: 1 + 2 (strMod) + 2 (proficiency)
    expect(strSave.total[0]).toBeLessThanOrEqual(24) // max: 20 + 2 + 2

    // Make sure the variable substitution works correctly
    expect(strSave.roll).toBe('1d20 + 2 + 2')
  })
})
