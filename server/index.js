const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const crypto = require('crypto');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"]
	}
});

const PORT = process.env.PORT || 3001;
const SERVER_REGION = process.env.AWS_REGION || 'local';

// Middleware
app.use(morgan('combined'));
// CORS must be before helmet to avoid conflicts
app.use(cors({
	origin: true, // Allow all origins (or specify your client origin)
	methods: ['GET', 'POST', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization'],
	credentials: true
}));
app.use(helmet({
	// Allow CORS headers
	crossOriginResourcePolicy: { policy: "cross-origin" }
}));
// Only parse JSON for non-binary endpoints
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
	res.json({
		status: 'healthy',
		region: SERVER_REGION,
		timestamp: new Date().toISOString(),
		server: 'speedyzoom-v1'
	});
});

// Generate random data for testing
function generateRandomData(sizeInMB) {
	const sizeInBytes = sizeInMB * 1024 * 1024;
	const chunkSize = 1024; // 1KB chunks for better memory management
	const chunks = [];

	for (let i = 0; i < sizeInBytes / chunkSize; i++) {
		// Generate random data that can't be easily compressed
		const randomChunk = crypto.randomBytes(chunkSize);
		chunks.push(randomChunk.toString('base64'));
	}

	return chunks.join('');
}

// Download test endpoint - streaming random data
app.get('/download/:sizeMB', (req, res) => {
	const sizeMB = parseInt(req.params.sizeMB) || 1;
	const maxSize = 100; // Limit to 100MB per request
	const actualSize = Math.min(sizeMB, maxSize);

	console.log(`Download test requested: ${actualSize}MB from ${req.ip}`);

	res.setHeader('Content-Type', 'application/octet-stream');
	res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
	res.setHeader('Pragma', 'no-cache');
	res.setHeader('Expires', '0');
	res.setHeader('X-Test-Size', actualSize);
	res.setHeader('X-Server-Region', SERVER_REGION);

	const startTime = Date.now();
	let bytesSent = 0;
	const targetBytes = actualSize * 1024 * 1024;
	const chunkSize = 8192; // 8KB chunks

	const sendChunk = () => {
		if (bytesSent >= targetBytes) {
			res.end();
			const duration = Date.now() - startTime;
			console.log(`Download completed: ${actualSize}MB in ${duration}ms to ${req.ip}`);
			return;
		}

		const remainingBytes = targetBytes - bytesSent;
		const currentChunkSize = Math.min(chunkSize, remainingBytes);

		// Generate random data to prevent compression
		const randomData = crypto.randomBytes(currentChunkSize);
		res.write(randomData);
		bytesSent += currentChunkSize;

		// Use setImmediate to prevent blocking
		setImmediate(sendChunk);
	};

	sendChunk();
});

// Upload test endpoint
app.post('/upload', (req, res) => {
	let bytesReceived = 0;
	const startTime = Date.now();

	console.log(`Upload test started from ${req.ip}`);

	req.on('data', chunk => {
		bytesReceived += chunk.length;
	});

	req.on('end', () => {
		const duration = Date.now() - startTime;
		// Prevent division by zero and unrealistic speeds
		const durationSeconds = Math.max(duration / 1000, 0.001);
		const speedMbps = (bytesReceived * 8) / (durationSeconds * 1000000); // Convert to Mbps properly

		console.log(`Upload completed: ${(bytesReceived / (1024 * 1024)).toFixed(2)}MB in ${duration}ms (${speedMbps.toFixed(2)} Mbps) from ${req.ip}`);

		res.json({
			bytesReceived,
			duration,
			speedMbps: Math.min(speedMbps.toFixed(2), 1000), // Cap at 1Gbps for sanity
			region: SERVER_REGION,
			timestamp: new Date().toISOString()
		});
	});

	req.on('error', (err) => {
		console.error('Upload error:', err);
		res.status(500).json({ error: 'Upload test failed' });
	});
});

// Latency test endpoint
app.get('/ping', (req, res) => {
	const timestamp = Date.now();
	res.json({
		timestamp,
		region: SERVER_REGION,
		pong: timestamp
	});
});

