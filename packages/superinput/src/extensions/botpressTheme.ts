import { EditorView } from '@codemirror/view'

// example https://github.com/codemirror/theme-one-dark/blob/main/src/one-dark.ts

const botpressTheme = EditorView.baseTheme({
  'div.cm-panels-bottom': {
    position: 'relative'
  },
  '.cm-eval-panel': {
    padding: '5px 10px',
    backgroundColor: '#d4d4d4',
    fontFamily: 'monospace',
    zIndex: 10,
    position: 'absolute',
    width: '-webkit-fill-available',
    borderRadius: '5px',
    marginTop: '5px'
  },
  '.panel-invalid': {
    backgroundColor: '#ffa29c'
  },
  '.panel-valid': {
    backgroundColor: '#a1ffaa'
  },
  'div.cm-editor': {
    border: '1px solid black',
    borderRadius: '10px'
  },
  'span.cm-completionDetail': {
    float: 'right',
    fontSize: '0.7rem'
  },
  'span.cm-completionLabel': {
    fontSize: '0.8rem'
  },
  'div.cm-tooltip-autocomplete': {
    borderRadius: '5px'
  },
  '.cm-tooltip-autocomplete ul li.cm-options[aria-selected="true"]': {
    background: 'white',
    color: 'black',
    fontWeight: 'bold'
  },
  '.cm-tooltip-autocomplete ul li.cm-options': {
    margin: '2px'
  },
  '.cm-tooltip-autocomplete ul li:first-child': {
    borderRadius: '5px 5px 0 0'
  },
  '.cm-tooltip-autocomplete ul li:last-child': {
    borderRadius: '0 0 5px 5px'
  },
  'span.cm-completionMatchedText': {
    textDecoration: 'none'
  },
  'div.cm-tooltip.cm-completionInfo': {
    top: '0 !important',
    padding: '0',
    minWidth: '250px',
    minHeight: '55px',
    borderRadius: '7px'
  },
  'div.cm-tooltip-hover': {
    borderRadius: '4px'
  }
})

export default botpressTheme
