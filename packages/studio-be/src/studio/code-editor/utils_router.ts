import * as sdk from 'botpress/sdk'
import { EditableFile, FilePermissions, FileTypes } from 'common/code-editor'
import { BotService } from 'core/bots'
import yn from 'yn'

import { validateFilePayload } from './utils'

export const getPermissionsMw =
  (hasPermission, botService: BotService) =>
  async (req: any, res, next): Promise<void> => {
    const hasPerms = (req) => async (op: string, res: string) =>
      hasPermission(req, op, 'module.code-editor.' + res, true)

    const isCloudBot = (await botService.findBotById(req.params.botId))?.isCloudBot
    const blockForCloud = (response) => (!isCloudBot ? response : false)

    const permissionsChecker = hasPerms(req)

    const perms: FilePermissions = {}
    for (const type of Object.keys(FileTypes)) {
      const { allowGlobal, allowScoped, allowRoot, onlySuperAdmin, permission } = FileTypes[type]

      const rootKey = `root.${permission}`
      const globalKey = `global.${permission}`
      const botKey = `bot.${permission}`

      if (onlySuperAdmin && !req.tokenUser.isSuperAdmin) {
        continue
      }

      if (allowRoot && !yn(process.core_env.BP_CODE_EDITOR_DISABLE_ADVANCED)) {
        perms[rootKey] = {
          type,
          write: blockForCloud(await permissionsChecker('write', rootKey)),
          read: blockForCloud(await permissionsChecker('read', rootKey))
        }
      }

      if (allowGlobal) {
        perms[globalKey] = {
          type,
          isGlobal: true,
          write: blockForCloud(await permissionsChecker('write', globalKey)),
          read: blockForCloud(await permissionsChecker('read', globalKey))
        }
      }

      if (allowScoped) {
        perms[botKey] = {
          type,
          isGlobal: false,
          write: await permissionsChecker('write', botKey),
          read: await permissionsChecker('read', botKey)
        }
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
    next(new Error('code-editor.error.missingParameters'))
  }

  if (!req.permissions['root.raw'].write) {
    next(new Error('code-editor.error.lackUploadPermissions'))
  }

  if (yn(process.core_env.BP_CODE_EDITOR_DISABLE_UPLOAD)) {
    next(new Error('code-editor.error.fileUploadDisabled'))
  }

  next()
}
