// src/App.tsx
import { useState, useEffect } from 'react';
import { PromptInput } from './components/ui/PromptInput';
import { GenerateButton } from './components/ui/GenerateButton';
import { useImageGeneration } from './hooks/useImageGeneration';
import type { ParsedError } from '@/lib/errors';

function App() {
  const [prompt, setPrompt] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const { generate, status, imageUrl, taskId, error, cleanup } = useImageGeneration();

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
  }, []);

  // Log errors when displayed to user for debugging and AI analysis
  useEffect(() => {
    if (error) {
      console.warn('[UI Error Displayed]', {
        timestamp: new Date().toISOString(),
        errorCode: error.code,
        userMessage: error.userMessage,
        technicalMessage: error.technicalMessage,
        suggestion: error.suggestion,
        isRetryable: error.isRetryable,
        currentStatus: status,
        willShowRetryButton: error.isRetryable && status === 'failed',
        action: 'showing error message to user in UI'
      });
    }
  }, [error, status]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));

    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleGenerate = () => {
    if (prompt.trim()) {
      generate(prompt, { size: '1328*1328' });
    }
  };

  const handleReset = () => {
    setPrompt('');
    cleanup();
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <div className="container mx-auto px-4 py-8">
        {/* Header with dark mode toggle */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">AI Image Generator</h1>
          <button
            onClick={toggleDarkMode}
            className="px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition-opacity"
            aria-label="Toggle dark mode"
          >
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>

        {/* Main content */}
        <div className="max-w-2xl mx-auto">
          {/* Prompt input */}
          <PromptInput
            value={prompt}
            onChange={setPrompt}
            onSubmit={handleGenerate}
            disabled={status === 'pending' || status === 'processing'}
          />

          {/* Generate button */}
          <GenerateButton
            status={status}
            onGenerate={handleGenerate}
            hasPrompt={prompt.trim().length > 0}
          />

          {/* Error display */}
          {error && (
            <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive text-destructive">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Error: {error.userMessage}</p>
                  {error.suggestion && (
                    <p className="text-sm mt-1 opacity-90">💡 {error.suggestion}</p>
                  )}
                  {error.isRetryable && status === 'failed' && (
                    <button
                      onClick={() => {
                        if (prompt.trim()) {
                          generate(prompt, { size: '1328*1328' });
                        }
                      }}
                      className="mt-2 px-3 py-1 text-sm rounded bg-destructive text-destructive-foreground hover:opacity-90"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Status indicator */}
          {status === 'processing' && (
            <div className="mt-4 text-center text-muted-foreground">
              <p>Generating your image... This may take 1-2 minutes.</p>
              {taskId && <p className="text-xs mt-1">Task ID: {taskId}</p>}
            </div>
          )}

          {/* Image result */}
          {imageUrl && status === 'succeeded' && (
            <div className="mt-8">
              <div className="rounded-lg overflow-hidden border border-border">
                <img
                  src={imageUrl}
                  alt="Generated image"
                  className="w-full h-auto"
                />
              </div>
              <div className="mt-4 flex gap-4 justify-center">
                <a
                  href={imageUrl}
                  download="generated-image.png"
                  className="px-6 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  Download Image
                </a>
                <button
                  onClick={handleReset}
                  className="px-6 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  Start Over
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
