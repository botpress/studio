import { injectable } from 'inversify'
import { Redis } from 'ioredis'
import _ from 'lodash'
import { Metric, MonitoringMetrics } from './monitoring'
/**
 * These methods are exposed outside the class to add minimal overhead when collecting metrics
 * It also avoids possible circular reference (the logger class can't access monitoring service, for example)
 */
let metricCollectionEnabled = false
let metricsContainer: MetricsContainer = {}

export const resetMetrics = () => {
  metricsContainer = {
    [Metric.Requests]: 0,
    [Metric.EventsIn]: 0,
    [Metric.EventsOut]: 0,
    [Metric.Warnings]: 0,
    [Metric.Errors]: 0,
    [Metric.Criticals]: 0
  }
}

export const getMetrics = () => {
  const metrics: Partial<MonitoringMetrics> = {}
  for (const pathMetric in metricsContainer) {
    _.set(metrics, pathMetric, metricsContainer[pathMetric])
  }

  if (metrics.requests && metrics.requests.count && metrics.requests.latency_sum) {
    metrics.requests.latency_avg = metrics.requests.latency_sum / metrics.requests.count
  }

  return metrics as MonitoringMetrics
}

export const setMetricsCollection = (enabled: boolean) => {
  metricCollectionEnabled = enabled
}

export const incrementMetric = (metricName: string, value?: number | undefined) => {
  if (!metricCollectionEnabled) {
    return
  }
  const realValue = value !== undefined ? value : 1

  if (!metricsContainer[metricName]) {
    metricsContainer[metricName] = realValue
  } else {
    metricsContainer[metricName] += realValue
  }
}

/**
 * Simple structure to hold the complete path of the metric and the desired value.
 * The object will be constructed to a MonitoringMetrics afterwards
 */
export interface MetricsContainer {
  [metricName: string]: number
}

export interface Status {
  botpress: string
  redis?: string
  database?: string
}

export interface MonitoringService {
  start(): Promise<void>
  stop(): void
  getStats(dateFrom: number, dateTo: number): Promise<string[]>
  getStatus(): Promise<Status>
  getRedisFactory(): (type: 'subscriber' | 'commands' | 'socket', url?: string | undefined) => Redis | undefined
}

@injectable()
export class CEMonitoringService implements MonitoringService {
  async start(): Promise<void> {}
  stop(): void {}
  async getStats(_dateFrom: number, _dateTo: number): Promise<string[]> {
    return []
  }
  async getStatus(): Promise<Status> {
    return { botpress: 'up' }
  }
  getRedisFactory() {
    return () => undefined
  }
}
