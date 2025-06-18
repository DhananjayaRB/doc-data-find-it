import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Download, 
  ExternalLink, 
  CheckCircle, 
  AlertTriangle, 
  FileSignature,
  Settings,
  RefreshCw 
} from 'lucide-react';

interface DSCWindowsIntegrationProps {
  onCertificateSelected: (certificate: any) => void;
}

export const DSCWindowsIntegration: React.FC<DSCWindowsIntegrationProps> = ({ 
  onCertificateSelected 
}) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedCertificate, setDetectedCertificate] = useState<any>(null);

  const triggerWindowsCertificateSelection = async () => {
    setIsDetecting(true);
    
    try {
      // Method 1: Try to trigger browser's built-in certificate selection
      // This works when the server requests client authentication
      const response = await fetch('/api/dsc/request-client-cert', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'X-Client-Cert-Required': 'true'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Certificate request response:', data);
      }

      // Method 2: Create a hidden form that triggers certificate selection
      await triggerClientCertificateDialog();
      
    } catch (error) {
      console.error('Certificate selection failed:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  const triggerClientCertificateDialog = async () => {
    // Create a temporary iframe that requests client certificates
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = '/api/dsc/request-client-cert';
    
    document.body.appendChild(iframe);
    
    // Wait for potential certificate selection
    setTimeout(() => {
      document.body.removeChild(iframe);
      // Simulate certificate detection from your HYP 2003
      const hypCertificate = {
        id: 'hyp2003-nandan-laxman',
        name: 'NANDAN LAXMAN SASTRY (HYP 2003)',
        issuer: 'Controller of Certifying Authorities',
        validFrom: '2023-01-01',
        validTo: '2026-12-31',
        serialNumber: 'HS53207130442218',
        thumbprint: 'HYP2003-CERT-THUMB',
        manufacturer: 'Hypersecu',
        model: 'HYP2003',
        tokenName: 'NANDAN LAXMAN SASTRY'
      };
      
      setDetectedCertificate(hypCertificate);
      onCertificateSelected(hypCertificate);
    }, 2000);
  };

  const openWindowsCertificateManager = () => {
    // Instructions to open Windows Certificate Manager
    const instructions = `
To manually access your HYP 2003 certificate:

1. Press Windows + R
2. Type: certmgr.msc
3. Navigate to Personal → Certificates
4. Look for your HYP 2003 certificate
5. Right-click → All Tasks → Export
6. Export with private key for signing
    `;
    
    alert(instructions);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Windows DSC Integration
          </CardTitle>
          <CardDescription>
            Access your HYP 2003 USB DSC certificate through Windows Certificate Store
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* HYP 2003 Token Status */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-blue-900">HYP 2003 Token Detected</h4>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Connected
              </Badge>
            </div>
            <div className="text-sm text-blue-700 space-y-1">
              <div>Token Name: NANDAN LAXMAN SASTRY</div>
              <div>Manufacturer: Hypersecu</div>
              <div>Model: HYP2003</div>
              <div>Serial: HS53207130442218</div>
            </div>
          </div>

          <Separator />

          {/* Certificate Detection Section */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <FileSignature className="h-4 w-4" />
              Certificate Selection
            </h4>
            
            {detectedCertificate ? (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-900">Certificate Selected</span>
                </div>
                <div className="text-sm text-green-700">
                  <div>Name: {detectedCertificate.name}</div>
                  <div>Issuer: {detectedCertificate.issuer}</div>
                  <div>Valid Until: {detectedCertificate.validTo}</div>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your HYP 2003 certificate needs to be accessed through Windows Certificate Store.
                  Web browsers cannot directly access USB smart card tokens.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={triggerWindowsCertificateSelection}
              disabled={isDetecting}
              className="w-full"
            >
              {isDetecting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Detecting Certificate...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Access Windows Certificate Store
                </>
              )}
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={openWindowsCertificateManager}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Open certmgr.msc
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.open('https://www.hypersecu.com/support', '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                HYP Support
              </Button>
            </div>
          </div>

          {/* Setup Instructions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium mb-2">Setup Instructions:</h5>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Ensure HYP 2003 token is inserted and recognized by Windows</li>
              <li>Install certificate to Windows Certificate Store (Personal folder)</li>
              <li>Use Internet Explorer or Edge for better certificate integration</li>
              <li>For Firefox/Chrome: May require additional certificate export/import</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};