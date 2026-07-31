import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { getRuntime } from './bootstrap/runtime'
import { RuntimeProvider } from './providers/RuntimeProvider'
import { SdkProvider } from './providers/SdkProvider'
import './index.css'

void getRuntime().initialize()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RuntimeProvider>
      <SdkProvider>
        <App />
      </SdkProvider>
    </RuntimeProvider>
  </React.StrictMode>,
)
