import React, { useState, useEffect } from 'react';
import SpeedTest from './components/SpeedTest';
import Header from './components/Header';
import ServerSelector from './components/ServerSelector';
import Results from './components/Results';
import Comparison from './components/Comparison';
import Footer from './components/Footer';

function App() {
  const [activeTab, setActiveTab] = useState('test');
  const [testResults, setTestResults] = useState([]);
  const [selectedServer, setSelectedServer] = useState(null);
  const [availableServers, setAvailableServers] = useState([]);

  useEffect(() => {
    // Load available servers (this will be populated from your AWS regions)
    const defaultServers = [
      { id: 'local', name: 'Local Development', region: 'local', url: 'http://localhost:3001' },
      // These will be populated when you deploy to AWS
      { id: 'us-east-1', name: 'US East (Virginia)', region: 'us-east-1', url: 'https://speedtest-us-east-1.your-domain.com' },
      { id: 'eu-west-1', name: 'EU West (Ireland)', region: 'eu-west-1', url: 'https://speedtest-eu-west-1.your-domain.com' },
      { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore)', region: 'ap-southeast-1', url: 'https://speedtest-ap-southeast-1.your-domain.com' }
    ];
    
    setAvailableServers(defaultServers);
    setSelectedServer(defaultServers[0]);
  }, []);

  const handleTestComplete = (result) => {
    setTestResults(prev => [result, ...prev].slice(0, 10)); // Keep last 10 results
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'test':
        return (
          <div className="glass-card p-8 max-w-4xl mx-auto">
            <SpeedTest 
              selectedServer={selectedServer}
              onTestComplete={handleTestComplete}
            />
          </div>
        );
      case 'servers':
        return (
          <div className="glass-card p-8 max-w-4xl mx-auto">
            <ServerSelector 
              servers={availableServers}
              selectedServer={selectedServer}
              onServerSelect={setSelectedServer}
            />
          </div>
        );
      case 'results':
        return (
          <div className="glass-card p-8 max-w-4xl mx-auto">
            <Results results={testResults} />
          </div>
        );
      case 'comparison':
        return (
          <div className="glass-card p-8 max-w-4xl mx-auto">
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
      <div className="max-w-6xl mx-auto px-5 py-5 flex-1">
        {/* Tab Navigation */}
        <div className="flex gap-5 my-8 border-b-2 border-primary-400 border-opacity-30">
          <button 
            className={`px-6 py-3 rounded-t-lg font-medium text-base transition-all duration-300 ${
              activeTab === 'test' 
                ? 'bg-primary-500 bg-opacity-30 text-white border-x border-t border-primary-400 border-opacity-50' 
                : 'bg-transparent text-neutral-300 hover:bg-primary-500 hover:bg-opacity-20 hover:text-white'
            }`}
            onClick={() => setActiveTab('test')}
          >
            🚀 Speed Test
          </button>
          <button 
            className={`px-6 py-3 rounded-t-lg font-medium text-base transition-all duration-300 ${
              activeTab === 'servers' 
                ? 'bg-primary-500 bg-opacity-30 text-white border-x border-t border-primary-400 border-opacity-50' 
                : 'bg-transparent text-neutral-300 hover:bg-primary-500 hover:bg-opacity-20 hover:text-white'
            }`}
            onClick={() => setActiveTab('servers')}
          >
            🌍 Servers
          </button>
          <button 
            className={`px-6 py-3 rounded-t-lg font-medium text-base transition-all duration-300 ${
              activeTab === 'results' 
                ? 'bg-primary-500 bg-opacity-30 text-white border-x border-t border-primary-400 border-opacity-50' 
                : 'bg-transparent text-neutral-300 hover:bg-primary-500 hover:bg-opacity-20 hover:text-white'
            }`}
            onClick={() => setActiveTab('results')}
          >
            📊 Results
          </button>
          <button 
            className={`px-6 py-3 rounded-t-lg font-medium text-base transition-all duration-300 ${
              activeTab === 'comparison' 
                ? 'bg-primary-500 bg-opacity-30 text-white border-x border-t border-primary-400 border-opacity-50' 
                : 'bg-transparent text-neutral-300 hover:bg-primary-500 hover:bg-opacity-20 hover:text-white'
            }`}
            onClick={() => setActiveTab('comparison')}
          >
            🔍 Compare
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="my-5">
          {renderContent()}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default App; 