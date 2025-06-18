# DSC Bridge Service Setup Instructions

## Overview
The DSC Bridge Service enables your web browser to access HYP 2003 USB DSC tokens for PDF signing by running a local desktop service.

## Requirements
- Windows 10/11
- Node.js 18 or later
- HYP 2003 USB DSC token
- Administrator privileges for installation

## Installation Steps

### 1. Install Node.js Dependencies
```bash
cd server
npm install express cors multer ws
```

### 2. Start DSC Bridge Service
```bash
node dsc-bridge-server.js
```

### 3. Install Certificate
- Insert HYP 2003 USB token
- Open Certificate Manager (certmgr.msc)
- Import certificate to Personal → Certificates
- Ensure private key is accessible

### 4. Verify Service
- Open http://localhost:8889/health
- Should show: {"status":"running","service":"DSC Bridge"}

## Usage

### 1. Web Application
- Open your PDF application in browser
- Click "Sign PDFs with DSC"
- Select "DSC Bridge Service" tab

### 2. Certificate Selection
- Bridge automatically detects HYP 2003 token
- Lists available certificates from Windows Certificate Store
- Select your certificate

### 3. PDF Signing
- Enter DSC PIN
- Click "Sign PDFs"
- Download signed documents

## Troubleshooting

### Bridge Service Not Connected
- Ensure service is running on port 8889
- Check Windows Firewall settings
- Run as Administrator if needed

### Certificate Not Detected
- Verify HYP 2003 token is inserted
- Check certificate is in Windows Certificate Store
- Ensure certificate has private key access

### Signing Fails
- Verify PIN is correct
- Check certificate validity dates
- Ensure SignTool is available in Windows

## Security Notes
- Bridge service runs locally only
- No data transmitted over internet
- PIN handled securely by Windows Certificate Store
- Signed PDFs contain valid digital signatures

## File Locations
- Service: `server/dsc-bridge-server.js`
- Temp uploads: `server/temp-uploads/`
- Signed files: `server/signed-files/`

## Support
For issues with HYP 2003 token:
- Check Hypersecu drivers
- Verify token in Device Manager
- Contact IT support for certificate installation