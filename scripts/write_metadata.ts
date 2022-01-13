import 'bluebird-global'
import { exec } from 'child_process'
import fse from 'fs-extra'
import path from 'path'

const writeMetadata = async () => {
  const metadata = {
    version: require(path.join(__dirname, '../package.json')).version,
    date: Date.now(),
    branch: 'master'
  }

  try {
    const currentBranch: string = await Promise.fromCallback(cb => exec('git rev-parse --abbrev-ref HEAD', cb))
    metadata.branch = currentBranch.replace('\n', '')
  } catch (err) {
    console.error("Couldn't get active branch", err)
  }

  await fse.writeJSONSync(path.join(__dirname, '../packages/studio-be/src/metadata.json'), metadata, { spaces: 2 })
}

void writeMetadata()
