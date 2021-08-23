import axios, { AxiosInstance } from 'axios'

const { CORE_PORT, ROOT_PATH, INTERNAL_PASSWORD } = process.core_env

let coreClient: AxiosInstance

if (INTERNAL_PASSWORD) {
  coreClient = axios.create({
    headers: { authorization: INTERNAL_PASSWORD },
    baseURL: `http://localhost:${CORE_PORT}${ROOT_PATH}/api/internal`
  })
}

export const coreActions = {
  invalidateFile: async (key: string) => {
    await coreClient?.post('/invalidateFile', { key })
  },
  onModuleEvent: async (eventType: string, payload: any) => {
    await coreClient?.post('/onModuleEvent', { eventType, ...payload })
  },
  notifyFlowChanges: async payload => {
    await coreClient?.post('/notifyFlowChange', payload)
  },
  invalidateCmsForBot: async (botId: string) => {
    await coreClient?.post('/invalidateCmsForBot', { botId })
  },
  setStudioReady: async () => {
    await coreClient?.post('/setStudioReady')
  },
  syncBotLibs: async (botId: string) => {
    await coreClient?.post('/syncBotLibs', { botId, serverId: process.env.SERVER_ID })
  }
}
