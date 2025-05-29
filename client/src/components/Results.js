import React from 'react';

function Results({ results }) {
  if (!results || results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-3xl font-bold text-white mb-4">No Test Results Yet</h2>
        <p className="text-white text-opacity-80 mb-6">
          Run some speed tests to see your results here
        </p>
        <div className="glass-card p-6 max-w-md mx-auto">
          <p className="text-white text-sm">
            Your test history will show comparison data between different protocols,
            helping you identify ISP optimizations and throttling patterns.
          </p>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getSpeedColor = (speed, type) => {
    const numSpeed = parseFloat(speed);
    if (type === 'download') {
      if (numSpeed >= 100) return 'text-green-400';
      if (numSpeed >= 50) return 'text-yellow-400';
      return 'text-red-400';
    } else {
      if (numSpeed >= 50) return 'text-green-400';
      if (numSpeed >= 25) return 'text-yellow-400';
      return 'text-red-400';
    }
  };

  const averageSpeed = results.reduce((sum, result) => sum + parseFloat(result.speed), 0) / results.length;
  const downloadTests = results.filter(r => r.type === 'download');
  const uploadTests = results.filter(r => r.type === 'upload');

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">📊 Test Results</h2>
        <p className="text-white text-opacity-80 mb-6">
          Your speed test history and performance analytics
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-6 text-center">
          <div className="text-3xl font-bold text-white mb-2">
            {averageSpeed.toFixed(1)}
          </div>
          <div className="text-white text-opacity-80">Avg Speed (Mbps)</div>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="text-3xl font-bold text-white mb-2">
            {results.length}
          </div>
          <div className="text-white text-opacity-80">Total Tests</div>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="text-3xl font-bold text-white mb-2">
            {downloadTests.length}/{uploadTests.length}
          </div>
          <div className="text-white text-opacity-80">Down/Up Tests</div>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {results.map((result) => (
          <div key={result.id} className="glass-card p-4 hover:bg-opacity-20 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-2xl">
                  {result.type === 'download' ? '📥' : '📤'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium capitalize">
                      {result.type}
                    </span>
                    <span className={`text-xl font-bold ${getSpeedColor(result.speed, result.type)}`}>
                      {result.speed} Mbps
                    </span>
                  </div>
                  <div className="text-white text-opacity-60 text-sm">
                    {formatDate(result.timestamp)}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-white text-opacity-80 text-sm">
                  Server: {result.server?.region || 'Unknown'}
                </div>
                {result.metrics && (
                  <div className="text-white text-opacity-60 text-xs">
                    Latency: {result.metrics.latency}ms
                  </div>
                )}
              </div>
            </div>
            
            {result.duration && (
              <div className="mt-3 pt-3 border-t border-white border-opacity-20">
                <div className="flex justify-between text-sm text-white text-opacity-70">
                  <span>Duration: {(result.duration / 1000).toFixed(1)}s</span>
                  {result.metrics?.jitter && (
                    <span>Jitter: {result.metrics.jitter}ms</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Export Options */}
      <div className="glass-card p-6 text-center">
        <h3 className="text-xl font-semibold text-white mb-4">Export Results</h3>
        <div className="flex gap-3 justify-center">
          <button 
            className="gradient-button px-4 py-2 rounded-lg text-white font-medium transition-all duration-300 hover:shadow-lg"
            onClick={() => {
              const dataStr = JSON.stringify(results, null, 2);
              const dataBlob = new Blob([dataStr], {type: 'application/json'});
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'speedyzoom-results.json';
              link.click();
            }}
          >
            📄 JSON
          </button>
          <button 
            className="gradient-button px-4 py-2 rounded-lg text-white font-medium transition-all duration-300 hover:shadow-lg"
            onClick={() => {
              const csvHeader = 'Timestamp,Type,Speed (Mbps),Server,Latency (ms),Duration (s)\n';
              const csvData = results.map(r => 
                `${r.timestamp},${r.type},${r.speed},${r.server?.region || 'Unknown'},${r.metrics?.latency || 0},${r.duration ? (r.duration/1000).toFixed(1) : 0}`
              ).join('\n');
              const dataBlob = new Blob([csvHeader + csvData], {type: 'text/csv'});
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'speedyzoom-results.csv';
              link.click();
            }}
          >
            📊 CSV
          </button>
        </div>
      </div>
    </div>
  );
}

export default Results; 