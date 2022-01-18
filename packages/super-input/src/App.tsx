import styled from 'styled-components'

import Demo from './Demo'

const AppContainer = styled.div`
  min-height: 100vh;
  display: grid;
  place-content: center;
  padding: 1rem;
`

const App = () => {
  return (
    <AppContainer>
      <Demo />
    </AppContainer>
  )
}

export default App
