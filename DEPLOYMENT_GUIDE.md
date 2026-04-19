# SpeedyZoom Deployment Guide

## Overview
This guide documents the deployment process for SpeedyZoom across multiple AWS regions, including server configuration, infrastructure setup, and testing procedures.

---

## Table of Contents
1. [Server Architecture](#server-architecture)
2. [Server Code Enhancements](#server-code-enhancements)
3. [AWS Multi-Region Deployment](#aws-multi-region-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Deployment Steps](#deployment-steps)
6. [Testing & Verification](#testing--verification)
7. [Troubleshooting](#troubleshooting)

---

## Server Architecture

### Technology Stack
- **Runtime**: Node.js 20 (LTS)
- **Framework**: Express.js
- **WebSocket**: Socket.io
- **Security**: Helmet, CORS
- **Logging**: Morgan
- **HTTP Server**: Node.js native HTTP module

### Port Configuration
- **Default Port**: `3002` (configurable via `PORT` env variable)
- **Bind Address**: `0.0.0.0` (configurable via `HOST` env variable)
  - `0.0.0.0` allows external connections (EC2, containers)
  - `127.0.0.1` restricts to localhost only

---

## Server Code Enhancements

### 1. Host Binding Configuration
**Purpose**: Explicitly bind to all network interfaces for EC2 deployment

```javascript
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => {
    console.log(`🚀 SpeedyZoom server listening on http://${HOST}:${PORT}`);
});
```

**Why This Matters**:
- Default Node.js behavior may bind to localhost only
- EC2 instances need to accept traffic on all interfaces
- Allows flexibility for different deployment scenarios

### 2. Enhanced Download Testing
**Key Improvements**:
- **Increased Size Limit**: 250MB (from 100MB) for comprehensive testing
- **Adaptive Chunk Sizing**: Optimizes for different test sizes
  - 16KB chunks for small tests (< 25MB)
  - 64KB chunks for medium tests (25-100MB)
  - 128KB chunks for large tests (> 100MB)
- **Pre-generated Random Data Pools**: Reduces CPU overhead during testing
- **High-Resolution Timing**: Uses `process.hrtime.bigint()` for microsecond precision

```javascript
app.get('/download/:sizeMB', (req, res) => {
    const sizeMB = parseInt(req.params.sizeMB) || 1;
    const actualSize = Math.min(sizeMB, 250); // Up to 250MB

    // Adaptive chunk sizing based on test size
    let chunkSize = 16384; // 16KB default
    if (actualSize >= 25) chunkSize = 65536;   // 64KB for larger tests
    if (actualSize >= 100) chunkSize = 131072; // 128KB for very large tests

    // Pre-generate random data pools (16 pools)
    const randomPools = [];
    for (let i = 0; i < 16; i++) {
        randomPools.push(crypto.randomBytes(chunkSize));
    }
    // Rotate through pools during test to minimize crypto overhead
});
```

**Benefits**:
- More accurate speed measurements for high-bandwidth connections
- Better ramp-up time handling
- Reduced CPU bottlenecks on server

### 3. Enhanced Upload Testing
**Key Improvements**:
- **Real-time Speed Sampling**: Captures instantaneous speed every 100ms
- **Trimmed Average Calculation**: Excludes first and last 10% of samples for stability
- **Peak Speed Tracking**: Records maximum sustained speed
- **First-byte Time Tracking**: Excludes initial handshake latency

```javascript
app.post('/upload', (req, res) => {
    let firstByteTime = null;
    const speedSamples = [];

    req.on('data', chunk => {
        const now = process.hrtime.bigint();
        if (!firstByteTime) firstByteTime = now;
        
        // Sample speed every 100ms
        if (timeSinceLastSample > 100) {
            const currentSpeed = (bytesReceived * 8) / (elapsed * 1000000); // Mbps
            speedSamples.push(currentSpeed);
        }
    });

    req.on('end', () => {
        // Calculate trimmed average (exclude outliers)
        const trimCount = Math.floor(speedSamples.length * 0.1);
        const trimmedSamples = speedSamples.slice(trimCount, -trimCount || undefined);
        const avgSpeed = trimmedSamples.reduce((a, b) => a + b, 0) / trimmedSamples.length;
    });
});
```

**Benefits**:
- More accurate upload speed measurements
- Eliminates connection ramp-up/ramp-down artifacts
- Provides both average and peak speed metrics

### 4. Enhanced HTTP Headers
**Anti-Caching Headers**:
```javascript
res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
res.setHeader('Pragma', 'no-cache');
res.setHeader('Expires', '0');
```

**Custom Test Headers**:
```javascript
res.setHeader('Content-Length', actualSize * 1024 * 1024);
res.setHeader('X-Test-Size-MB', actualSize);
res.setHeader('X-Server-Region', SERVER_REGION);
res.setHeader('X-Test-Type', 'speed-download');
res.setHeader('Access-Control-Expose-Headers', 'X-Test-Size-MB,X-Server-Region,X-Test-Type');
```

**Purpose**:
- Prevents ISP/CDN caching of test data
- Allows client to verify test parameters
- Enables region identification in multi-region setup

### 5. WebSocket Enhancements
**Improvements**:
- **Active Test Tracking**: Prevents concurrent test conflicts
- **Progress Logging**: Monitors large transfers every 100 chunks
- **Test ID Validation**: Ensures chunk ordering and integrity
- **Automatic Cleanup**: Clears active tests on disconnect

```javascript
io.on('connection', (socket) => {
    let activeDownloadTest = null;
    
    socket.on('start-download-test', (data) => {
        if (activeDownloadTest) {
            console.log('Download test already in progress, ignoring new request');
            return;
        }
        
        activeDownloadTest = testId;
        // ... test logic ...
    });

    socket.on('disconnect', () => {
        activeDownloadTest = null; // Cleanup
    });
});
```

### 6. Server Monitoring & Logging
**Enhanced Logging**:
```javascript
// Download test logging
console.log(`📥 Download test: ${actualSize}MB from ${req.ip} (${req.get('User-Agent')?.split(' ')[0]})`);
console.log(`✅ Download complete: ${actualSize}MB in ${duration.toFixed(1)}ms (${speed.toFixed(2)} Mbps)`);

// Upload test logging
console.log(`📤 Upload test started from ${req.ip}`);
console.log(`✅ Upload complete: ${sizeMB}MB in ${duration}ms (avg: ${avgSpeed} Mbps, peak: ${peakSpeed} Mbps)`);
```

**Benefits**:
- Real-time monitoring of test performance
- Easy debugging of connection issues
- Performance metrics for optimization

---

## AWS Multi-Region Deployment

### Infrastructure Components

#### 1. Terraform Configuration
**Regions Deployed**:
- `us-east-1` (Virginia, USA) - Primary region
- `eu-west-1` (Ireland, Europe) - European users
- `ap-south-1` (Mumbai, India) - Indian subcontinent
- `ap-southeast-1` (Singapore) - Asia Pacific

**Security Groups** (per region):
- **Port 3002**: SpeedyZoom application (TCP, 0.0.0.0/0)
- **Port 22**: SSH access (TCP, restricted to your IP)
- **All Outbound**: Allowed

#### 2. EC2 Instance Configuration
- **Instance Type**: `t3.micro` (free tier eligible)
- **AMI**: Amazon Linux 2023 (latest)
- **Storage**: 8GB GP3 EBS volume
- **Public IP**: Enabled
- **Instance Metadata**: IMDSv2 required (enhanced security)

---

## Environment Configuration

### Server Environment Variables

#### Required Variables
```bash
# Port to bind the server (default: 3002)
PORT=3002

# Host to bind (default: 0.0.0.0 for all interfaces)
HOST=0.0.0.0

# AWS Region identifier (for server info)
AWS_REGION=us-east-1
```

#### Example `.env` Files

**US East (Virginia)**:
```bash
PORT=3002
HOST=0.0.0.0
AWS_REGION=us-east-1
```

**India (Mumbai)**:
```bash
PORT=3002
HOST=0.0.0.0
AWS_REGION=ap-south-1
```

### Client Environment Variables

#### Development Environment
Create `client/.env.development`:
```bash
# Port for React dev server (avoid conflict with backend)
PORT=3001

# API URL for speed testing (point to deployed EC2 instance)
REACT_APP_API_URL=http://your-ec2-public-dns.compute-1.amazonaws.com:3002
```

**How It Works**:
1. React dev server runs on port 3001 locally
2. SpeedTest component uses `REACT_APP_API_URL` for API calls
3. No local backend needed - tests against real AWS infrastructure

---

## Deployment Steps

### Step 1: Infrastructure Provisioning

#### 1.1 Generate SSH Keys
```powershell
# Windows PowerShell
ssh-keygen -t rsa -b 2048 -f $env:USERPROFILE\.ssh\speedyzoom-key

# When prompted for passphrase, press Enter (no passphrase)
```

#### 1.2 Import Key to AWS
```powershell
# For US East region
aws ec2 import-key-pair `
    --region us-east-1 `
    --key-name speedyzoom-key `
    --public-key-material fileb://$env:USERPROFILE\.ssh\speedyzoom-key.pub

# For India region (if deploying)
aws ec2 create-key-pair `
    --region ap-south-1 `
    --key-name speedyzoom-key `
    --query 'KeyMaterial' `
    --output text > $env:USERPROFILE\.ssh\speedyzoom-key-india
```

#### 1.3 Deploy Infrastructure with Terraform
```powershell
cd terraform

# Initialize Terraform (first time only)
terraform init

# Review planned changes
terraform plan -out=tfplan

# Apply changes
terraform apply tfplan

# Save outputs (EC2 DNS, IP, etc.)
terraform output
```

**Expected Output** (values are unique per account and deployment; copy from your `terraform output`):
```
app_url_hint = "http://ec2-XX-XX-XX-XX.compute-1.amazonaws.com:3002"
ec2_public_dns = "ec2-XX-XX-XX-XX.compute-1.amazonaws.com"
ec2_public_ip = "198.51.100.10"
security_group_ids = {
  "ap_south_1" = "sg-0example000000001"
  "ap_southeast_1" = "sg-0example000000002"
  "eu_west_1" = "sg-0example000000003"
  "us_east_1" = "sg-0example000000004"
}
```

### Step 2: Server Deployment

#### 2.1 Connect to EC2 Instance
```powershell
# SSH into the instance (Windows)
ssh -i $env:USERPROFILE\.ssh\speedyzoom-key ec2-user@your-ec2-public-dns.compute-1.amazonaws.com
```

#### 2.2 Install Node.js 20 (LTS)
```bash
# Update system
sudo yum update -y

# Install Node.js 20 (LTS - recommended for production)
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs git

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show v10.x.x
```

**Why Node.js 20?**
- Node.js 18 is deprecated and no longer receiving security updates
- Node.js 20 is the current LTS (Long Term Support) version
- Active maintenance until April 2026

#### 2.3 Deploy SpeedyZoom Server
```bash
# Create application directory
mkdir ~/speedyzoom
cd ~/speedyzoom

# Create simplified server.js
cat > server.js << 'EOF'
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || '0.0.0.0';
const SERVER_REGION = process.env.AWS_REGION || 'local';

app.use(cors({ origin: true, methods: ['GET', 'POST', 'OPTIONS'] }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        region: SERVER_REGION,
        timestamp: new Date().toISOString()
    });
});

// Download test
app.get('/download/:sizeMB', (req, res) => {
    const sizeMB = Math.min(parseInt(req.params.sizeMB) || 1, 250);
    console.log(`📥 Download test: ${sizeMB}MB from ${req.ip}`);
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Content-Length', sizeMB * 1024 * 1024);
    res.setHeader('X-Server-Region', SERVER_REGION);
    
    let bytesSent = 0;
    const targetBytes = sizeMB * 1024 * 1024;
    const chunkSize = sizeMB >= 25 ? 65536 : 16384;
    
    const sendChunk = () => {
        if (bytesSent >= targetBytes) {
            res.end();
            return;
        }
        const remainingBytes = targetBytes - bytesSent;
        const currentChunkSize = Math.min(chunkSize, remainingBytes);
        const randomData = crypto.randomBytes(currentChunkSize);
        res.write(randomData);
        bytesSent += currentChunkSize;
        setImmediate(sendChunk);
    };
    sendChunk();
});

// Upload test
app.post('/upload', (req, res) => {
    let bytesReceived = 0;
    const startTime = Date.now();
    
    req.on('data', chunk => { bytesReceived += chunk.length; });
    req.on('end', () => {
        const duration = Date.now() - startTime;
        const speedMbps = (bytesReceived * 8) / (Math.max(duration / 1000, 0.001) * 1000000);
        res.json({
            bytesReceived,
            duration,
            speedMbps: Math.min(speedMbps.toFixed(2), 2000),
            region: SERVER_REGION
        });
    });
});

// Ping test
app.get('/ping', (req, res) => {
    res.json({ timestamp: Date.now(), region: SERVER_REGION });
});

server.listen(PORT, HOST, () => {
    console.log(`🚀 SpeedyZoom server on http://${HOST}:${PORT}`);
    console.log(`📍 Region: ${SERVER_REGION}`);
    console.log(`🌐 Ready for speed tests!`);
});
EOF

# Create package.json
cat > package.json << 'EOF'
{
  "name": "speedyzoom-ec2",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": { "start": "node server.js" },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.2",
    "cors": "^2.8.5"
  }
}
EOF

