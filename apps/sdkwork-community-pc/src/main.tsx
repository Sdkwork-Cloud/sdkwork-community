import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { bootstrapCommunityPcHost } from './bootstrap/communityHost'
import './index.css'

bootstrapCommunityPcHost()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)