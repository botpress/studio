import { FileTypes, EditableFile, FilePermissions } from 'common/code-editor'
import yn from 'yn'

import { validateFilePayload } from './utils'

export const getPermissionsMw = () => async (req: any, res, next): Promise<void> => {
  const perms: FilePermissions = {}
  for (const type of Object.keys(FileTypes)) {
    const { permission } = FileTypes[type]

    const botKey = `bot.${permission}`

    // if (onlySuperAdmin && !req.tokenUser.isSuperAdmin) {
    //   continue
    // }

    perms[botKey] = {
      type,
      isGlobal: false,
      write: true,
      read: true
    }
  }

  req.permissions = perms
  next()
}

export const validateFilePayloadMw = (actionType: 'read' | 'write') => async (req, res, next) => {
  if (!req.permissions || !req.body) {
    next(new Error('Missing parameters'))
  }

  try {
    // When renaming, the signature is different
    const file = req.body.file || req.body
    await validateFilePayload(file as EditableFile, req.permissions, req.params.botId, actionType)
    next()
  } catch (err) {
    next(err)
  }
}

export const validateFileUploadMw = async (req, res, next) => {
  if (!req.permissions || !req.body) {
    next(new Error('module.code-editor.error.missingParameters'))
  }

  if (!req.permissions['root.raw'].write) {
    next(new Error('module.code-editor.error.lackUploadPermissions'))
  }

  if (yn(process.env.BP_CODE_EDITOR_DISABLE_UPLOAD)) {
    next(new Error('module.code-editor.error.fileUploadDisabled'))
  }

  next()
}