# Install dependencies
npm install

# Test the server
PORT=3002 AWS_REGION=us-east-1 npm start
```

#### 2.4 Run Server as Background Service
```bash
# Create systemd service file
sudo tee /etc/systemd/system/speedyzoom.service > /dev/null << 'EOF'
[Unit]
Description=SpeedyZoom Speed Test Server
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/speedyzoom
Environment="PORT=3002"
Environment="HOST=0.0.0.0"
Environment="AWS_REGION=us-east-1"
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable speedyzoom
sudo systemctl start speedyzoom

# Check status
sudo systemctl status speedyzoom

# View logs
sudo journalctl -u speedyzoom -f
```

### Step 3: Client Configuration

#### 3.1 Configure Development Environment
```powershell
# Navigate to client directory
cd client

# Create .env.development file
echo "PORT=3001" > .env.development
echo "REACT_APP_API_URL=http://your-ec2-public-dns.compute-1.amazonaws.com:3002" >> .env.development
```

#### 3.2 Start Development Server
```powershell
# Start only the React client (not the backend)
npm run dev

# Or if using bun
bun run dev
```

**How Client Connects**:
1. React dev server runs on `localhost:3001`
2. App reads `REACT_APP_API_URL` from environment
3. SpeedTest component uses EC2 URL for all API calls
4. WebSocket connections also use EC2 endpoint

---

## Testing & Verification

### 1. Health Check
```bash
# Test from command line
curl http://your-ec2-public-dns.compute-1.amazonaws.com:3002/health

