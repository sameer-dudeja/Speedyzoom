import React, { useState } from 'react';

function Comparison() {
  const [comparisonData, setComparisonData] = useState({
    speedyZoom: '',
    ookla: '',
    fastCom: '',
    googleSpeed: ''
  });

  const [analysisResult, setAnalysisResult] = useState(null);

  const handleInputChange = (service, value) => {
    setComparisonData(prev => ({
      ...prev,
      [service]: value
    }));
  };

  const analyzeResults = () => {
    const speedyZoomSpeed = parseFloat(comparisonData.speedyZoom);
    const ooklaSpeed = parseFloat(comparisonData.ookla);
    const fastComSpeed = parseFloat(comparisonData.fastCom);
    const googleSpeed = parseFloat(comparisonData.googleSpeed);

    if (!speedyZoomSpeed) {
      alert('Please enter your SpeedyZoom result first');
      return;
    }

    const comparisons = [];
    
    if (ooklaSpeed) {
      const diff = ((ooklaSpeed - speedyZoomSpeed) / speedyZoomSpeed) * 100;
      comparisons.push({
        service: 'Ookla Speedtest',
        speed: ooklaSpeed,
        difference: diff,
        status: getOptimizationStatus(diff)
      });
    }

    if (fastComSpeed) {
      const diff = ((fastComSpeed - speedyZoomSpeed) / speedyZoomSpeed) * 100;
      comparisons.push({
        service: 'Fast.com',
        speed: fastComSpeed,
        difference: diff,
        status: getOptimizationStatus(diff)
      });
    }

    if (googleSpeed) {
      const diff = ((googleSpeed - speedyZoomSpeed) / speedyZoomSpeed) * 100;
      comparisons.push({
        service: 'Google Speed Test',
        speed: googleSpeed,
        difference: diff,
        status: getOptimizationStatus(diff)
      });
    }

    setAnalysisResult({
      speedyZoomSpeed,
      comparisons,
      overallAssessment: getOverallAssessment(comparisons)
    });
  };

  const getOptimizationStatus = (diff) => {
    if (diff <= 5) return 'normal';
    if (diff <= 20) return 'suspicious';
    if (diff <= 50) return 'likely';
    return 'definite';
  };

  const getOverallAssessment = (comparisons) => {
    if (comparisons.length === 0) return 'insufficient';
    
    const avgDiff = comparisons.reduce((sum, comp) => sum + comp.difference, 0) / comparisons.length;
    
    if (avgDiff <= 5) return 'no-optimization';
    if (avgDiff <= 20) return 'mild-optimization';
    if (avgDiff <= 50) return 'significant-optimization';
    return 'heavy-optimization';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'normal': return 'text-green-400';
      case 'suspicious': return 'text-yellow-400';
      case 'likely': return 'text-orange-400';
      case 'definite': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'normal': return '✅';
      case 'suspicious': return '⚠️';
      case 'likely': return '🔶';
      case 'definite': return '🚨';
      default: return '❓';
    }
  };

  const getAssessmentMessage = (assessment) => {
    switch (assessment) {
      case 'no-optimization':
        return {
          icon: '✅',
          title: 'No ISP Optimization Detected',
          message: 'Your ISP appears to treat all traffic equally. This is ideal!',
          color: 'text-green-400'
        };
      case 'mild-optimization':
        return {
          icon: '⚠️',
          title: 'Mild ISP Optimization Detected',
          message: 'Some speed test sites may receive slightly preferential treatment.',
          color: 'text-yellow-400'
        };
      case 'significant-optimization':
        return {
          icon: '🔶',
          title: 'Significant ISP Optimization Detected',
          message: 'Popular speed test sites appear to be heavily optimized by your ISP.',
          color: 'text-orange-400'
        };
      case 'heavy-optimization':
        return {
          icon: '🚨',
          title: 'Heavy ISP Optimization Detected',
          message: 'Your ISP is likely providing very different performance for speed tests vs real usage.',
          color: 'text-red-400'
        };
      default:
        return {
          icon: '❓',
          title: 'Insufficient Data',
          message: 'Add more speed test results for better analysis.',
          color: 'text-gray-400'
        };
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-5 flex items-center justify-center gap-3">
          <span className="text-3xl">🔍</span> ISP Optimization Analysis
        </h2>
        <p className="text-white text-opacity-80 text-lg">
          Compare SpeedyZoom results with popular speed test sites to detect ISP optimizations
        </p>
      </div>

      {/* Input Form */}
      <div className="glass-card p-8">
        <h3 className="text-2xl font-semibold text-white mb-6">Enter Your Speed Test Results</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-white text-opacity-80 text-base mb-3 font-medium">
              SpeedyZoom Result (Mbps) *
            </label>
            <input
              type="number"
              placeholder="e.g., 150.5"
              className="w-full bg-white bg-opacity-10 border border-white border-opacity-30 rounded-lg px-5 py-3 text-white text-base placeholder-white placeholder-opacity-50 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400 focus:ring-opacity-50 transition-all"
              value={comparisonData.speedyZoom}
              onChange={(e) => handleInputChange('speedyZoom', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-white text-opacity-80 text-base mb-3 font-medium">
              Ookla Speedtest.net (Mbps)
            </label>
            <input
              type="number"
              placeholder="e.g., 300.0"
              className="w-full bg-white bg-opacity-10 border border-white border-opacity-30 rounded-lg px-5 py-3 text-white text-base placeholder-white placeholder-opacity-50 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400 focus:ring-opacity-50 transition-all"
              value={comparisonData.ookla}
              onChange={(e) => handleInputChange('ookla', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-white text-opacity-80 text-base mb-3 font-medium">
              Fast.com (Netflix) (Mbps)
            </label>
            <input
              type="number"
              placeholder="e.g., 280.0"
              className="w-full bg-white bg-opacity-10 border border-white border-opacity-30 rounded-lg px-5 py-3 text-white text-base placeholder-white placeholder-opacity-50 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400 focus:ring-opacity-50 transition-all"
              value={comparisonData.fastCom}
              onChange={(e) => handleInputChange('fastCom', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-white text-opacity-80 text-base mb-3 font-medium">
              Google Speed Test (Mbps)
            </label>
            <input
              type="number"
              placeholder="e.g., 290.0"
              className="w-full bg-white bg-opacity-10 border border-white border-opacity-30 rounded-lg px-5 py-3 text-white text-base placeholder-white placeholder-opacity-50 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400 focus:ring-opacity-50 transition-all"
              value={comparisonData.googleSpeed}
              onChange={(e) => handleInputChange('googleSpeed', e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={analyzeResults}
          className="w-full mt-8 gradient-button py-4 rounded-xl text-white text-lg font-bold transition-all duration-300 hover:shadow-2xl hover:scale-105"
        >
          🔍 Analyze ISP Optimization
        </button>
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Overall Assessment */}
          <div className="glass-card p-10 transform hover:scale-105 transition-transform duration-300">
            <div className="text-center">
              <div className="text-6xl mb-5">
                {getAssessmentMessage(analysisResult.overallAssessment).icon}
              </div>
              <h3 className={`text-3xl font-bold mb-4 ${getAssessmentMessage(analysisResult.overallAssessment).color}`}>
                {getAssessmentMessage(analysisResult.overallAssessment).title}
              </h3>
              <p className="text-white text-opacity-80 text-lg">
                {getAssessmentMessage(analysisResult.overallAssessment).message}
              </p>
            </div>
          </div>

          {/* Detailed Comparisons */}
          <div className="glass-card p-8">
            <h3 className="text-2xl font-semibold text-white mb-6">Detailed Analysis</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-5 bg-white bg-opacity-5 rounded-xl transform hover:scale-105 transition-transform">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">⚡</span>
                  <span className="text-white font-semibold text-lg">SpeedyZoom (Baseline)</span>
                </div>
                <div className="text-white font-bold text-xl">
                  {analysisResult.speedyZoomSpeed.toFixed(1)} Mbps
                </div>
              </div>

              {analysisResult.comparisons.map((comp, index) => (
                <div key={index} className="flex items-center justify-between p-5 bg-white bg-opacity-5 rounded-xl transform hover:scale-105 transition-transform">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{getStatusIcon(comp.status)}</span>
                    <span className="text-white font-semibold text-lg">{comp.service}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold text-xl">
                      {comp.speed.toFixed(1)} Mbps
                    </div>
                    <div className={`text-base font-medium ${getStatusColor(comp.status)}`}>
                      {comp.difference > 0 ? '+' : ''}{comp.difference.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="glass-card p-8">
            <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
              <span className="text-xl">💡</span> What This Means
            </h3>
            <div className="space-y-4 text-white text-opacity-80 text-base">
              <div className="flex items-start gap-4 p-4 bg-white bg-opacity-5 rounded-lg">
                <span className="text-green-400 mt-1 text-xl">✓</span>
                <div>
                  <strong className="text-white">Normal (0-5% difference):</strong> Your ISP treats all traffic equally - ideal situation.
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-white bg-opacity-5 rounded-lg">
                <span className="text-yellow-400 mt-1 text-xl">⚠</span>
                <div>
                  <strong className="text-white">Suspicious (5-20% difference):</strong> Possible mild optimization of speed test sites.
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-white bg-opacity-5 rounded-lg">
                <span className="text-orange-400 mt-1 text-xl">🔶</span>
                <div>
                  <strong className="text-white">Likely Optimization (20-50% difference):</strong> Speed test sites probably get preferential routing.
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-white bg-opacity-5 rounded-lg">
                <span className="text-red-400 mt-1 text-xl">🚨</span>
                <div>
                  <strong className="text-white">Definite Optimization (50%+ difference):</strong> Significant difference between speed tests and real performance.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="glass-card p-8">
        <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
          <span className="text-xl">📋</span> How to Use This Tool
        </h3>
        <div className="space-y-4 text-white text-opacity-80 text-base">
          <div className="flex items-start gap-4 p-4 bg-white bg-opacity-5 rounded-lg">
            <span className="text-primary-400 font-bold text-xl">1.</span>
            <div className="leading-relaxed">Run a speed test with SpeedyZoom using our custom methodology</div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-white bg-opacity-5 rounded-lg">
            <span className="text-primary-400 font-bold text-xl">2.</span>
            <div className="leading-relaxed">Visit popular speed test sites (Ookla, Fast.com, Google) and record their results</div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-white bg-opacity-5 rounded-lg">
            <span className="text-primary-400 font-bold text-xl">3.</span>
            <div className="leading-relaxed">Enter all results above and click "Analyze" to detect ISP optimizations</div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-white bg-opacity-5 rounded-lg">
            <span className="text-primary-400 font-bold text-xl">4.</span>
            <div className="leading-relaxed">Compare the results - large differences may indicate ISP traffic shaping</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Comparison; 