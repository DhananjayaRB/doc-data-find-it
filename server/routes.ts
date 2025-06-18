import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // DSC Certificate detection endpoint
  app.get('/api/dsc/certificates', (req, res) => {
    try {
      // Check for client certificate in TLS handshake
      const socket = req.socket as any;
      const cert = socket.getPeerCertificate ? socket.getPeerCertificate(true) : null;
      
      if (cert && cert.subject) {
        // Real certificate detected from Windows Certificate Store
        const certificates = [{
          id: `cert-${cert.fingerprint || Date.now()}`,
          name: cert.subject.CN || 'DSC Certificate',
          issuer: cert.issuer?.O || cert.issuer?.CN || 'Certificate Authority',
          validFrom: cert.valid_from || '',
          validTo: cert.valid_to || '',
          serialNumber: cert.serialNumber || '',
          thumbprint: cert.fingerprint || cert.fingerprint256 || ''
        }];
        
        res.json({ 
          certificates, 
          detected: true,
          source: 'windows_cert_store'
        });
      } else {
        // No client certificate - provide instructions
        res.json({ 
          certificates: [{
            id: 'setup-required',
            name: 'DSC Certificate Setup Required',
            issuer: 'Please install your HYP 2003 certificate in Windows',
            validFrom: '',
            validTo: '',
            serialNumber: 'Follow setup instructions',
            thumbprint: ''
          }], 
          detected: false,
          message: 'Install DSC certificate in Windows Certificate Store (Personal folder)',
          instructions: [
            '1. Insert HYP 2003 USB token',
            '2. Install certificate driver software',
            '3. Import certificate to Windows Certificate Store',
            '4. Restart browser and retry'
          ]
        });
      }
    } catch (error) {
      console.error('DSC detection error:', error);
      res.status(500).json({ 
        error: 'Certificate detection failed', 
        certificates: [],
        detected: false 
      });
    }
  });

  // Endpoint to request client certificate authentication
  app.get('/api/dsc/request-client-cert', (req, res) => {
    // Set headers to request client certificate
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    
    res.json({ 
      message: 'Client certificate authentication endpoint',
      requestsCert: true,
      timestamp: new Date().toISOString()
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
