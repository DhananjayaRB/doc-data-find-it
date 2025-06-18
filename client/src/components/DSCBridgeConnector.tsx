import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Shield,
  Usb,
  Play,
  ExternalLink
} from 'lucide-react';
import DSCBridgeService from '@/services/dscBridgeService';

interface DSCBridgeConnectorProps {
  onCertificatesDetected: (certificates: any[]) => void;
  onBridgeReady: (ready: boolean) => void;
}

export const DSCBridgeConnector: React.FC<DSCBridgeConnectorProps> = ({
  onCertificatesDetected,
  onBridgeReady
}) => {
  const [bridgeConnected, setBridgeConnected] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState<'checking' | 'connected' | 'disconnected' | 'installing'>('checking');
  const [certificates, setCertificates] = useState<any[]>([]);
  const [usbTokens, setUsbTokens] = useState<any[]>([]);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isInstalling, setIsInstalling] = useState(false);

  const bridgeService = DSCBridgeService.getInstance();

  useEffect(() => {
    checkBridgeConnection();
    const interval = setInterval(checkBridgeConnection, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const checkBridgeConnection = async () => {
    setBridgeStatus('checking');
    
    const connected = await bridgeService.checkBridgeConnection();
    
    if (connected) {
      setBridgeConnected(true);
      setBridgeStatus('connected');
      onBridgeReady(true);
      
      // Get status including certificates and USB tokens
      const status = await bridgeService.getBridgeStatus();
      setCertificates(status.certificates);
      setUsbTokens(status.usbTokens);
      onCertificatesDetected(status.certificates);
      
      // Connect WebSocket for real-time updates
      await bridgeService.connectWebSocket();
    } else {
      setBridgeConnected(false);
      setBridgeStatus('disconnected');
      onBridgeReady(false);
      setCertificates([]);
      setUsbTokens([]);
    }
  };

  const downloadBridgeService = async () => {
    setIsInstalling(true);
    setDownloadProgress(0);

    // Simulate download progress
    const progressInterval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // In a real implementation, this would download the actual installer
    setTimeout(() => {
      setIsInstalling(false);
      setDownloadProgress(100);
      
      // Create download link for the bridge service installer
      const installer = bridgeService.generateBridgeInstaller();
      
      // Trigger download
      const link = document.createElement('a');
      link.href = '/api/download/dsc-bridge-installer';
      link.download = 'DSC-Bridge-Setup.exe';
      link.click();
      
      alert('DSC Bridge installer downloaded. Please run as Administrator and restart this application.');
    }, 2000);
  };

  const launchBridgeService = () => {
    // Attempt to launch the bridge service
    window.open('dsc-bridge://launch', '_blank');
    setTimeout(checkBridgeConnection, 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          DSC Bridge Service
        </CardTitle>
        <CardDescription>
          Desktop service for HYP 2003 USB DSC token access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Bridge Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              bridgeStatus === 'connected' ? 'bg-green-500' : 
              bridgeStatus === 'checking' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="font-medium">Bridge Service Status</span>
          </div>
          <Badge variant={bridgeStatus === 'connected' ? 'default' : 'secondary'}>
            {bridgeStatus === 'connected' ? 'Connected' : 
             bridgeStatus === 'checking' ? 'Checking...' : 'Disconnected'}
          </Badge>
        </div>

        {/* Connected State */}
        {bridgeStatus === 'connected' && (
          <div className="space-y-3">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                DSC Bridge service is running and ready for USB token access.
              </AlertDescription>
            </Alert>

            {/* USB Tokens */}
            {usbTokens.length > 0 && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                  <Usb className="h-4 w-4" />
                  Connected USB Tokens
                </h4>
                {usbTokens.map((token, index) => (
                  <div key={index} className="text-sm text-green-700">
                    {token.name} - {token.manufacturer} ({token.serialNumber})
                  </div>
                ))}
              </div>
            )}

            {/* Certificates */}
            {certificates.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Available Certificates</h4>
                {certificates.map((cert, index) => (
                  <div key={index} className="text-sm text-blue-700 mb-1">
                    <div className="font-medium">{cert.name}</div>
                    <div>Valid: {cert.validFrom} to {cert.validTo}</div>
                  </div>
                ))}
              </div>
            )}

            <Button 
              onClick={checkBridgeConnection}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Status
            </Button>
          </div>
        )}

        {/* Disconnected State */}
        {bridgeStatus === 'disconnected' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                DSC Bridge service is not running. Install and start the service to access your USB DSC token.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                The DSC Bridge service runs on your computer and provides secure access to your HYP 2003 USB token.
              </div>

              {isInstalling && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Downloading DSC Bridge Service...</div>
                  <Progress value={downloadProgress} className="w-full" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={downloadBridgeService}
                  disabled={isInstalling}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Service
                </Button>
                
                <Button 
                  onClick={launchBridgeService}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Launch Service
                </Button>
              </div>

              <Button 
                onClick={() => window.open('https://github.com/your-repo/dsc-bridge/releases', '_blank')}
                variant="outline"
                size="sm"
                className="w-full flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Manual Download
              </Button>
            </div>
          </div>
        )}

        {/* Installation Instructions */}
        <div className="bg-gray-50 p-3 rounded-lg text-sm">
          <h5 className="font-medium mb-2">Installation Steps:</h5>
          <ol className="list-decimal list-inside space-y-1 text-gray-600">
            <li>Download DSC Bridge Service installer</li>
            <li>Run installer as Administrator</li>
            <li>Insert your HYP 2003 USB DSC token</li>
            <li>Start the DSC Bridge Service</li>
            <li>Return to this page - service will auto-detect</li>
          </ol>
        </div>

      </CardContent>
    </Card>
  );
};