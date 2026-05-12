import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

type GlobalResetWindow = Window & {
  resetApp?: () => void
  forceReset?: () => void
}

const globalWin = window as GlobalResetWindow

const fallbackReset = (replace: boolean) => {
  console.log(`[Main] ${replace ? 'forceReset' : 'resetApp'} fallback invoked`)
  localStorage.clear()
  sessionStorage.clear()
  if (replace) {
    window.location.replace('/login')
  } else {
    window.location.href = '/login'
  }
}

if (typeof globalWin.resetApp !== 'function') {
  globalWin.resetApp = () => fallbackReset(false)
}

if (typeof globalWin.forceReset !== 'function') {
  globalWin.forceReset = () => fallbackReset(true)
}

// Apply saved theme BEFORE render to prevent flash
const savedTheme = localStorage.getItem('bizcore-theme')
let theme = 'light' // default

if (savedTheme) {
  try {
    const parsed = JSON.parse(savedTheme)
    theme = parsed?.state?.theme || 'light'
  } catch {
    theme = 'light'
  }
}

if (theme === 'dark') {
  document.documentElement.classList.add('dark')
  document.documentElement.classList.remove('light')
} else {
  document.documentElement.classList.add('light')
  document.documentElement.classList.remove('dark')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
