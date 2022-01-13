import { FileTypes, EditableFile, FilePermissions } from 'common/code-editor'
import yn from 'yn'

import { validateFilePayload } from './utils'

export const getPermissionsMw = hasPermission => async (req: any, res, next): Promise<void> => {
  const hasPerms = req => async (op: string, res: string) => hasPermission(req, op, 'module.code-editor.' + res, true)

  const permissionsChecker = hasPerms(req)

  const perms: FilePermissions = {}
  for (const type of Object.keys(FileTypes)) {
    const { permission } = FileTypes[type]

    const botKey = `bot.${permission}`

    perms[botKey] = {
      type,
      isGlobal: false,
      write: await permissionsChecker('write', botKey),
      read: await permissionsChecker('read', botKey)
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
