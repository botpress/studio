import { Button, Radio, RadioGroup } from '@blueprintjs/core'
import { ContentElement } from 'botpress/sdk'
import { confirmDialog, Dialog, lang } from 'botpress/shared'
import { LocalActionDefinition } from 'common/typings'
import _ from 'lodash'
import React, { Component } from 'react'
import Markdown from 'react-markdown'
import { connect } from 'react-redux'
import ContentPickerWidget from '~/components/Content/Select/Widget'
import { LinkDocumentationProvider } from '~/components/Util/DocumentationProvider'
import { RootReducer } from '~/reducers'

import ParametersTable, { Parameter } from './ParametersTable'
import SelectActionDropdown from './SelectActionDropdown'
import style from './style.scss'

export type ActionType = 'code' | 'message'
export type Item<T extends ActionType> = T extends 'code' ? CodeItem : T extends 'message' ? MessageItem : never

interface ActionOption {
  label: string
  value: string
  metadata: LocalActionDefinition
}

interface MessageItem {
  type: 'message'
  message: string
}

interface CodeItem {
  type: 'code'
  functionName: string
  parameters: Parameter
}

interface OwnProps {
  show: boolean
  onSubmit: (item: Item<ActionType>) => void
  onClose: () => void
  item?: Item<ActionType>
}

type StateProps = ReturnType<typeof mapStateToProps>
type Props = StateProps & OwnProps

interface State {
  actionType: ActionType
  selectedActionOption?: ActionOption
  isEdit: boolean
  messageValue: string
  functionParams: Parameter
}

const DEFAULT_STATE: State = {
  actionType: 'message',
  selectedActionOption: undefined,
  isEdit: false,
  messageValue: '',
  functionParams: {}
}

class ActionModalForm extends Component<Props, State> {
  state: State = { ...DEFAULT_STATE }

