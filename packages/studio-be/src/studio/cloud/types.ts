type RuntimeStatus =
  | 'ACTIVE'
  | 'DELETED'
  | 'BLOCKED'
  | 'UPDATING'
  | 'DELETING'
  | 'BLOCKING'
  | 'PENDING'
  | 'STARTING'
  | 'FAILED'

export interface Introspect {
  userId: string
  runtimeName: string
  runtimeStatus: RuntimeStatus
  botName: string
  botId: string
}

export type PersonalAccessToken = string
export type OAuthAccessToken = string

export interface Principals {
  botId?: string
  userId?: string
  clientId?: string
}

export const scopes = ['messaging', 'nlu'] as const
export type Scope = typeof scopes[number]

export interface ApiKey {
  id: string
  secret: string
  scopes: readonly Scope[]
}

export interface Bot {
  id: string
  runtimeName: string
  workspaceId: string
  name: string
  apiKey: ApiKey
  configurations: BotConfiguration | null
  filename: string | null
  archive: Buffer | null
  createdOn: string
  updatedOn: string
  importedOn: string | null
}

export interface BotConfiguration {
  cloud: BotCloudConfiguration
  messaging: BotMessagingConfiguration
}

export interface BotCloudConfiguration {
  clientId: string
  clientSecret: string
}

// TODO: create a type for input messaging config and output. input doesnt have webhook token
export interface BotMessagingConfiguration {
  clientId: string
  clientToken: string
  webhookToken: string | null
  channels?: Record<string, Record<string, unknown>>
}
