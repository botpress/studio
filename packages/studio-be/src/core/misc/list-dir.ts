import glob from 'glob'
import path from 'path'

export interface FileListing {
  relativePath: string
  absolutePath: string
}

export const getBuiltinPath = (dirName: string) => path.resolve(__dirname, '../../builtin', dirName)

export const listDir = async (dirPath: string, ignores: RegExp[] = []): Promise<FileListing[]> => {
  const files = await Promise.fromCallback<string[]>(cb => glob('**/*', { cwd: dirPath, nodir: true }, cb))

  return files
    .filter(x => {
      const match = ignores.filter(i => x.match(i))
      return match && !match.length
    })
    .map(relativePath => ({ relativePath, absolutePath: path.join(dirPath, relativePath) }))
}
