import { z } from 'zod'

export const DeployRequestSchema = z.object({
  params: z.object({ botId: z.string() }),
  body: z.object({ workspaceId: z.string(), personalAccessToken: z.string() })
})
