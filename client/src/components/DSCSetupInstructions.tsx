import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Info, CheckCircle, ExternalLink } from 'lucide-react';

interface DSCSetupInstructionsProps {
  onRetryDetection: () => void;
}

export const DSCSetupInstructions: React.FC<DSCSetupInstructionsProps> = ({ onRetryDetection }) => {
  return (
    <div className="space-y-4">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Your HYP 2003 USB DSC token is not being detected. This is normal for web browsers due to security restrictions.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            DSC Certificate Setup Instructions
          </CardTitle>
          <CardDescription>
            Follow these steps to enable DSC signing in your browser
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                1
              </div>
              <div>
                <h4 className="font-medium">Install DSC Certificate in Windows</h4>
                <p className="text-sm text-gray-600">
                  Insert your HYP 2003 USB token and install the certificate in Windows Certificate Store (Personal folder)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                2
              </div>
              <div>
                <h4 className="font-medium">Enable Browser Certificate Access</h4>
                <p className="text-sm text-gray-600">
                  For Chrome/Edge: Go to Settings → Privacy and Security → Security → Manage Certificates
                </p>
                <p className="text-sm text-gray-600">
                  For Firefox: Go to Settings → Privacy & Security → View Certificates
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                3
              </div>
              <div>
                <h4 className="font-medium">Use HTTPS Connection</h4>
                <p className="text-sm text-gray-600">
                  Certificate access requires a secure HTTPS connection. Make sure you're accessing the application via HTTPS.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-sm font-medium text-green-600">
                <CheckCircle className="h-3 w-3" />
              </div>
              <div>
                <h4 className="font-medium">Alternative: Use Desktop Application</h4>
                <p className="text-sm text-gray-600">
                  For full DSC support, consider using a desktop application that can directly interface with your USB token.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex gap-3">
              <Button onClick={onRetryDetection} variant="outline">
                Retry Detection
              </Button>
              <Button 
                onClick={() => window.open('https://www.microsoft.com/en-us/download/details.aspx?id=8328', '_blank')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Download Certificate Manager
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Note:</strong> Web browsers cannot directly access USB tokens due to security restrictions. 
          The certificate must be installed in Windows Certificate Store first.
        </AlertDescription>
      </Alert>
    </div>
  );
};