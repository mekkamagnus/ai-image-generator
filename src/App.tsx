// src/App.tsx
import { useState, useEffect } from 'react';
import { PromptInput } from './components/ui/PromptInput';
import { GenerateButton } from './components/ui/GenerateButton';
import { useImageGeneration } from './hooks/useImageGeneration';

function App() {
  const [prompt, setPrompt] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const { generate, status, imageUrl, taskId, error, cleanup } = useImageGeneration();

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
  }, []);

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
              <p className="font-semibold">Error:</p>
              <p className="text-sm">{error}</p>
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
