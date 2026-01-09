import { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Mockup 2: Clean Minimalist Theme
 *
 * Design inspired by Apple/Linear.app aesthetic:
 * - Clean white/light gray background
 * - Subtle shadows and borders
 * - Centered focused prompt input
 * - Minimal distractions
 * - Typography-driven design
 * - Soft hover states
 */

export default function Mockup2() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const features = [
    { icon: '⚡', title: 'Lightning Fast', desc: 'Generate in seconds' },
    { icon: '🎨', title: 'Creative Freedom', desc: 'Unlimited possibilities' },
    { icon: '✨', title: 'High Quality', desc: 'Stunning results' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-lg" />
              <span className="text-xl font-semibold">
                AI Image Generator
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Back to App
              </Link>
              <div className="flex gap-2">
                <Link to="/ui-mockup/1" className="px-3 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                  Mockup 1
                </Link>
                <Link to="/ui-mockup/3" className="px-3 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                  Mockup 3
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-32 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
              Create with AI
            </h1>
            <p className="text-xl text-gray-600">
              The simplest way to generate stunning images
            </p>
          </div>

          {/* Prompt Input - Centered Focus */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-16">
            <div className="flex flex-col gap-4">
              <label className="text-sm font-medium text-gray-700">
                What would you like to create?
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A serene mountain landscape at sunset..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                rows={4}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {prompt.length}/500 characters
                </span>
                <button
                  onClick={() => setIsGenerating(true)}
                  disabled={!prompt.trim() || isGenerating}
                  className="px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isGenerating ? 'Creating...' : 'Create Image'}
                </button>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {features.map((feature, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Example Gallery */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Recent Creations</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl hover:scale-105 transition-transform cursor-pointer"
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-500 text-sm">Example {i}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mockup Label */}
      <div className="fixed top-20 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-300 shadow-sm">
        <span className="text-sm font-semibold">Mockup 2: Minimalist</span>
      </div>
    </div>
  );
}
