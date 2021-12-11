import { useEffect, useState, useRef, MutableRefObject } from 'react'
import { useCodeMirror } from '@uiw/react-codemirror'
import { defaultHighlightStyle } from '@codemirror/highlight'
import { completionKeymap } from '@codemirror/autocomplete'
import { placeholder as placeholderExt, keymap, EditorView } from '@codemirror/view'
import { history, historyKeymap } from '@codemirror/history'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/closebrackets'
import { oneDarkHighlightStyle } from '@codemirror/theme-one-dark'

import { botpressTheme, bpAutocomplete, BPLang } from './extensions'
import { evalString } from '../utils/tokenEval'
import { IProps } from './types'

import './index.css'

export default function SuperInput(props: IProps) {
  let { value, maxHeight, globs, onChange, placeholder } = props
  if (!globs) globs = {}
  if (!placeholder) placeholder = 'event.payload !== slots.payload'
  if (!maxHeight) maxHeight = '100px'
  const editor = useRef() as MutableRefObject<HTMLInputElement>
  const [panel, setPanel] = useState('')
  const { setContainer } = useCodeMirror({
    container: editor.current,
    value,
    maxHeight,
    basicSetup: false,
    extensions: [
      EditorView.lineWrapping,
      defaultHighlightStyle.fallback,
      placeholderExt(placeholder),
      BPLang(),
      oneDarkHighlightStyle,
      bpAutocomplete(globs),
      history(),
      closeBrackets(),
      botpressTheme,
      keymap.of([...closeBracketsKeymap, ...historyKeymap, ...completionKeymap])
    ],
    onUpdate: update => {
      const { view } = update
      if (update.focusChanged) setPanel(view.hasFocus ? evalString(update.state.doc.sliceString(0), globs) : '')
      else if (update.docChanged) {
        setPanel(evalString(update.state.doc.sliceString(0), globs))
        if (onChange) onChange(update.state.doc.sliceString(0))
      }
    }
  })

  useEffect(() => {
    if (editor.current) {
      setContainer(editor.current)
    }
  }, [editor, setContainer])

  return (
    <div className="bp-editor" ref={editor}>
      {panel ? (
        <div
          className={`bp-editor-panel ${panel === 'INVALID' ? 'invalid' : 'valid'}`}
          onMouseDown={e => console.log(e)}
        >
          <p>{panel}</p>
        </div>
      ) : null}
    </div>
  )
}
