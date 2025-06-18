import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Info, 
  ExternalLink, 
  Download, 
  Shield,
  Chrome,
  Globe
} from 'lucide-react';

interface DSCBrowserLimitationsProps {
  onRetryDetection: () => void;
}

export const DSCBrowserLimitations: React.FC<DSCBrowserLimitationsProps> = ({ 
  onRetryDetection 
}) => {
  const openWindowsCertManager = () => {
    // Create instructions for opening Certificate Manager
    const instructions = `
To access Windows Certificate Manager:

1. Press Windows + R
2. Type: certmgr.msc
3. Press Enter
4. Navigate to Personal → Certificates
5. Look for your DSC certificate
6. If not present, import from your HYP 2003 token
    `;
    
    alert(instructions);
  };

  const downloadDesktopApp = () => {
    // In a real implementation, this would link to a desktop application
    alert('Desktop DSC signing applications can directly access USB tokens without browser limitations.');
  };

  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Browser Security Limitation:</strong> Web browsers cannot directly access USB smart card devices like your HYP 2003 token due to security restrictions.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            DSC Certificate Access Options
          </CardTitle>
          <CardDescription>
            Your HYP 2003 token is working, but requires Windows Certificate Store integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Current Status */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-yellow-900">HYP 2003 Token Status</h4>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                Connected but not browser-accessible
              </Badge>
            </div>
            <p className="text-sm text-yellow-700">
              Your token is working with Windows applications but browsers cannot directly access USB smart cards.
            </p>
          </div>

          {/* Solution Options */}
          <div className="space-y-3">
            <h4 className="font-medium">Solutions:</h4>
            
            {/* Option 1: Windows Certificate Store */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Import to Windows Certificate Store
                </h5>
                <Badge variant="outline">Recommended</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Import your DSC certificate to Windows Certificate Store for browser access.
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={openWindowsCertManager}
                  variant="outline"
                  size="sm"
                >
                  Open certmgr.msc
                </Button>
                <Button 
                  onClick={onRetryDetection}
                  variant="outline"
                  size="sm"
                >
                  Retry Detection
                </Button>
              </div>
            </div>

            {/* Option 2: Use IE/Edge */}
            <div className="border rounded-lg p-4">
              <h5 className="font-medium flex items-center gap-2 mb-2">
                <Chrome className="h-4 w-4" />
                Use Internet Explorer or Edge
              </h5>
              <p className="text-sm text-gray-600 mb-3">
                IE and Edge have better smart card integration support.
              </p>
              <Button 
                onClick={() => window.open('microsoft-edge:' + window.location.href, '_blank')}
                variant="outline"
                size="sm"
              >
                Open in Edge
              </Button>
            </div>

            {/* Option 3: Desktop Application */}
            <div className="border rounded-lg p-4">
              <h5 className="font-medium flex items-center gap-2 mb-2">
                <Download className="h-4 w-4" />
                Desktop Application
              </h5>
              <p className="text-sm text-gray-600 mb-3">
                Desktop applications can directly access USB tokens without browser limitations.
              </p>
              <Button 
                onClick={downloadDesktopApp}
                variant="outline"
                size="sm"
              >
                Learn About Desktop Apps
              </Button>
            </div>
          </div>

          {/* Browser Compatibility */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium mb-2">Browser Compatibility:</h5>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Chrome className="h-4 w-4 text-gray-500" />
                <span>Chrome: Limited smart card support</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-500" />
                <span>Firefox: Limited smart card support</span>
              </div>
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-blue-500" />
                <span>Edge: Better smart card integration</span>
              </div>
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-blue-500" />
                <span>IE: Full smart card support</span>
              </div>
            </div>
          </div>

          {/* Certificate Import Instructions */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>To import your HYP 2003 certificate:</strong><br />
              1. Ensure token is inserted<br />
              2. Open certmgr.msc<br />
              3. Right-click Personal → Certificates<br />
              4. All Tasks → Import → Browse for certificate<br />
              5. Restart browser after import
            </AlertDescription>
          </Alert>

        </CardContent>
      </Card>
    </div>
  );
};