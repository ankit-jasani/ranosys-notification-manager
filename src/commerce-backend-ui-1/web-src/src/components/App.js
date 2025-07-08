/*
Copyright 2025 Ranosys Technologies. All rights reserved.
*/

import React from 'react'
import { Provider, lightTheme } from '@adobe/react-spectrum'
import { ErrorBoundary } from 'react-error-boundary'
import { Route, Routes, HashRouter } from 'react-router-dom'
import ExtensionRegistration from './ExtensionRegistration'

function App (props) {

  // use exc runtime event handlers
  // respond to configuration change events (e.g. user switches org)
  props.runtime.on('configuration', ({ imsOrg, imsToken }) => {
    console.log('configuration change', { imsOrg, imsToken })
  })
  // respond to history change events
  props.runtime.on('history', ({ type, path }) => {
    console.log('history change', { type, path })
  })

  return (
      <ErrorBoundary onError={onError} FallbackComponent={fallbackComponent}>
          <HashRouter>
              <Provider theme={lightTheme} colorScheme={'light'}>
                  <Routes>
                      <Route index element={<ExtensionRegistration runtime={props.runtime} ims={props.ims} />} />
                  </Routes>
              </Provider>
          </HashRouter>
      </ErrorBoundary>
  )

  // Methods

  // error handler on UI rendering failure
  function onError(e, componentStack) {}

  // component to show if UI fails rendering
  function fallbackComponent({ componentStack, error }) {
      return (
          <React.Fragment>
              <h1 style={{ textAlign: 'center', marginTop: '20px' }}>Something went wrong :(</h1>
              <pre>{componentStack + '\n' + error.message}</pre>
          </React.Fragment>
      )
  }
}

export default App
