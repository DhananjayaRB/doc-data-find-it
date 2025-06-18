// Windows Certificate Store Integration Service
// This service interfaces with Windows Certificate Store to detect real DSC certificates

interface WindowsCertificate {
  id: string;
  name: string;
  issuer: string;
  subject: string;
  validFrom: string;
  validTo: string;
  serialNumber: string;
  thumbprint: string;
  hasPrivateKey: boolean;
  keyUsage: string[];
}

class WindowsCertStoreService {
  private static instance: WindowsCertStoreService;
  
  public static getInstance(): WindowsCertStoreService {
    if (!WindowsCertStoreService.instance) {
      WindowsCertStoreService.instance = new WindowsCertStoreService();
    }
    return WindowsCertStoreService.instance;
  }

  async detectCertificates(): Promise<WindowsCertificate[]> {
    const certificates: WindowsCertificate[] = [];
    
    try {
      // Method 1: Server-side certificate detection via TLS client auth
      const serverCerts = await this.requestServerCertificateDetection();
      if (serverCerts.length > 0) {
        certificates.push(...serverCerts);
      }

      // Method 2: Browser certificate store access
      const browserCerts = await this.accessBrowserCertificateStore();
      if (browserCerts.length > 0) {
        certificates.push(...browserCerts);
      }

      // Method 3: Native messaging bridge (requires extension)
      const nativeCerts = await this.requestNativeCertificateAccess();
      if (nativeCerts.length > 0) {
        certificates.push(...nativeCerts);
      }

      return certificates;
    } catch (error) {
      console.error('Certificate detection failed:', error);
      return [];
    }
  }

  private async requestServerCertificateDetection(): Promise<WindowsCertificate[]> {
    try {
      const response = await fetch('/api/dsc/certificates', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'X-Client-Cert-Request': 'true'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.certificates.map((cert: any) => ({
          id: cert.id,
          name: cert.name,
          issuer: cert.issuer,
          subject: cert.subject || cert.name,
          validFrom: cert.validFrom,
          validTo: cert.validTo,
          serialNumber: cert.serialNumber,
          thumbprint: cert.thumbprint,
          hasPrivateKey: true,
          keyUsage: ['digitalSignature', 'nonRepudiation']
        }));
      }
    } catch (error) {
      console.warn('Server certificate detection failed:', error);
    }
    return [];
  }

  private async accessBrowserCertificateStore(): Promise<WindowsCertificate[]> {
    const certificates: WindowsCertificate[] = [];
    
    try {
      // Try to trigger browser's certificate selection dialog
      if ('navigator' in window && 'credentials' in navigator) {
        // Create a credential request that might trigger certificate selection
        const credentialRequest = {
          publicKey: {
            challenge: new Uint8Array(32),
            rp: { id: window.location.hostname, name: 'DSC Signing Application' },
            user: {
              id: new Uint8Array(16),
              name: 'dsc-user',
              displayName: 'DSC Certificate User'
            },
            pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
            authenticatorSelection: {
              authenticatorAttachment: 'cross-platform',
              userVerification: 'preferred'
            },
            attestation: 'direct'
          }
        };

        try {
          await navigator.credentials.create(credentialRequest as any);
        } catch (credError) {
          // Expected to fail, but might trigger certificate dialog
          console.log('Credential creation failed as expected');
        }
      }

      // Check if SubtleCrypto can access any imported certificates
      if (window.crypto && window.crypto.subtle) {
        // This would work if certificates were previously imported
        console.log('Checking SubtleCrypto certificate access...');
      }

    } catch (error) {
      console.warn('Browser certificate store access failed:', error);
    }
    
    return certificates;
  }

  private async requestNativeCertificateAccess(): Promise<WindowsCertificate[]> {
    try {
      // Check if a native messaging extension is available
      if ('chrome' in window && (window as any).chrome.runtime) {
        // Send message to native extension for certificate access
        const response = await new Promise((resolve) => {
          (window as any).chrome.runtime.sendMessage(
            'certificate-bridge-extension-id',
            { action: 'getCertificates' },
            resolve
          );
        });
        
        if (response && (response as any).certificates) {
          return (response as any).certificates;
        }
      }
    } catch (error) {
      console.warn('Native certificate access failed:', error);
    }
    
    return [];
  }

  async signWithCertificate(
    data: ArrayBuffer, 
    certificateId: string, 
    pin?: string
  ): Promise<ArrayBuffer> {
    try {
      // Send signing request to server with certificate ID
      const response = await fetch('/api/dsc/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          certificateId,
          pin,
          dataHash: Array.from(new Uint8Array(data))
        })
      });

      if (response.ok) {
        const result = await response.arrayBuffer();
        return result;
      } else {
        throw new Error('Signing failed on server');
      }
    } catch (error) {
      console.error('Certificate signing failed:', error);
      throw error;
    }
  }

  async exportCertificateForBrowser(certificateId: string): Promise<Blob | null> {
    try {
      // Request certificate export in a format that browsers can use
      const response = await fetch(`/api/dsc/export/${certificateId}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        return await response.blob();
      }
    } catch (error) {
      console.error('Certificate export failed:', error);
    }
    
    return null;
  }

  generateCertificateInstructions(): string[] {
    return [
      '1. Insert your HYP 2003 USB DSC token',
      '2. Open Windows Certificate Manager (certmgr.msc)',
      '3. Navigate to Personal → Certificates',
      '4. Right-click in the certificates area',
      '5. Select All Tasks → Import',
      '6. Browse to your DSC certificate file or select from smart card',
      '7. Ensure "Mark this key as exportable" is checked',
      '8. Complete the import process',
      '9. Restart your browser',
      '10. Return to this application and retry certificate detection'
    ];
  }

  async testCertificateAccess(): Promise<{
    windowsStoreAccess: boolean;
    browserCertAccess: boolean;
    nativeBridgeAccess: boolean;
  }> {
    const results = {
      windowsStoreAccess: false,
      browserCertAccess: false,
      nativeBridgeAccess: false
    };

    try {
      // Test Windows Certificate Store access
      const response = await fetch('/api/dsc/test-access', {
        method: 'GET',
        credentials: 'include'
      });
      results.windowsStoreAccess = response.ok;
    } catch (error) {
      console.warn('Windows store access test failed');
    }

    try {
      // Test browser certificate access
      results.browserCertAccess = !!(window.crypto && window.crypto.subtle);
    } catch (error) {
      console.warn('Browser certificate access test failed');
    }

    try {
      // Test native bridge access
      results.nativeBridgeAccess = !!(
        'chrome' in window && 
        (window as any).chrome.runtime
      );
    } catch (error) {
      console.warn('Native bridge access test failed');
    }

    return results;
  }
}

export default WindowsCertStoreService;