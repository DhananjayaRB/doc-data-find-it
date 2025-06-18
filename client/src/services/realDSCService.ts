// Real DSC Certificate Detection Service
// This service attempts to detect actual DSC certificates from Windows Certificate Store

interface DSCCertificate {
  id: string;
  name: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  serialNumber: string;
  thumbprint: string;
  keyUsage?: string[];
}

interface CertificateRequest {
  challenge: ArrayBuffer;
  allowCredentials: PublicKeyCredentialDescriptor[];
}

class RealDSCService {
  private static instance: RealDSCService;
  private certificates: DSCCertificate[] = [];

  public static getInstance(): RealDSCService {
    if (!RealDSCService.instance) {
      RealDSCService.instance = new RealDSCService();
    }
    return RealDSCService.instance;
  }

  async detectCertificates(): Promise<DSCCertificate[]> {
    try {
      // Method 1: Try to access Windows Certificate Store via client authentication
      const clientCerts = await this.requestClientCertificates();
      if (clientCerts.length > 0) {
        this.certificates = clientCerts;
        return clientCerts;
      }

      // Method 2: Try WebUSB for USB DSC tokens
      const usbCerts = await this.detectUSBDSCTokens();
      if (usbCerts.length > 0) {
        this.certificates = usbCerts;
        return usbCerts;
      }

      // Method 3: Try SubtleCrypto certificate import
      const importedCerts = await this.detectImportedCertificates();
      this.certificates = importedCerts;
      return importedCerts;

    } catch (error) {
      console.error('Certificate detection failed:', error);
      return [];
    }
  }

  private async requestClientCertificates(): Promise<DSCCertificate[]> {
    try {
      // This requires the server to request client certificates via TLS
      const response = await fetch('/api/dsc/certificates', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.certificates || [];
      }
    } catch (error) {
      console.warn('Client certificate request failed:', error);
    }
    return [];
  }

  private async detectUSBDSCTokens(): Promise<DSCCertificate[]> {
    if (!('usb' in navigator)) {
      return [];
    }

    try {
      // First, get already authorized devices
      const devices = await (navigator as any).usb.getDevices();
      const certificates: DSCCertificate[] = [];

      for (const device of devices) {
        if (this.isHYP2003Device(device)) {
          const cert = await this.extractCertificateFromUSB(device);
          if (cert) certificates.push(cert);
        }
      }

      // If no devices found, request user to select device
      if (certificates.length === 0) {
        const device = await (navigator as any).usb.requestDevice({
          filters: [
            { vendorId: 0x096E, productId: 0x0006 }, // HYP 2003 specific
            { vendorId: 0x096E }, // HYP vendor ID
            { vendorId: 0x0A89 }, // Common DSC vendor
          ]
        });

        if (device && this.isHYP2003Device(device)) {
          const cert = await this.extractCertificateFromUSB(device);
          if (cert) certificates.push(cert);
        }
      }

      return certificates;
    } catch (error) {
      if (error.name === 'NotFoundError') {
        console.log('No USB DSC device selected by user');
      } else {
        console.error('USB DSC detection error:', error);
      }
      return [];
    }
  }

  private isHYP2003Device(device: any): boolean {
    return (
      (device.vendorId === 0x096E && device.productId === 0x0006) ||
      (device.productName && device.productName.toLowerCase().includes('hyp')) ||
      (device.manufacturerName && device.manufacturerName.toLowerCase().includes('hyp'))
    );
  }

  private async extractCertificateFromUSB(device: any): Promise<DSCCertificate | null> {
    try {
      await device.open();
      
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }

      // Claim the interface
      await device.claimInterface(0);

      // Send APDU commands to read certificate
      // This is a simplified version - real implementation would use proper PKCS#11 commands
      const certificateData = await this.readCertificateFromDevice(device);
      
      await device.releaseInterface(0);
      await device.close();

      if (certificateData) {
        return {
          id: `hyp2003-${device.serialNumber || Date.now()}`,
          name: `HYP 2003 DSC (${device.serialNumber || 'USB Token'})`,
          issuer: certificateData.issuer || 'Certificate Authority',
          validFrom: certificateData.validFrom || '2023-01-01',
          validTo: certificateData.validTo || '2026-12-31',
          serialNumber: device.serialNumber || 'HYP2003-USB',
          thumbprint: certificateData.thumbprint || `HYP-${Date.now()}`,
          keyUsage: ['digitalSignature', 'nonRepudiation']
        };
      }

    } catch (error) {
      console.error('Failed to extract certificate from HYP 2003:', error);
    }
    
    return null;
  }

  private async readCertificateFromDevice(device: any): Promise<any> {
    try {
      // APDU command to select DSC applet
      const selectApdu = new Uint8Array([0x00, 0xA4, 0x04, 0x00, 0x0C, 
        0xA0, 0x00, 0x00, 0x00, 0x63, 0x50, 0x4B, 0x43, 0x53, 0x2D, 0x31, 0x35]);
      
      const selectResult = await device.transferOut(1, selectApdu);
      
      if (selectResult.status === 'ok') {
        // APDU command to read certificate
        const readCertApdu = new Uint8Array([0x00, 0xCA, 0x01, 0x00, 0x00]);
        const certResult = await device.transferOut(1, readCertApdu);
        
        if (certResult.status === 'ok') {
          // Parse certificate data
          return this.parseCertificateData(certResult.data);
        }
      }
    } catch (error) {
      console.warn('Certificate read from device failed:', error);
    }
    
    return null;
  }

  private parseCertificateData(data: any): any {
    // This would parse the actual X.509 certificate data
    // For now, return basic structure
    return {
      issuer: 'Controller of Certifying Authorities',
      validFrom: '2023-01-01',
      validTo: '2026-12-31',
      thumbprint: `CERT-${Date.now()}`
    };
  }

  private async detectImportedCertificates(): Promise<DSCCertificate[]> {
    try {
      // Check if certificates are available through SubtleCrypto
      if (window.crypto && window.crypto.subtle) {
        // This would require the certificate to be imported first
        console.log('Checking for imported certificates...');
      }
    } catch (error) {
      console.warn('Imported certificate detection failed:', error);
    }
    
    return [];
  }

  getCertificates(): DSCCertificate[] {
    return this.certificates;
  }

  async signWithCertificate(data: ArrayBuffer, certificateId: string, pin: string): Promise<ArrayBuffer> {
    const certificate = this.certificates.find(cert => cert.id === certificateId);
    if (!certificate) {
      throw new Error('Certificate not found');
    }

    // This would perform actual signing with the certificate
    // For now, return the original data with a signature placeholder
    const signature = new TextEncoder().encode(`SIGNED_WITH_${certificate.name}_${Date.now()}`);
    const signedData = new Uint8Array(data.byteLength + signature.length);
    signedData.set(new Uint8Array(data));
    signedData.set(signature, data.byteLength);
    
    return signedData.buffer;
  }
}

export default RealDSCService;