  textToItemId = (text: string) => _.get(text.match(/^say #!(.*)$/), '[1]')

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    const { item } = nextProps

    if (this.props.show || !nextProps.show) {
      return
    }

    if (!item) {
      this.resetForm()
      return
    }

    let nextState
    if (item.type === 'message') {
      nextState = { actionType: 'message', messageValue: item.message }
    } else {
      const action = this.props.actions.find((action) => action.name === item.functionName)
      nextState = {
        actionType: 'code',
        selectedActionOption: action ? this.actionToOption(action) : undefined,
        functionParams: item.parameters
      }
    }

    this.setState({ ...nextState, isEdit: Boolean(item) })
  }

  actionToOption = (action: LocalActionDefinition): ActionOption => ({
    label: action.name,
    value: action.name,
    metadata: action
  })

  handleTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ actionType: event.target.value as ActionType })
  }

  onChangeType = (type: ActionType) => () => {
    this.setState({ actionType: type })
  }

  resetForm() {
    this.setState({ ...DEFAULT_STATE, isEdit: this.state.isEdit })
  }

  renderSectionAction() {
    const paramsHelp = <LinkDocumentationProvider file="main/memory" />

    const onParamsChange = (args: any) => {
      args = _.values(args).reduce((sum, n) => {
        if (n.key === '') {
          return sum
        }
        return { ...sum, [n.key]: n.value }
      }, {})
      this.setState({ functionParams: args })
    }

    const actionsOptions = (this.props.actions || []).map(this.actionToOption)
    const selectedActionOption = this.state.selectedActionOption

    return (
      <div>
        <h5>{lang.tr('studio.flow.node.actionToRun')}</h5>
        <div className={style.section}>
          <SelectActionDropdown
            id="select-action"
            value={this.state.selectedActionOption || ''}
            options={actionsOptions}
            onChange={(newOption: ActionOption) => {
              this.setState({ selectedActionOption: newOption })

              if (
                Object.keys(this.state.functionParams || {}).length > 0 &&
                !confirmDialog(lang.tr('studio.flow.node.confirmOverwriteParameters'), {
                  acceptLabel: lang.tr('overwrite')
                })
              ) {
                return
              }

              this.setState({
                functionParams: _.fromPairs(newOption.metadata.params.map((param) => [param.name, param.default || '']))
              })
            }}
          />
          {selectedActionOption && (
            <>
              <h4>{selectedActionOption.metadata.title}</h4>
              <Markdown source={selectedActionOption.metadata.description} />
            </>
          )}
        </div>
        {selectedActionOption && (
          <>
            <h5>
              {lang.tr('studio.flow.node.actionParameters')} {paramsHelp}
            </h5>
            <div className={style.section}>
              <ParametersTable
                onChange={onParamsChange}
                value={this.state.functionParams}
                definitions={selectedActionOption.metadata.params}
              />
            </div>
          </>
        )}
      </div>
    )
  }

  renderSectionMessage() {
    const handleChange = (item: ContentElement) => {
      this.setState({ messageValue: `say #!${item.id}` })
    }

    const itemId = this.textToItemId(this.state.messageValue)

    return (
      <div>
        <h5>{lang.tr('studio.flow.node.message')}:</h5>
        <div className={style.section}>
          <ContentPickerWidget
            itemId={itemId}
            onChange={handleChange}
            placeholder={lang.tr('studio.flow.node.messageToSend')}
          />
        </div>
      </div>
    )
  }

  onSubmit = () => {
    if (this.state.actionType === 'message') {
      this.props.onSubmit({ type: this.state.actionType, message: this.state.messageValue })
    } else {
      this.props.onSubmit?.({
        type: this.state.actionType,
        functionName: this.state.selectedActionOption?.value,
        parameters: this.state.functionParams
      } as CodeItem)
    }
    this.resetForm()
  }

  onClose = () => {
    this.resetForm()
    this.props.onClose?.()
  }

  isValid = () => {
    switch (this.state.actionType) {
      case 'code':
        return this.state.selectedActionOption?.value.length
      case 'message':
        return this.state.messageValue.length
      default:
        return false
    }
  }

  handleAltEnter = (event: React.KeyboardEvent) => {
    if (event.altKey && event.key === 'Enter' && this.isValid()) {
      this.onSubmit()
    }
  }

  render() {
    const formId = 'action-modal-form'

    return (
      <div onKeyDown={this.handleAltEnter}>
        <Dialog.Wrapper
          size="md"
          title={this.state.isEdit ? lang.tr('studio.flow.node.editAction') : lang.tr('studio.flow.node.addAction')}
          isOpen={this.props.show}
          onClose={this.onClose}
          onSubmit={this.onSubmit}
          id={formId}
        >
          <Dialog.Body>
            <>
              <div className={style.section}>
                <h5>{lang.tr('studio.flow.node.theBotWill')}</h5>
                <RadioGroup onChange={this.handleTypeChange} selectedValue={this.state.actionType}>
                  <Radio label={lang.tr('studio.flow.node.saySomething')} value="message" />
                  <Radio label={lang.tr('studio.flow.node.executeCode')} value="code" />
                </RadioGroup>
              </div>
              {this.state.actionType === 'message' ? this.renderSectionMessage() : this.renderSectionAction()}
            </>
          </Dialog.Body>
          <Dialog.Footer>
            <Button title={lang.tr('cancel')} onClick={this.onClose} form={formId} text={lang.tr('cancel')} />
            <Button
              intent="primary"
              id="btn-submit-action"
              type="submit"
              form={formId}
              disabled={!this.isValid()}
              text={
                this.state.isEdit
                  ? lang.tr('studio.flow.node.finishUpdateAction')
                  : lang.tr('studio.flow.node.finishAddAction')
              }
            />
          </Dialog.Footer>
        </Dialog.Wrapper>
      </div>
    )
  }
}

const mapStateToProps = (state: RootReducer) => ({
  actions: state.skills.actions?.filter((a) => a.legacy)
})

export default connect(mapStateToProps)(ActionModalForm)
