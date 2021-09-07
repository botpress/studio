export interface StudioConnector {
  /** Event emitter */
  events: any
  /** An axios instance */
  axios: any
  getModuleInjector: any
  loadModuleView: any
}

interface ReactIntl {
  formatMessage(message: { id: string; defaultValue: string }, values?: { [key: string]: any }): string
}

export namespace Renderer {
  export interface Message {
    incomingEventId?: string
    isLastGroup?: boolean
    isLastOfGroup?: boolean
    isBotMessage?: boolean
    sentOn?: Date
    messageId?: number
    intl: ReactIntl
    onSendData?: (data: any) => Promise<void>
    onFileUpload?: (label: string, payload: any, file: File) => Promise<void>
    registerTranslations: (translations: any) => void
    translate: (key: string) => string
    type: string
    store: any
    bp?: StudioConnector
    keyboard?: any
    children: any
  }

  export type Button = {
    label: string
    payload: any
    preventDoubleClick: boolean
    onButtonClick: (title: any, payload: any) => void
  } & Pick<Message, 'onFileUpload'>

  export type Text = {
    text: string
    markdown: boolean
    escapeHTML: boolean
    intl?: any
    maxLength?: number
  } & Message

  export interface Option {
    label: string
    value: string
  }

  export type Dropdown = {
    options: Option[]
    buttonText?: string
    escapeHTML: boolean
    allowCreation?: boolean
    placeholderText?: string
    allowMultiple?: boolean
    width?: number
    markdown: boolean
    message: string
    displayInKeyboard?: boolean
  } & Message

  export type QuickReply = {
    buttons: any
    quick_replies: any
    disableFreeText: boolean
  } & Message

  export type QuickReplyButton = {
    allowMultipleClick: boolean
    title: string
  } & Button

  export interface FileMessage {
    file: {
      url: string
      title: string
      storage: string
      text: string
    }
    escapeTextHTML: boolean
  }

  export interface VoiceMessage {
    file: {
      type: string
      audio: string
      autoPlay?: boolean
    }

    shouldPlay: boolean
    onAudioEnded: () => void
  }

  export interface FileInput {
    onFileChanged: (event: any) => void
    name: string
    className: string
    accept: string
    placeholder: string
    disabled?: boolean
  }

  export interface Carousel {
    elements: Card[]
    settings: any
  }

  export interface Card {
    picture: string
    title: string
    subtitle: string
    buttons: CardButton[]
  }

  export interface CardButton {
    url: string
    title: string
    type: string
    payload: any
    text: string
  }
}
