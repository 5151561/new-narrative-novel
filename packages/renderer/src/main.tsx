import ReactDOM from 'react-dom/client'

import App from './App'
import { AppProviders } from './app/providers'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <AppProviders>
    <App />
  </AppProviders>,
)
