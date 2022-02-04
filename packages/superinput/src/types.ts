export interface IPanelProps {
  valid: boolean | null
  text: string
}

export enum SI_TYPES {
  TEMPLATE = 0,
  EXPRESSION = 1,
  BOOL = 2
}

export interface ISiProps {
  value?: string
  onChange?: (newValue: string) => any
  placeholder?: string
  type?: SI_TYPES
  eventState?: any
  noGlobsEvalMsg?: string
  autoFocus?: boolean
}
