import { ViewUpdate } from '@codemirror/view'

export interface IProps {
  maxHeight?: string
  value?: string
  globs?: any
  onChange?: (newValue: string) => {}
  placeholder?: string
}
