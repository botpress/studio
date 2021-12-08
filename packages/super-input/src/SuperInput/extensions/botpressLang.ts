import { parser } from '@lezer/markdown'
import { parseMixed } from '@lezer/common'
import { LRLanguage, LanguageSupport } from '@codemirror/language'
import { javascriptLanguage, javascript } from '@codemirror/lang-javascript'

import jsRange from '../../utils/jsRange'

const botpressLang = LRLanguage.define({
  parser: parser.configure({
    wrap: parseMixed((node: any, docInput: any) => {
      let pos = 0
      return {
        parser: javascriptLanguage.parser,
        overlay: docInput.doc.text.reduce((accu: any, line: string) => {
          let matches = jsRange(line)

          if (!matches) {
            pos += line.length + 1 || 1
            return accu
          }
          let localPos = 0
          matches.forEach(match => {
            localPos = line.indexOf(match, localPos)

            accu.push({
              from: pos + localPos + (match === '{{}}' ? 1 : 2),
              to: pos + localPos + match.length - 1
            })

            localPos += match.length
          })
          pos += line.length + 1 || 1
          return accu
        }, [])
      } as any
    })
  }) as any,
  languageData: {
    autoCloseTags: '{'
  }
})

function BPLang() {
  return new LanguageSupport(botpressLang, [javascript().support])
}
export default BPLang
