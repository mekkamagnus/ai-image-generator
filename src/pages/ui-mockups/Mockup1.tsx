import { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Mockup 1: Dark Gradient Theme
 *
 * Design inspired by modern AI tools:
 * - Dark gradient background (purple to blue)
 * - Glassmorphism card effect
 * - Floating prompt input at bottom
 * - Neon accent colors
 * - Large hero section with example images
 */

export default function Mockup1() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const examplePrompts = [
    'A cyberpunk city at night with neon lights',
    'Portrait of a robot with human emotions',
    'Abstract digital art with flowing colors'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg" />
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                AI Image Generator
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/" className="text-sm text-gray-400 hover:text-white transition-colors">
                Back to App
              </Link>
              <div className="flex gap-2">
                <Link to="/ui-mockup/2" className="px-3 py-1 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition">
                  Mockup 2
                </Link>
                <Link to="/ui-mockup/3" className="px-3 py-1 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition">
                  Mockup 3
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-24 pb-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Create Stunning Images with AI
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Transform your ideas into breathtaking visuals in seconds
          </p>
        </div>
      </div>

      {/* Example Gallery */}
      <div className="max-w-7xl mx-auto px-4 mb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="aspect-square bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl border border-white/10 backdrop-blur-sm hover:scale-105 transition-transform cursor-pointer"
            >
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-500">Example {i}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Prompt Input */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl">
          <div className="flex flex-col gap-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your imagination..."
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none"
              rows={3}
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                {examplePrompts.map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(example)}
                    className="px-3 py-1 text-xs bg-white/10 rounded-full hover:bg-white/20 transition"
                  >
                    {example.substring(0, 30)}...
                  </button>
                ))}
              </div>
              <button
                onClick={() => setIsGenerating(true)}
                disabled={!prompt.trim() || isGenerating}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mockup Label */}
      <div className="fixed top-20 right-4 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-purple-500/50">
        <span className="text-sm font-semibold text-purple-400">Mockup 1: Dark Gradient</span>
      </div>
    </div>
  );
}
