# SpeedyZoom - Custom Speed Test Tool

## 🎯 Purpose
A custom internet speed test tool designed to bypass ISP optimizations and traffic shaping that may affect popular speed test sites like Ookla and Fast.com.

## 🧠 The Problem
- ISPs often optimize traffic to known speed test sites
- Private peering agreements may inflate speed test results
- Standard speed tests may not reflect real-world download performance
- Your actual Netflix/Steam downloads are slower than speed tests show

## 🚀 Our Solution
- Multi-server architecture across different regions
- Randomized test patterns to avoid detection
- Multiple test methodologies (HTTP, WebSocket, parallel connections)
- Real-time and historical speed analysis

## 🔬 Technical Methodology

### **Multi-Protocol Testing Strategy**

#### **1. HTTP-based Testing (Traditional Web)**
```javascript
// Mimics real web downloads (websites, files, streaming)
axios.get(`${server}/download/10MB`, {
  onDownloadProgress: (progress) => {
    // Real-time speed calculation
  }
})
```

**Advantages:**
- ✅ Matches actual web browsing patterns
- ✅ Standard HTTP/HTTPS protocols
- ✅ Realistic overhead inclusion

**Limitations:**
- ❌ Can be cached by ISP proxies
- ❌ HTTP overhead affects measurement accuracy
- ❌ Request/response latency impact

#### **2. WebSocket Testing (Real-time Applications)**
```javascript
// Mimics real-time apps (gaming, video calls, live streaming)
socket.emit('start-download-test', { sizeMB: 10 });
socket.on('download-chunk', (data) => {
  // Instantaneous speed tracking
});
```

**Why WebSocket is Crucial:**

- **Persistent Connection**: No HTTP handshake overhead per data chunk
- **Real-time Bidirectional**: Continuous data flow like Netflix/YouTube
- **Harder to Cache**: Dynamic binary data streams
- **Protocol Diversity**: Different traffic patterns than HTTP
- **Lower Latency**: Direct socket communication
- **Gaming/Streaming Simulation**: Matches real app behavior

#### **3. Parallel Multi-Connection Testing**
```javascript
// Test network's ability to handle multiple streams
Promise.all([
  downloadTest(connection1),
  downloadTest(connection2),
  downloadTest(connection3),
  downloadTest(connection4)
])
```

## 🛡️ Anti-Detection & Anti-Optimization Techniques

### **1. Cryptographic Random Data Generation**
```javascript
// Prevents compression and content-based optimizations
const randomData = crypto.randomBytes(chunkSize);
// This ensures:
// ❌ No compression savings
// ❌ No content-based caching
// ❌ No pattern recognition
// ❌ No CDN optimization
```

### **2. Variable Test Patterns**
```javascript
// Randomized parameters to avoid detection:
const testConfig = {
  chunkSizes: [1024, 2048, 4096, 8192, 16384, 32768], // 1KB to 32KB
  intervals: [10, 25, 50, 100],                        // ms between chunks
  connections: [1, 2, 4, 8],                           // parallel streams
  durations: [5, 10, 15, 30],                          // seconds
  protocols: ['http', 'websocket', 'mixed']
}
```

### **3. Geographic Distribution**
```javascript
// Multiple cloud regions prevent single-point optimization
const testServers = [
  { region: 'us-east', name: 'US East Coast' },
  { region: 'eu-west', name: 'Europe West' },
  { region: 'ap-southeast', name: 'Asia Pacific' }
]
```

### **4. Custom Domain Strategy**
- **Not Whitelisted**: Our domain isn't in ISP speed test databases
- **No CDN Partnerships**: No special peering agreements
- **Regular Routing**: Traffic goes through standard internet paths
- **No Caching**: Fresh servers without content optimization

## 📊 Advanced Speed Calculation

### **Real-time Speed Tracking**
```javascript
// Traditional (inaccurate for real-time):
avgSpeed = totalBytes / totalTime

// Our method (accurate real-time):
const instantSpeed = (chunkBytes * 8) / (chunkTime * 1024 * 1024); // Mbps
speedHistory.push(instantSpeed);

const metrics = {
  instantaneous: currentSpeed,           // Live speed right now
  movingAverage: last10Samples.avg(),   // Smoothed speed
  peakSustained: maxConsistent30s,      // Best sustained performance
  consistency: standardDeviation,        // Connection stability
  jitter: maxSpeed - minSpeed          // Speed variation
}
```

