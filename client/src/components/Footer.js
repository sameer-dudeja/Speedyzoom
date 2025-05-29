import React from 'react';

function Footer() {
  return (
    <footer className="bg-footer-900 border-t border-primary-400 border-opacity-20 mt-12">
      <div className="max-w-6xl mx-auto px-5 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Project Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">⚡</span>
              </div>
              <h3 className="text-lg font-bold text-white">SpeedyZoom</h3>
            </div>
            <p className="text-neutral-400 text-sm leading-relaxed">
              A modern speed test application that bypasses ISP optimizations to provide 
              accurate measurements of your real internet performance.
            </p>
          </div>

          {/* Tech Stack */}
          <div>
            <h4 className="text-white font-semibold mb-4">Built With</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-accent-400">⚛️</span>
                <span className="text-neutral-300">React.js + Tailwind CSS</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-success-400">🚀</span>
                <span className="text-neutral-300">Node.js + Socket.io</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary-400">⚡</span>
                <span className="text-neutral-300">Bun Runtime</span>
              </div>
            </div>
          </div>

          {/* Links & Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Developer</h4>
            <div className="space-y-3">
              <a 
                href="https://github.com/sameer-dudeja" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-neutral-300 hover:text-accent-400 transition-colors duration-300 group"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>GitHub Repository</span>
              </a>
              
              <div className="text-xs text-neutral-500 mt-4">
                <p>Open source • MIT License</p>
                <p className="mt-1">Feel free to contribute or report issues!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-primary-400 border-opacity-20 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-neutral-400 text-sm">
              © 2025 SpeedyZoom by Sameer Dudeja. Built with ⚡ and lots of ☕
            </p>
            <div className="flex items-center gap-4 text-xs text-neutral-500">
              <span>Version 1.0.0</span>
              <span>•</span>
              <span>Real-time Speed Testing</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer; 