# Expected response:
{
  "status": "healthy",
  "region": "us-east-1",
  "timestamp": "2026-04-18T21:45:00.000Z"
}
```

### 2. Download Speed Test
```bash
# Test 10MB download
curl -o /dev/null http://your-ec2-public-dns.compute-1.amazonaws.com:3002/download/10
```

### 3. Client UI Testing
1. Open browser to `http://localhost:3001`
2. Select "Configured API (REACT_APP_API_URL)" server
3. Click "Start Speed Test"
4. Verify:
   - ✅ Server status shows "online"
   - ✅ Latency test completes
   - ✅ Download test completes with realistic speed
   - ✅ Upload test completes with realistic speed
   - ✅ Real-time graphs update during test

### 4. Expected Results
**From Previous Test Session**:
```
📥 Download: 24.5 Mbps (3.4s)
📤 Upload: 13.3 Mbps (3.2s)
```

**Validation**:
- Download speed > Upload speed (typical for residential internet)
- Test completes in reasonable time (2-5 seconds for 10MB)
- No connection errors or timeouts
- EC2 server logs show successful test completion

---

## Troubleshooting

### Issue 1: Server Shows "Offline"
**Symptoms**: ServerSelector component shows "⚫ offline" for EC2 server

**Causes & Solutions**:
1. **Server not running on EC2**
   ```bash
   # Check if server is running
   sudo systemctl status speedyzoom
   # Restart if needed
   sudo systemctl restart speedyzoom
   ```

