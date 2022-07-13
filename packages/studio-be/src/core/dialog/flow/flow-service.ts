import { Flow, Logger } from 'botpress/sdk'
import { ArrayCache } from 'common/array-cache'
import { ObjectCache } from 'common/object-cache'
import { FlowMutex, FlowView, NodeView } from 'common/typings'
import { coreActions } from 'core/app/core-client'
import { TYPES } from 'core/app/types'
import { BotService } from 'core/bots'
import { GhostService, ScopedGhostService } from 'core/bpfs'
import { JobService } from 'core/distributed/job-service'
import { KeyValueStore, KvsService } from 'core/kvs'
import { inject, injectable, postConstruct, tagged } from 'inversify'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import _ from 'lodash'
import moment from 'moment'
import { QNAService } from 'studio/qna'

import { validateFlowSchema } from '../utils/validator'

const PLACING_STEP = 250
const MIN_POS_X = 50
const FLOW_DIR = 'flows'

const MUTEX_LOCK_DELAY_SECONDS = 30

interface FlowModification {
  name: string
  botId: string
  userEmail: string
  modification: 'rename' | 'delete' | 'create' | 'update'
  newName?: string
  payload?: any
}

export class MutexError extends Error {
  type = MutexError.name
}

@injectable()
export class FlowService {
  private scopes: { [botId: string]: ScopedFlowService } = {}
  private invalidateFlow: (botId: string, key: string, flow?: FlowView, newKey?: string) => void =
    this._localInvalidateFlow

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'FlowService')
    private logger: Logger,
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.ObjectCache) private cache: ObjectCache,
    @inject(TYPES.KeyValueStore) private kvs: KeyValueStore,
    @inject(TYPES.BotService) private botService: BotService,
    @inject(TYPES.JobService) private jobService: JobService,
    @inject(TYPES.QnaService) private qnaService: QNAService
  ) {
    this._listenForCacheInvalidation()
    this.botService.listenForBotUnmount(this.handleUnmount.bind(this))
  }

  @postConstruct()
  async init() {
    await AppLifecycle.waitFor(AppLifecycleEvents.CONFIGURATION_LOADED)

    this.invalidateFlow = <any>await this.jobService.broadcast<void>(this._localInvalidateFlow.bind(this))
  }

  private async handleUnmount(botId: string) {
    delete this.scopes[botId]
  }

  private _localInvalidateFlow(botId: string, key: string, flow?: FlowView, newKey?: string) {
    return this.forBot(botId).localInvalidateFlow(key, flow, newKey)
  }

  private _listenForCacheInvalidation() {
    this.cache.events.on('invalidation', async (key) => {
      try {
        const matches = key.match(/^([A-Z0-9-_]+)::(?:data\/)?bots\/([A-Z0-9-_]+)\/flows\/([\s\S]+(flow)\.json)/i)

        if (matches && matches.length >= 2) {
          const [_key, type, botId, flowName] = matches
          if (type === 'file' || type === 'object') {
            await this.forBot(botId).handleInvalidatedCache(flowName)
          }
        }
      } catch (err) {
        this.logger.error('Error Invalidating flow cache: ' + err.message)
      }
    })
  }

  public forBot(botId: string): ScopedFlowService {
    let scope = this.scopes[botId]
    if (!scope) {
      scope = new ScopedFlowService(
        botId,
        this.ghost.forBot(botId),
        this.kvs.forBot(botId),
        this.logger,
        this.qnaService,
        (key, flow, newKey) => this.invalidateFlow(botId, key, flow, newKey)
      )
      this.scopes[botId] = scope
    }
    return scope
  }
}

export class ScopedFlowService {
  private cache: ArrayCache<string, FlowView>

  constructor(
    private botId: string,
    private ghost: ScopedGhostService,
    private kvs: KvsService,
    private logger: Logger,
    private qnaService: QNAService,
    private invalidateFlow: (key: string, flow?: FlowView, newKey?: string) => void
  ) {
    this.cache = new ArrayCache<string, FlowView>(
      (x) => x.name,
      (x, _prevKey, newKey) => ({ ...x, name: newKey, location: newKey })
    )
  }

  public async localInvalidateFlow(key: string, flow?: FlowView, newKey?: string) {
    if (!this.cache.values().length) {
      return
    }

    if (flow) {
      this.cache.update(key, flow)
    } else if (newKey) {
      this.cache.rename(key, newKey)
    } else if (this.cache.get(key)) {
      this.cache.remove(key)
    }
  }

