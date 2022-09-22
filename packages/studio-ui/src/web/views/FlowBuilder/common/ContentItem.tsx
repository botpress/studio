import { Classes } from '@blueprintjs/core'
import { ContentElement } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import cx from 'classnames'
import { escapeHtmlChars } from 'common/html'
import { random } from 'lodash'
import Mustache from 'mustache'
import React, { useEffect, useMemo, useState } from 'react'
import Markdown from 'react-markdown'
import { connect } from 'react-redux'
import { fetchContentItem, refreshFlowsLinks } from '~/actions'
import { isMissingCurlyBraceClosure } from '~/components/Util/form.util'
import { RootReducer } from '~/reducers'
import { isRTLLocale } from '~/translations'
import { recursiveSearch, restoreDots, stripDots } from '~/util'
import InspectorPopover from './InspectorPopover'

import style from './style.scss'

const missingTranslationPrefix = '(missing translation)'

interface OwnProps {
  text: string
  className: string
}

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps

type Props = DispatchProps & StateProps & OwnProps

export const textToItemId = (text: string) => text?.match(/^say #!(.*)$/)?.[1]

const ContentItem = (props: Props) => {
  const [loading, setIsLoading] = useState(true)
  const itemID = textToItemId(props.text)
  const contentItem = props.contentElementsByID[itemID]

  const strOfRandomLength = useMemo(() => Array(random(10, 30)).fill('a').join(''), [props.text])

  useEffect(() => {
    if (loading && contentItem) {
      setIsLoading(false)
    } else {
      // @ts-ignore
      props.fetchContentItem(itemID, { batched: true }).then((data: ContentElement) => {
        props.refreshFlowsLinks(data) // taken from previous implementation
        setIsLoading(false)
      })
    }
  }, [loading])

  // This is taken as is from previous implementation
  // TODO replace this by typed components
  const legacyHTMLRenderer = () => {
    const preview = contentItem.previews[props.contentLang] ?? ''
    const textContent = escapeHtmlChars(`${lang.tr(contentItem.schema?.title)} | ${preview}`)
    const vars = {}

    const htmlTpl = textContent.replace(/{{([a-z$@0-9. _-]*?)}}/gi, (x) => {
      const name = stripDots(x.replace(/{|}/g, ''))
      vars[name] = `<span class="var">${x}</span>`
      return `{${stripDots(x)}}`
    })

    let mustached = restoreDots(htmlTpl)

    if (!isMissingCurlyBraceClosure(htmlTpl)) {
      mustached = restoreDots(Mustache.render(htmlTpl, vars))
    }

    return mustached
  }

  {
    /* This logic will be changed by some typed and well scoped components that depend on the schema type until then legacy logic is kept */
  }
  const legacyBodyRendering = () => {
    const hasImageSubtype = recursiveSearch(contentItem?.schema?.json, '$subtype')?.indexOf('image') !== -1
    if (hasImageSubtype) {
      return (
        <Markdown
          source={contentItem.previews[props.contentLang]}
          renderers={{
            image: (props) => <img {...props} className={style.imagePreview} />,
            link: (props) => (
              <a href={props.href} target="_blank">
                {props.children}
              </a>
            )
          }}
        />
      )
    } else {
      const html = { __html: legacyHTMLRenderer() }
      const isMissingTranslation = contentItem.previews[props.contentLang]?.startsWith(missingTranslationPrefix)
      return (
        <span
          className={cx(style.name, { [style.missingTranslation]: isMissingTranslation })}
          dangerouslySetInnerHTML={html}
        />
      )
    }
  }

  return (
    <InspectorPopover
      icon={<span className={style.icon}>💬</span>}
      title={lang.tr('studio.flow.node.saySomething')}
      body={loading ? null : legacyBodyRendering()}
    >
      <div
        className={cx(props.className, style['action-item'], {
          [style.rtl]: isRTLLocale(props.contentLang)
        })}
      >
        <span className={style.icon}>💬</span>
        {loading && <span className={Classes.SKELETON}>{strOfRandomLength}</span>}
        {!loading && legacyBodyRendering()}
      </div>
    </InspectorPopover>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  contentElementsByID: state.content.itemsById,
  contentLang: state.language.contentLang
})

const mapDispatchToProps = {
  fetchContentItem,
  refreshFlowsLinks
}

export default connect(mapStateToProps, mapDispatchToProps)(ContentItem)
