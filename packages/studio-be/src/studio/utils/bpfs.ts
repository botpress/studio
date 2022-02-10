import path from 'path'
import fse from 'fs-extra'
import glob from 'glob'
import { DirectoryListingOptions } from 'botpress/sdk'
import VError from 'verror'
import _ from 'lodash'

export interface bpfs {
  upsertFile(filePath: string, content: Buffer | string): Promise<void>
  readFile(filePath: string): Promise<Buffer>
  fileExists(filePath: string): Promise<boolean>
  deleteFile(filePath: string): Promise<void>
  deleteDir(dirPath: string): Promise<void>
  directoryListing(folder: string, options: DirectoryListingOptions): Promise<string[]>
  fileSize(filePath: string): Promise<number>
  moveFile(fromPath: string, toPath: string): Promise<void>
}

const forceForwardSlashes = (path) => path.replace(/\\/g, '/')

export const Instance: bpfs = {
  upsertFile(filePath: string, content: string | Buffer): Promise<void> {
    return fse.writeFile(path.resolve(process.PROJECT_LOCATION, filePath), content)
  },
  readFile(filePath: string): Promise<Buffer> {
    return fse.readFile(path.resolve(process.PROJECT_LOCATION, filePath))
  },
  fileExists(filePath: string): Promise<boolean> {
    return fse.pathExists(path.resolve(process.PROJECT_LOCATION, filePath))
  },
  deleteFile(filePath: string): Promise<void> {
    return fse.unlink(path.resolve(process.PROJECT_LOCATION, filePath))
  },
  deleteDir(dirPath: string): Promise<void> {
    return fse.remove(path.resolve(process.PROJECT_LOCATION, dirPath))
  },
  async directoryListing(
    folder: string,
    options: DirectoryListingOptions = {
      excludes: [],
      includeDotFiles: false
    }
  ): Promise<string[]> {
    try {
      await fse.access(path.resolve(process.PROJECT_LOCATION, folder), fse.constants.R_OK)
    } catch (e) {
      // if directory doesn't exist we don't care
      if (e.code === 'ENOENT') {
        return []
      }

      throw new VError(e, `[Disk Storage] No read access to directory "${folder}"`)
    }

    const globOptions: glob.IOptions = {
      cwd: path.resolve(process.PROJECT_LOCATION, folder),
      dot: options.includeDotFiles
    }

    // options.excludes can either be a string or an array of strings or undefined
    if (Array.isArray(options.excludes)) {
      globOptions['ignore'] = options.excludes
    } else if (options.excludes) {
      globOptions['ignore'] = [options.excludes]
    } else {
      globOptions['ignore'] = []
    }

    try {
      const files = await Promise.fromCallback<string[]>((cb) => glob('**/*.*', globOptions, cb))
      if (!options.sortOrder) {
        return files.map((filePath) => forceForwardSlashes(filePath))
      }

      const { column, desc } = options.sortOrder

      const filesWithDate = await Promise.map(files, async (filePath) => ({
        filePath,
        modifiedOn: (await fse.stat(path.join(path.resolve(process.PROJECT_LOCATION, folder), filePath))).mtime
      }))

      return _.orderBy(filesWithDate, [column], [desc ? 'desc' : 'asc']).map((x) => forceForwardSlashes(x.filePath))
    } catch (e) {
      return []
    }
  },

  async fileSize(filePath: string): Promise<number> {
    return (await fse.stat(path.resolve(process.PROJECT_LOCATION, filePath))).size
  },
  moveFile(fromPath: string, toPath: string): Promise<void> {
    return fse.move(path.resolve(process.PROJECT_LOCATION, fromPath), path.resolve(process.PROJECT_LOCATION, toPath))
  }
}