### **Multi-Dimensional Analysis**
```javascript
const comprehensiveTest = {
  // Protocol comparison
  httpDownload: "185 Mbps",
  wsDownload: "170 Mbps",        // Real-time app performance
  httpUpload: "95 Mbps",
  wsUpload: "88 Mbps",
  
  // Network characteristics
  latency: "24ms",
  jitter: "3ms",
  packetLoss: "0.1%",
  
  // Geographic performance
  localServer: "200 Mbps",
  regionalServer: "180 Mbps",
  internationalServer: "120 Mbps",
  
  // Load testing
  singleConnection: "185 Mbps",
  multiConnection: "190 Mbps"    // Parallelization benefit
}
```

## 🔍 What We Can Detect

### **ISP Speed Test Optimization**
```javascript
// Comparison reveals optimization:
{
  "popularSpeedtest": "300 Mbps",      // ISP optimized route
  "ourHttpTest": "180 Mbps",           // Real web performance (-40%)
  "ourWebSocketTest": "165 Mbps",      // Real app performance (-45%)
  "actualStreaming": "170 Mbps"        // Matches our results!
}
```

### **Protocol-Specific Throttling**
```javascript
// Reveals selective throttling:
{
  "httpDownload": "200 Mbps",
  "websocketDownload": "100 Mbps",     // WebSocket throttling detected
  "httpUpload": "150 Mbps",
  "websocketUpload": "75 Mbps"         // Real-time app throttling
}
```

### **Geographic Routing Issues**
```javascript
// International routing problems:
{
  "localServer": "250 Mbps",           // Great local performance
  "regionalServer": "200 Mbps",        // Good regional
  "internationalServer": "80 Mbps"     // Poor international routing
}
```

### **Time-based Throttling**
```javascript
// Peak hour throttling:
{
  "morningSpeed": "200 Mbps",
  "eveningSpeed": "120 Mbps",         // Peak hour throttling
  "nightSpeed": "180 Mbps"
}
```

## 🏗️ Architecture

### Frontend (Client)
- **React with Tailwind CSS** - Modern, responsive UI
- **WebSocket Client** - Real-time speed testing
- **Chart.js** - Speed visualization and analytics
- **Progressive Web App** - Mobile-friendly, offline capable

### Backend (Server)
- **Node.js + Express** - REST API endpoints
- **Socket.io** - WebSocket server for real-time testing
- **Crypto Module** - Random data generation
- **Multi-region deployment** - Distributed testing infrastructure

### Infrastructure
- **Cloud instances** - Multiple regions for global coverage
- **Load balancing** - Traffic distribution and redundancy
- **CDN** - Static asset delivery optimization
- **DNS management** - Global routing and failover

## 🚦 Getting Started

### Local Development

```bash
# Install dependencies
npm install

# Install all project dependencies (both client and server)
npm run install:all

# Start development servers (both frontend and backend)
npm run dev

# Access the application
# Frontend: http://localhost:3001 (React dev server)
# Backend API: http://localhost:3002 (Express + Socket.io)
```

### Testing Against AWS Infrastructure

```bash
# 1. Configure client to use deployed EC2 server
cd client
echo "PORT=3001" > .env.development
echo "REACT_APP_API_URL=http://your-ec2-dns:3002" >> .env.development

# 2. Start only the React client
npm run dev

# The app will now test against the real AWS infrastructure
```

### AWS Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for comprehensive deployment instructions including:
- AWS infrastructure setup with Terraform
- EC2 instance configuration
- Node.js 20 installation
- Server deployment and systemd service setup
- Multi-region deployment
- Security and performance optimization

## 🎯 Key Features

