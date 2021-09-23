import { Renderer } from 'channel-web'

export type InfoSource = {
  lastUpdate: string
  url: string
} & Renderer.Text
