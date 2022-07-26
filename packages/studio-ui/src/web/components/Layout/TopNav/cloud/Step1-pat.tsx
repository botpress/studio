import { Button, InputGroup, Icon } from '@blueprintjs/core'
import axios from 'axios'
import _, { debounce } from 'lodash'
import React, { useEffect, useMemo, useReducer } from 'react'
import { connect } from 'react-redux'
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

interface InitialState {
  initialPatValue: string | null
  initialPatValid: false
  validatingInitialPat: true
  newPat: null
  newPatValid: false
}

type State =
  | InitialState
  | { initialPatValue: null; initialPatValid: false; validatingInitialPat: false; newPat: string; newPatValid: boolean }
  | { initialPatValue: string; initialPatValid: boolean; validatingInitialPat: false; newPat: null; newPatValid: false }
  | {
      initialPatValue: string
      initialPatValid: false
      validatingInitialPat: false
      newPat: string
      newPatValid: boolean
    }

type Action =
  | { type: 'input/updated'; value: string }
  | { type: 'newPat/validated'; valid: boolean }
  | { type: 'initialPat/validated'; valid: boolean }

function reducer(state: State, action: Action): State {
  const { initialPatValue, initialPatValid, validatingInitialPat, newPat, newPatValid } = state

  switch (action.type) {
    case 'input/updated':
      if (_.isNull(initialPatValue) && initialPatValid === false && validatingInitialPat === false) {
        return { initialPatValue, initialPatValid, validatingInitialPat, newPat: action.value, newPatValid }
      }
      if (_.isString(initialPatValue) && initialPatValid === false && validatingInitialPat === false) {
        return { initialPatValue, initialPatValid, validatingInitialPat, newPat: action.value, newPatValid }
      }
      throw new Error(`invalid action: ${JSON.stringify(action)} for state: ${JSON.stringify(state)}`)
    case 'newPat/validated':
      if (
        _.isNull(initialPatValue) &&
        initialPatValid === false &&
        _.isString(newPat) &&
        validatingInitialPat === false
      ) {
        return { initialPatValue, initialPatValid, validatingInitialPat, newPat, newPatValid: action.valid }
      }
      if (
        _.isString(initialPatValue) &&
        initialPatValid === false &&
        _.isString(newPat) &&
        validatingInitialPat === false
      ) {
        return { initialPatValue, initialPatValid, validatingInitialPat, newPat, newPatValid: action.valid }
      }
      throw new Error(`invalid action: ${JSON.stringify(action)} for state: ${JSON.stringify(state)}`)
    case 'initialPat/validated':
      if (_.isString(initialPatValue) && _.isNull(newPat) && newPatValid === false && validatingInitialPat === true) {
        return { initialPatValue, initialPatValid: action.valid, validatingInitialPat: false, newPat, newPatValid }
      }
      throw new Error(`invalid action: ${JSON.stringify(action)} for state: ${JSON.stringify(state)}`)
    default:
      throw new Error(`unknown action: ${JSON.stringify(action)}`)
  }
}

function init(props: Props): State {
  const initialPatValue = localStorage.getItem(LOCALSTORAGE_KEY)

  if (initialPatValue === null) {
    return { initialPatValue, initialPatValid: false, validatingInitialPat: true, newPat: null, newPatValid: false }
  }
  return { initialPatValue, initialPatValid: false, validatingInitialPat: true, newPat: null, newPatValid: false }
}

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps
type Props = DispatchProps & StateProps & OwnProps

const LOCALSTORAGE_KEY = 'bp/pat'

const PatInput = (props: Props): JSX.Element => {
  const { onCompleted } = props

  const [state, dispatch] = useReducer(reducer, props, init)

  const { initialPatValue, initialPatValid, validatingInitialPat, newPat, newPatValid } = state

  useEffect(() => {
    const ac = new AbortController()

    const validateInitialPat = async (pat: string) => {
      const valid = await fetchPatStatus(pat, ac)
      dispatch({ type: 'initialPat/validated', valid })
    }

    if (initialPatValue) {
      void validateInitialPat(initialPatValue)
    }

    return () => ac.abort()
  }, [initialPatValue])

  const validatePat = async (pat: string, ac: AbortController) => {
    const valid = await fetchPatStatus(pat, ac)
    dispatch({ type: 'newPat/validated', valid })
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
    if (newPat) {
      void debouncedValidatePat(newPat, debounceAc)
    }
  }, [newPat])

  const changeHandler = async (event) => {
    dispatch({ type: 'input/updated', value: event.target.value })
  }

  const savePat = (pat: string) => {
    localStorage.setItem(LOCALSTORAGE_KEY, pat)
    onCompleted(pat)
  }

  const onSaveClicked = async () => {
    if (newPat && newPatValid) {
      savePat(newPat)
    }
  }

  if (validatingInitialPat) {
    return <></>
  }

  if (initialPatValue && initialPatValid) {
    onCompleted(initialPatValue)
    return <></>
  }

  return (
    <div>
      <InputGroup
        placeholder="Enter Personal Access Token"
        value={newPat || ''}
        onChange={changeHandler}
        rightElement={newPatValid ? <Icon icon="tick-circle" /> : <Icon icon="error" />}
      />
      <Button disabled={!newPatValid} text="Save" onClick={onSaveClicked} />
    </div>
  )
}

const mapStateToProps = (state: RootReducer) => ({})

const mapDispatchToProps = {}

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, mapDispatchToProps)(PatInput)
