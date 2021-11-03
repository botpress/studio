import { Logger } from 'botpress/sdk'
import { TYPES } from 'core/app/types'
import { StudioConfig, ConfigProvider } from 'core/config'
import { PersistedConsoleLogger } from 'core/logger'
import { EventEmitter2 } from 'eventemitter2'
import { Server } from 'http'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import socketio from 'socket.io'
import { RealTimePayload } from './payload-sdk-impl'

const debug = DEBUG('realtime')

export const getSocketTransports = (config: StudioConfig): string[] => {
  // Just to be sure there is at least one valid transport configured
  const transports = _.filter(config.httpServer.socketTransports, t => ['websocket', 'polling'].includes(t))
  return transports && transports.length ? transports : ['websocket', 'polling']
}

@injectable()
export class RealtimeService {
  private readonly ee: EventEmitter2

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'Realtime')
    private logger: Logger,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider
  ) {
    this.ee = new EventEmitter2({ wildcard: true, maxListeners: 100 })

    PersistedConsoleLogger.LogStreamEmitter.onAny((type, level, message, args) => {
      this.sendToSocket(RealTimePayload.forAdmins(type as string, { level, message, args }))
    })
  }

  sendToSocket(payload: RealTimePayload) {
    debug('Send %o', payload)
    this.ee.emit(payload.eventName, payload.payload, 'server')
  }

  async installOnHttpServer(server: Server) {
    const transports = getSocketTransports(await this.configProvider.getBotpressConfig())

    const io: socketio.Server = socketio(server, {
      transports,
      path: `${process.ROOT_PATH}/socket.io`,
      origins: '*:*',
      serveClient: false
    })

    const studio = io.of('/studio')
    this.setupStudioSocket(studio)

    this.ee.onAny((event, payload, from) => {
      if (from === 'client') {
        return // This is coming from the client, we don't send this event back to them
      }

      if (payload && (payload.__socketId || payload.__room)) {
        // Send only to this socketId or room
        return studio.to(payload.__socketId || payload.__room).emit('event', {
          name: event,
          data: payload
        })
      }

      // broadcast event to the front-end clients
      studio.emit('event', { name: event, data: payload })
    })
  }

  setupStudioSocket(studio: socketio.Namespace): void {
    studio.on('connection', socket => {
      const visitorId = _.get(socket, 'handshake.query.visitorId')

      socket.on('event', event => {
        try {
          if (!event || !event.name) {
            return
          }

          this.ee.emit(event.name, event.data, 'client', {
            visitorId,
            socketId: socket.id,
            guest: false,
            admin: true
          })
        } catch (err) {
          this.logger.attachError(err).error('Error processing incoming studio event')
        }
      })
    })
  }
}
