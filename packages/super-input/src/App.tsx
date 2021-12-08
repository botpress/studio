import styled from 'styled-components'

import Demo from './Demo'

const AppContainer = styled.div`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
`

const App = () => {
  return (
    <AppContainer>
      <Demo />
    </AppContainer>
  )
}

export default App
