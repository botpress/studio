import { DirectoryListingOptions } from 'botpress/sdk'

export interface bpfs {
  upsertFile(filePath: string, content: Buffer | string, recordRevision: boolean): Promise<void>
  readFile(filePath: string): Promise<Buffer>
  fileExists(filePath: string): Promise<boolean>
  deleteFile(filePath: string, recordRevision: boolean): Promise<void>
  deleteDir(dirPath: string): Promise<void>
  directoryListing(folder: string, options: DirectoryListingOptions): Promise<string[]>
  fileSize(filePath: string): Promise<number>
  moveFile(fromPath: string, toPath: string): Promise<void>
}

export const Instance: bpfs = {
  upsertFile: function (filePath: string, content: string | Buffer, recordRevision: boolean): Promise<void> {
    throw new Error('Function not implemented.')
  },
  readFile: function (filePath: string): Promise<Buffer> {
    throw new Error('Function not implemented.')
  },
  fileExists: function (filePath: string): Promise<boolean> {
    throw new Error('Function not implemented.')
  },
  deleteFile: function (filePath: string, recordRevision: boolean): Promise<void> {
    throw new Error('Function not implemented.')
  },
  deleteDir: function (dirPath: string): Promise<void> {
    throw new Error('Function not implemented.')
  },
  directoryListing: function (folder: string, options: DirectoryListingOptions): Promise<string[]> {
    throw new Error('Function not implemented.')
  },
  fileSize: function (filePath: string): Promise<number> {
    throw new Error('Function not implemented.')
  },
  moveFile: function (fromPath: string, toPath: string): Promise<void> {
    throw new Error('Function not implemented.')
  }
}
