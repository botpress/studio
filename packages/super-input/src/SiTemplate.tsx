import { useEffect, useState, useRef, MutableRefObject } from 'react'
import { useCodeMirror } from '@uiw/react-codemirror'
import { classHighlightStyle } from '@codemirror/highlight'
import { completionKeymap } from '@codemirror/autocomplete'
import { placeholder as placeholderExt, keymap, EditorView } from '@codemirror/view'
import { history, historyKeymap } from '@codemirror/history'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/closebrackets'
import { oneDarkHighlightStyle } from '@codemirror/theme-one-dark'

import EditorFrame from './EditorFrame'
import EvalPanel from './EvalPanel'
import { botpressTheme, bpAutocomplete, BPLang, hoverInspect, exprDecorator } from './extensions'
import { evalStrTempl } from './utils/tokenEval'
import { ISiTemplateProps } from './types'

export default function SiTemplate({
  value,
  maxHeight,
  globs,
  onChange,
  placeholder,
  invalEvalMsg,
  noGlobsEvalMsg
}: ISiTemplateProps) {
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
      classHighlightStyle,
      placeholderExt(placeholder),
      BPLang(),
      hoverInspect(globs),
      oneDarkHighlightStyle,
      bpAutocomplete(globs),
      exprDecorator(globs),
      history(),
      closeBrackets(),
      botpressTheme,
      keymap.of([...closeBracketsKeymap, ...historyKeymap, ...completionKeymap])
    ],
    onUpdate: update => {
      const { view } = update
      if (globs) {
        if (update.focusChanged && globs)
          setPanel(view.hasFocus ? evalStrTempl(update.state.doc.sliceString(0), globs) : '')
        else if (update.docChanged) setPanel(evalStrTempl(update.state.doc.sliceString(0), globs))
      }
      if (update.docChanged && onChange) onChange(update.state.doc.sliceString(0))
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
