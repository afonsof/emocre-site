import path from 'node:path'

export const rootPath = path.join(__dirname, '..')
export const dataDir = path.join(rootPath, 'data')
export const dataPath = (sub: string): string => path.join(dataDir, sub)
export const creaturesDir = dataPath('creature/creatures')
export const artBase = path.join(rootPath, 'vendor', 'emocre-creatures', 'art')
export const siteDataPath = path.join(rootPath, '_data')
export const siteAssetsPath = path.join(rootPath, 'assets')
