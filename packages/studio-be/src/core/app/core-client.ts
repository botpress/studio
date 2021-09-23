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
  onBotCreation: async (botId: string) => {
    await coreClient?.post('/onBotCreation', { botId })
  },
  setStudioReady: async () => {
    const tryRequest = async () => {
      try {
        await coreClient?.post('/setStudioReady')
      } catch {
        setTimeout(tryRequest, 250)
      }
    }

    await tryRequest()
  },
  checkForDirtyModels: async (botId: string) => {
    await coreClient?.post('/checkForDirtyModels', { botId })
  },
  syncBotLibs: async (botId: string) => {
    await coreClient?.post('/syncBotLibs', { botId, serverId: process.env.SERVER_ID })
  }
}
