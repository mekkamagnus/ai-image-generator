// src/App.tsx
import { useState, useEffect } from 'react';
import { PromptInput } from './components/ui/PromptInput';
import { GenerateButton } from './components/ui/GenerateButton';
import { useImageGeneration } from './hooks/useImageGeneration';

// Keyboard shortcuts
const ESCAPE_KEY = 'Escape';

function App() {
  const [prompt, setPrompt] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const { generate, status, imageUrl, taskId, error, cleanup } = useImageGeneration();

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
  }, []);

  // Progress and timer for loading state
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    let timerInterval: NodeJS.Timeout;

    if (status === 'processing') {
      // Reset progress when processing starts
      setProgress(0);
      setElapsedTime(0);

      // Animate progress bar in stages
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 33) return 33;
          if (prev < 66) return 66;
          if (prev < 100) return 100;
          return prev;
        });
      }, 5000);

      // Update elapsed time
      timerInterval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      clearInterval(progressInterval);
      clearInterval(timerInterval);
    };
  }, [status]);

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

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ESCAPE_KEY) {
        // Clear state on Escape key
        if (prompt || imageUrl) {
          handleReset();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prompt, imageUrl]);

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
    setProgress(0);
    setElapsedTime(0);
  };

  const getTimeEstimate = () => {
    const totalSeconds = 120; // 2 minutes estimate
    const remaining = Math.max(0, totalSeconds - elapsedTime);
    if (remaining > 90) return `2+ minutes`;
    if (remaining > 60) return `~${Math.ceil(remaining / 60)} minute`;
    return `~${remaining}s`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <div className="container mx-auto px-4 py-8 sm:py-6 md:py-8">
        {/* Header with dark mode toggle */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">AI Image Generator</h1>
          <button
            onClick={toggleDarkMode}
            className="min-h-[44px] px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-primary"
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
            <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive text-destructive" role="alert" aria-live="polite">
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
                      className="mt-2 min-h-[44px] px-3 py-2 text-sm rounded bg-destructive text-destructive-foreground hover:opacity-90 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-destructive"
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
            <div className="mt-4 text-center text-muted-foreground" role="status" aria-live="polite">
              <p className="text-base">Generating your image... ({getTimeEstimate()} remaining)</p>
              {taskId && <p className="text-xs mt-1">Task ID: {taskId}</p>}

              {/* Progress bar */}
              <div className="mt-4 mx-auto max-w-md bg-primary/20 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-1000 ease-in-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Timeline */}
              <div className="mt-3 flex justify-center items-center gap-4 text-xs">
                <span className={`flex items-center gap-1 ${progress >= 33 ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {progress >= 33 ? '✅' : '⏳'} Creating task
                </span>
                <span className="text-muted-foreground">→</span>
                <span className={`flex items-center gap-1 ${progress >= 66 ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {progress >= 66 ? '✅' : progress >= 33 ? '🔄' : '⏳'} Processing
                </span>
                <span className="text-muted-foreground">→</span>
                <span className={`flex items-center gap-1 ${progress >= 100 ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {progress >= 100 ? '✅' : progress >= 66 ? '🔄' : '⏳'} Fetching result
                </span>
              </div>
            </div>
          )}

          {/* Image result */}
          {imageUrl && status === 'succeeded' && (
            <div className="mt-8">
              <div className="rounded-lg overflow-hidden border border-border shadow-lg">
                <img
                  src={imageUrl}
                  alt="Generated image"
                  className="w-full h-auto max-w-full object-contain"
                />
              </div>
              <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href={imageUrl}
                  download="generated-image.png"
                  className="min-h-[44px] px-6 py-3 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-secondary inline-flex items-center justify-center"
                  aria-label="Download generated image"
                >
                  Download Image
                </a>
                <button
                  onClick={handleReset}
                  className="min-h-[44px] px-6 py-3 rounded-lg border border-border hover:bg-muted transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 inline-flex items-center justify-center"
                  aria-label="Clear and start new generation"
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
