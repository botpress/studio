import { Button, InputGroup, Icon, Spinner, IconSize } from '@blueprintjs/core'
import axios from 'axios'
import _, { debounce } from 'lodash'
import React, { useEffect, useMemo, useReducer, useState } from 'react'
import { connect } from 'react-redux'
import { updateUserPersonalAccessToken } from '~/actions'
import { RootReducer } from '~/reducers'

const fetchPatStatus = async (pat: string, ac: AbortController): Promise<boolean> => {
  const resp = await axios.get(`${window.CLOUD_CONTROLLER_ENDPOINT}/v1/authentication/pat`, {
    headers: { Authorization: `bearer ${pat}` },
    validateStatus: () => true,
    signal: ac.signal
  })

  const authenticated = resp.status === 200 && resp.headers['x-user-id'] !== undefined
  return authenticated
}

interface OwnProps {
  onCompleted: (pat: string) => void
}

type State =
  | {
      initialPatValue: null
      pat: null
      patValid: false
    }
  | { initialPatValue: null; pat: string; patValid: boolean }
  | { initialPatValue: string; pat: string; patValid: true }

type Action =
  | { type: 'savebtn/clicked' }
  | { type: 'input/updated'; value: string }
  | { type: 'pat/validated'; valid: boolean }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'savebtn/clicked':
      return { ...state }
    case 'input/updated':
      return { ...state, pat: action.value }
    case 'pat/validated':
      if (_.isNull(state.initialPatValue) && _.isString(state.pat)) {
        const { initialPatValue, pat } = state
        return { pat, initialPatValue, patValid: action.valid }
      }
      throw new Error(`invalid state action: ${JSON.stringify(action)} for state: ${JSON.stringify(state)}`)
    default:
      throw new Error(`unknown action: ${JSON.stringify(action)}`)
  }
}

function init(props: Props): State {
  const initialPatValue = localStorage.getItem(LOCALSTORAGE_KEY)

  if (initialPatValue === null) {
    return { initialPatValue, pat: initialPatValue, patValid: false }
  }
  return { initialPatValue, pat: initialPatValue, patValid: true }
}

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps
type Props = DispatchProps & StateProps & OwnProps

const LOCALSTORAGE_KEY = 'bp/pat'

const PatInput = (props: Props): JSX.Element => {
  const { onCompleted } = props

  const [state, dispatch] = useReducer(reducer, props, init)

  const { initialPatValue, pat, patValid } = state

  // useEffect(() => {
  //   const ac = new AbortController()

  //   const checkUserAuthentication = async (pat: string) => {
  //     const patValid = await fetchPatStatus(pat, ac)
  //     if (!initialCheckCompleted) {
  //       setInitialCheckCompleted(true)
  //     }
  //     setPatValid(patValid)
  //   }

  //   if (pat && pat.length > 0) {
  //     void checkUserAuthentication(pat)
  //   }

  //   return () => ac.abort()
  // }, [pat])

  const validatePat = async (pat: string, ac: AbortController) => {
    const valid = await fetchPatStatus(pat, ac)
    dispatch({ type: 'pat/validated', valid })
  }

  const savePat = (pat: string) => {
    localStorage.setItem(LOCALSTORAGE_KEY, pat)
    onCompleted(pat)
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

  const changeHandler = async (event) => {
    dispatch({ type: 'input/updated', value: event.target.value })
    void debouncedValidatePat(event.target.value, debounceAc)
  }

  const onSaveClicked = async () => {
    if (pat) {
      savePat(pat)
    }
  }

  if (initialPatValue && patValid) {
    onCompleted(pat)
    return <></>
  }

  return (
    <div>
      <InputGroup
        placeholder="Enter Personal Access Token"
        value={pat || ''}
        onChange={changeHandler}
        rightElement={patValid ? <Icon icon="tick-circle" /> : <Icon icon="error" />}
      />
      <Button disabled={!patValid} text="Save" onClick={onSaveClicked} />
    </div>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  // user: state.user
})

const mapDispatchToProps = {
  // fetchUser,
  // updateUserPersonalAccessToken
}

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, mapDispatchToProps)(PatInput)
