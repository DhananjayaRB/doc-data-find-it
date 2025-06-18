// DSC Bridge Service - Connects to desktop bridge for USB token access
interface DSCBridgeResponse {
  success: boolean;
  data?: any;
  error?: string;
  certificates?: DSCCertificate[];
}

interface DSCCertificate {
  id: string;
  name: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  serialNumber: string;
  thumbprint: string;
}

interface SignedDocument {
  originalFile: File;
  signedFile: File;
  signatureInfo: {
    signedBy: string;
    signedAt: string;
    reason: string;
    location: string;
    certificateThumbprint: string;
    isValid: boolean;
  };
}

class DSCBridgeService {
  private static instance: DSCBridgeService;
  private bridgeUrl = 'http://localhost:8889'; // Desktop bridge service port
  private websocket: WebSocket | null = null;

  public static getInstance(): DSCBridgeService {
    if (!DSCBridgeService.instance) {
      DSCBridgeService.instance = new DSCBridgeService();
    }
    return DSCBridgeService.instance;
  }

  async checkBridgeConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.bridgeUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      return response.ok;
    } catch (error) {
      console.warn('DSC Bridge not running:', error);
      return false;
    }
  }

  async detectCertificates(): Promise<DSCCertificate[]> {
    try {
      const response = await fetch(`${this.bridgeUrl}/api/certificates`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data: DSCBridgeResponse = await response.json();
        return data.certificates || [];
      }
    } catch (error) {
      console.error('Certificate detection failed:', error);
    }
    return [];
  }

  async signPDFs(
    files: File[], 
    certificateId: string, 
    pin: string,
    options: { reason: string; location: string }
  ): Promise<SignedDocument[]> {
    try {
      const formData = new FormData();
      
      files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });
      
      formData.append('certificateId', certificateId);
      formData.append('pin', pin);
      formData.append('reason', options.reason);
      formData.append('location', options.location);
      formData.append('fileCount', files.length.toString());

      const response = await fetch(`${this.bridgeUrl}/api/sign`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          return await this.downloadSignedFiles(result.signedFiles);
        } else {
          throw new Error(result.error || 'Signing failed');
        }
      } else {
        throw new Error(`Signing service error: ${response.status}`);
      }
    } catch (error) {
      console.error('PDF signing failed:', error);
      throw error;
    }
  }

  private async downloadSignedFiles(signedFileInfo: any[]): Promise<SignedDocument[]> {
    const signedDocuments: SignedDocument[] = [];

    for (const fileInfo of signedFileInfo) {
      try {
        const response = await fetch(`${this.bridgeUrl}/api/download/${fileInfo.signedFileId}`);
        if (response.ok) {
          const blob = await response.blob();
          const signedFile = new File([blob], fileInfo.signedFileName, { type: 'application/pdf' });
          
          // Find original file
          const originalFile = new File([new ArrayBuffer(0)], fileInfo.originalFileName, { type: 'application/pdf' });
          
          signedDocuments.push({
            originalFile,
            signedFile,
            signatureInfo: fileInfo.signatureInfo
          });
        }
      } catch (error) {
        console.error('Failed to download signed file:', error);
      }
    }

    return signedDocuments;
  }

  async getBridgeStatus(): Promise<{
    connected: boolean;
    usbTokens: any[];
    certificates: DSCCertificate[];
  }> {
    try {
      const response = await fetch(`${this.bridgeUrl}/api/status`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Bridge status check failed:', error);
    }
    
    return {
      connected: false,
      usbTokens: [],
      certificates: []
    };
  }

  connectWebSocket(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        this.websocket = new WebSocket(`ws://localhost:8890`);
        
        this.websocket.onopen = () => {
          console.log('Connected to DSC Bridge WebSocket');
          resolve(true);
        };
        
        this.websocket.onerror = () => {
          console.warn('WebSocket connection failed');
          resolve(false);
        };
        
        this.websocket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          this.handleBridgeMessage(data);
        };
      } catch (error) {
        console.error('WebSocket setup failed:', error);
        resolve(false);
      }
    });
  }

  private handleBridgeMessage(data: any) {
    switch (data.type) {
      case 'token_inserted':
        console.log('USB token inserted:', data.tokenInfo);
        break;
      case 'token_removed':
        console.log('USB token removed');
        break;
      case 'certificate_changed':
        console.log('Certificate list updated');
        break;
    }
  }

  generateBridgeInstaller(): { downloadUrl: string; instructions: string[] } {
    return {
      downloadUrl: '/assets/DSC-Bridge-Setup.exe',
      instructions: [
        '1. Download and install DSC Bridge Service',
        '2. Run the service as Administrator',
        '3. Insert your HYP 2003 USB DSC token',
        '4. Return to this page and retry signing',
        '5. The bridge will automatically detect your token'
      ]
    };
  }
}

export default DSCBridgeService;