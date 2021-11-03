import { Commander, lang, QuickShortcut } from 'botpress/shared'
import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'
import { fetchContentCategories, toggleBottomPanel } from '~/actions'
import { RootReducer } from '~/reducers'

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps

type Props = DispatchProps &
  StateProps &
  RouteComponentProps & {
    toggleEmulator: () => void
  }

const CommandPalette: FC<Props> = props => {
  const [commands, setCommands] = useState<QuickShortcut[]>([])

  useEffect(() => {
    const commands: QuickShortcut[] = [
      {
        label: lang.tr('flows'),
        type: 'goto',
        category: 'studio',
        url: '/flows/main'
      },
      { label: lang.tr('content'), type: 'goto', category: 'studio', url: '/content' },
      {
        label: lang.tr('commander.links.chat'),
        category: 'external',
        type: 'popup',
        url: `${window.location.origin}/s/${window.BOT_ID}`
      },
      {
        label: lang.tr('toolbar.toggleBottomPanel'),
        category: 'command',
        shortcut: 'ctrl+j',
        type: 'execute',
        method: props.toggleBottomPanel
      },
      {
        label: lang.tr('toolbar.toggleEmulator'),
        category: 'command',
        shortcut: 'ctrl+e',
        type: 'execute',
        method: props.toggleEmulator
      },
      {
        label: lang.tr('toolbar.toggleSidePanel'),
        category: 'command',
        shortcut: 'ctrl+b',
        type: 'execute',
        method: () => window.toggleSidePanel()
      }
    ]

    setCommands(commands)
  }, [props.contentTypes])

  return <Commander location="studio" history={props.history} user={props.user} shortcuts={commands} />
}

const mapStateToProps = (state: RootReducer) => ({
  contentTypes: state.content.categories.registered,
  user: state.user
})

const mapDispatchToProps = { fetchContentCategories, toggleBottomPanel }

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(CommandPalette))
