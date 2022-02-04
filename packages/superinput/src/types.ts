export interface PanelProps {
  valid: boolean | null
  text: string
}

export enum SiTypes {
  TEMPLATE = 'template',
  EXPRESSION = 'expression',
  BOOL = 'bool'
}

export interface SiProps {
  value?: string
  onChange?: (newValue: string) => any
  placeholder?: string
  type?: SiTypes
  eventState?: any
  noGlobsEvalMsg?: string
  autoFocus?: boolean
}