### Implemented ✅
- ✅ **Multi-Protocol Testing** - HTTP and WebSocket testing
- ✅ **Anti-Detection Technology** - Cryptographic random data generation
- ✅ **Real-time Analytics** - Live speed tracking with Recharts visualization
- ✅ **ISP Detection** - Automatic IP geolocation and ISP identification
- ✅ **Modern UI** - Cyberpunk neon theme with glass-morphism effects
- ✅ **Sequential Testing** - Latency → Download → Upload with real-time graphs
- ✅ **AWS Multi-Region Ready** - Terraform infrastructure for 4 AWS regions
- ✅ **Production Deployment** - Successfully deployed and tested on AWS EC2
- ✅ **Enhanced Server** - Adaptive chunk sizing, high-res timing, trimmed averaging

### In Progress 🚧
- 🚧 **Multi-Region Deployment** - Infrastructure ready, deploying to additional regions
- 🚧 **Server Selection** - Geographic proximity and latency-based selection

### Planned 📋
- 📋 **Historical Tracking** - Speed trends over time
- 📋 **Parallel Connections** - Multi-stream testing for accurate measurements
- 📋 **ISP Optimization Detection** - Compare with popular speed tests
- 📋 **Export Results** - JSON, CSV data export
- 📋 **Mobile Optimization** - Enhanced responsive design

## 🔬 Scientific Approach

### **Hypothesis Testing**
```
H0: ISP treats all traffic equally
H1: ISP optimizes specific speed test traffic

Method: Compare SpeedyZoom results vs popular speed tests
Significance: >20% difference indicates optimization
```

### **Data Collection**
- Multiple protocols per test session
- Geographic diversity across regions  
- Time-series data for pattern detection
- Statistical significance testing

### **Validation**
- Cross-reference with actual application performance
- Peer-to-peer speed comparisons
- Network topology analysis
- ISP routing correlation

## 🔍 How It Bypasses ISP Optimizations

1. **Custom Domain** - Not in ISP speed test whitelist databases
2. **Randomized Testing** - Unpredictable patterns prevent pre-optimization
3. **Multiple Protocols** - HTTP, WebSocket, raw TCP testing
4. **Distributed Servers** - Different hosting providers and regions
5. **Dynamic Content** - No caching benefits for ISP infrastructure
6. **Real Application Simulation** - Matches actual usage patterns

## 📈 Expected Results

### **Unoptimized ISP (Good)**
```
Popular Speed Test: 200 Mbps | SpeedyZoom: 195 Mbps | Difference: 2.5%
```

### **Optimized ISP (Suspicious)**
```
Popular Speed Test: 300 Mbps | SpeedyZoom: 180 Mbps | Difference: 40%
```

### **Heavily Optimized ISP (Problematic)**
```
Popular Speed Test: 400 Mbps | SpeedyZoom: 120 Mbps | Difference: 70%
```

## 📚 Documentation

- **[README.md](./README.md)** - Project overview, features, quick start (you are here)
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Internal development guide, implementation phases, technical decisions
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Comprehensive AWS deployment, server configuration, troubleshooting

## 🏗️ Project Status

### Phase 1: Core Speed Test ✅ Complete
- Multi-protocol testing (HTTP + WebSocket)
- Real-time speed calculation and visualization
- Modern UI with cyberpunk theme
- ISP detection and connection info

### Phase 2: Infrastructure & Deployment ✅ Complete
- Terraform multi-region infrastructure
- Enhanced server with adaptive testing
- Production deployment on AWS EC2
- Comprehensive documentation

### Phase 3: Multi-Region Expansion 🚧 In Progress
- Deploy to India, Europe, Asia Pacific regions
- Automatic server selection
- Enhanced testing features

### Phase 4: Advanced Features 📋 Planned
- Historical data tracking
- ISP optimization detection
- Machine learning pattern detection
- Browser extension

## 📜 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests.

## ⚠️ Disclaimer

*This tool is for educational and diagnostic purposes. Results may vary based on network conditions, server load, and ISP policies. Use responsibly and in compliance with your ISP's terms of service.*

---

## 🔗 Quick Links

- [Getting Started](#-getting-started)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Development Documentation](./DEVELOPMENT.md)
- [Technical Methodology](#-technical-methodology)
- [Infrastructure Setup](./terraform/) 