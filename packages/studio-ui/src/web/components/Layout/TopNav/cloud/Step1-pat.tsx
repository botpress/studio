import { Button, InputGroup, Tooltip } from '@blueprintjs/core'

import { UnreachableCaseError } from 'common/errors'
import _, { debounce } from 'lodash'
import React, { useEffect, useMemo, useReducer } from 'react'
import { connect } from 'react-redux'
import { RootReducer } from '~/reducers'
import { LocalStoragePat } from './local-storage-pat'
import { fetchPatStatus } from './pat'

import style from './style.scss'

interface OwnProps {
  onCompleted: (pat: string) => void
}

type State =
  | {
      status: 'checking_initial_pat'
    }
  | {
      status: 'initial_pat_valid'
      initialPat: string
    }
  | {
      status: 'initial_pat_invalid'
    }
  | {
      status: 'checking_new_pat'
      newPat: string
    }
  | {
      status: 'new_pat_status_received'
      newPat: string
      valid: boolean
    }

type Action =
  | { type: 'input/updated'; value: string }
  | { type: 'newPat/validated'; value: string; valid: boolean }
  | { type: 'initialPatCheck/valid'; value: string }
  | { type: 'initialPatCheck/invalid' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'input/updated':
      return { status: 'checking_new_pat', newPat: action.value }
    case 'newPat/validated':
      return { status: 'new_pat_status_received', newPat: action.value, valid: action.valid }
    case 'initialPatCheck/valid':
      return { status: 'initial_pat_valid', initialPat: action.value }
    case 'initialPatCheck/invalid':
      return { status: 'initial_pat_invalid' }
    default:
      throw new UnreachableCaseError(action)
  }
}

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps
type Props = DispatchProps & StateProps & OwnProps

const LOCALSTORAGE_KEY = 'bp/pat'

const PatProvider = (props: Props): JSX.Element => {
  const { onCompleted } = props

  const [state, dispatch] = useReducer(reducer, { status: 'checking_initial_pat' })

  const { status } = state

  const validatePat = async (pat: string, ac: AbortController) => {
    const valid = await fetchPatStatus(pat, ac)
    dispatch({ type: 'newPat/validated', valid, value: pat })
  }

  const debounceAc = new AbortController()
  const debouncedValidatePat = useMemo(() => debounce(validatePat, 300), [])
  // Stop the invocation of the debounced function
  // after unmounting
  useEffect(() => {
    return () => {
      debouncedValidatePat.cancel()
    }
  }, [])

  useEffect(() => {
    if (status === 'checking_new_pat') {
      const { newPat } = state
      void debouncedValidatePat(newPat, debounceAc)
    }
  }, [status])

  const changeHandler = async (event) => {
    dispatch({ type: 'input/updated', value: event.target.value })
  }

  const savePat = (pat: string) => {
    localStorage.setItem(LOCALSTORAGE_KEY, pat)
    onCompleted(pat)
  }

  const onSaveClicked = async () => {
    if (status === 'new_pat_status_received' && state.valid) {
      savePat(state.newPat)
    }
  }

  if (status === 'checking_initial_pat') {
    return (
      <LocalStoragePat
        onCompleted={(value) => {
          if (value) {
            dispatch({ type: 'initialPatCheck/valid', value })
          } else {
            dispatch({ type: 'initialPatCheck/invalid' })
          }
        }}
      />
    )
  }

  if (status === 'initial_pat_valid') {
    onCompleted(state.initialPat)
    return <></>
  }

  if (status === 'initial_pat_invalid') {
    return (
      <div className={style.patContainer}>
        <InputGroup
          className={style.patInput}
          placeholder="Enter Personal Access Token"
          value={''}
          onChange={changeHandler}
          rightElement={
            <Tooltip content={'Token invalid'}>
              <Button disabled={true} icon={'error'} minimal={true} />
            </Tooltip>
          }
        />
        <Button disabled text="Save" onClick={onSaveClicked} />
      </div>
    )
  }

  if (status === 'new_pat_status_received') {
    return (
      <div className={style.patContainer}>
        <InputGroup
          className={style.patInput}
          placeholder="Enter Personal Access Token"
          value={state.newPat}
          onChange={changeHandler}
          rightElement={
            state.valid ? (
              <Button disabled={true} icon={'tick-circle'} minimal={true} />
            ) : (
              <Tooltip content={'Token invalid'}>
                <Button disabled={true} icon={'error'} minimal={true} />
              </Tooltip>
            )
          }
        />
        <Button disabled={!state.valid} text="Save" onClick={onSaveClicked} />
      </div>
    )
  }

  if (status === 'checking_new_pat') {
    return (
      <div className={style.patContainer}>
        <InputGroup
          className={style.patInput}
          placeholder="Enter Personal Access Token"
          value={state.newPat}
          onChange={changeHandler}
          rightElement={
            <Tooltip content={'Checking token status'}>
              <Button disabled={true} icon={'refresh'} minimal={true} />
            </Tooltip>
          }
        />
        <Button disabled text="Save" onClick={onSaveClicked} />
      </div>
    )
  }

  return <></>
}

const mapStateToProps = (state: RootReducer) => ({})

const mapDispatchToProps = {}

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, mapDispatchToProps)(PatProvider)
