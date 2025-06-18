// Certificate Store API for real Windows Certificate Store integration
// This service interfaces with actual Windows Certificate Store via TLS client authentication

interface CertificateInfo {
  id: string;
  name: string;
  issuer: string;
  subject: string;
  validFrom: string;
  validTo: string;
  serialNumber: string;
  thumbprint: string;
  hasPrivateKey: boolean;
}

interface CertificateStoreResponse {
  detected: boolean;
  certificates: CertificateInfo[];
  source: 'windows_cert_store' | 'browser_fallback';
  message?: string;
  instructions?: string[];
}

class CertificateStoreAPI {
  private static instance: CertificateStoreAPI;
  
  public static getInstance(): CertificateStoreAPI {
    if (!CertificateStoreAPI.instance) {
      CertificateStoreAPI.instance = new CertificateStoreAPI();
    }
    return CertificateStoreAPI.instance;
  }

  async detectCertificates(): Promise<CertificateStoreResponse> {
    try {
      // Primary method: Server-side certificate detection via TLS client authentication
      const response = await fetch('/api/dsc/certificates', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'X-Client-Cert-Request': 'true',
          'Cache-Control': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          detected: data.detected,
          certificates: data.certificates || [],
          source: data.source || 'windows_cert_store',
          message: data.message,
          instructions: data.instructions
        };
      } else {
        throw new Error(`Server responded with status ${response.status}`);
      }
    } catch (error) {
      console.error('Certificate detection failed:', error);
      return {
        detected: false,
        certificates: [],
        source: 'browser_fallback',
        message: 'Certificate detection service unavailable',
        instructions: [
          'Ensure your DSC certificate is installed in Windows Certificate Store',
          'Try using Internet Explorer or Edge for better certificate support',
          'Contact IT support for certificate installation assistance'
        ]
      };
    }
  }

  async signDocuments(files: File[], certificateId: string, pin: string, options: {
    reason: string;
    location: string;
  }): Promise<{
    success: boolean;
    signedFiles?: any[];
    error?: string;
  }> {
    try {
      const formData = new FormData();
      
      // Add files to form data
      files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });
      
      // Add signing parameters
      formData.append('certificateId', certificateId);
      formData.append('pin', pin);
      formData.append('reason', options.reason);
      formData.append('location', options.location);
      formData.append('fileCount', files.length.toString());

      const response = await fetch('/api/dsc/sign', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: result.success,
          signedFiles: result.signedFiles,
          error: result.error
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Signing failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('Document signing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown signing error'
      };
    }
  }

  async testCertificateAccess(): Promise<{
    tlsClientAuth: boolean;
    windowsCertStore: boolean;
    browserCertAccess: boolean;
  }> {
    const results = {
      tlsClientAuth: false,
      windowsCertStore: false,
      browserCertAccess: false
    };

    try {
      // Test TLS client authentication
      const tlsResponse = await fetch('/api/dsc/test-tls-auth', {
        method: 'GET',
        credentials: 'include'
      });
      results.tlsClientAuth = tlsResponse.ok;
    } catch (error) {
      console.warn('TLS client auth test failed');
    }

    try {
      // Test Windows Certificate Store access
      const storeResponse = await fetch('/api/dsc/test-cert-store', {
        method: 'GET',
        credentials: 'include'
      });
      results.windowsCertStore = storeResponse.ok;
    } catch (error) {
      console.warn('Windows cert store test failed');
    }

    try {
      // Test browser certificate access
      results.browserCertAccess = !!(
        window.crypto && 
        window.crypto.subtle &&
        'credentials' in navigator
      );
    } catch (error) {
      console.warn('Browser cert access test failed');
    }

    return results;
  }

  async requestCertificateInstallation(): Promise<{
    success: boolean;
    instructions: string[];
  }> {
    return {
      success: true,
      instructions: [
        '1. Insert your HYP 2003 USB DSC token',
        '2. Open Windows Certificate Manager (certmgr.msc)',
        '3. Navigate to Personal → Certificates',
        '4. Right-click and select All Tasks → Import',
        '5. Choose your certificate file or select from smart card reader',
        '6. Ensure "Mark this key as exportable" is checked',
        '7. Complete the import wizard',
        '8. Restart your browser',
        '9. Return to this application and retry certificate detection'
      ]
    };
  }

  async downloadCertificateForBrowser(certificateId: string): Promise<Blob | null> {
    try {
      const response = await fetch(`/api/dsc/export/${certificateId}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        return await response.blob();
      }
    } catch (error) {
      console.error('Certificate download failed:', error);
    }
    
    return null;
  }
}

export default CertificateStoreAPI;
export type { CertificateInfo, CertificateStoreResponse };