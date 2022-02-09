import { DirectoryListingOptions } from 'botpress/sdk'

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

export const Instance: bpfs = {
  upsertFile(filePath: string, content: string | Buffer): Promise<void> {
    throw new Error('Function not implemented.')
  },
  readFile(filePath: string): Promise<Buffer> {
    throw new Error('Function not implemented.')
  },
  fileExists(filePath: string): Promise<boolean> {
    throw new Error('Function not implemented.')
  },
  deleteFile(filePath: string): Promise<void> {
    throw new Error('Function not implemented.')
  },
  deleteDir(dirPath: string): Promise<void> {
    throw new Error('Function not implemented.')
  },
  directoryListing(folder: string, options: DirectoryListingOptions): Promise<string[]> {
    throw new Error('Function not implemented.')
  },
  fileSize(filePath: string): Promise<number> {
    throw new Error('Function not implemented.')
  },
  moveFile(fromPath: string, toPath: string): Promise<void> {
    throw new Error('Function not implemented.')
  }
}