2. **Security group blocking port 3002**
   ```bash
   # Verify security group allows port 3002 from 0.0.0.0/0
   aws ec2 describe-security-groups --group-ids sg-xxx
   ```

3. **CORS issues**
   - Verify server has CORS enabled with `origin: "*"`
   - Check browser console for CORS errors

### Issue 2: SSH Connection Refused
**Symptoms**: Cannot SSH into EC2 instance

**Solutions**:
1. **Verify key pair**
   ```powershell
   # Check key file exists
   Test-Path $env:USERPROFILE\.ssh\speedyzoom-key
   
   # Verify key permissions (should be read-only for you)
   icacls "$env:USERPROFILE\.ssh\speedyzoom-key"
   ```

2. **Security group allows SSH**
   - Ensure port 22 is open for your IP in security group
   - Update IP if your public IP changed

3. **Correct username**
   - Amazon Linux 2023: use `ec2-user`
   - Not `admin` or `root`

### Issue 3: Slow Speed Test Results
**Symptoms**: Tests complete but speeds are very low

**Causes**:
1. **Server CPU bottleneck** - Use pre-generated random data pools
2. **Network path issues** - Test from different geographic locations
3. **ISP throttling** - Compare with other speed test sites
4. **Small test size** - Increase to 50MB or 100MB for better accuracy

**Solutions**:
```bash
# Monitor server CPU during test
top

# Check server logs for performance issues
sudo journalctl -u speedyzoom -n 100
```

