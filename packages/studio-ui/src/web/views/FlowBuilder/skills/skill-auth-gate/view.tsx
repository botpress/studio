import { Button, Checkbox, FormGroup, InputGroup } from '@blueprintjs/core'
import { lang, toast } from 'botpress/shared'

import cx from 'classnames'
import React, { FC, useEffect, useState } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import ContentPickerWidget from '~/components/Content/Select/Widget'
import { InfoTooltip } from '~/components/Shared/Interface'
import { SkillProps } from '../typings'

import style from './style.scss'

export interface AuthGateProps {
  loginMessage: string
  inviteMessage: string
  promptLogin: boolean
  inviteCodeRetry: number
}

export const AuthGate: FC<SkillProps<AuthGateProps>> = (props) => {
  const [inviteCodeRetry, setInviteCodeRetry] = useState<number>(3)
  const [promptLogin, setPromptLogin] = useState<boolean>(false)
  const [loginMessage, setLoginMessage] = useState<string>()
  const [inviteMessage, setInviteMessage] = useState<string>()

  useEffect(() => {
    props.onDataChanged({ loginMessage, inviteMessage, promptLogin, inviteCodeRetry })
    props.onValidChanged(true)
  }, [loginMessage, inviteMessage, promptLogin])

  useEffect(() => {
    const { loginMessage, inviteMessage, promptLogin, inviteCodeRetry } = props.initialData

    setPromptLogin(promptLogin)
    setLoginMessage(loginMessage)
    setInviteMessage(inviteMessage)
    setInviteCodeRetry(inviteCodeRetry || 3)

    props.resizeBuilderWindow('small')
  }, [])

  return (
    <div>
      <div className={cx(style.element, style.flex)}>
        <Checkbox
          checked={promptLogin}
          onChange={(e) => setPromptLogin(e.currentTarget.checked)}
          label={lang.tr('skills.authGate.promptUnauthenticated')}
        />

        <div style={{ marginLeft: 5 }}>
          <InfoTooltip text={lang.tr('skills.authGate.whenChecked')} />
        </div>
      </div>

      {promptLogin && (
        <div>
          <div className={style.element}>
            <div className={style.title}>{lang.tr('skills.authGate.loginPromptMessage')}</div>
            <ContentPickerWidget
              itemId={loginMessage}
              onChange={(content) => setLoginMessage(content.id)}
              placeholder={lang.tr('skills.authGate.selectContent')}
            />

            <blockquote className={cx('bp3-blockquote', style.details)}>
              {lang.tr('skills.authGate.loginUrl')}
              {'  '}
              <InfoTooltip text={lang.tr('skills.authGate.urlTooltip')} />
              <br />
              <code>{lang.tr('skills.authGate.loginLink')}</code>
              <CopyToClipboard
                text={lang.tr('skills.authGate.loginLink')}
                onCopy={() => toast.info(lang.tr('skills.authGate.copiedToClipboard'))}
              >
                <Button icon="clipboard" minimal />
              </CopyToClipboard>
            </blockquote>
          </div>

          <div className={style.element}>
            <div className={style.title}>{lang.tr('skills.authGate.inviteMessage')}</div>
            <ContentPickerWidget
              itemId={inviteMessage}
              onChange={(content) => setInviteMessage(content.id)}
              placeholder={lang.tr('skills.authGate.invitePlaceholder')}
            />
          </div>

          <div className={cx(style.element, style.retry)}>
            <FormGroup label={lang.tr('skills.authGate.retryLimit')}>
              <InputGroup
                value={inviteCodeRetry.toString()}
                onChange={(e) => setInviteCodeRetry(Number(e.currentTarget.value))}
              />
            </FormGroup>
          </div>
        </div>
      )}
    </div>
  )
}
