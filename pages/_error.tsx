import * as React from 'react'
import { MainContainer } from '../containers/MainContainer'

export default () => {
    return (
      <MainContainer>
        <section id="404-section" key="404-1" className="hero is-large is-long is-bold">
          <div className="hero-body">
            <div className="container has-text-centered">
              <h1 className="title">
                404 💩
              </h1>
              <h2 className="subtitle">
                Sorry, we cannot find the page. Go back <a href="/">home</a>
              </h2>
            </div>
          </div>
        </section>
      </MainContainer>
  )
}
