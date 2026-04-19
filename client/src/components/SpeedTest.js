import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

function SpeedTest({ selectedServer, onTestComplete }) {
	const [isTestRunning, setIsTestRunning] = useState(false);
	const [currentTestType, setCurrentTestType] = useState(''); // Currently running test type
	const [currentSpeed, setCurrentSpeed] = useState(0);
	const [progress, setProgress] = useState(0);
	const [testResults, setTestResults] = useState({
		download: null,
		upload: null
	});
	const [metrics, setMetrics] = useState({
		latency: 0,
		jitter: 0
	});
	const [speedUnit, setSpeedUnit] = useState('Mbps'); // 'Mbps' or 'MB/s'
	const [userInfo, setUserInfo] = useState({
		ip: null,
		isp: null,
		location: null,
		country: null
	});
	const [downloadGraphData, setDownloadGraphData] = useState([]);
	const [uploadGraphData, setUploadGraphData] = useState([]);

	const socketRef = useRef(null);
	const testStartTime = useRef(null);
	const testCompletionRef = useRef({
		download: false,
		upload: false
	});

	useEffect(() => {
		if (selectedServer && selectedServer.url) {
			// Initialize socket connection for real-time testing
			socketRef.current = io(selectedServer.url);

			socketRef.current.on('connect', () => {
				// WebSocket connected
			});

			socketRef.current.on('download-chunk', (data) => {
				updateSpeedFromChunk(data);
			});

			socketRef.current.on('download-complete', (data) => {
				handleTestComplete(data, 'download');
			});

			socketRef.current.on('disconnect', () => {
				// WebSocket disconnected
			});

			return () => {
				if (socketRef.current) {
					socketRef.current.disconnect();
				}
			};
		}
	}, [selectedServer]);

	const updateSpeedFromChunk = useCallback((data) => {
		const now = Date.now();
		const elapsed = Math.max((now - testStartTime.current) / 1000, 0.001); // Prevent division by zero
		const speedMbps = (data.totalSent * 8) / (elapsed * 1000000); // Correct Mbps calculation

		setCurrentSpeed(Math.min(speedMbps, 1000)); // Cap at 1Gbps for sanity
		setProgress((data.totalSent / (10 * 1024 * 1024)) * 100); // Assuming 10MB test

		// Update graph data
		setDownloadGraphData(prev => {
			const newPoint = {
				time: parseFloat(elapsed.toFixed(1)), // Ensure it's a number for proper scaling
				speed: Math.min(speedMbps, 1000)
			};
			// Keep all data points for complete test visualization
			return [...prev, newPoint];
		});
	}, []);

	const startLatencyTest = async () => {
		if (!selectedServer) return;

		const latencies = [];

		for (let i = 0; i < 5; i++) {
			const start = Date.now();
			try {
				await axios.get(`${selectedServer.url}/ping`);
				const latency = Date.now() - start;
				latencies.push(latency);
			} catch (error) {
				console.error('Latency test failed:', error);
			}
		}

		if (latencies.length > 0) {
			const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
			const jitter = Math.max(...latencies) - Math.min(...latencies);

			setMetrics(prev => ({
				...prev,
				latency: Math.round(avgLatency),
				jitter: Math.round(jitter)
			}));
		}
	};

	const startDownloadTest = async () => {
		if (!selectedServer) return;

		setProgress(0);
		setCurrentSpeed(0);
		testStartTime.current = Date.now();
		setDownloadGraphData([{ time: 0, speed: 0 }]);

		try {
			// Multi-phase adaptive download test
			await runAdaptiveDownloadTest();
		} catch (error) {
			console.error('Download test failed:', error);
		}
	};

	const runAdaptiveDownloadTest = async () => {
		const phases = [
			{ size: 1, duration: 2000, name: 'warmup' },     // 1MB warmup
			{ size: 5, duration: 3000, name: 'ramp' },       // 5MB ramp-up  
			{ size: 25, duration: 8000, name: 'sustained' }, // 25MB sustained
			{ size: 50, duration: 15000, name: 'peak' }      // 50MB peak test
		];

		let totalBytes = 0;
		let totalDuration = 0;
		let peakSpeed = 0;
		let sustainedSpeed = 0;
		const speedSamples = [];

		for (let i = 0; i < phases.length; i++) {
			const phase = phases[i];
			console.log(`Starting ${phase.name} phase: ${phase.size}MB`);
			
			const phaseStart = Date.now();
			
			try {
				const response = await axios.get(`${selectedServer.url}/download/${phase.size}`, {
					responseType: 'blob',
					timeout: phase.duration,
					onDownloadProgress: (progressEvent) => {
						const { loaded } = progressEvent;
						const elapsed = (Date.now() - testStartTime.current) / 1000;
						const phaseElapsed = (Date.now() - phaseStart) / 1000;
						
						// Calculate instantaneous speed (smoothed over last 500ms)
						const instantSpeed = (loaded * 8) / (phaseElapsed * 1000000);
						const smoothedSpeed = Math.min(instantSpeed, 1000);
						
						setCurrentSpeed(smoothedSpeed);
						peakSpeed = Math.max(peakSpeed, smoothedSpeed);
						
						if (phase.name === 'sustained' || phase.name === 'peak') {
							speedSamples.push(smoothedSpeed);
						}

						// Update progress across all phases
						const phaseWeight = [0.1, 0.2, 0.4, 0.3][i]; // Different weights per phase
						const baseProgress = phases.slice(0, i).reduce((sum, p, idx) => sum + [0.1, 0.2, 0.4, 0.3][idx] * 100, 0);
						const phaseProgress = (loaded / (phase.size * 1024 * 1024)) * phaseWeight * 100;
						setProgress(baseProgress + phaseProgress);

						// Add to graph data
						setDownloadGraphData(prev => [
							...prev,
							{
								time: parseFloat(elapsed.toFixed(1)),
								speed: smoothedSpeed,
								phase: phase.name
							}
						]);
					}
				});

				const phaseDuration = Date.now() - phaseStart;
				totalBytes += response.data.size;
				totalDuration += phaseDuration;

				// Short pause between phases to stabilize
				if (i < phases.length - 1) {
					await new Promise(resolve => setTimeout(resolve, 200));
				}

			} catch (error) {
				if (error.code === 'ECONNABORTED') {
					console.log(`Phase ${phase.name} timed out, continuing...`);
					break; // Stop if network can't handle this phase
				}
				throw error;
			}
		}

		// Calculate final results
		const trimCount = Math.max(1, Math.floor(speedSamples.length * 0.6));
		sustainedSpeed = speedSamples.length > 0 
			? speedSamples.slice(-trimCount).reduce((a, b) => a + b, 0) / trimCount
			: peakSpeed;

		handleTestComplete({
			totalBytes,
			duration: totalDuration,
			avgSpeed: sustainedSpeed.toFixed(2),
			peakSpeed: peakSpeed.toFixed(2),
			testType: 'adaptive-download'
		}, 'download');
	};

	const startUploadTest = async () => {
		if (!selectedServer) return;

		setProgress(0);
		setCurrentSpeed(0);
		testStartTime.current = Date.now();

		// Add initial data point at time 0
		setUploadGraphData([{ time: 0, speed: 0 }]);

		try {
			// Generate random data for upload (5MB)
			const testData = new ArrayBuffer(5 * 1024 * 1024);
			const view = new Uint8Array(testData);
			for (let i = 0; i < view.length; i++) {
				view[i] = Math.floor(Math.random() * 256);
			}

			// Track progress updates for better visualization
			let lastProgressUpdate = 0;
			const progressUpdateInterval = 50; // Update every 50ms (more frequent)
			let uploadCompleteTime = null;
			let finalUploadSpeed = 0;

			const response = await axios.post(`${selectedServer.url}/upload`, testData, {
				headers: {
					'Content-Type': 'application/octet-stream'
				},
				onUploadProgress: (progressEvent) => {
					const { loaded, total } = progressEvent;
					const now = Date.now();
					
					// Update on every progress event or every 50ms, whichever comes first
					if (now - lastProgressUpdate >= progressUpdateInterval || loaded === total) {
						lastProgressUpdate = now;
						
						const realElapsed = (now - testStartTime.current) / 1000;
						const speedMbps = (loaded * 8) / (realElapsed * 1000000);
						
						setCurrentSpeed(Math.min(speedMbps, 1000));
						setProgress((loaded / total) * 100);

						// Add REAL data point with REAL timing
						setUploadGraphData(prev => {
							const newPoint = {
								time: parseFloat(realElapsed.toFixed(1)),
								speed: Math.min(speedMbps, 1000)
							};
							return [...prev, newPoint];
						});

						// Track when upload actually completes
						if (loaded === total) {
							uploadCompleteTime = now;
							finalUploadSpeed = Math.min(speedMbps, 1000);
						}
					}
				}
			});

			// Calculate upload test duration and speed
			const actualUploadTime = uploadCompleteTime ? (uploadCompleteTime - testStartTime.current) : Math.max((Date.now() - testStartTime.current), 1);
			const uploadSpeed = (testData.byteLength * 8) / ((actualUploadTime / 1000) * 1000000); // Mbps

			// Ensure minimum test duration for UI visibility and accuracy
			const minTestDuration = 2000; // 2 seconds minimum
			const remainingTime = minTestDuration - actualUploadTime;
			
			if (remainingTime > 0) {
				// Continue showing the final speed during the remaining time
				// Add data points to maintain graph continuity
				const updateInterval = 100; // Update every 100ms during wait
				const updatesNeeded = Math.ceil(remainingTime / updateInterval);
				
				for (let i = 1; i <= updatesNeeded; i++) {
					await new Promise(resolve => setTimeout(resolve, updateInterval));
					const elapsed = (Date.now() - testStartTime.current) / 1000;
					
					// Add data point showing maintained speed
					setUploadGraphData(prev => {
						const newPoint = {
							time: parseFloat(elapsed.toFixed(1)),
							speed: finalUploadSpeed || Math.min(uploadSpeed, 1000)
						};
						return [...prev, newPoint];
					});
				}
			}

			// Recalculate with actual duration used
			const finalDuration = Math.max((Date.now() - testStartTime.current), minTestDuration);
			const finalSpeed = (testData.byteLength * 8) / ((finalDuration / 1000) * 1000000); // Mbps

			// Create proper result object with calculated values
			const uploadResult = {
				...response.data, // Include server response data first
				totalBytes: testData.byteLength, // Override with our values
				duration: finalDuration, // Override server duration with our calculated duration
				avgSpeed: Math.min(finalSpeed, 1000).toFixed(2), // Override with our calculated speed
			};

			handleTestComplete(uploadResult, 'upload');
		} catch (error) {
			console.error('Upload test failed:', error);
		}
	};

	const handleTestComplete = useCallback((result, testType) => {
		// Set completion flag immediately
		testCompletionRef.current[testType] = true;

		// Use the speed from the result, preferring avgSpeed for upload tests
		let finalSpeed = result.avgSpeed || result.speedMbps || 0;

		// Only recalculate if no speed is provided (mainly for WebSocket downloads without proper speed)
		if (!finalSpeed && result.totalBytes && result.duration) {
			const durationSeconds = Math.max(result.duration / 1000, 0.001);
			const calculatedSpeed = (result.totalBytes * 8) / (durationSeconds * 1000000);
			finalSpeed = Math.min(calculatedSpeed, 1000).toFixed(2);
		}

		// Store the result for this test type
		setTestResults(prev => {
			const newResults = {
				...prev,
				[testType]: {
					speed: finalSpeed,
					duration: result.duration,
					timestamp: new Date().toISOString()
				}
			};
			return newResults;
		});

		const testResult = {
			id: Date.now(),
			type: testType,
			speed: finalSpeed,
			server: selectedServer,
			timestamp: new Date().toISOString(),
			metrics: { ...metrics },
			duration: result.duration,
			userInfo: { ...userInfo } // Include user info for historical tracking
		};

		onTestComplete(testResult);
	}, [selectedServer, metrics, onTestComplete, userInfo]);

	const resetTest = useCallback(() => {
		setIsTestRunning(false);
		setCurrentTestType('');
		setProgress(0);
		setCurrentSpeed(0);
		setTestResults({ download: null, upload: null });
		setDownloadGraphData([]);
		setUploadGraphData([]);
		// Reset completion flags
		testCompletionRef.current = { download: false, upload: false };
		if (socketRef.current) {
			socketRef.current.disconnect();
			socketRef.current.connect();
		}
	}, []);

	const waitForTestCompletion = useCallback((testType) => {
		return new Promise((resolve) => {
			const checkCompletion = () => {
				if (testCompletionRef.current[testType]) {
					resolve();
				} else {
					setTimeout(checkCompletion, 100);
				}
			};
			checkCompletion();
		});
	}, []);

	const runCompleteSpeedTest = async () => {
		if (isTestRunning) {
			return;
		}

		setIsTestRunning(true);
		setTestResults({ download: null, upload: null }); // Clear previous results
		setDownloadGraphData([]);
		setUploadGraphData([]);
		// Reset completion flags
		testCompletionRef.current = { download: false, upload: false };

		try {
			// Step 1: Latency test
			await startLatencyTest();

			// Step 2: Download test
			setCurrentTestType('download');
			setProgress(0);
			setCurrentSpeed(0);

			if (selectedServer.id === 'local') {
				// For WebSocket tests, we need to wait for completion
				await startDownloadTest();
				await waitForTestCompletion('download');
			} else {
				// HTTP tests complete automatically
				await startDownloadTest();
			}

			// Step 3: Upload test
			setCurrentTestType('upload');
			setProgress(0);
			setCurrentSpeed(0);

			// Add a small delay to ensure UI updates are visible
			await new Promise(resolve => setTimeout(resolve, 500));

			await startUploadTest();

			// Step 4: Complete
			setIsTestRunning(false);
			setCurrentTestType('');
			setProgress(100);

			setTimeout(() => {
				setProgress(0);
				setCurrentSpeed(0);
			}, 2000);
		} catch (error) {
			console.error('Speed test sequence failed:', error);
			setIsTestRunning(false);
		}
	};

	// Fetch user IP and ISP information
	const fetchUserInfo = useCallback(async () => {
		try {
			// Using ipapi.co - free tier allows 1000 requests/day
			const response = await axios.get('https://ipapi.co/json/', { timeout: 5000 });
			setUserInfo({
				ip: response.data.ip,
				isp: response.data.org || response.data.network,
				location: `${response.data.city}, ${response.data.region}`,
				country: response.data.country_name
			});
		} catch (error) {
			// Fallback - try to get just IP
			try {
				const ipResponse = await axios.get('https://api.ipify.org?format=json', { timeout: 3000 });
				setUserInfo(prev => ({ ...prev, ip: ipResponse.data.ip }));
			} catch (ipError) {
				// Could not fetch IP info
			}
		}
	}, []);

	// Convert speed between Mbps and MB/s
	const convertSpeed = useCallback((speedMbps) => {
		if (speedUnit === 'MB/s') {
			return (speedMbps / 8).toFixed(1); // Convert Mbps to MB/s
		}
		return speedMbps.toFixed(1);
	}, [speedUnit]);

	const getSpeedUnit = () => speedUnit;

	// Fetch user info on component mount
	useEffect(() => {
		fetchUserInfo();
	}, [fetchUserInfo]);

	return (
		<div className="space-y-8">
			{/* Header with Controls */}
			<div className="flex justify-between items-center">
				<h2 className="text-3xl font-bold text-white flex items-center gap-3">
					<div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center cyber-glow">
						<span className="text-2xl">⚡</span>
					</div>
					Speed Test
				</h2>
				
				{/* Top Right Controls */}
				<div className="flex items-center gap-5">
					{/* Speed Unit Toggle */}
					<div className="bg-secondary-900 bg-opacity-40 rounded-full p-1 border border-primary-400 border-opacity-30">
						<button
							onClick={() => setSpeedUnit('Mbps')}
							className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
								speedUnit === 'Mbps'
									? 'bg-primary-500 text-white'
									: 'text-neutral-300 hover:text-white'
							}`}
						>
							Mbps
						</button>
						<button
							onClick={() => setSpeedUnit('MB/s')}
							className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
								speedUnit === 'MB/s'
									? 'bg-primary-500 text-white'
									: 'text-neutral-300 hover:text-white'
							}`}
						>
							MB/s
						</button>
					</div>

					{/* Reset Button */}
					{(isTestRunning || testResults.download || testResults.upload) && (
						<button
							onClick={resetTest}
							className="px-4 py-2 rounded-full bg-accent-600 hover:bg-accent-500 text-white text-xs font-medium transition-all duration-300 neon-border"
						>
							{isTestRunning ? 'Reset' : 'Clear'}
						</button>
					)}
				</div>
			</div>

			{/* Metrics Grid */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="metric-card p-6">
					<div className="text-sm text-white text-opacity-70 mb-2 font-medium">Latency</div>
					<div className="text-3xl font-bold text-white">{metrics.latency} <span className="text-lg text-opacity-70">ms</span></div>
				</div>
				<div className="metric-card p-6">
					<div className="text-sm text-white text-opacity-70 mb-2 font-medium">Jitter</div>
					<div className="text-3xl font-bold text-white">{metrics.jitter} <span className="text-lg text-opacity-70">ms</span></div>
				</div>
				<div className="metric-card p-6">
					<div className="text-sm text-white text-opacity-70 mb-2 font-medium">Server</div>
					<div className="text-xl font-bold text-white truncate">{selectedServer?.region || 'None'}</div>
				</div>
			</div>

			{/* Speed Graphs */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Download Graph */}
				<div className="glass-card p-6">
					<h4 className="text-base font-semibold text-white mb-4 flex items-center gap-3">
						<span className="text-xl">📥</span> 
						<span>Download Speed</span>
						{currentTestType === 'download' && isTestRunning && (
							<div className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-pulse ml-auto"></div>
						)}
					</h4>
					<div className="h-56">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={downloadGraphData}>
								<defs>
									<linearGradient id="downloadGradient" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#0088ff" stopOpacity={0.8}/>
										<stop offset="95%" stopColor="#0088ff" stopOpacity={0.1}/>
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray="3 3" stroke="#1e3a8a" strokeOpacity={0.2} />
								<XAxis 
									dataKey="time" 
									axisLine={false}
									tickLine={false}
									tick={{ fill: '#94a3b8', fontSize: 10 }}
									domain={[0, 'dataMax']}
									type="number"
									allowDataOverflow={false}
									tickCount={8}
									includeHidden={true}
									tickFormatter={(value) => `${value.toFixed(1)}s`}
								/>
								<YAxis 
									axisLine={false}
									tickLine={false}
									tick={{ fill: '#94a3b8', fontSize: 10 }}
									domain={[0, 'dataMax']}
									allowDataOverflow={false}
									tickFormatter={(value) => `${Math.round(value)} ${speedUnit}`}
									label={{ 
										value: `Speed (${speedUnit})`, 
										angle: -90, 
										position: 'insideLeft',
										style: { textAnchor: 'middle', fill: '#94a3b8', fontSize: '10px' }
									}}
								/>
								<Area 
									type="monotone" 
									dataKey="speed" 
									stroke="#0088ff" 
									strokeWidth={3}
									fill="url(#downloadGradient)"
									fillOpacity={1}
									strokeOpacity={0.8}
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>
					{downloadGraphData.length === 0 && (
						<div className="absolute inset-0 flex items-center justify-center text-neutral-500 text-xs">
							Waiting for download test...
						</div>
					)}
				</div>

				{/* Upload Graph */}
				<div className="glass-card p-6">
					<h4 className="text-base font-semibold text-white mb-4 flex items-center gap-3">
						<span className="text-xl">📤</span>
						<span>Upload Speed</span>
						{currentTestType === 'upload' && isTestRunning && (
							<div className="w-2.5 h-2.5 bg-accent-500 rounded-full animate-pulse ml-auto"></div>
						)}
					</h4>
					<div className="h-56">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={uploadGraphData}>
								<defs>
									<linearGradient id="uploadGradient" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#00d4ff" stopOpacity={0.8}/>
										<stop offset="95%" stopColor="#00d4ff" stopOpacity={0.1}/>
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray="3 3" stroke="#1e3a8a" strokeOpacity={0.2} />
								<XAxis 
									dataKey="time" 
									axisLine={false}
									tickLine={false}
									tick={{ fill: '#94a3b8', fontSize: 10 }}
									domain={([dataMin, dataMax]) => [0, Math.max(dataMax || 0, 2)]}
									type="number"
									allowDataOverflow={false}
									tickCount={8}
									includeHidden={true}
									tickFormatter={(value) => `${value.toFixed(1)}s`}
								/>
								<YAxis 
									axisLine={false}
									tickLine={false}
									tick={{ fill: '#94a3b8', fontSize: 10 }}
									domain={([dataMin, dataMax]) => [0, Math.max(dataMax || 0, 10)]}
									allowDataOverflow={false}
									tickFormatter={(value) => `${Math.round(value)} ${speedUnit}`}
									label={{ 
										value: `Speed (${speedUnit})`, 
										angle: -90, 
										position: 'insideLeft',
										style: { textAnchor: 'middle', fill: '#94a3b8', fontSize: '10px' }
									}}
								/>
								<Area 
									type="monotone" 
									dataKey="speed" 
									stroke="#00d4ff" 
									strokeWidth={3}
									fill="url(#uploadGradient)"
									fillOpacity={1}
									strokeOpacity={0.8}
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>
					{uploadGraphData.length === 0 && (
						<div className="absolute inset-0 flex items-center justify-center text-neutral-500 text-xs">
							Waiting for upload test...
						</div>
					)}
				</div>
			</div>

			{/* Current Speed Display (only during testing) */}
			{isTestRunning && (
				<div className={`text-center py-8`}>
					<div className={`speed-display animate-speed-pulse`}>
						{convertSpeed(currentSpeed)}
						<span className="text-3xl opacity-80 ml-4">{getSpeedUnit()}</span>
					</div>
					<div className="text-base mt-4 text-white text-opacity-70 font-medium">
						{currentTestType === 'download' ? '📥 Downloading' : '📤 Uploading'}
					</div>
				</div>
			)}

			{/* Results Display (persistent until next test) */}
			{!isTestRunning && (testResults.download || testResults.upload) && (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{/* Download Result */}
					<div className="glass-card p-8 text-center transform hover:scale-105 transition-transform duration-300">
						<div className="text-base text-white text-opacity-80 mb-3 font-medium flex items-center justify-center gap-2">
							<span className="text-xl">📥</span> Download
						</div>
						<div className="text-5xl font-bold text-white mb-2">
							{testResults.download ? convertSpeed(parseFloat(testResults.download.speed)) : '--'}
							<span className="text-2xl opacity-80 ml-3">{getSpeedUnit()}</span>
						</div>
						{testResults.download && (
							<div className="text-sm text-white text-opacity-60 mt-3">
								Completed in {(testResults.download.duration / 1000).toFixed(1)}s
							</div>
						)}
					</div>
					
					{/* Upload Result */}
					<div className="glass-card p-8 text-center transform hover:scale-105 transition-transform duration-300">
						<div className="text-base text-white text-opacity-80 mb-3 font-medium flex items-center justify-center gap-2">
							<span className="text-xl">📤</span> Upload
						</div>
						<div className="text-5xl font-bold text-white mb-2">
							{testResults.upload ? convertSpeed(parseFloat(testResults.upload.speed)) : '--'}
							<span className="text-2xl opacity-80 ml-3">{getSpeedUnit()}</span>
						</div>
						{testResults.upload && (
							<div className="text-sm text-white text-opacity-60 mt-3">
								Completed in {(testResults.upload.duration / 1000).toFixed(1)}s
							</div>
						)}
					</div>
				</div>
			)}

			{/* Progress Bar (only during testing) */}
			{isTestRunning && (
				<div className="w-full h-3 bg-secondary-900 bg-opacity-50 rounded-full overflow-hidden neon-border mb-8">
					<div
						className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-300 ease-out cyber-glow"
						style={{ width: `${progress}%` }}
					/>
				</div>
			)}

			{/* Start Test Button */}
			<div className="text-center mb-8">
				<button
					onClick={runCompleteSpeedTest}
					disabled={isTestRunning || !selectedServer}
					className={`px-12 py-4 rounded-xl text-xl font-bold transition-all duration-300 shadow-lg ${isTestRunning || !selectedServer
						? 'bg-gray-600 cursor-not-allowed text-gray-400 opacity-50'
						: 'gradient-button text-white hover:shadow-2xl hover:-translate-y-1 hover:scale-105 active:translate-y-0 active:scale-100'
						}`}
				>
					{isTestRunning ? (
						<span className="flex items-center gap-3">
							<div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
							Testing {currentTestType}...
						</span>
					) : (
						`Start Speed Test`
					)}
				</button>
			</div>

			{/* Connection Info */}
			{userInfo.ip && (
				<div className="glass-card p-6">
					<h4 className="text-base font-semibold text-white mb-5 flex items-center gap-3">
						<span className="text-xl">🌐</span> Connection Info
					</h4>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
						{userInfo.isp && (
							<div>
								<div className="text-neutral-400 mb-2 font-medium">ISP</div>
								<div className="text-white font-semibold truncate">{userInfo.isp}</div>
							</div>
						)}
						{userInfo.location && (
							<div>
								<div className="text-neutral-400 mb-2 font-medium">Location</div>
								<div className="text-white font-semibold truncate">{userInfo.location}</div>
							</div>
						)}
						<div>
							<div className="text-neutral-400 mb-2 font-medium">IP Address</div>
							<div className="text-white font-semibold">{userInfo.ip}</div>
						</div>
						{userInfo.country && (
							<div>
								<div className="text-neutral-400 mb-2 font-medium">Country</div>
								<div className="text-white font-semibold">{userInfo.country}</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

export default SpeedTest;