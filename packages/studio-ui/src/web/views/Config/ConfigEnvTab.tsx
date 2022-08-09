import { Button, FormGroup, InputGroup, ControlGroup } from '@blueprintjs/core'

import { lang } from 'botpress/shared'

import React, { Component, FC, useEffect, useState } from 'react'

interface ConfigEntry {
  name: string
  value: string
}

interface EntryProps {
  name: string
  value: string
  onChange: (key: string, value: string) => void
  onDelete: () => void
}

const Entry: FC<EntryProps> = props => {
  const [name, setName] = useState(props.name || '')
  const [value, setValue] = useState(props.value || '')

  useEffect(() => {
    console.log(props.name, props.value)
  }, [])

  const update = () => {
    props.onChange(name, value)
  }

  return (
    <div>
      <ControlGroup>
        <FormGroup label="Key" style={{ width: 250 }} inline>
          <InputGroup
            placeholder="KEY_NAME"
            value={name}
            onChange={e => setName(e.currentTarget.value)}
            onBlur={update}
            maxLength={50}
          />
        </FormGroup>

        <FormGroup label="Value" style={{ width: 450 }} inline>
          <InputGroup
            placeholder="value"
            value={value}
            onChange={e => setValue(e.currentTarget.value)}
            onBlur={update}
            maxLength={500}
            style={{ width: 400 }}
            fill
          />
        </FormGroup>

        <div style={{ height: 20 }}>
          <Button icon="trash" onClick={props.onDelete}></Button>
        </div>
      </ControlGroup>
    </div>
  )
}

interface ConfigEnvTabProps {
  env: Record<string, string>
  onChange: (configEnv: any) => void
}

const ConfigEnvTab: FC<ConfigEnvTabProps> = props => {
  const [entries, setEntries] = useState<ConfigEntry[]>([])

  useEffect(() => {
    setEntries(Object.keys(props.env).map(x => ({ name: x, value: props.env[x] })))
  }, [])

  const updateEntry = (index: number, name: string, value: string): void => {
    entries[index] = { name, value }
    setEntries([...entries])
  }

  useEffect(() => {
    props.onChange(
      entries.reduce((acc, curr) => {
        return { ...acc, [curr.name]: curr.value }
      }, {})
    )
  }, [entries])

  return (
    <div>
      <h1>{lang.tr('Configuration Variables')}</h1>

      <p>
        You can define configuration variables that will be accessible inside your Hooks and Actions. Values are not
        synchronized automatically on the cloud and must be configured manually. <a href="">Learn More</a>{' '}
        <code>bp.env.forBot('botId').MY_KEY</code>
      </p>
      <div>
        {entries.map((x, idx) => (
          <Entry
            key={x.name}
            name={x.name}
            value={x.value}
            onChange={(key, value) => updateEntry(idx, key, value)}
            onDelete={() => setEntries(entries.filter((x, index) => index !== idx))}
          ></Entry>
        ))}
        <Button
          icon="add"
          text="Add"
          onClick={() => {
            setEntries([...entries, { name: '', value: '' }])
          }}
        ></Button>
        <br></br> <br></br> <br></br>
      </div>
    </div>
  )
}

export default ConfigEnvTab
