import { completionKeymap } from '@codemirror/autocomplete'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/closebrackets'
import { classHighlightStyle } from '@codemirror/highlight'
import { history, historyKeymap } from '@codemirror/history'
import { oneDarkHighlightStyle } from '@codemirror/theme-one-dark'
import { placeholder as placeholderExt, keymap, EditorView } from '@codemirror/view'
import { useCodeMirror } from '@uiw/react-codemirror'
import React, { MutableRefObject, useEffect, useRef, useState } from 'react'
import EditorFrame from './EditorFrame'
import EvalPanel from './EvalPanel'
import { BPLang, hoverInspect, bpAutocomplete, exprDecorator } from './extensions'
import { ISiTemplateProps } from './types'
import { evalStrTempl } from './utils/tokenEval'

export default function SiTemplate({
  value,
  maxHeight,
  globs,
  onChange,
  placeholder,
  invalEvalMsg,
  noGlobsEvalMsg
}: ISiTemplateProps) {
  if (!placeholder) {
    placeholder = 'event.payload !== slots.payload'
  }
  if (!maxHeight) {
    maxHeight = '100px'
  }
  const editor = useRef() as MutableRefObject<HTMLInputElement>
  const [panel, setPanel] = useState('')
  const { setContainer } = useCodeMirror({
    container: editor.current,
    value,
    maxHeight,
    basicSetup: false,
    extensions: [
      // placeholderExt(placeholder)
      // EditorView.lineWrapping,
      // classHighlightStyle
      // BPLang()
      // hoverInspect(globs)
      // oneDarkHighlightStyle,
      // bpAutocomplete(globs),
      // exprDecorator(globs),
      // history(),
      // closeBrackets(),
      // // botpressTheme,
      // keymap.of([...closeBracketsKeymap, ...historyKeymap, ...completionKeymap])
    ],
    onUpdate: update => {
      const { view } = update
      if (globs) {
        if (update.focusChanged && globs) {
          setPanel(view.hasFocus ? evalStrTempl(update.state.doc.sliceString(0), globs) : '')
        } else if (update.docChanged) {
          setPanel(evalStrTempl(update.state.doc.sliceString(0), globs))
        }
      }
      if (update.docChanged && onChange) {
        onChange(update.state.doc.sliceString(0))
      }
    }
  })

  useEffect(() => {
    if (editor.current) {
      setContainer(editor.current)
    }
  }, [editor, setContainer])

  return (
    <EditorFrame ref={editor}>
      {!globs ? (
        <EvalPanel valid={null} text={noGlobsEvalMsg} />
      ) : panel === 'INVALID' ? (
        <EvalPanel valid={false} text={invalEvalMsg} />
      ) : panel ? (
        <EvalPanel valid={true} text={panel} />
      ) : null}
    </EditorFrame>
  )
}
