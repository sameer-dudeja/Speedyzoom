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
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">🌍 Select Test Server</h2>
        <p className="text-white text-opacity-80 mb-6">
          Choose a server closer to your location for more accurate results
        </p>
        <button
          onClick={checkAllServers}
          disabled={checking}
          className="gradient-button px-6 py-2 rounded-full text-white font-medium transition-all duration-300 hover:shadow-lg disabled:opacity-50"
        >
          {checking ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Checking Servers...
            </span>
          ) : (
            'Refresh Server Status'
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {servers.map((server) => {
          const status = serverStatus[server.id];
          const isSelected = selectedServer?.id === server.id;
          
          return (
            <div
              key={server.id}
              onClick={() => onServerSelect(server)}
              className={`glass-card p-6 cursor-pointer transition-all duration-300 hover:bg-opacity-20 border-2 ${
                isSelected 
                  ? 'border-primary-400 bg-opacity-20' 
                  : 'border-transparent'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {getStatusIcon(status?.status)}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {server.name}
                    </h3>
                    <p className="text-sm text-white text-opacity-70">
                      {server.region}
                    </p>
                  </div>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 bg-primary-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-white text-opacity-80">Status:</span>
                  <span className={`font-medium ${getStatusColor(status?.status)}`}>
                    {status?.status || 'Checking...'}
                  </span>
                </div>
                
                {status?.latency && (
                  <div className="flex justify-between items-center">
                    <span className="text-white text-opacity-80">Latency:</span>
                    <span className="text-white font-medium">
                      {status.latency} ms
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-white text-opacity-80">URL:</span>
                  <span className="text-white text-opacity-60 text-xs truncate max-w-48">
                    {server.url}
                  </span>
                </div>
              </div>
              
              {server.id === 'local' && (
                <div className="mt-4 p-3 bg-accent-500 bg-opacity-20 rounded-lg border border-accent-400 border-opacity-30 neon-border">
                  <p className="text-accent-300 text-sm">
                    💡 Development server - Use for local testing
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center mt-8">
        <div className="glass-card p-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            Why Multiple Servers Matter
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl mb-2">🗺️</div>
              <div className="text-white font-medium">Geographic Diversity</div>
              <div className="text-white text-opacity-70">
                Test from different regions to identify ISP routing optimizations
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🔄</div>
              <div className="text-white font-medium">Load Distribution</div>
              <div className="text-white text-opacity-70">
                Multiple servers prevent bottlenecks and provide redundancy
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-white font-medium">Accurate Comparison</div>
              <div className="text-white text-opacity-70">
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