import Joi from 'joi'

export const DeployRequestSchema = Joi.object({
  workspaceId: Joi.string(),
  personalAccessToken: Joi.string()
})
