
import {dataPath, siteAssetsPath, siteDataPath, creaturesDir, artBase} from './paths'
import {emotionEnToPt} from '@emocre/tools/src/schema/emotion'
import fs from 'fs'
import {writeJson} from '@emocre/tools/src/file/serialize'

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
