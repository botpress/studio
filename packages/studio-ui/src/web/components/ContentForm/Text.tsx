import { lang } from 'botpress/shared'
import React, { FC, useEffect, useRef, useState } from 'react'
import SmartInput from '~/components/SmartInput'
import style from '~/views/FlowBuilder/sidePanelTopics/form/style.scss'

import { isMissingCurlyBraceClosure } from '../Util/form.util'

interface Props {
  formData: any
  formContext: any
  schema: any
  required?: boolean
  uiSchema: any
  onChange: () => any
}

const Text: FC<Props> = (props) => {
  const { formContext, formData, schema, required, uiSchema, onChange } = props
  const key = useRef(`${formContext?.customKey}`)

  useEffect(() => {
    key.current = `${formContext?.customKey}`
  }, [formContext?.customKey])

  return (
    <div className={style.fieldWrapper}>
      <span className={style.formLabel}>
        {schema.title} {required && '*'}
      </span>
      <div className={style.innerWrapper}>
        <SmartInput
          key={key.current}
          singleLine={uiSchema.$subtype !== 'textarea'}
          value={formData}
          onChange={onChange}
          className={style.textarea}
          isSideForm
        />
        {isMissingCurlyBraceClosure(formData) && (
          <p className={style.fieldError}>{lang.tr('studio.content.missingClosingCurlyBrace')}</p>
        )}
      </div>
    </div>
  )
}

export default Text
