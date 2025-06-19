// DSC Bridge Server - Desktop service for USB DSC token access
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import WebSocket, { WebSocketServer } from 'ws';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname as pathDirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = pathDirname(__filename);

class DSCBridgeServer {
  constructor() {
    this.app = express();
    this.port = 8889;
    this.wsPort = 8890;
    this.certificates = [];
    this.usbTokens = [];
    this.clients = new Set();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.initializeUSBDetection();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    
    // File upload configuration
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'temp-uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
      }
    });
    
    this.upload = multer({ storage });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'running', 
        service: 'DSC Bridge',
        timestamp: new Date().toISOString() 
      });
    });

    // Get certificates from USB tokens
    this.app.get('/api/certificates', async (req, res) => {
      try {
        const certificates = await this.detectCertificates();
        res.json({
          success: true,
          certificates,
          usbTokens: this.usbTokens
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Get bridge status
    this.app.get('/api/status', (req, res) => {
      res.json({
        connected: true,
        usbTokens: this.usbTokens,
        certificates: this.certificates,
        timestamp: new Date().toISOString()
      });
    });

    // Sign PDFs with DSC
    this.app.post('/api/sign', this.upload.array('file'), async (req, res) => {
      try {
        const { certificateId, pin, reason, location, fileCount } = req.body;
        const files = req.files;

        if (!files || files.length === 0) {
          throw new Error('No files uploaded');
        }

        const signedFiles = await this.signPDFsWithDSC(
          files, 
          certificateId, 
          pin, 
          { reason, location }
        );

        res.json({
          success: true,
          signedFiles,
          message: `${files.length} PDF(s) signed successfully`
        });

      } catch (error) {
        console.error('Signing error:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Download signed file
    this.app.get('/api/download/:fileId', (req, res) => {
      const fileId = req.params.fileId;
      const filePath = path.join(__dirname, 'signed-files', fileId);
      
      if (fs.existsSync(filePath)) {
        res.download(filePath);
      } else {
        res.status(404).json({ error: 'File not found' });
      }
    });
  }

  setupWebSocket() {
    this.wss = new WebSocketServer({ port: this.wsPort });
    
    this.wss.on('connection', (ws) => {
      console.log('WebSocket client connected');
      this.clients.add(ws);
      
      // Send current status
      ws.send(JSON.stringify({
        type: 'status',
        data: {
          usbTokens: this.usbTokens,
          certificates: this.certificates
        }
      }));
      
      ws.on('close', () => {
        this.clients.delete(ws);
      });
    });
  }

  broadcast(message) {
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  async initializeUSBDetection() {
    console.log('Initializing USB DSC token detection...');
    
    // Detect HYP 2003 USB tokens
    setInterval(() => {
      this.detectUSBTokens();
    }, 3000);
    
    // Initial detection
    await this.detectUSBTokens();
  }

  async detectUSBTokens() {
    try {
      // Use Windows WMI to detect USB devices
      const wmiQuery = 'Get-WmiObject -Class Win32_PnPEntity | Where-Object { $_.Description -like "*Smart Card*" -or $_.Description -like "*HYP*" } | Select-Object Name, Description, DeviceID';
      
      const result = await this.executeCommand('powershell', [
        '-Command', `${wmiQuery}`
      ]);
      const previousCount = this.usbTokens.length;
      
      // Parse PowerShell output and detect HYP tokens
      this.usbTokens = this.parseUSBDevices(result);
      
      // Notify clients if tokens changed
      if (this.usbTokens.length !== previousCount) {
        this.broadcast({
          type: 'token_change',
          data: { usbTokens: this.usbTokens }
        });
        
        // Update certificates when tokens change
        await this.detectCertificates();
      }
      
    } catch (error) {
      console.warn('USB detection error:', error.message);
    }
  }

  parseUSBDevices(output) {
    const tokens = [];
    
    if (output.includes('HYP') || output.includes('Smart Card')) {
      tokens.push({
        name: 'HYP 2003 USB DSC',
        manufacturer: 'Hypersecu',
        description: 'Smart Card Reader',
        serialNumber: this.extractSerialNumber(output),
        connected: true
      });
    }
    
    return tokens;
  }

  extractSerialNumber(output) {
    // Extract serial number from device output
    const match = output.match(/HS\d+/);
    return match ? match[0] : 'Unknown';
  }

  async detectCertificates() {
    try {
      if (this.usbTokens.length === 0) {
        this.certificates = [];
        return [];
      }

      // Use Windows Certificate Store to list certificates
      const certQuery = `
        Get-ChildItem -Path Cert:\\CurrentUser\\My | 
        Where-Object { $_.HasPrivateKey -eq $true } | 
        Select-Object Subject, Issuer, Thumbprint, NotBefore, NotAfter
      `;
      
      const result = await this.executeCommand('powershell', ['-Command', certQuery]);
      this.certificates = this.parseCertificates(result);
      
      this.broadcast({
        type: 'certificates_updated',
        data: { certificates: this.certificates }
      });
      
      return this.certificates;
      
    } catch (error) {
      console.error('Certificate detection error:', error);
      return [];
    }
  }

  parseCertificates(output) {
    const certificates = [];
    
    // Parse PowerShell certificate output
    const lines = output.split('\n');
    let currentCert = {};
    
    lines.forEach(line => {
      if (line.includes('Subject')) {
        const subject = line.split(':')[1]?.trim();
        if (subject) {
          currentCert.name = this.extractCommonName(subject);
          currentCert.subject = subject;
        }
      } else if (line.includes('Issuer')) {
        currentCert.issuer = line.split(':')[1]?.trim();
      } else if (line.includes('Thumbprint')) {
        currentCert.thumbprint = line.split(':')[1]?.trim();
        currentCert.id = currentCert.thumbprint;
      } else if (line.includes('NotBefore')) {
        currentCert.validFrom = line.split(':')[1]?.trim();
      } else if (line.includes('NotAfter')) {
        currentCert.validTo = line.split(':')[1]?.trim();
        
        // Certificate complete
        if (currentCert.name && currentCert.thumbprint) {
          certificates.push({ ...currentCert });
        }
        currentCert = {};
      }
    });
    
    return certificates;
  }

  extractCommonName(subject) {
    const cnMatch = subject.match(/CN=([^,]+)/);
    return cnMatch ? cnMatch[1] : 'Certificate Holder';
  }

  async signPDFsWithDSC(files, certificateId, pin, options) {
    const signedFiles = [];
    const signedDir = path.join(__dirname, 'signed-files');
    
    if (!fs.existsSync(signedDir)) {
      fs.mkdirSync(signedDir, { recursive: true });
    }
    
    for (const file of files) {
      try {
        const signedFileName = file.filename.replace('.pdf', '_signed.pdf');
        const signedFilePath = path.join(signedDir, signedFileName);
        
        // Use Windows SignTool or similar for actual PDF signing
        await this.signPDFWithWindowsCert(
          file.path, 
          signedFilePath, 
          certificateId, 
          pin, 
          options
        );
        
        signedFiles.push({
          originalFileName: file.originalname,
          signedFileName: signedFileName,
          signedFileId: signedFileName,
          signatureInfo: {
            signedBy: this.getCertificateName(certificateId),
            signedAt: new Date().toISOString(),
            reason: options.reason,
            location: options.location,
            certificateThumbprint: certificateId,
            isValid: true
          }
        });
        
      } catch (error) {
        console.error(`Failed to sign ${file.originalname}:`, error);
      }
    }
    
    return signedFiles;
  }

  async signPDFWithWindowsCert(inputPath, outputPath, certThumbprint, pin, options) {
    try {
      // Use SignTool for PDF signing with certificate from Windows Certificate Store
      const signToolCommand = [
        'signtool', 'sign',
        '/sha1', certThumbprint,
        '/fd', 'SHA256',
        '/t', 'http://timestamp.digicert.com',
        '/v',
        inputPath
      ];
      
      await this.executeCommand('signtool', signToolCommand);
      
      // Copy signed file to output location
      fs.copyFileSync(inputPath, outputPath);
      
    } catch (error) {
      throw new Error(`PDF signing failed: ${error.message}`);
    }
  }

  getCertificateName(thumbprint) {
    const cert = this.certificates.find(c => c.thumbprint === thumbprint);
    return cert ? cert.name : 'Unknown Certificate';
  }

  executeCommand(command, args) {
    return new Promise((resolve, reject) => {
      let process;
      if (command === 'powershell' && Array.isArray(args)) {
        process = spawn(command, args); // No shell: true for PowerShell with args
      } else {
        process = spawn(command, args, { shell: true });
      }
      let output = '';
      let error = '';
      
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(error || `Command failed with code ${code}`));
        }
      });
    });
  }

  start() {
    this.app.listen(this.port, 'localhost', () => {
      console.log(`DSC Bridge Server running on http://localhost:${this.port}`);
      console.log(`WebSocket server running on ws://localhost:${this.wsPort}`);
    });
  }
}

// Start the bridge server
const bridge = new DSCBridgeServer();
bridge.start();

export default DSCBridgeServer;
