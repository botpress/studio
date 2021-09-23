import { Logger } from 'botpress/sdk'
import cookie from 'cookie'
import { TYPES } from 'core/app/types'
import { BotpressConfig, ConfigProvider } from 'core/config'
import { getOrCreate as redisFactory } from 'core/distributed'
import { PersistedConsoleLogger } from 'core/logger'
import { AuthService } from 'core/security'
import { EventEmitter2 } from 'eventemitter2'
import { Server } from 'http'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import socketio from 'socket.io'
import redisAdapter from 'socket.io-redis'
import socketioJwt from 'socketio-jwt'
import { RealTimePayload } from './payload-sdk-impl'

const debug = DEBUG('realtime')

export const getSocketTransports = (config: BotpressConfig): string[] => {
  // Just to be sure there is at least one valid transport configured
  const transports = _.filter(config.httpServer.socketTransports, t => ['websocket', 'polling'].includes(t))
  return transports && transports.length ? transports : ['websocket', 'polling']
}

@injectable()
export class RealtimeService {
  private readonly ee: EventEmitter2
  private useRedis: boolean

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'Realtime')
    private logger: Logger,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.AuthService) private authService: AuthService
  ) {
    this.ee = new EventEmitter2({ wildcard: true, maxListeners: 100 })

    this.useRedis = process.CLUSTER_ENABLED && Boolean(process.env.REDIS_URL) && process.IS_PRO_ENABLED

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

    if (this.useRedis) {
      io.adapter(redisAdapter({ pubClient: redisFactory('commands'), subClient: redisFactory('socket') }))
    }

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

  checkCookieToken = async (socket: socketio.Socket, fn: (err?) => any) => {
    try {
      const csrfToken = socket.handshake.query.token
      const { jwtToken } = cookie.parse(socket.handshake.headers.cookie)

      if (jwtToken && csrfToken) {
        await this.authService.checkToken(jwtToken, csrfToken)
        fn(undefined)
      }

      fn('Mandatory parameters are missing')
    } catch (err) {
      fn(err)
    }
  }

  setupStudioSocket(studio: socketio.Namespace): void {
    if (process.USE_JWT_COOKIES) {
      studio.use(this.checkCookieToken)
    } else {
      studio.use(socketioJwt.authorize({ secret: process.APP_SECRET, handshake: true }))
    }

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
