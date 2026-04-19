import React, { useState, useEffect } from 'react';
import SpeedTest from './components/SpeedTest';
import Header from './components/Header';
import ServerSelector from './components/ServerSelector';
import Results from './components/Results';
import Comparison from './components/Comparison';
import Footer from './components/Footer';
import { getStoredResults, saveTestResult } from './utils/storage';

function App() {
  const [activeTab, setActiveTab] = useState('test');
  const [testResults, setTestResults] = useState([]);
  const [selectedServer, setSelectedServer] = useState(null);
  const [availableServers, setAvailableServers] = useState([]);

  // Load stored results from localStorage on mount
  useEffect(() => {
    const storedResults = getStoredResults();
    setTestResults(storedResults);
  }, []);

  useEffect(() => {
    const envApiUrl = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
    const defaultServers = [
      { id: 'local', name: 'Local Development', region: 'local', url: 'http://localhost:3002' },
      ...(envApiUrl
        ? [{ id: 'env', name: 'Configured API (REACT_APP_API_URL)', region: 'configured', url: envApiUrl }]
        : []),
      { id: 'us-east-1', name: 'US East (Virginia)', region: 'us-east-1', url: 'https://speedtest-us-east-1.your-domain.com' },
      { id: 'eu-west-1', name: 'EU West (Ireland)', region: 'eu-west-1', url: 'https://speedtest-eu-west-1.your-domain.com' },
      { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore)', region: 'ap-southeast-1', url: 'https://speedtest-ap-southeast-1.your-domain.com' }
    ];

    setAvailableServers(defaultServers);
    const initial =
      process.env.NODE_ENV === 'production' && envApiUrl
        ? defaultServers.find((s) => s.id === 'env')
        : defaultServers[0];
    setSelectedServer(initial || defaultServers[0]);
  }, []);

  const handleTestComplete = (result) => {
    // Save to localStorage
    saveTestResult(result);
    
    // Update state (load from storage to ensure consistency)
    const storedResults = getStoredResults();
    setTestResults(storedResults);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'test':
        return (
          <div className="glass-card p-10 w-full">
            <SpeedTest 
              selectedServer={selectedServer}
              onTestComplete={handleTestComplete}
            />
          </div>
        );
      case 'servers':
        return (
          <div className="glass-card p-10 w-full">
            <ServerSelector 
              servers={availableServers}
              selectedServer={selectedServer}
              onServerSelect={setSelectedServer}
            />
          </div>
        );
      case 'results':
        return (
          <div className="glass-card p-10 w-full">
            <Results results={testResults} />
          </div>
        );
      case 'comparison':
        return (
          <div className="glass-card p-10 w-full">
            <Comparison />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-cyber-gradient text-white flex flex-col">
      <Header />
      <div className="max-w-7xl mx-auto px-8 py-10 flex-1 w-full">
        {/* Tab Navigation */}
        <div className="flex gap-3 mb-10 bg-secondary-900 bg-opacity-30 p-2 rounded-xl backdrop-blur-sm border border-primary-400 border-opacity-20">
          <button 
            className={`flex-1 px-8 py-4 rounded-lg font-semibold text-base transition-all duration-300 ${
              activeTab === 'test' 
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg transform scale-[1.02]' 
                : 'text-neutral-300 hover:bg-primary-500 hover:bg-opacity-20 hover:text-white'
            }`}
            onClick={() => setActiveTab('test')}
          >
            Speed Test
          </button>
          <button 
            className={`flex-1 px-8 py-4 rounded-lg font-semibold text-base transition-all duration-300 ${
              activeTab === 'servers' 
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg transform scale-[1.02]' 
                : 'text-neutral-300 hover:bg-primary-500 hover:bg-opacity-20 hover:text-white'
            }`}
            onClick={() => setActiveTab('servers')}
          >
            Servers
          </button>
          <button 
            className={`flex-1 px-8 py-4 rounded-lg font-semibold text-base transition-all duration-300 ${
              activeTab === 'results' 
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg transform scale-[1.02]' 
                : 'text-neutral-300 hover:bg-primary-500 hover:bg-opacity-20 hover:text-white'
            }`}
            onClick={() => setActiveTab('results')}
          >
            Results
          </button>
          <button 
            className={`flex-1 px-8 py-4 rounded-lg font-semibold text-base transition-all duration-300 ${
              activeTab === 'comparison' 
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg transform scale-[1.02]' 
                : 'text-neutral-300 hover:bg-primary-500 hover:bg-opacity-20 hover:text-white'
            }`}
            onClick={() => setActiveTab('comparison')}
          >
            Compare
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="animate-fade-in">
          {renderContent()}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default App; 