import { Button } from '@blueprintjs/core'
import axios from 'axios'
import { confirmDialog, lang, toast, ModuleUI } from 'botpress/shared'
import React, { useEffect, useState } from 'react'

import AddLibrary from './AddLibrary'
import style from './style.scss'

export interface InstalledLibrary {
  name: string
  version: string
}

const { Container, ItemList, SidePanel, SidePanelSection, SplashScreen } = ModuleUI

const MainView = props => {
  const [libraries, setLibraries] = useState([])
  const [page, setPage] = useState('splash')
  const [lib, setLib] = useState<InstalledLibrary>()
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    refreshLibraries()
  }, [])

  const refreshLibraries = async () => {
    const { data } = await axios.get(`${window.STUDIO_API_PATH}/libraries/list`)

    setLibraries(
      Object.entries(data).map(([name, version]) => ({
        label: (
          <span>
            <strong>{name}</strong> <small>{version}</small>
          </span>
        ),
        data: { name, version },
        value: name,
        contextMenu: [
          {
            label: lang.tr('delete'),
            icon: 'delete',
            onClick: () => deleteLibrary(name)
          }
        ]
      }))
    )
  }

  const deleteLibrary = async (name: string) => {
    if (!(await confirmDialog(lang.tr('libraries.confirmRemove'), { acceptLabel: 'Remove' }))) {
      return
    }

    try {
      await axios.post(`${window.STUDIO_API_PATH}/libraries/delete`, { name })
      await refreshLibraries()
      toast.info('libraries.deleteSuccess')
    } catch (err) {
      toast.failure('libraries.removeFailure')
    }
  }

  const syncLibs = async () => {
    setProcessing(true)

    try {
      await axios.post(`${window.STUDIO_API_PATH}/libraries/sync`)
      await refreshLibraries()
      toast.info('libraries.syncSuccess')
    } catch (err) {
      toast.failure(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleLibClicked = item => {
    setLib(item.data)
  }

  const commonProps = { refreshLibraries, setPage }

  return (
    <Container>
      <SidePanel>
        <SidePanelSection
          label={lang.tr('libraries.fullName')}
          actions={[{ icon: 'add', tooltip: lang.tr('add'), onClick: () => setPage('add') }]}
        >
          <ItemList items={libraries} onElementClicked={handleLibClicked} />
        </SidePanelSection>
      </SidePanel>
      <div>
        {page === 'splash' && (
          <SplashScreen
            icon="book"
            title={lang.tr('libraries.fullName')}
            description={
              <div>
                {lang.tr('libraries.splash.text1')}
                <br />
                <br />
                {lang.tr('libraries.splash.text2')}
                <br />
                <br />
                <Button
                  onClick={syncLibs}
                  disabled={processing}
                  text={lang.tr(processing ? 'pleaseWait' : 'libraries.sync')}
                />
              </div>
            }
          />
        )}

        <div className={style.container}>{page === 'add' && <AddLibrary {...commonProps} />}</div>
      </div>
    </Container>
  )
}

export default MainView
