import { Button } from '@blueprintjs/core'
import { Dialog, lang } from 'botpress/shared'
import React from 'react'
import ArrayField from 'react-jsonschema-form/lib/components/fields/ArrayField'
import I18nManager from './I18nManager'

export default class ArrayMl extends I18nManager {
  state = {
    isOpen: false,
    text: []
  }

  componentDidMount() {
    const schemaProps = this.props.schema.items.properties
    const propertyNames = Object.keys(schemaProps)

    const requiredFormat = propertyNames.map((p) => schemaProps[p].title).join('|')

    const text =
      this.props.formData && this.props.formData.map((el) => propertyNames.map((p) => el[p]).join('|')).join('\n')

    this.setState({ text, requiredFormat, propertyNames })
  }

  handleTextareaChanged = (event) => this.setState({ text: event.target.value })
  toggle = () => this.setState({ isOpen: !this.state.isOpen })

  extractChoices = () => {
    const choices = this.state.text.split('\n').map((line) => {
      const split = line.split('|')

      return this.state.propertyNames.reduce((result, prop, idx) => {
        result[prop] = split[idx]
        return result
      }, {})
    })

    this.handleOnChange(choices)
    this.toggle()
  }

  renderTextarea() {
    return (
      <React.Fragment>
        This input lets you quickly manage the entries of your content element. Add each element on a different line.
        You will have a chance to review your changes after saving on this modal.
        <br />
        <br />
        Expected format: <strong>{this.state.requiredFormat}</strong>
        <textarea
          style={{ width: '100%', height: '80%', marginTop: 8 }}
          onChange={this.handleTextareaChanged}
          value={this.state.text}
        />
      </React.Fragment>
    )
  }

  renderModal() {
    return (
      <Dialog.Wrapper size="md" title="Quick Editor" isOpen={this.state.isOpen} onClose={this.toggle}>
        <Dialog.Body> {this.renderTextarea()}</Dialog.Body>
        <Dialog.Footer>
          <Button intent="primary" onClick={this.extractChoices} title={lang.tr('save')} />
          <Button onClick={this.toggle} title={lang.tr('cancel')} />
        </Dialog.Footer>
      </Dialog.Wrapper>
    )
  }

  render() {
    return (
      <div>
        <div style={{ float: 'right', position: 'absolute', right: 30 }}>
          <Button minimal onClick={this.toggle} title="Quick Editor" />
        </div>
        {this.renderWrapped(
          <ArrayField {...this.props} formData={this.props.formData} onChange={this.handleOnChange} />
        )}
        {this.renderModal()}
      </div>
    )
  }
}
