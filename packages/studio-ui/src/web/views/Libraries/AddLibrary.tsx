import { Button, ControlGroup, InputGroup, Radio, RadioGroup } from '@blueprintjs/core'
import axios from 'axios'
import { lang, toast } from 'botpress/shared'
import React, { useState } from 'react'
import { isOperationAllowed } from '~/components/Shared/Utils'

import Dropdown from './LibDropdown'
import style from './style.scss'
import UploadLibrary from './UploadLibrary'

interface LibEntry {
  name: string
  date: string
  description: string
  version: string
  links: {
    npm: string
    bugs: string
    homepage: string
    repository: string
  }
}

const AddLibrary = (props) => {
  const [items, setItems] = useState([])
  const [activeItem, setActiveItem] = useState<LibEntry>()

  const [processing, setProcessing] = useState(false)
  const [repoName, setRepoName] = useState('')
  const [source, setSource] = useState('npm')
  const [command, setCommand] = useState('')

  const searchChanged = async (query, event) => {
    if (event) {
      try {
        const { data } = await axios.get(`${window.STUDIO_API_PATH}/libraries/search/${query}`)

        setItems(data)
        setRepoName('')
      } catch (err) {
        toast.failure(`Error while querying the registry. ${err}`)
      }
    }
  }

  const addLib = async () => {
    setProcessing(true)

    try {
      await axios.post(`${window.STUDIO_API_PATH}/libraries/add`, {
        name: repoName || activeItem.name,
        version: activeItem?.version
      })

      toast.success('Library added successfully!')
      props.refreshLibraries()
    } catch (err) {
      toast.failure(`There was an error adding the library. Check server logs for more details ${err}`)
    } finally {
      setProcessing(false)
    }
  }

  const executeCommand = async () => {
    setProcessing(true)

    try {
      await axios.post(`${window.STUDIO_API_PATH}/libraries/executeNpm`, { command })

      toast.success('Command execution completed')
      props.refreshLibraries()
    } catch (err) {
      toast.failure(`There was an error executing the command. Check server logs for more details ${err}`)
    } finally {
      setProcessing(false)
    }
  }

  const changeSource = (source) => {
    setSource(source)
  }

  const onItemChanged = async (item: LibEntry) => {
    setActiveItem(item)

    // Not used yet, in a future update it will display a dropdown with list of versions if we don't want the latest one
    // const { data } = await props.axios.get(`/mod/libraries/details/${item.name}`)
  }

  return (
    <div>
      <div className={style.title}>{lang.tr('libraries.addLibrary')}</div>
      <RadioGroup onChange={(e) => changeSource(e.currentTarget.value)} selectedValue={source}>
        <Radio label={lang.tr('libraries.searchNpm')} value="npm" />
        <Radio label={lang.tr('libraries.searchGithub')} value="github" />
        <Radio label={lang.tr('libraries.uploadArchive')} value="archive" />

        {isOperationAllowed({ superAdmin: true }) && (
          <Radio label={lang.tr('libraries.customCommand')} value="command" />
        )}
      </RadioGroup>
      <br />

      {source === 'npm' && (
        <div>
          <h5>{lang.tr('search')}</h5>
          <Dropdown items={items} onChange={onItemChanged} onQueryChange={searchChanged} />

          {activeItem && (
            <div className={style.libInfo}>
              {lang.tr('name')}: {activeItem.name} (
              <a href={activeItem.links.repository}>{lang.tr('libraries.viewGithub')}</a>)
              <br />
              {lang.tr('description')}: {activeItem.description}
              <br />
              <br />
              <div style={{ display: 'flex' }}>
                <Button
                  onClick={addLib}
                  disabled={processing}
                  text={lang.tr(processing ? 'pleaseWait' : 'libraries.addLibrary')}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {source === 'github' && (
        <div>
          <h5>{lang.tr('libraries.searchGithub')}</h5>
          <ControlGroup>
            <InputGroup placeholder="botpress/botpress#master" onChange={(e) => setRepoName(e.currentTarget.value)} />
            <Button onClick={addLib} disabled={processing} text={processing ? 'pleaseWait' : 'libraries.addLibrary'} />
          </ControlGroup>
        </div>
      )}

      {source === 'archive' && (
        <div>
          <h5>{lang.tr('libraries.uploadArchive')}</h5>
          <UploadLibrary {...props} />
        </div>
      )}

      {source === 'command' && (
        <div>
          <h5>{lang.tr('libraries.customCommand')}</h5>
          <ControlGroup>
            <InputGroup placeholder="install axios" onChange={(e) => setCommand(e.currentTarget.value)} />
            <Button
              onClick={executeCommand}
              disabled={processing}
              text={lang.tr(processing ? 'pleaseWait' : 'execute')}
            />
          </ControlGroup>
          <br />
          {lang.tr('libraries.openConsole')}
        </div>
      )}
    </div>
  )
}

export default AddLibrary
