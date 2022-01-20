import { ViewUpdate } from '@codemirror/view'

export interface IPanelProps {
  valid: boolean | null
  text: string
}

interface ISiProps {
  globs?: any
  value?: string
  placeholder?: string
  maxHeight?: string
  invalEvalMsg: string
  noGlobsEvalMsg: string
  onChange?: (newValue: string) => any
}

export interface ISiBoolProps extends ISiProps {}
export interface ISiTemplateProps extends ISiProps {}
export interface ISiExpressionProps extends ISiProps {}
