import { ToolTip } from 'botpress/shared'
import _ from 'lodash'
import React from 'react'
import { MdErrorOutline } from 'react-icons/md'

import style from '../style.scss'

interface Props {
  formData: any
  formContext: any
  name: string
  onChange: (text: string) => void
}

interface State {
  placeholder: string
}

export default class I18nManager extends React.Component<Props, State> {
  state = {
    placeholder: ''
  }

  componentDidMount() {
    this.setState({
      placeholder: this.props.formContext[this.props.name + '$' + this.props.formContext.defaultLang] || ''
    })
  }

  showMissingIcon = () => {
    const { defaultLang, activeLang } = this.props.formContext
    if (defaultLang === activeLang) {
      return false
    }

    const isDefaultLangSet = this.isPropertySet(this.props.name + '$' + defaultLang)
    const isActiveLangSet = this.isPropertySet(this.props.name + '$' + activeLang)
    const isEmpty = !this.props.formData || !this.props.formData.length

    return isDefaultLangSet && (!isActiveLangSet || isEmpty)
  }

  isPropertySet(propName) {
    const value = this.props.formContext[propName]
    if (value === undefined || (_.isArray(value) && value.length === 1 && _.every(_.values(value[0]), _.isEmpty))) {
      return false
    }

    return true
  }

  handleOnChange = (value) => {
    this.props.onChange(value)
  }

  useDefaultLangText = () => {
    const original = this.props.formContext[this.props.name + '$' + this.props.formContext.defaultLang]
    original && this.handleOnChange(original)
  }

  renderWrapped(component) {
    const isMissing = this.showMissingIcon()

    return (
      <div className={style.flexContainer}>
        {component}
        {isMissing && (
          <div className={style.missingIcon}>
            <ToolTip
              position="bottom"
              content={`Translation missing for current language (${this.props.formContext.activeLang}). Click here to copy the default language text`}
            >
              <MdErrorOutline onClick={this.useDefaultLangText} />
            </ToolTip>
          </div>
        )}
      </div>
    )
  }
}
