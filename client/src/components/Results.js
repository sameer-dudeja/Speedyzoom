import React, { useState, useMemo } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { getStoredResults, exportResultsAsJSON, exportResultsAsCSV, getStorageStats, clearStoredResults, deleteTestResult } from '../utils/storage';

function Results({ results: propResults }) {
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Always load from storage to ensure we have the latest data
  // Use propResults only as initial fallback
  // refreshKey is included to force re-computation when data is updated
  const allResults = useMemo(() => {
    const stored = getStoredResults();
    return stored.length > 0 ? stored : (propResults || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propResults, refreshKey]);
  
  const [filterType, setFilterType] = useState('all'); // 'all', 'download', 'upload'
  const [filterServer, setFilterServer] = useState('all');
  const [dateRange, setDateRange] = useState('all'); // 'all', 'today', 'week', 'month', 'custom'
  const [showCharts, setShowCharts] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(true);

  // Get unique servers from results
  const uniqueServers = useMemo(() => {
    const servers = new Set();
    allResults.forEach(r => {
      if (r.server?.id) servers.add(r.server.id);
    });
    return Array.from(servers).map(id => {
      const result = allResults.find(r => r.server?.id === id);
      return result?.server || { id, name: id, region: id };
    });
  }, [allResults]);

  // Filter results based on current filters
  const filteredResults = useMemo(() => {
    let filtered = [...allResults];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(r => r.type === filterType);
    }

    // Filter by server
    if (filterServer !== 'all') {
      filtered = filtered.filter(r => r.server?.id === filterServer);
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = null;
      }
      
      if (startDate) {
        filtered = filtered.filter(r => {
          const testDate = new Date(r.timestamp);
          return testDate >= startDate;
        });
      }
    }

    // Sort by timestamp (newest first)
    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [allResults, filterType, filterServer, dateRange]);

  // Prepare chart data
  const chartData = useMemo(() => {
    // Group by date and calculate averages
    // Use ISO date string (YYYY-MM-DD) for reliable sorting across locales
    const grouped = {};
    
    filteredResults.forEach(result => {
      const date = new Date(result.timestamp);
      // Use ISO date string for consistent, sortable key (YYYY-MM-DD)
      const dateKey = date.toISOString().split('T')[0];
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          dateKey: dateKey, // Sortable ISO date string
          dateDisplay: date.toLocaleDateString(), // Locale-formatted for display
          download: [],
          upload: [],
          latency: []
        };
      }
      
      if (result.type === 'download') {
        grouped[dateKey].download.push(parseFloat(result.speed));
      } else if (result.type === 'upload') {
        grouped[dateKey].upload.push(parseFloat(result.speed));
      }
      
      if (result.metrics?.latency) {
        grouped[dateKey].latency.push(result.metrics.latency);
      }
    });

    // Calculate averages and format for chart
    // Sort by ISO date string for reliable ordering
    // Keep numeric values for Recharts (formatting done in tooltip/display)
    return Object.values(grouped).map(group => ({
      date: group.dateDisplay, // Display locale-formatted date
      dateKey: group.dateKey, // Keep sortable key
      download: group.download.length > 0 
        ? group.download.reduce((a, b) => a + b, 0) / group.download.length
        : null,
      upload: group.upload.length > 0
        ? group.upload.reduce((a, b) => a + b, 0) / group.upload.length
        : null,
      latency: group.latency.length > 0
        ? Math.round(group.latency.reduce((a, b) => a + b, 0) / group.latency.length)
        : null
    })).sort((a, b) => a.dateKey.localeCompare(b.dateKey)); // Sort by ISO date string
  }, [filteredResults]);

  // Calculate analytics
  const analytics = useMemo(() => {
    if (filteredResults.length === 0) {
      return {
        totalTests: 0,
        avgDownload: 0,
        avgUpload: 0,
        avgLatency: 0,
        bestDownload: null,
        worstDownload: null,
        bestUpload: null,
        worstUpload: null,
        trend: 'neutral'
      };
    }

    const downloads = filteredResults.filter(r => r.type === 'download').map(r => parseFloat(r.speed));
    const uploads = filteredResults.filter(r => r.type === 'upload').map(r => parseFloat(r.speed));
    const latencies = filteredResults.filter(r => r.metrics?.latency).map(r => r.metrics.latency);

    // Calculate trends (compare first half vs second half)
    // Only calculate trend if we have enough data points (at least 2 results)
    let trend = 'neutral';
    if (filteredResults.length >= 2) {
      const sortedByDate = [...filteredResults].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      const midPoint = Math.floor(sortedByDate.length / 2);
      const firstHalf = sortedByDate.slice(0, midPoint);
      const secondHalf = sortedByDate.slice(midPoint);
      
      // Only calculate trend if both halves have data
      if (firstHalf.length > 0 && secondHalf.length > 0) {
        const firstHalfAvg = firstHalf.reduce((sum, r) => sum + parseFloat(r.speed || 0), 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, r) => sum + parseFloat(r.speed || 0), 0) / secondHalf.length;
        
        if (secondHalfAvg > firstHalfAvg * 1.1) trend = 'improving';
        else if (secondHalfAvg < firstHalfAvg * 0.9) trend = 'declining';
      }
    }

    return {
      totalTests: filteredResults.length,
      avgDownload: downloads.length > 0 ? downloads.reduce((a, b) => a + b, 0) / downloads.length : 0,
      avgUpload: uploads.length > 0 ? uploads.reduce((a, b) => a + b, 0) / uploads.length : 0,
      avgLatency: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
      bestDownload: downloads.length > 0 ? Math.max(...downloads) : null,
      worstDownload: downloads.length > 0 ? Math.min(...downloads) : null,
      bestUpload: uploads.length > 0 ? Math.max(...uploads) : null,
      worstUpload: uploads.length > 0 ? Math.min(...uploads) : null,
      trend
    };
  }, [filteredResults]);

  const storageStats = getStorageStats();

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

  const handleExportJSON = () => {
    const dataStr = exportResultsAsJSON();
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `speedyzoom-results-${new Date().toISOString().split('T')[0]}.json`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    
    // Clean up: remove link and revoke object URL after download starts
    // Use try-catch to handle edge cases where link might already be removed
    setTimeout(() => {
      try {
        if (link.parentNode) {
          document.body.removeChild(link);
        }
      } catch (error) {
        // Link may have already been removed, ignore
      }
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleExportCSV = () => {
    const csvStr = exportResultsAsCSV();
    const dataBlob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `speedyzoom-results-${new Date().toISOString().split('T')[0]}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    
    // Clean up: remove link and revoke object URL after download starts
    // Use try-catch to handle edge cases where link might already be removed
    setTimeout(() => {
      try {
        if (link.parentNode) {
          document.body.removeChild(link);
        }
      } catch (error) {
        // Link may have already been removed, ignore
      }
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all test results? This cannot be undone.')) {
      clearStoredResults();
      setRefreshKey(prev => prev + 1); // Trigger refresh
    }
  };

  const handleDeleteResult = (resultId) => {
    deleteTestResult(resultId);
    setRefreshKey(prev => prev + 1); // Trigger refresh
  };

  if (!allResults || allResults.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-3xl font-bold text-white mb-4">No Test Results Yet</h2>
        <p className="text-white text-opacity-80 mb-6">
          Run some speed tests to see your results here
        </p>
        <div className="glass-card p-6 max-w-md mx-auto">
          <p className="text-white text-sm">
            Your test history will be automatically saved and displayed here,
            helping you track speed trends and identify ISP optimizations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">📊 Test Results & History</h2>
        <p className="text-white text-opacity-80 mb-6">
          Your speed test history and performance analytics
        </p>
      </div>

      {/* Storage Stats */}
      <div className="glass-card p-4">
        <div className="flex justify-between items-center text-sm">
          <div className="text-white text-opacity-80">
            <span className="font-medium">{storageStats.totalTests}</span> tests stored
            {storageStats.storageSize > 0 && (
              <span className="ml-4">({storageStats.storageSize} KB)</span>
            )}
          </div>
          <button
            onClick={handleClearAll}
            className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-all duration-300"
          >
            Clear All Data
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Type Filter */}
          <div>
            <label className="block text-white text-opacity-80 text-sm mb-2">Test Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-secondary-900 bg-opacity-60 border border-primary-400 border-opacity-30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400 focus:ring-opacity-50 transition-all duration-300"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                color: 'white',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2300d4ff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                paddingRight: '40px'
              }}
            >
              <option value="all" style={{ backgroundColor: '#0f172a', color: 'white' }}>All Types</option>
              <option value="download" style={{ backgroundColor: '#0f172a', color: 'white' }}>Download Only</option>
              <option value="upload" style={{ backgroundColor: '#0f172a', color: 'white' }}>Upload Only</option>
            </select>
          </div>

          {/* Server Filter */}
          <div>
            <label className="block text-white text-opacity-80 text-sm mb-2">Server</label>
            <select
              value={filterServer}
              onChange={(e) => setFilterServer(e.target.value)}
              className="w-full bg-secondary-900 bg-opacity-60 border border-primary-400 border-opacity-30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400 focus:ring-opacity-50 transition-all duration-300"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                color: 'white',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2300d4ff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                paddingRight: '40px'
              }}
            >
              <option value="all" style={{ backgroundColor: '#0f172a', color: 'white' }}>All Servers</option>
              {uniqueServers.map(server => (
                <option 
                  key={server.id} 
                  value={server.id}
                  style={{ backgroundColor: '#0f172a', color: 'white' }}
                >
                  {server.name || server.region || server.id}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-white text-opacity-80 text-sm mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-secondary-900 bg-opacity-60 border border-primary-400 border-opacity-30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400 focus:ring-opacity-50 transition-all duration-300"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                color: 'white',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2300d4ff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                paddingRight: '40px'
              }}
            >
              <option value="all" style={{ backgroundColor: '#0f172a', color: 'white' }}>All Time</option>
              <option value="today" style={{ backgroundColor: '#0f172a', color: 'white' }}>Today</option>
              <option value="week" style={{ backgroundColor: '#0f172a', color: 'white' }}>Last 7 Days</option>
              <option value="month" style={{ backgroundColor: '#0f172a', color: 'white' }}>Last 30 Days</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setShowCharts(!showCharts)}
            className="px-4 py-2 rounded-lg bg-primary-500 bg-opacity-30 hover:bg-opacity-50 text-white text-sm font-medium transition-all duration-300"
          >
            {showCharts ? '📉 Hide Charts' : '📈 Show Charts'}
          </button>
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="px-4 py-2 rounded-lg bg-primary-500 bg-opacity-30 hover:bg-opacity-50 text-white text-sm font-medium transition-all duration-300"
          >
            {showAnalytics ? '📊 Hide Analytics' : '📊 Show Analytics'}
          </button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {showAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-6 text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {analytics.totalTests}
            </div>
            <div className="text-white text-opacity-80 text-sm">Total Tests</div>
          </div>
          
          <div className="glass-card p-6 text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {analytics.avgDownload > 0 ? analytics.avgDownload.toFixed(1) : '--'}
            </div>
            <div className="text-white text-opacity-80 text-sm">Avg Download (Mbps)</div>
            {analytics.bestDownload && (
              <div className="text-xs text-green-400 mt-1">
                Best: {analytics.bestDownload.toFixed(1)} Mbps
              </div>
            )}
          </div>
          
          <div className="glass-card p-6 text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {analytics.avgUpload > 0 ? analytics.avgUpload.toFixed(1) : '--'}
            </div>
            <div className="text-white text-opacity-80 text-sm">Avg Upload (Mbps)</div>
            {analytics.bestUpload && (
              <div className="text-xs text-green-400 mt-1">
                Best: {analytics.bestUpload.toFixed(1)} Mbps
              </div>
            )}
          </div>
          
          <div className="glass-card p-6 text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {analytics.avgLatency > 0 ? Math.round(analytics.avgLatency) : '--'}
            </div>
            <div className="text-white text-opacity-80 text-sm">Avg Latency (ms)</div>
            {analytics.trend !== 'neutral' && (
              <div className={`text-xs mt-1 ${analytics.trend === 'improving' ? 'text-green-400' : 'text-red-400'}`}>
                {analytics.trend === 'improving' ? '📈 Improving' : '📉 Declining'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Historical Charts */}
      {showCharts && chartData.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-xl font-semibold text-white mb-4">📈 Speed Trends Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="downloadGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0088ff" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0088ff" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="uploadGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a8a" strokeOpacity={0.2} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  label={{ 
                    value: 'Speed (Mbps)', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fill: '#94a3b8', fontSize: '10px' }
                  }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    border: '1px solid rgba(59, 130, 246, 0.5)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="download" 
                  stroke="#0088ff" 
                  strokeWidth={2}
                  fill="url(#downloadGradient)"
                  name="Download (Mbps)"
                />
                <Area 
                  type="monotone" 
                  dataKey="upload" 
                  stroke="#00d4ff" 
                  strokeWidth={2}
                  fill="url(#uploadGradient)"
                  name="Upload (Mbps)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Results List */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-white">
            Test History ({filteredResults.length} {filteredResults.length === 1 ? 'result' : 'results'})
          </h3>
        </div>
        
        {filteredResults.length === 0 ? (
          <div className="glass-card p-6 text-center">
            <p className="text-white text-opacity-80">No results match your current filters.</p>
          </div>
        ) : (
          filteredResults.map((result) => (
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
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-white text-opacity-80 text-sm">
                      Server: {result.server?.region || result.server?.name || 'Unknown'}
                    </div>
                    {result.metrics && (
                      <div className="text-white text-opacity-60 text-xs">
                        Latency: {result.metrics.latency}ms
                        {result.metrics.jitter && ` | Jitter: ${result.metrics.jitter}ms`}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteResult(result.id)}
                    className="px-2 py-1 rounded text-red-400 hover:bg-red-500 hover:bg-opacity-20 text-xs transition-all duration-300"
                    title="Delete this result"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              {result.duration && (
                <div className="mt-3 pt-3 border-t border-white border-opacity-20">
                  <div className="flex justify-between text-sm text-white text-opacity-70">
                    <span>Duration: {(result.duration / 1000).toFixed(1)}s</span>
                    {result.userInfo?.isp && (
                      <span>ISP: {result.userInfo.isp}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Export Options */}
      <div className="glass-card p-6 text-center">
        <h3 className="text-xl font-semibold text-white mb-4">Export Results</h3>
        <div className="flex gap-3 justify-center">
          <button 
            onClick={handleExportJSON}
            className="gradient-button px-4 py-2 rounded-lg text-white font-medium transition-all duration-300 hover:shadow-lg"
          >
            📄 Export JSON
          </button>
          <button 
            onClick={handleExportCSV}
            className="gradient-button px-4 py-2 rounded-lg text-white font-medium transition-all duration-300 hover:shadow-lg"
          >
            📊 Export CSV
          </button>
        </div>
        <p className="text-white text-opacity-60 text-sm mt-4">
          Export includes all {storageStats.totalTests} stored test results
        </p>
      </div>
    </div>
  );
}

export default Results;
