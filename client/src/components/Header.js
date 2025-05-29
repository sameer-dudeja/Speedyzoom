import React from 'react';

function Header() {
  return (
    <header className="bg-secondary-900 bg-opacity-30 backdrop-blur-md border-b border-primary-400 border-opacity-30">
      <div className="max-w-6xl mx-auto px-5 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center cyber-glow">
              <span className="text-xl font-bold text-white">⚡</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">SpeedyZoom</h1>
              <p className="text-sm text-neutral-300">Bypass ISP Optimizations</p>
            </div>
          </div>
          
          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-neutral-300">System Online</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header; 