  public async handleInvalidatedCache(flowName: string) {
    const flowPath = this.toFlowPath(flowName)

    // fix an issue when creating a bot where the .flow.json is written but not the .ui.json because of the locking mechanism
    if (!(await this.ghost.fileExists(FLOW_DIR, this.toUiPath(flowPath)))) {
      return
    }

    if (await this.ghost.fileExists(FLOW_DIR, flowPath)) {
      const flow = await this.parseFlow(flowPath)
      await this.localInvalidateFlow(flowPath, flow)
    } else {
      await this.localInvalidateFlow(flowPath, undefined)
    }
  }

  async loadAll(): Promise<FlowView[]> {
    if (this.cache.values().length) {
      return this.cache.values()
    }

    const flowsPath = this.ghost.directoryListing(FLOW_DIR, '*.flow.json', undefined, undefined, {
      sortOrder: { column: 'filePath' }
    })

    try {
      const flows = await Promise.map(flowsPath, async (flowPath: string) => {
        return this.parseFlow(flowPath)
      })

      this.cache.initialize(flows)

      return flows
    } catch (err) {
      this.logger.forBot(this.botId).attachError(err).error('Could not load flows')
      return []
    }
  }

  private async parseFlow(flowPath: string): Promise<FlowView> {
    const flow = await this.ghost.readFileAsObject<Flow>(FLOW_DIR, flowPath)
    const schemaError = validateFlowSchema(flow)

    if (!flow || schemaError) {
      throw new Error(`Invalid schema for "${flowPath}". ${schemaError} `)
    }

    const uiEq = await this.ghost.readFileAsObject<FlowView>(FLOW_DIR, this.toUiPath(flowPath))
    let unplacedIndex = -1

    const nodeViews: NodeView[] = flow.nodes.map((node) => {
      const position = _.get(_.find(uiEq.nodes, { id: node.id }), 'position')
      unplacedIndex = position ? unplacedIndex : unplacedIndex + 1
      return {
        ...node,
        x: position ? position.x : MIN_POS_X + unplacedIndex * PLACING_STEP,
        y: position ? position.y : (_.maxBy(flow.nodes, 'y') || { y: 0 })['y'] + PLACING_STEP
      }
    })

    const key = this._buildFlowMutexKey(flowPath)
    const currentMutex = (await this.kvs.get(key)) as FlowMutex
    if (currentMutex) {
      currentMutex.remainingSeconds = this._getRemainingSeconds(currentMutex.lastModifiedAt)
    }

    return {
      name: flowPath,
      location: flowPath,
      nodes: nodeViews,
      links: uiEq.links,
      currentMutex,
      ..._.pick(flow, ['version', 'catchAll', 'startNode', 'skillData', 'label', 'description'])
    }
  }

  private _getRemainingSeconds(lastModifiedAt: Date): number {
    const now = moment()
    const freeTime = moment(lastModifiedAt).add(MUTEX_LOCK_DELAY_SECONDS, 'seconds')
    return Math.ceil(Math.max(0, freeTime.diff(now, 'seconds')))
  }

  async insertFlow(flow: FlowView, userEmail: string) {
    const isFlowNameValid = await this.isFlowNameValid(flow.name)
    if (!isFlowNameValid) {
      throw new Error(`Can not create an already existent flow : ${flow.name}`)
    }

    await this._upsertFlow(flow)

    const currentMutex = await this._testAndLockMutex(userEmail, flow.location || flow.name)
    const mutexFlow: FlowView = { ...flow, currentMutex }

    await this.notifyChanges({
      botId: this.botId,
      name: flow.name,
      modification: 'create',
      payload: mutexFlow,
      userEmail
    })
  }

  async updateFlow(flow: FlowView, userEmail: string) {
    const currentMutex = await this._testAndLockMutex(userEmail, flow.location || flow.name)

    await this._upsertFlow(flow)

    const mutexFlow: FlowView = { ...flow, currentMutex }

    await this.notifyChanges({
      name: flow.name,
      botId: this.botId,
      modification: 'update',
      payload: mutexFlow,
      userEmail
    })
  }

  private async _upsertFlow(flow: FlowView) {
    const flowFiles = await this.ghost.directoryListing(FLOW_DIR, '**/*.json')

    const isNew = !flowFiles.find((x) => flow.location === x)

    const { flowPath, uiPath, flowContent, uiContent } = await this.prepareSaveFlow(flow, isNew)

    this.invalidateFlow(flow.name, flow)

    await Promise.all([
      this.ghost.upsertFile(FLOW_DIR, flowPath!, JSON.stringify(flowContent, undefined, 2)),
      this.ghost.upsertFile(FLOW_DIR, uiPath, JSON.stringify(uiContent, undefined, 2))
    ])
  }

