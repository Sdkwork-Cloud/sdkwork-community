import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { bootstrapCommunityPort } from './bootstrap/communityPort'
import { initCommunityH5I18n } from './bootstrap/i18n'
import { RuntimeProvider } from './providers/RuntimeProvider'
import { SdkProvider } from './providers/SdkProvider'
import './index.css'

initCommunityH5I18n();
bootstrapCommunityPort();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RuntimeProvider>
      <SdkProvider>
        <App />
      </SdkProvider>
    </RuntimeProvider>
  </React.StrictMode>,
)
