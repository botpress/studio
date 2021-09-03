import { IconName } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import { Categories } from 'common/typings'
import _ from 'lodash'
import React, { Component } from 'react'
import { ItemList, SidePanel, SidePanelSection } from '~/components/Shared/Interface'
import { SectionAction } from '~/components/Shared/Interface/typings'

export default class SidebarView extends Component<Props> {
  CATEGORY_ALL = {
    id: 'all',
    title: lang.tr('all'),
    count: null
  }

  CATEGORY_DISABLED = {
    id: 'disabled',
    title: lang.tr('disabled'),
    count: null
  }

  render() {
    const contentTypeActions: SectionAction[] = this.props.categories.enabled.map(cat => {
      return {
        id: `btn-create-${cat.id}`,
        label: lang.tr(cat.title),
        onClick: (_: React.MouseEvent) => {
          this.props.handleCategorySelected(cat.id)
          this.props.handleAdd()
        }
      }
    })

    const actions: SectionAction[] = [
      {
        tooltip: lang.tr('studio.content.sideBar.createNewContent'),
        id: 'btn-add-content',
        icon: 'add' as IconName,
        items: contentTypeActions
      }
    ]

    const contentTypes = [this.CATEGORY_ALL, ...this.props.categories.enabled].map(cat => {
      return {
        id: `btn-filter-${cat.id}`,
        label: !!cat.count ? `${lang.tr(cat.title)} (${cat.count})` : lang.tr(cat.title),
        value: cat,
        selected: cat.id === this.props.selectedId,
        actions: [
          cat !== this.CATEGORY_ALL && {
            id: `btn-list-create-${cat.id}`,
            tooltip: lang.tr('studio.content.sideBar.createNew', { name: lang.tr(cat.title) }),
            icon: 'add' as IconName,
            onClick: () => {
              this.props.handleCategorySelected(cat.id)
              this.props.handleAdd()
            }
          }
        ]
      }
    })

    const contentTypesDisabled = [this.CATEGORY_DISABLED, ...this.props.categories.disabled].map(cat => {
      return {
        id: `btn-filter-${cat.id}`,
        label: lang.tr(cat.title),
        value: cat,
        selected: cat.id === this.CATEGORY_DISABLED.id,
        actions: [
          cat.id !== this.CATEGORY_DISABLED.id && {
            id: `btn-list-warning-${cat.id}`,
            tooltip: 'Content-types is unregistered.',
            icon: 'warning-sign' as IconName
          }
        ]
      }
    })

    return (
      <SidePanel>
        <SidePanelSection label={lang.tr('studio.content.sideBar.filterByType')} actions={actions}>
          <ItemList items={contentTypes} onElementClicked={el => this.props.handleCategorySelected(el.value.id)} />
          <ItemList items={contentTypesDisabled} />
        </SidePanelSection>
      </SidePanel>
    )
  }
}

interface Props {
  categories: Categories
  handleCategorySelected: (id: string) => void
  selectedId: string
  readOnly: boolean
  handleAdd: any
}
