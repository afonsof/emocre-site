import {readObjectFromFile} from '@emocre/tools/src/file/config-file'
import {dataPath, siteAssetsPath, siteDataPath, creaturesDir, artBase} from './paths'
import {emotionEnToPt} from '@emocre/tools/src/schema/emotion'
import fs from 'fs'
import {writeJson} from '@emocre/tools/src/file/serialize'
import {effectivenessTextToNumber} from '@emocre/tools/src/type/type'
import {CreaturesFileRepository} from '@emocre/tools/src/creature/creatures-file-repository'

(async () => {
  const repo = new CreaturesFileRepository(creaturesDir, artBase)
  const creatures = await repo
    .where(c => c.site)
    .whereArtFrontExists()
    .execute()

  function destinationCreatureImagePath(emotion: string, stage: number): string {
    return `${siteAssetsPath}/creatures/${emotion}-${stage}-art-front.png`
  }

  const typeChart = await readObjectFromFile<{
    effectiveness: { target: string, source: string, factor: string }[],
    types: { name_en: string, name_pt: string, key: string }[]
  }>(dataPath('type/types.yml'))
  const typeIndexMap: Record<string, number> = {}
  typeChart.types.forEach((type, index) => {
    typeIndexMap[type.key] = index
  })
  const allTypes = typeChart.types.map(t => t.key)

  function getWeaknesses(type1: string, type2?: string): string[] {
    const weaknesses: string[] = []
    allTypes.forEach(attackingType => {
      const multiplier1 = effectivenessTextToNumber(typeChart.effectiveness.find(e => e.source == attackingType && e.target == type1)!.factor)
      let multiplier2 = 1
      if (type2) {
        multiplier2 = effectivenessTextToNumber(typeChart.effectiveness.find(e => e.source == attackingType && e.target == type2)!.factor)
      }
      const totalMultiplier = multiplier1 * multiplier2
      if (totalMultiplier > 1) {
        weaknesses.push(attackingType)
      }
    })
    return weaknesses
  }

  const out = await Promise.all(creatures
    .map(async (c) => {
      return {
        number: c.number,
        name: c.name_pt,
        description: c.description_pt,
        type1Pt: await emotionEnToPt(c.type_1 as any, dataPath('type/types.yml')),
        type2Pt: c.type_2 ? await emotionEnToPt(c.type_2 as any, dataPath('type/types.yml')) : undefined,
        type1: c.type_1,
        type2: c.type_2,
        emotion: c.emotion.toLowerCase(),
        emotionPt: await emotionEnToPt(c.emotion, dataPath('type/types.yml')),
        stage: c.stage,
        energy: c.energy,
        attack: c.power,
        defense: c.defense,
        speed: c.speed,
        weaknesses: getWeaknesses(c.type_1, c.type_2),
        weaknessesPt: await Promise.all(getWeaknesses(c.type_1, c.type_2).map(async t => emotionEnToPt(t, dataPath('type/types.yml')))),
        complexTypeName: c.complexTypeName,
        artPath: c.artFrontPath,
      }
    }))

  await Promise.all(creatures.map(async (c) => {
    const destinationFile = destinationCreatureImagePath(c.emotion.toLowerCase(), c.stage)
    if (!fs.existsSync(c.crtArtPathAbs)) {
      throw new Error(`CRT sprite not found (run emocre-art \`make sprites\` then re-vendor): ${c.crtArtPathAbs}`)
    }
    await fs.promises.copyFile(c.crtArtPathAbs, destinationFile)
  }))
  const outPath = `${siteDataPath}/creatures.json`
  await writeJson(outPath, out)
})()
