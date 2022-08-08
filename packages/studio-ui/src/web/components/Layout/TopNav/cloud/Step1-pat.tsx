import { UnreachableCaseError } from 'common/errors'
import _, { debounce } from 'lodash'
import React, { useEffect, useMemo, useReducer } from 'react'
import { connect } from 'react-redux'
import { RootReducer } from '~/reducers'
import { LocalStoragePat } from './local-storage-pat'
import { fetchPatStatus } from './pat'
import { PatInput } from './pat-input'

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

  const changeHandler = (pat: string) => {
    dispatch({ type: 'input/updated', value: pat })
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

  switch (status) {
    case 'checking_initial_pat':
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
    case 'initial_pat_valid':
      onCompleted(state.initialPat)
      return <></>
    case 'initial_pat_invalid':
      return <PatInput valid={false} onChange={changeHandler} onSave={onSaveClicked} />
    case 'checking_new_pat':
      return <PatInput valid={false} loading={true} onChange={changeHandler} onSave={onSaveClicked} />
    case 'new_pat_status_received':
      return <PatInput valid={state.valid} onChange={changeHandler} onSave={onSaveClicked} />
    default:
      throw new UnreachableCaseError(status)
  }
}

const mapStateToProps = (state: RootReducer) => ({})

const mapDispatchToProps = {}

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, mapDispatchToProps)(PatProvider)
