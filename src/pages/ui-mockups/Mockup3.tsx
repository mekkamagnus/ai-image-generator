import { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Mockup 3: Glassmorphism Theme
 *
 * Design inspired by modern Dribbble/awwwards trends:
 * - Vibrant gradient background
 * - Heavy glassmorphism (frosted glass) effects
 * - Floating cards and elements
 * - Bold typography
 * - Interactive hover animations
 * - Side panel layout
 */

export default function Mockup3() {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('realistic');
  const [isGenerating, setIsGenerating] = useState(false);

  const styles = [
    { id: 'realistic', name: 'Realistic', color: 'from-blue-500 to-purple-500' },
    { id: 'artistic', name: 'Artistic', color: 'from-pink-500 to-orange-500' },
    { id: 'abstract', name: 'Abstract', color: 'from-green-500 to-teal-500' },
    { id: 'anime', name: 'Anime', color: 'from-purple-500 to-pink-500' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white overflow-hidden">
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
              <Link to="/" className="text-sm text-white/80 hover:text-white transition-colors">
                Back to App
              </Link>
              <div className="flex gap-2">
                <Link to="/ui-mockup/1" className="px-3 py-1 text-sm bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition">
                  1
                </Link>
                <Link to="/ui-mockup/2" className="px-3 py-1 text-sm bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition">
                  2
                </Link>
              </div>
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
              />
            </div>

            {/* Style Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Style</label>
              <div className="grid grid-cols-2 gap-2">
                {styles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
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

            {/* Generate Button */}
            <button
              onClick={() => setIsGenerating(true)}
              disabled={!prompt.trim() || isGenerating}
              className="w-full py-4 bg-white text-purple-600 rounded-xl font-bold hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {isGenerating ? '✨ Creating Magic...' : '✨ Generate Image'}
            </button>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 h-full">
            <div className="aspect-square bg-gradient-to-br from-white/20 to-white/5 rounded-2xl flex items-center justify-center mb-6">
              <div className="text-center">
                <div className="text-6xl mb-4">🖼️</div>
                <p className="text-white/60">
                  {prompt ? 'Your creation will appear here' : 'Enter a prompt to get started'}
                </p>
              </div>
            </div>

            {/* Example Grid */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Inspiration</h3>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="aspect-square bg-white/10 backdrop-blur-sm rounded-xl hover:scale-105 transition-transform cursor-pointer border border-white/10"
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-2xl">{['🌸', '🏔️', '🌊', '🎭', '🌆', '🚀'][i - 1]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mockup Label */}
      <div className="fixed top-20 right-4 bg-white/20 backdrop-blur-xl rounded-lg px-4 py-2 border border-white/30">
        <span className="text-sm font-semibold">Mockup 3: Glassmorphism</span>
      </div>
    </div>
  );
}
