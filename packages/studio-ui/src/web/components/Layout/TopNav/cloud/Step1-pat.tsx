import { Button, InputGroup, Icon, Spinner, IconSize } from '@blueprintjs/core'
import axios from 'axios'
import { debounce } from 'lodash'
import React, { useEffect, useMemo, useState } from 'react'
import { connect } from 'react-redux'
import { fetchUser } from '~/actions'
import { RootReducer } from '~/reducers'

const fetchPatStatus = async (pat: string): Promise<boolean> => {
  const resp = await axios.get(`${window.CLOUD_CONTROLLER_ENDPOINT}/v1/authentication/pat`, {
    headers: { Authorization: `bearer ${pat}` },
    validateStatus: () => true
  })

  const authenticated = resp.status === 200 && resp.headers['x-user-id'] !== undefined
  return authenticated
}

interface OwnProps {
  onCompleted: () => void
}

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps
type Props = DispatchProps & StateProps & OwnProps

const PatInput = (props: Props): JSX.Element => {
  const { user, onCompleted } = props

  const [initialCheckCompleted, setInitialCheckCompleted] = useState(false)
  const [pat, setPat] = useState('')
  const [patValid, setPatValid] = useState<null | 'checking' | 'valid' | 'invalid'>()
  const [saveRequestState, setSaveRequestState] = useState<'pending' | 'in-progress' | 'completed'>('pending')

  useEffect(() => {
    const checkUserAuthentication = async () => {
      const patValid = await fetchPatStatus(user.personalAccessToken)
      setInitialCheckCompleted(true)

      if (patValid) {
        onCompleted()
      }
    }

    if (user.personalAccessToken?.length > 0) {
      void checkUserAuthentication()
    }
  }, [user.personalAccessToken])

  const validatePat = async (pat: string) => {
    setPatValid('checking')
    const patStatus = await fetchPatStatus(pat)
    setPatValid(patStatus ? 'valid' : 'invalid')
  }

  const debouncedValidatePat = useMemo(() => debounce(validatePat, 300), [])
  // Stop the invocation of the debounced function
  // after unmounting
  useEffect(() => {
    return () => {
      debouncedValidatePat.cancel()
    }
  }, [])

  const changeHandler = async (event) => {
    setPat(event.target.value)
    void debouncedValidatePat(event.target.value)
  }

  const onSaveClicked = async () => {
    setSaveRequestState('in-progress')
    await axios.post(`${window.API_PATH}/admin/user/profile`, { personalAccessToken: pat })
    props.fetchUser()
    onCompleted()
  }

  let rightElement
  switch (patValid) {
    case 'checking':
      rightElement = <Spinner size={IconSize.STANDARD} />
      break
    case 'invalid':
      rightElement = <Icon icon="error" />
      break
    case 'valid':
      rightElement = <Icon icon="tick-circle" />
      break
  }

  if (!initialCheckCompleted) {
    return <></>
  }

  return (
    <div>
      <InputGroup
        placeholder="Enter Personal Access Token"
        value={pat}
        onChange={changeHandler}
        rightElement={rightElement}
      />
      <Button
        disabled={patValid !== 'valid' || saveRequestState === 'in-progress'}
        text="Save"
        onClick={onSaveClicked}
      />
    </div>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  user: state.user
})

const mapDispatchToProps = {
  fetchUser
}

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, mapDispatchToProps)(PatInput)