  async deleteFlow(flowName: string, userEmail: string) {
    const flowFiles = await this.ghost.directoryListing(FLOW_DIR, '*.json')
    const fileToDelete = flowFiles.find((f) => f === flowName)
    if (!fileToDelete) {
      throw new Error(`Can not delete a flow that does not exist: ${flowName}`)
    }

    const uiPath = this.toUiPath(fileToDelete)

    this.invalidateFlow(flowName)

    await Promise.all([this.ghost.deleteFile(FLOW_DIR, fileToDelete!), this.ghost.deleteFile(FLOW_DIR, uiPath)])

    await this.notifyChanges({
      name: flowName,
      botId: this.botId,
      modification: 'delete',
      userEmail
    })
  }

  async renameFlow(previousName: string, newName: string, userEmail: string) {
    const flowFiles = await this.ghost.directoryListing(FLOW_DIR, '*.json')
    const fileToRename = flowFiles.find((f) => f === previousName)
    if (!fileToRename) {
      throw new Error(`Can not rename a flow that does not exist: ${previousName}`)
    }
    const isFlowNameValid = await this.isFlowNameValid(newName)
    if (!isFlowNameValid) {
      throw new Error(`New flow name ${newName} is already in use`)
    }

    this.invalidateFlow(previousName, undefined, newName)

    const previousUiName = this.toUiPath(fileToRename)
    const newUiName = this.toUiPath(newName)
    await Promise.all([
      this.ghost.renameFile(FLOW_DIR, fileToRename!, newName),
      this.ghost.renameFile(FLOW_DIR, previousUiName, newUiName)
    ])

    await this.qnaService.onFlowRenamed({
      botId: this.botId,
      previousFlowName: previousName,
      nextFlowName: newName
    })

    await coreActions.onModuleEvent('onFlowRenamed', {
      botId: this.botId,
      previousFlowName: previousName,
      nextFlowName: newName
    })

    await this.notifyChanges({
      name: previousName,
      botId: this.botId,
      modification: 'rename',
      newName,
      userEmail
    })
  }

  private isFlowNameValid = async (name: string): Promise<Boolean> => {
    const flowFiles = await this.ghost.directoryListing(FLOW_DIR, '*.json')
    return flowFiles.findIndex((f) => f.toLowerCase() === name.toLowerCase()) === -1
  }

  private notifyChanges = async (modification: FlowModification) => {
    await coreActions.notifyFlowChanges(modification)
  }

  private _buildFlowMutexKey(flowLocation: string): string {
    return `FLOWMUTEX: ${flowLocation}`
  }

  private async _testAndLockMutex(currentFlowEditor: string, flowLocation: string): Promise<FlowMutex> {
    const key = this._buildFlowMutexKey(flowLocation)

    const currentMutex = ((await this.kvs.get(key)) || {}) as FlowMutex
    const { lastModifiedBy: flowOwner, lastModifiedAt } = currentMutex

    const now = new Date()
    const remainingSeconds = this._getRemainingSeconds(now)

    if (currentFlowEditor === flowOwner) {
      const mutex: FlowMutex = {
        lastModifiedBy: flowOwner,
        lastModifiedAt: now
      }
      await this.kvs.set(key, mutex)

      mutex.remainingSeconds = remainingSeconds
      return mutex
    }

    const isMutexExpired = !this._getRemainingSeconds(lastModifiedAt)
    if (!flowOwner || isMutexExpired) {
      const mutex: FlowMutex = {
        lastModifiedBy: currentFlowEditor,
        lastModifiedAt: now
      }
      await this.kvs.set(key, mutex)

      mutex.remainingSeconds = remainingSeconds
      return mutex
    }

    throw new MutexError('Flow is currently locked by someone else')
  }

  private async prepareSaveFlow(flow: FlowView, isNew: boolean) {
    const schemaError = validateFlowSchema(flow)
    if (schemaError) {
      throw new Error(schemaError)
    }

    if (!isNew) {
      await this.qnaService.onFlowChanged({ botId: this.botId, flow })
      await coreActions.onModuleEvent('onFlowChanged', { botId: this.botId, flow })
    }

    const uiContent = {
      nodes: flow.nodes.map((node) => ({ id: node.id, position: _.pick(node, 'x', 'y') })),
      links: flow.links
    }

    const flowContent = {
      ..._.pick(flow, ['version', 'catchAll', 'startNode', 'skillData', 'label', 'description']),
      nodes: flow.nodes.map((node) => _.omit(node, 'x', 'y', 'lastModified'))
    }

    const flowPath = flow.location
    return { flowPath, uiPath: this.toUiPath(flowPath!), flowContent, uiContent }
  }

  private toUiPath(flowPath: string) {
    return flowPath.replace(/\.flow\.json$/i, '.ui.json')
  }

  private toFlowPath(uiPath: string) {
    return uiPath.replace(/\.ui\.json$/i, '.flow.json')
  }
}
