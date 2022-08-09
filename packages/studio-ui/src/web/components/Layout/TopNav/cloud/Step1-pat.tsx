import { UnreachableCaseError } from 'common/errors'
import _ from 'lodash'
import React, { useEffect, useReducer } from 'react'
import { connect } from 'react-redux'
import { RootReducer } from '~/reducers'
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
      status: 'pat_invalid'
    }
  | {
      status: 'saving'
      newPat: string
    }

type Action =
  | { type: 'newPat/invalid' }
  | { type: 'initialPatCheck/valid'; value: string }
  | { type: 'initialPatCheck/invalid' }
  | { type: 'saving'; value: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'initialPatCheck/valid':
      return { status: 'initial_pat_valid', initialPat: action.value }
    case 'initialPatCheck/invalid':
      return { status: 'initial_pat_invalid' }
    case 'newPat/invalid':
      return { status: 'pat_invalid' }
    case 'saving':
      return { status: 'saving', newPat: action.value }
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

  const ac = new AbortController()

  useEffect(() => {
    return () => {
      // Cancel all pending requests
      ac.abort()
    }
  }, [])

  useEffect(() => {
    if (status === 'checking_initial_pat') {
      const initialPatValue = localStorage.getItem(LOCALSTORAGE_KEY)
      if (!initialPatValue) {
        dispatch({ type: 'initialPatCheck/invalid' })
        return
      }

      fetchPatStatus(initialPatValue, ac)
        .then((valid) => {
          valid
            ? dispatch({ type: 'initialPatCheck/valid', value: initialPatValue })
            : dispatch({ type: 'initialPatCheck/invalid' })
        })
        .catch((err) => {
          throw err
        })
    }
  }, [status])

  useEffect(() => {
    if (status === 'saving') {
      const save = async () => {
        const { newPat: pat } = state
        const valid = await fetchPatStatus(pat, ac)

        if (valid) {
          localStorage.setItem(LOCALSTORAGE_KEY, pat)
          onCompleted(pat)
        } else {
          dispatch({ type: 'newPat/invalid' })
        }
      }

      void save()
    }
  }, [status])

  const onSaveClicked = async (pat: string) => {
    dispatch({ type: 'saving', value: pat })
  }

  switch (status) {
    case 'checking_initial_pat':
      return <></>
    case 'initial_pat_valid':
      onCompleted(state.initialPat)
      return <></>
    case 'initial_pat_invalid':
      return <PatInput error={false} disabled={false} onSave={onSaveClicked} />
    case 'pat_invalid':
      return <PatInput error={true} disabled={false} onSave={onSaveClicked} />
    case 'saving':
      return <PatInput error={false} disabled={true} onSave={onSaveClicked} />
    default:
      throw new UnreachableCaseError(status)
  }
}

const mapStateToProps = (state: RootReducer) => ({})

const mapDispatchToProps = {}

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, mapDispatchToProps)(PatProvider)
