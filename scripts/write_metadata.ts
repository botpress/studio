import fs from 'fs'
import path from 'path'
import { execute } from './utils/exec'
import logger from './utils/logger'
import { getProjectVersion } from './utils/version'

const writeMetadata = async () => {
  const metadata = {
    version: getProjectVersion(),
    date: Date.now(),
    branch: 'master'
  }

  try {
    const currentBranch: string = await execute('git rev-parse --abbrev-ref HEAD', undefined, { silent: true })
    metadata.branch = currentBranch.replace('\n', '')
  } catch (err) {
    logger.error("Couldn't get active branch", err as Error)
  }

  const metadataPath = path.join(__dirname, '../packages/studio-be/src/metadata.json')
  await new Promise<void>((resolve, reject) =>
    fs.writeFile(metadataPath, JSON.stringify(metadata, undefined, 2), { encoding: 'utf-8' }, err =>
      err ? reject(err) : resolve()
    )
  )
}

void writeMetadata()
