import Roller from '../index'

describe('Character', () => {
  it('should be able to generate a character', () => {
    // the ability scores in DnD Fifth Edition
    const statNames = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']

    // 4d6 drop the lowest
    // the method we're going to use for generating an ability score
    const statRoll = 'sum(drop(4d6))'

    // roll 7 scores and drop the lowest
    // the method we're gong to use for generating our stat block
    const statsToRoll = statNames.length + 1

    // generate a complext d20 syntax: drop(sum(drop(4d6)), sum(drop(4d6)), ...)
    const statsRoll = `drop(${Array.from({ length: statsToRoll })
      .map(() => statRoll)
      .join(', ')})`

    // generate our new scores array
    const statsGenerator = new Roller(statsRoll).result!

    const abilityScores: {
      [key: string]: {
        score: number
        modifier: number
      }
    } = statNames.reduce((scores, stat, index) => {
      const score = statsGenerator.rolls[index] as unknown as number

      scores[stat] = {
        score: score,

        // dnd5e stat modifiers are floor((STAT - 10) / 2)
        modifier: Math.floor((score - 10) / 2),
      }

      return scores
    }, {})

    // Fighters are proficient in STR and CON saves
    const proficiencies = ['STR', 'CON']

    const Fighter = new Roller({
      variables: {
        level: 1,
        proficiency: 2,
        ...Object.entries(abilityScores).reduce((statBlock, [stat, values]) => {
          statBlock = {
            ...statBlock,
            [stat.toLowerCase()]: values.score,
            [`${stat.toLowerCase()}Mod`]: values.modifier,
          }

          return statBlock
        }, {}),
      },
      map: {
        // when we use a variable in our roll, we always prefix it
        // with a `$` so Roller knows to look it up in the variables object
        initiative: '1d20 + $dexMod',
        longsword: {
          hit: '1d20 + $strMod + $proficiency',
          dmg: {
            '1h': '1d8 + $strMod',
            '2h': '1d10 + $strMod',
          },
        },
        saves: statNames.reduce((saves, stat) => {
          saves[stat] = `1d20 + $${stat.toLowerCase()}Mod${
            proficiencies.includes(stat) ? ` + $proficiency` : ''
          }`

          return saves
        }, {}),
      },
    })

    // Test the examples from the README's Advanced Interface section

    // Test: roll with proficiency only (no specific stat)
    const proficiencyRoll = Fighter.roll('1d20 + $proficiency')

    // Verify type and structure
    expect(typeof proficiencyRoll.total).toBe('number')
    expect(proficiencyRoll.rolls.length).toBeGreaterThan(0)
    expect(proficiencyRoll.originalRolls.length).toBeGreaterThan(0)

    // Since proficiency is 2, the difference between total and the first roll should be 2
    expect(proficiencyRoll.total - proficiencyRoll.originalRolls[0]).toBe(2)

    // Test: initiative roll
    const initiativeRoll = Fighter.roll('initiative')
    expect(typeof initiativeRoll.total).toBe('number')
    expect(initiativeRoll.rolls.length).toBeGreaterThan(0)
    expect(initiativeRoll.notation).toBe(`1d20 + ${abilityScores.DEX.modifier}`)

    // Test: longsword hit roll
    const longswordHitRoll = Fighter.roll('longsword.hit')
    expect(typeof longswordHitRoll.total).toBe('number')
    expect(longswordHitRoll.rolls.length).toBeGreaterThan(0)
    expect(longswordHitRoll.notation).toBe(
      `1d20 + ${abilityScores.STR.modifier} + ${Fighter.variables.proficiency}`
    )

    // Test: two-handed longsword damage roll
    const longswordDmgRoll = Fighter.roll('longsword.dmg.2h')
    expect(typeof longswordDmgRoll.total).toBe('number')
    expect(longswordDmgRoll.rolls.length).toBeGreaterThan(0)
    expect(longswordDmgRoll.notation).toBe(
      `1d10 + ${abilityScores.STR.modifier}`
    )

    // Test: strength saving throw
    const strSaveRoll = Fighter.roll('saves.STR')
    expect(typeof strSaveRoll.total).toBe('number')
    expect(strSaveRoll.rolls.length).toBeGreaterThan(0)
    expect(strSaveRoll.notation).toContain('1d20')
    expect(strSaveRoll.notation).toContain(`${abilityScores.STR.modifier}`)
    expect(strSaveRoll.notation).toContain(`${Fighter.variables.proficiency}`) // STR is a proficient save

    // Test: wisdom saving throw (not proficient)
    const wisSaveRoll = Fighter.roll('saves.WIS')
    expect(typeof wisSaveRoll.total).toBe('number')
    expect(wisSaveRoll.rolls.length).toBeGreaterThan(0)
    expect(wisSaveRoll.notation).toContain('1d20')
    expect(wisSaveRoll.notation).toContain(`${abilityScores.WIS.modifier}`)
  })
})