// WebSocket-based real-time speed testing
io.on('connection', (socket) => {
	console.log('Client connected for WebSocket testing:', socket.id);
	
	let activeDownloadTest = null;
	let activeUploadTest = null;
	
	socket.on('start-download-test', (data) => {
		if (activeDownloadTest) {
			console.log('Download test already in progress, ignoring new request');
			return;
		}
		
		const { sizeMB = 1, testId } = data;
		const actualSize = Math.min(sizeMB, 50); // Limit WebSocket tests to 50MB
		const targetBytes = actualSize * 1024 * 1024;
		const chunkSize = 16384; // 16KB chunks for WebSocket
		
		console.log(`WebSocket download test started: ${actualSize}MB for ${socket.id}, testId: ${testId}`);
		
		activeDownloadTest = testId;
		let bytesSent = 0;
		const startTime = Date.now();
		let chunkCount = 0;
		
		const sendData = () => {
			if (bytesSent >= targetBytes) {
				const duration = Date.now() - startTime;
				const finalResult = {
					testId,
					totalBytes: bytesSent,
					duration: duration,
					region: SERVER_REGION
				};
				console.log(`WebSocket download complete: ${(bytesSent / (1024 * 1024)).toFixed(2)}MB in ${duration}ms (${chunkCount} chunks)`);
				socket.emit('download-complete', finalResult);
				activeDownloadTest = null; // Clear active test
				return;
			}
			
			const remainingBytes = targetBytes - bytesSent;
			const currentChunkSize = Math.min(chunkSize, remainingBytes);
			
			// Generate random binary data
			const randomData = crypto.randomBytes(currentChunkSize);
			socket.emit('download-chunk', {
				testId,
				data: randomData.toString('base64'),
				bytes: currentChunkSize,
				totalSent: bytesSent + currentChunkSize
			});
			
			bytesSent += currentChunkSize;
			chunkCount++;
			
			// Log progress every 100 chunks
			if (chunkCount % 100 === 0) {
				console.log(`Progress: ${(bytesSent / (1024 * 1024)).toFixed(2)}MB sent (${chunkCount} chunks)`);
			}
			
			// Add small delay for more realistic timing in local testing
			setTimeout(() => setImmediate(sendData), 1);
		};
		
		sendData();
	});

	socket.on('start-upload-test', (data) => {
		const { testId } = data;
		let bytesReceived = 0;
		const startTime = Date.now();

		console.log(`WebSocket upload test started for ${socket.id}`);

		socket.on('upload-chunk', (chunkData) => {
			if (chunkData.testId === testId) {
				bytesReceived += chunkData.bytes;

				socket.emit('upload-progress', {
					testId,
					bytesReceived,
					timestamp: Date.now()
				});
			}
		});

		socket.on('upload-complete', (completeData) => {
			if (completeData.testId === testId) {
				const duration = Date.now() - startTime;
				// Use the same corrected calculation as HTTP upload
				const durationSeconds = Math.max(duration / 1000, 0.001);
				const speedMbps = (bytesReceived * 8) / (durationSeconds * 1000000);

				socket.emit('upload-result', {
					testId,
					bytesReceived,
					duration,
					speedMbps: Math.min(speedMbps.toFixed(2), 1000), // Cap at 1Gbps
					region: SERVER_REGION
				});

				console.log(`WebSocket upload completed: ${(bytesReceived / (1024 * 1024)).toFixed(2)}MB in ${duration}ms (${speedMbps.toFixed(2)} Mbps) from ${socket.id}`);
			}
		});
	});

	socket.on('ping-test', (data) => {
		socket.emit('pong-test', {
			...data,
			serverTimestamp: Date.now(),
			region: SERVER_REGION
		});
	});

	socket.on('disconnect', () => {
		console.log('Client disconnected:', socket.id);
		// Clean up any active tests
		activeDownloadTest = null;
		activeUploadTest = null;
	});
});

// Multi-connection test endpoint for testing parallel downloads
app.get('/multi-download/:connections/:sizeMB', (req, res) => {
	const connections = Math.min(parseInt(req.params.connections) || 1, 8);
	const sizeMB = Math.min(parseInt(req.params.sizeMB) || 1, 20);

	res.json({
		message: `Multi-connection test endpoint ready`,
		connections,
		sizeMBPerConnection: sizeMB,
		totalSizeMB: connections * sizeMB,
		region: SERVER_REGION,
		instructions: `Make ${connections} parallel requests to /download/${sizeMB}`
	});
});

// Server info endpoint
app.get('/info', (req, res) => {
	res.json({
		server: 'SpeedyZoom Speed Test Server',
		version: '1.0.0',
		region: SERVER_REGION,
		capabilities: [
			'HTTP Download Tests',
			'HTTP Upload Tests',
			'WebSocket Real-time Tests',
			'Latency Testing',
			'Multi-connection Tests'
		],
		limits: {
			maxDownloadSizeMB: 100,
			maxUploadSizeMB: 100,
			maxWebSocketSizeMB: 50,
			maxConnections: 8
		},
		timestamp: new Date().toISOString()
	});
});

server.listen(PORT, () => {
	console.log(`🚀 SpeedyZoom server running on port ${PORT}`);
	console.log(`📍 Region: ${SERVER_REGION}`);
	console.log(`🌐 Ready for speed tests!`);
}); 