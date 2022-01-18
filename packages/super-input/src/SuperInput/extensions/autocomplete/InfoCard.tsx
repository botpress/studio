import ReactDOM from 'react-dom'
import { useCallback } from 'react'
import styled from 'styled-components'
import { InfoCardComponent } from './types'

const CardContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  hr {
    border-top: 1.5px solid #d6d6d6;
    margin: 0;
  }
`

const Content = styled.div`
  padding: 3px 6px;
`

const Header = styled(Content)`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  h3 {
    font-size: 1.1rem;
    margin: auto 0;
  }

  h6 {
    font-size: 0.65rem;
    color: #ac0000ff;
    margin: auto 0 auto 25px;
  }
`

const Docs = styled(Content)`
  p {
    font-size: 0.8rem;
  }
`

const Foot = styled(Content)`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`

const Evals = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  maxwidth: 35px;

  h6 {
    margin: auto 0;
    font-size: 0.75rem;
  }

  div {
    font-size: 1em;
    font-weight: bold;
    color: rgb(83, 109, 255);
    margin: 2px 4px;
    background-color: #dddddd;
    padding: 4px 8px;
    border-radius: 4px;
    width: fit-content;
  }
`

const LinkBtn = styled.div`
  background-color: #bcdeff;
  border-radius: 5px;
  margin: auto 0;
  padding: 3.5px 6px;
  font-size: 1.5rem;
  cursor: pointer;
`

const InfoCard: InfoCardComponent = ({ key, link, docs, type, evals }) => {
  const goToLink = (link: string) => {
    window.open(link, '_blank')
  }

  return () => {
    let dom = document.createElement('div')
    ReactDOM.render(
      <CardContainer>
        <Header>
          <h3>{key}</h3>
          <h6>{type}</h6>
        </Header>
        <hr />
        {docs ? (
          <Docs>
            <p>{docs}</p>
          </Docs>
        ) : null}
        <Foot>
          <Evals>
            {evals ? (
              <>
                <h6>Evaluates to: </h6>
                <div>{evals}</div>
              </>
            ) : null}
          </Evals>
          {link ? <LinkBtn onMouseDown={() => goToLink(link)}>🔗</LinkBtn> : null}
        </Foot>
      </CardContainer>,
      dom
    )
    return dom
  }
}

export default InfoCard

// container
/// name (space) full type elipsis
/// desc
/// eval string, number, bool (space) docs button
