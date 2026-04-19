import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ServerSelector({ servers, selectedServer, onServerSelect }) {
  const [serverStatus, setServerStatus] = useState({});
  const [checking, setChecking] = useState(false);

  const checkServerHealth = async (server) => {
    try {
      const start = Date.now();
      await axios.get(`${server.url}/health`, { timeout: 5000 });
      const latency = Date.now() - start;
      return { status: 'online', latency };
    } catch (error) {
      return { status: 'offline', latency: null };
    }
  };

  const checkAllServers = async () => {
    setChecking(true);
    const statusPromises = servers.map(async (server) => {
      const health = await checkServerHealth(server);
      return { id: server.id, ...health };
    });

    const results = await Promise.all(statusPromises);
    const statusMap = {};
    results.forEach(result => {
      statusMap[result.id] = result;
    });
    
    setServerStatus(statusMap);
    setChecking(false);
  };

  useEffect(() => {
    checkAllServers();
  }, [servers]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'text-success-400';
      case 'offline': return 'text-neutral-400';
      default: return 'text-primary-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online': return '🟢';
      case 'offline': return '⚫';
      default: return '🔵';
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-5 flex items-center justify-center gap-3">
          <span className="text-3xl">🌍</span> Select Test Server
        </h2>
        <p className="text-white text-opacity-80 mb-8 text-lg">
          Choose a server closer to your location for more accurate results
        </p>
        <button
          onClick={checkAllServers}
          disabled={checking}
          className="gradient-button px-8 py-3 rounded-xl text-white font-semibold transition-all duration-300 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
        >
          {checking ? (
            <span className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Checking Servers...
            </span>
          ) : (
            'Refresh Server Status'
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {servers.map((server) => {
          const status = serverStatus[server.id];
          const isSelected = selectedServer?.id === server.id;
          
          return (
            <div
              key={server.id}
              onClick={() => onServerSelect(server)}
              className={`glass-card p-8 cursor-pointer transition-all duration-300 hover:bg-opacity-20 border-2 transform hover:scale-105 ${
                isSelected 
                  ? 'border-primary-400 bg-opacity-20 scale-105' 
                  : 'border-transparent'
              }`}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">
                    {getStatusIcon(status?.status)}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {server.name}
                    </h3>
                    <p className="text-base text-white text-opacity-70 mt-1">
                      {server.region}
                    </p>
                  </div>
                </div>
                {isSelected && (
                  <div className="w-8 h-8 bg-primary-400 rounded-full flex items-center justify-center cyber-glow">
                    <span className="text-white text-lg">✓</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white text-opacity-80 font-medium">Status:</span>
                  <span className={`font-semibold text-base ${getStatusColor(status?.status)}`}>
                    {status?.status || 'Checking...'}
                  </span>
                </div>
                
                {status?.latency && (
                  <div className="flex justify-between items-center">
                    <span className="text-white text-opacity-80 font-medium">Latency:</span>
                    <span className="text-white font-semibold text-base">
                      {status.latency} ms
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-white text-opacity-80 font-medium">URL:</span>
                  <span className="text-white text-opacity-60 text-sm truncate max-w-48">
                    {server.url}
                  </span>
                </div>
              </div>
              
              {server.id === 'local' && (
                <div className="mt-5 p-4 bg-accent-500 bg-opacity-20 rounded-lg border border-accent-400 border-opacity-40 neon-border">
                  <p className="text-accent-300 text-base font-medium">
                    💡 Development server - Use for local testing
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center mt-10">
        <div className="glass-card p-8">
          <h3 className="text-2xl font-bold text-white mb-6">
            Why Multiple Servers Matter
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-3">🗺️</div>
              <div className="text-white font-semibold text-lg mb-2">Geographic Diversity</div>
              <div className="text-white text-opacity-70 text-base leading-relaxed">
                Test from different regions to identify ISP routing optimizations
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🔄</div>
              <div className="text-white font-semibold text-lg mb-2">Load Distribution</div>
              <div className="text-white text-opacity-70 text-base leading-relaxed">
                Multiple servers prevent bottlenecks and provide redundancy
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">📊</div>
              <div className="text-white font-semibold text-lg mb-2">Accurate Comparison</div>
              <div className="text-white text-opacity-70 text-base leading-relaxed">
                Compare results across regions to detect ISP bias
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServerSelector; 