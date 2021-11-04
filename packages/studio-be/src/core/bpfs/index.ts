import { DirectoryListingOptions } from 'botpress/sdk'
import { ReplaceInFileConfig } from 'replace-in-file'

export class BPError extends Error {
  private hideStack = true
  constructor(message: string, private code) {
    super(message)
  }
}

export interface StorageDriver {
  upsertFile(filePath: string, content: Buffer | string, recordRevision: boolean): Promise<void>
  readFile(filePath: string): Promise<Buffer>
  fileExists(filePath: string): Promise<boolean>
  deleteFile(filePath: string, recordRevision: boolean): Promise<void>
  deleteDir(dirPath: string): Promise<void>
  directoryListing(folder: string, options: DirectoryListingOptions): Promise<string[]>
  fileSize(filePath: string): Promise<number>
  moveFile(fromPath: string, toPath: string): Promise<void>
}

export interface FileRevision {
  path: string
  revision: string
  created_by: string
  created_on: Date
}

export type ReplaceContent = Pick<ReplaceInFileConfig, 'from' | 'to'>

export * from './cache-invalidators'
export * from './ghost-service'
export * from './ghost.inversify'
export * from './memory-cache'
