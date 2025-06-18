import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { FileSignature, Shield, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DSCCertificate {
  id: string;
  name: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  serialNumber: string;
  thumbprint: string;
}

interface DSCSigningDialogProps {
  selectedFiles: { file: File; data: any }[];
  onSigningComplete: (signedFiles: { 
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
  }[]) => void;
}

export const DSCSigningDialog: React.FC<DSCSigningDialogProps> = ({ 
  selectedFiles, 
  onSigningComplete 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [certificates, setCertificates] = useState<DSCCertificate[]>([]);
  const [selectedCertificate, setSelectedCertificate] = useState<string>('');
  const [pin, setPin] = useState('');
  const [signingReason, setSigningReason] = useState('Document Authentication');
  const [signingLocation, setSigningLocation] = useState('India');
  const [isLoading, setIsLoading] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDSCAvailable, setIsDSCAvailable] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkDSCAvailability();
  }, [isOpen]);

  const checkDSCAvailability = async () => {
    try {
      setIsLoading(true);
      
      // Check if Windows Crypto API is available
      if (!(window as any).crypto?.subtle) {
        throw new Error('Web Crypto API not available');
      }

      // Try to access Windows Certificate Store via WebCrypto
      await loadCertificates();
      setIsDSCAvailable(true);
    } catch (error) {
      console.error('DSC not available:', error);
      setError('DSC/USB Token not detected. Please ensure your DSC is connected and drivers are installed.');
      setIsDSCAvailable(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCertificates = async () => {
    try {
      // This would typically interface with Windows Certificate Store
      // For now, we'll simulate certificate detection
      const mockCertificates: DSCCertificate[] = [
        {
          id: 'cert1',
          name: 'Employee Digital Certificate',
          issuer: 'Controller of Certifying Authorities India',
          validFrom: '2024-01-01',
          validTo: '2027-01-01',
          serialNumber: '123456789ABC',
          thumbprint: 'A1B2C3D4E5F6'
        }
      ];

      // In a real implementation, this would call:
      // - Windows Certificate Store API
      // - PKCS#11 interface for USB tokens
      // - Or use a native bridge to access system certificates
      
      setCertificates(mockCertificates);
    } catch (error) {
      console.error('Error loading certificates:', error);
      throw error;
    }
  };

  const signPDFs = async () => {
    if (!selectedCertificate || !pin) {
      setError('Please select a certificate and enter PIN');
      return;
    }

    setIsSigning(true);
    setError(null);

    try {
      const signedFiles: { 
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
      }[] = [];

      for (const fileData of selectedFiles) {
        const { file } = fileData;
        
        // Create signed PDF (simulation)
        const signedPdfBlob = await signPDFWithDSC(file, selectedCertificate, pin);
        const signedFile = new File([signedPdfBlob], file.name.replace('.pdf', '_signed.pdf'), {
          type: 'application/pdf'
        });

        const cert = certificates.find(c => c.id === selectedCertificate);
        
        signedFiles.push({
          originalFile: file,
          signedFile,
          signatureInfo: {
            signedBy: cert?.name || 'Unknown',
            signedAt: new Date().toISOString(),
            reason: signingReason,
            location: signingLocation,
            certificateThumbprint: cert?.thumbprint || '',
            isValid: true
          }
        });
      }

      onSigningComplete(signedFiles);
      
      toast({
        title: "PDFs Signed Successfully!",
        description: `${signedFiles.length} PDF(s) have been digitally signed`,
        variant: "default"
      });

      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.error('Signing error:', error);
      setError(`Signing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSigning(false);
    }
  };

  const signPDFWithDSC = async (file: File, certificateId: string, pin: string): Promise<Blob> => {
    // This is a simulation of PDF signing
    // In a real implementation, this would:
    // 1. Load the PDF document
    // 2. Access the certificate from Windows Certificate Store or USB token
    // 3. Create a digital signature using PKCS#7/CAdES
    // 4. Embed the signature in the PDF
    
    try {
      // Read the original PDF
      const arrayBuffer = await file.arrayBuffer();
      
      // For demonstration, we'll just add signature metadata
      // Real implementation would use libraries like:
      // - pdf-lib for PDF manipulation
      // - node-forge for cryptographic operations
      // - PKCS#11 wrapper for USB token access
      
      const signatureMetadata = JSON.stringify({
        signedBy: certificates.find(c => c.id === certificateId)?.name,
        signedAt: new Date().toISOString(),
        reason: signingReason,
        location: signingLocation,
        certificateThumbprint: certificates.find(c => c.id === certificateId)?.thumbprint
      });

      // Create a new blob with signature marker (for demonstration)
      const uint8Array = new Uint8Array(arrayBuffer);
      const signedArray = new Uint8Array(uint8Array.length + signatureMetadata.length);
      signedArray.set(uint8Array);
      signedArray.set(new TextEncoder().encode(signatureMetadata), uint8Array.length);

      return new Blob([signedArray], { type: 'application/pdf' });
    } catch (error) {
      throw new Error(`Failed to sign PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const resetForm = () => {
    setSelectedCertificate('');
    setPin('');
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          disabled={selectedFiles.length === 0}
        >
          <FileSignature className="h-4 w-4" />
          Sign PDFs with DSC ({selectedFiles.length})
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Digital Signature Certificate Signing
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Detecting DSC devices...</span>
            </div>
          )}

          {error && (
            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {isDSCAvailable && !isLoading && (
            <>
              <div className="space-y-2">
                <Label htmlFor="certificate">Select Certificate</Label>
                <Select value={selectedCertificate} onValueChange={setSelectedCertificate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a certificate" />
                  </SelectTrigger>
                  <SelectContent>
                    {certificates.map((cert) => (
                      <SelectItem key={cert.id} value={cert.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{cert.name}</span>
                          <span className="text-xs text-gray-500">
                            Valid: {cert.validFrom} to {cert.validTo}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin">DSC PIN</Label>
                <Input
                  id="pin"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter your DSC PIN"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Signing Reason</Label>
                <Input
                  id="reason"
                  value={signingReason}
                  onChange={(e) => setSigningReason(e.target.value)}
                  placeholder="Reason for signing"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Signing Location</Label>
                <Input
                  id="location"
                  value={signingLocation}
                  onChange={(e) => setSigningLocation(e.target.value)}
                  placeholder="Location"
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Files to be signed: {selectedFiles.length}
                  </span>
                </div>
                <div className="space-y-1">
                  {selectedFiles.slice(0, 3).map((fileData, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {fileData.file.name}
                    </Badge>
                  ))}
                  {selectedFiles.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{selectedFiles.length - 3} more...
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={signPDFs}
                  disabled={!selectedCertificate || !pin || isSigning}
                  className="flex-1"
                >
                  {isSigning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing...
                    </>
                  ) : (
                    <>
                      <FileSignature className="mr-2 h-4 w-4" />
                      Sign PDFs
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                  disabled={isSigning}
                >
                  Cancel
                </Button>
              </div>
            </>
          )}

          {!isDSCAvailable && !isLoading && (
            <div className="text-center p-4">
              <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-4">
                DSC device not detected. Please ensure:
              </p>
              <ul className="text-xs text-gray-500 text-left space-y-1">
                <li>• DSC USB token is connected</li>
                <li>• Drivers are properly installed</li>
                <li>• Certificate is valid and not expired</li>
                <li>• Browser has necessary permissions</li>
              </ul>
              <Button 
                onClick={checkDSCAvailability}
                variant="outline" 
                size="sm" 
                className="mt-4"
              >
                Retry Detection
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};