import axios from 'axios'
import { FormFields, lang, SupportedFileType } from 'botpress/shared'
import cn from 'classnames'
import { isBpUrl } from 'common/url'
import React, { FC, Fragment, useState } from 'react'
import { AccessControl } from '~/components/Shared/Utils'
import style from '~/views/FlowBuilder/sidePanelTopics/form/style.scss'

import { Schema } from '../typings'

import localStyle from './style.scss'
import UrlUpload from './UrlUpload'
interface IUploadWidgetProps {
  value: string | null
  onChange(value: string | null): void
  schema: Schema & {
    $subtype: SupportedFileType
  }
}

const UploadWidget: FC<IUploadWidgetProps> = props => {
  const { value } = props
  const [error, setError] = useState<string>(null)
  const [enterUrlManually, setEnterUrlManually] = useState(false)

  React.useEffect(() => {
    if (value) {
      setEnterUrlManually(!isBpUrl(value))
    }
  }, [])

  const onError = (error: string) => {
    setError(error)
  }

  const onChange = (value: string | null) => {
    props.onChange(value)
    setError(null)
  }

  const handleToggleManually = () => {
    setEnterUrlManually(!enterUrlManually)
    setError(null)
  }

  const { $subtype: subtype, $filter: filter } = props.schema

  return (
    <AccessControl
      operation="write"
      resource="bot.media"
      fallback={<em>{lang.tr('module.builtin.types.permissionDenied')}</em>}
    >
      <Fragment>
        {!enterUrlManually && (
          <FormFields.Upload
            axios={axios.create({ baseURL: window.STUDIO_API_PATH })}
            onChange={onChange}
            value={value}
            type={subtype}
            filter={filter}
          />
        )}

        {enterUrlManually && <UrlUpload value={value} type={subtype} onChange={onChange} onError={onError} />}

        {!value && (
          <div className={localStyle.fieldContainer}>
            <a className={localStyle.toggleLink} onClick={handleToggleManually}>
              {!enterUrlManually
                ? lang.tr('module.builtin.types.enterUrlChoice')
                : lang.tr('module.builtin.types.uploadFileChoice')}
            </a>

            {error && <p className={cn(style.fieldError, localStyle.fieldError)}>{error}</p>}
          </div>
        )}
      </Fragment>
    </AccessControl>
  )
}

export default UploadWidget
