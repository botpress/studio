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
  noGlobsEvalMsg: string
  type?: SI_TYPES
  globs?: any
  value?: string
  placeholder?: string
  onChange?: (newValue: string) => any
}