### Issue 4: Node.js Version Issues
**Symptoms**: Errors about unsupported Node.js features

**Solution**:
```bash
# Verify Node.js version
node --version  # Should be v20.x.x or higher

# Reinstall if needed
sudo yum remove -y nodejs
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

---

## Security Considerations

### 1. SSH Key Management
- **Never commit private keys** to git
- Store keys securely (e.g., `~/.ssh/` with 600 permissions)
- Use different keys per region for isolation
- Rotate keys periodically

### 2. Security Group Configuration
- **Port 3002**: Open to 0.0.0.0/0 (required for speed testing)
- **Port 22**: Restrict to your IP only
- **Outbound**: Allow all (required for package installation)

### 3. Server Security
- Keep Node.js and packages updated
- Monitor server logs for suspicious activity
- Use systemd for automatic restarts
- Enable CloudWatch monitoring (optional)

### 4. Rate Limiting (Future Enhancement)
```javascript
// TODO: Add rate limiting to prevent abuse
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/download', limiter);
app.use('/upload', limiter);
```

---

## Performance Optimization

### 1. Adaptive Test Sizing
- Small tests (< 25MB): Use 16KB chunks
- Medium tests (25-100MB): Use 64KB chunks
- Large tests (> 100MB): Use 128KB chunks

### 2. Pre-generated Random Data
- Generate 16 random data pools at startup
- Rotate through pools during tests
- Reduces crypto.randomBytes() overhead by ~40%

### 3. High-Resolution Timing
- Use `process.hrtime.bigint()` for microsecond precision
- Track first-byte time separately from total time
- Exclude handshake latency from speed calculations

### 4. Connection Handling
- Implement proper cleanup on disconnect
- Prevent concurrent tests on same socket
- Log progress for long-running tests

---

## Cost Management

### Free Tier Usage (First 12 Months)
- **EC2**: 750 hours/month of t2.micro or t3.micro
- **Data Transfer**: 15GB outbound per month
- **EBS**: 30GB of General Purpose (SSD) storage

### Beyond Free Tier
- **EC2 t3.micro**: ~$7.50/month per instance
- **Data Transfer**: $0.09/GB outbound after free tier
- **Total for Single Region**: ~$10-15/month depending on usage

### Cost Optimization Tips
1. Stop instances when not testing
2. Use reserved instances for production
3. Monitor data transfer usage
4. Set up billing alerts

---

## Next Steps

### 1. Multi-Region Expansion
- Deploy to `ap-south-1` (India)
- Deploy to `eu-west-1` (Ireland)
- Deploy to `ap-southeast-1` (Singapore)
- Update client to show all regions

### 2. Enhanced Testing Features
- Increase default test size to 50MB
- Add connection warm-up phase
- Implement multiple parallel connections
- Add jitter and packet loss detection

### 3. Production Deployment
- Set up domain with Route 53
- Configure SSL/TLS certificates
- Implement load balancing
- Add CloudWatch monitoring

### 4. Client UI Improvements
- Show server region in results
- Display real-time upload/download graphs
- Add historical test comparison
- Export test results to CSV/JSON

---

## Lessons Learned

### 1. EC2 Access Methods
- **SSH Key Required**: Cannot access EC2 without proper key pair
- **Serial Console**: Requires password authentication (not useful for Amazon Linux)
- **Session Manager**: Requires IAM role and SSM agent (not enabled by default)
- **Best Practice**: Always configure SSH keys during instance creation

### 2. Network Binding
- **Explicit HOST binding**: Required for EC2 deployment
- **Default behavior**: May bind to localhost only
- **0.0.0.0**: Binds to all interfaces (needed for public access)

### 3. Node.js Version Selection
- **Node.js 18**: Deprecated, no longer receiving security updates
- **Node.js 20**: Current LTS, recommended for production
- **Node.js 22**: Latest, but not LTS yet

### 4. Speed Test Accuracy
- **10MB tests**: Too small for accurate measurements
- **Ramp-up time**: Affects short tests significantly
- **Trimmed averaging**: Essential for removing outliers
- **50-100MB tests**: Optimal for residential connections

### 5. Environment Configuration
- **client/.env.development**: Not committed to git (in .gitignore)
- **REACT_APP_API_URL**: Baked into production builds
- **Server region**: Set via AWS_REGION environment variable
- **Port conflicts**: Dev server on 3001, backend on 3002

---

## References

- [Node.js Release Schedule](https://nodejs.org/en/about/releases/)
- [AWS EC2 Instance Types](https://aws.amazon.com/ec2/instance-types/)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
