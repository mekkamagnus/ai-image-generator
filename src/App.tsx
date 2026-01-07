import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

function App() {
  const [count, setCount] = useState(0)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    // Check localStorage on mount
    const isDark = localStorage.getItem('darkMode') === 'true'
    setDarkMode(isDark)
  }, [])

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('darkMode', String(newMode))

    // Toggle class on html element
    if (newMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <div className="container mx-auto px-4 py-8">
        {/* Dark mode toggle */}
        <div className="flex justify-end mb-8">
          <button
            onClick={toggleDarkMode}
            className="px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition-opacity"
            aria-label="Toggle dark mode"
          >
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>

        {/* Main content */}
        <div className="text-center">
          <div className="flex justify-center gap-8 mb-8">
            <a href="https://vite.dev" target="_blank" rel="noopener noreferrer">
              <img src={viteLogo} className="h-24 hover:drop-shadow-lg transition-shadow" alt="Vite logo" />
            </a>
            <a href="https://react.dev" target="_blank" rel="noopener noreferrer">
              <img src={reactLogo} className="h-24 hover:drop-shadow-lg transition-spin" alt="React logo" />
            </a>
          </div>

          <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Vite + React + Tailwind v4
          </h1>

          <div className="max-w-md mx-auto p-6 rounded-lg shadow-lg bg-card">
            <button
              onClick={() => setCount((count) => count + 1)}
              className="px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
            >
              Count is {count}
            </button>
            <p className="mt-4 text-sm text-muted-foreground">
              Edit <code className="px-2 py-1 rounded bg-muted">src/App.tsx</code> and save to test HMR
            </p>
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            Click on the Vite and React logos to learn more
          </p>

          {/* Test dark mode colors */}
          <div className="mt-8 p-4 rounded-lg bg-secondary/20">
            <p className="text-primary">Primary color test</p>
            <p className="text-secondary">Secondary color test</p>
            <p className="text-foreground">Foreground color test</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
