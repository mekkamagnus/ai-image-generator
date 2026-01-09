// src/App.tsx
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useImageGeneration } from './hooks/useImageGeneration';
import type { ImageStyle } from './lib/qwen-api';
import Mockup1 from './pages/ui-mockups/Mockup1';
import Mockup2 from './pages/ui-mockups/Mockup2';
import Mockup3 from './pages/ui-mockups/Mockup3';

// Keyboard shortcuts
const ESCAPE_KEY = 'Escape';

// Recent creation type
interface RecentCreation {
  id: string;
  imageUrl: string;
  prompt: string;
  style: ImageStyle;
  timestamp: number;
}

function App() {
  const [prompt, setPrompt] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>('realistic');
  const [recentCreations, setRecentCreations] = useState<RecentCreation[]>([]);
  const { generate, status, imageUrl, taskId, error, cleanup } = useImageGeneration();

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
  }, []);

  // Load recent creations from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('recentCreations');
      if (saved) {
        const parsed = JSON.parse(saved);
        setRecentCreations(parsed);
      }
    } catch (error) {
      console.error('Failed to load recent creations:', error);
    }
  }, []);

  // Save to localStorage when image generation succeeds
  useEffect(() => {
    if (imageUrl && status === 'succeeded' && prompt) {
      const newCreation: RecentCreation = {
        id: Date.now().toString(),
        imageUrl,
        prompt,
        style: selectedStyle,
        timestamp: Date.now()
      };

      const updated = [newCreation, ...recentCreations].slice(0, 12); // Keep only 12 most recent
      setRecentCreations(updated);

      try {
        localStorage.setItem('recentCreations', JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save recent creations:', error);
      }
    }
  }, [imageUrl, status, prompt, selectedStyle, recentCreations]);

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
      generate(prompt, { size: '1328*1328', style: selectedStyle });
    }
  };

  const handleReset = () => {
    setPrompt('');
    cleanup();
    setProgress(0);
    setElapsedTime(0);
  };

  const handleStyleSelect = (style: ImageStyle) => {
    setSelectedStyle(style);
  };

  const getTimeEstimate = () => {
    const totalSeconds = 120; // 2 minutes estimate
    const remaining = Math.max(0, totalSeconds - elapsedTime);
    if (remaining > 90) return `2+ minutes`;
    if (remaining > 60) return `~${Math.ceil(remaining / 60)} minute`;
    return `~${remaining}s`;
  };

  return (
    <Routes>
      {/* UI Mockup Routes */}
      <Route path="/ui-mockup/1" element={<Mockup1 />} />
      <Route path="/ui-mockup/2" element={<Mockup2 />} />
      <Route path="/ui-mockup/3" element={<Mockup3 />} />

      {/* Main App Route - Using Mockup 3 Design */}
      <Route path="/" element={
        <div className={`min-h-screen transition-colors ${darkMode ? 'bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white' : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white'}`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }} />
          </div>

          {/* Navigation */}
          <nav className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-xl border-b border-white/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <span className="text-xl">🎨</span>
                  </div>
                  <span className="text-xl font-bold">
                    AI Studio
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={toggleDarkMode}
                    className="px-3 py-1 text-sm bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition"
                    aria-label="Toggle dark mode"
                  >
                    {darkMode ? '☀️ Light' : '🌙 Dark'}
                  </button>
                  <a
                    href="/ui-mockup/3"
                    className="text-sm text-white/80 hover:text-white transition-colors"
                  >
                    View Mockups
                  </a>
                </div>
              </div>
            </div>
          </nav>

          {/* Main Layout */}
          <div className="pt-24 pb-8 px-4 flex gap-6">
            {/* Left Panel - Controls */}
            <div className="w-96 flex-shrink-0">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 sticky top-24">
                <h2 className="text-2xl font-bold mb-6">Create</h2>

                {/* Prompt Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Your Vision</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe what you want to see..."
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                    rows={5}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey && prompt.trim()) {
                        handleGenerate();
                      }
                    }}
                  />
                </div>

                {/* Style Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3">Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'realistic' as const, name: 'Realistic' },
                      { id: 'artistic' as const, name: 'Artistic' },
                      { id: 'abstract' as const, name: 'Abstract' },
                      { id: 'anime' as const, name: 'Anime' }
                    ].map((style) => (
                      <button
                        key={style.id}
                        onClick={() => handleStyleSelect(style.id)}
                        className={`p-3 rounded-xl text-sm font-medium transition-all ${
                          selectedStyle === style.id
                            ? 'bg-white/30 border-2 border-white'
                            : 'bg-white/10 border-2 border-transparent hover:bg-white/20'
                        }`}
                      >
                        {style.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="mb-6 p-4 rounded-xl bg-red-500/20 backdrop-blur-sm border border-red-500/30" role="alert" aria-live="polite">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">❌</div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{error.userMessage}</p>
                        {error.suggestion && (
                          <p className="text-xs mt-1 opacity-90">💡 {error.suggestion}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Indicator */}
                {status === 'processing' && (
                  <div className="mb-6 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                    <p className="text-sm font-medium mb-2">✨ Creating Magic...</p>
                    <p className="text-xs text-white/60 mb-3">{getTimeEstimate()} remaining</p>
                    <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-white h-full rounded-full transition-all duration-1000 ease-in-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || status === 'pending' || status === 'processing'}
                  className="w-full py-4 bg-white text-purple-600 rounded-xl font-bold hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  {status === 'processing' ? '✨ Creating Magic...' : '✨ Generate Image'}
                </button>
              </div>
            </div>

            {/* Right Panel - Preview & Gallery */}
            <div className="flex-1">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 h-full flex flex-col">
                {/* Preview Area */}
                <div className="aspect-square bg-gradient-to-br from-white/20 to-white/5 rounded-2xl flex items-center justify-center mb-6 overflow-hidden">
                  {imageUrl && status === 'succeeded' ? (
                    <img
                      src={imageUrl}
                      alt="Generated image"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <div className="text-6xl mb-4">🖼️</div>
                      <p className="text-white/60">
                        {prompt ? 'Your creation will appear here' : 'Enter a prompt to get started'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Image Actions */}
                {imageUrl && status === 'succeeded' && (
                  <div className="flex gap-3 mb-6">
                    <a
                      href={imageUrl}
                      download="generated-image.png"
                      className="flex-1 py-3 bg-white/20 backdrop-blur-sm rounded-xl text-sm font-medium hover:bg-white/30 transition-colors text-center border border-white/10"
                    >
                      Download
                    </a>
                    <button
                      onClick={handleReset}
                      className="flex-1 py-3 bg-white/20 backdrop-blur-sm rounded-xl text-sm font-medium hover:bg-white/30 transition-colors border border-white/10"
                    >
                      Start Over
                    </button>
                  </div>
                )}

                {/* Gallery Section */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Recent Creations</h3>
                    {recentCreations.length > 0 && (
                      <button className="text-sm text-white/60 hover:text-white transition-colors">
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* Gallery Grid */}
                  {recentCreations.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {recentCreations.map((creation) => (
                        <div
                          key={creation.id}
                          onClick={() => {
                            setPrompt(creation.prompt);
                            setSelectedStyle(creation.style);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="aspect-square bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-sm rounded-xl hover:scale-105 transition-all cursor-pointer border border-white/10 group relative overflow-hidden"
                        >
                          <img
                            src={creation.imageUrl}
                            alt={creation.prompt}
                            className="w-full h-full object-cover"
                          />
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                            <div className="text-center">
                              <p className="text-xs font-medium mb-1 line-clamp-2">{creation.prompt}</p>
                              <p className="text-xs text-white/60 capitalize">{creation.style}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                          key={i}
                          className="aspect-square bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-sm rounded-xl border border-white/10 flex items-center justify-center"
                        >
                          <div className="text-center">
                            <span className="text-3xl mb-2 block">{['🌸', '🏔️', '🌊', '🎭', '🌆', '🚀'][i - 1]}</span>
                            <p className="text-xs text-white/40">No creations yet</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      } />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
