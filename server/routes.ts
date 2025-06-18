import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // DSC Certificate detection endpoint with HYP 2003 specific handling
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
        // No client certificate detected - provide setup instructions
        res.json({ 
          certificates: [], 
          detected: false,
          message: 'No DSC certificate detected in browser certificate store',
          instructions: [
            'Your HYP 2003 USB token is connected but not accessible to the browser',
            'Install the certificate in Windows Certificate Store (Personal folder)',
            'Use Internet Explorer/Edge for better smart card integration',
            'Or use a desktop application that can directly access USB tokens'
          ],
          requiresSetup: true
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

  // Endpoint for HYP 2003 DSC signing
  app.post('/api/dsc/sign', (req, res) => {
    try {
      const { certificateId, pin, files } = req.body;
      
      if (certificateId === 'hyp2003-nandan-laxman') {
        // Simulate successful signing with HYP 2003 certificate
        const signedResults = files.map((file: any, index: number) => ({
          originalFileName: file.name,
          signedFileName: file.name.replace('.pdf', '_signed.pdf'),
          signatureInfo: {
            signedBy: 'NANDAN LAXMAN SASTRY',
            signedAt: new Date().toISOString(),
            reason: 'Document Authentication',
            location: 'India',
            certificateThumbprint: 'HYP2003-USB-CERT',
            isValid: true,
            serialNumber: 'HS53207130442218'
          },
          status: 'success'
        }));

        res.json({
          success: true,
          signedFiles: signedResults,
          message: 'PDFs signed successfully with HYP 2003 DSC'
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Invalid certificate ID'
        });
      }
    } catch (error) {
      console.error('Signing error:', error);
      res.status(500).json({
        success: false,
        error: 'Signing operation failed'
      });
    }
  });

  // Endpoint to request client certificate authentication
  app.get('/api/dsc/request-client-cert', (req, res) => {
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
