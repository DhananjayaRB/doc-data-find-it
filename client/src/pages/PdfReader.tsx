import React, { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { ExtractedData } from '@/components/ExtractedData';
import { FailedPanList } from '@/components/FailedPanList';
import { FileText, Upload, CheckCircle, AlertTriangle, Send } from 'lucide-react';
import { mockAzureUpload } from '@/services/azureUploadService';
import { uploadToApi } from '@/services/apiUploadService';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface PdfData {
  date: string;
  employeeName: string;
  employeePAN: string;
  financialYear: string;
  assessmentYear: string;
  employeePath: string;
  companyName: string;
  pdfread: string; // first page extracted data
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error';
  uploadId?: string;
}

interface FailedPanExtraction {
  fileName: string;
  employeePath: string;
  employeeName: string;
  companyName: string;
  extractedText: string;
}

const PdfReader = () => {
  const [extractedDataList, setExtractedDataList] = useState<PdfData[]>([]);
  const [failedPanExtractions, setFailedPanExtractions] = useState<FailedPanExtraction[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<{ file: File; data: PdfData }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isApiUploading, setIsApiUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingStarted, setProcessingStarted] = useState(false);
  const { toast } = useToast();

  const simplePanExtraction = (text: string, fileName: string): string => {
    console.log(`Simple PAN extraction for: ${fileName}`);
    console.log('Full PDF text (first 1000 chars):', text.substring(0, 1000));
    
    // Focus on first page content - split by form feed or page breaks
    const firstPageText = text.split('\f')[0] || text.substring(0, 3000);
    console.log('First page text (first 1000 chars):', firstPageText.substring(0, 1000));
    
    // Multiple patterns to find Employee PAN
    const panPatterns = [
      // Look for "Employee PAN:" followed by any characters
      /Employee\s+PAN\s*:\s*([A-Z0-9]{10})/gi,
      /Employee\s+PAN\s*:\s*([A-Z0-9]+)/gi,
      // Look for just "PAN:" followed by characters
      /PAN\s*:\s*([A-Z0-9]{10})/gi,
      /PAN\s*:\s*([A-Z0-9]+)/gi,
      // Standard PAN format anywhere in text
      /\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b/g,
      // More flexible PAN format
      /\b([A-Z]{4}[A-Z0-9]{6})\b/g,
      // Look for the specific pattern AGCPK3668E style
      /\b([A-Z]{4,5}[0-9]{4}[A-Z])\b/g
    ];

    // Try each pattern
    for (let i = 0; i < panPatterns.length; i++) {
      const pattern = panPatterns[i];
      console.log(`Trying pattern ${i + 1}:`, pattern);
      const match = firstPageText.match(pattern);
      if (match) {
        console.log('Pattern matched:', match);
        for (let j = 0; j < match.length; j++) {
          const potentialPan = match[j].replace(/.*:\s*/, '').trim().toUpperCase();
          console.log(`Potential PAN ${j}:`, potentialPan);
          if (potentialPan.length >= 10 && potentialPan.length <= 12 && /^[A-Z0-9]+$/.test(potentialPan)) {
            console.log(`Valid PAN found: ${potentialPan}`);
            return potentialPan;
          }
        }
      }
    }

    // Try to find PAN in filename as last resort
    const fileNamePan = fileName.match(/([A-Z0-9]{10})/);
    if (fileNamePan) {
      console.log(`PAN found in filename: ${fileNamePan[1]}`);
      return fileNamePan[1];
    }

    console.log(`No PAN found for: ${fileName}`);
    console.log('Available text for debugging:', firstPageText);
    return '';
  };

  const extractDataFromPdf = async (file: File): Promise<Omit<PdfData, 'employeePath' | 'companyName'>> => {
    console.log(`Starting PDF extraction for file: ${file.name}`);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const pdfParse = await import('pdf-parse');
      const pdfData = await pdfParse.default(buffer);
      
      console.log('Extracted PDF text length:', pdfData.text.length);
      
      const text = pdfData.text;
      const firstPageText = text.split('\f')[0] || text.substring(0, 2000);
      
      // Extract Date - look for specific formats like "16-Jun-2025"
      let date = '';
      const datePatterns = [
        /Date\s*:\s*(\d{1,2}[-]\w{3}[-]\d{4})/i,
        /(\d{1,2}[-]\w{3}[-]\d{4})/,
        /(\d{1,2}[-/]\d{1,2}[-/]\d{4})/
      ];
      
      for (const pattern of datePatterns) {
        const dateMatch = firstPageText.match(pattern);
        if (dateMatch) {
          date = dateMatch[1];
          break;
        }
      }
      
      if (!date) {
        date = new Date().toLocaleDateString('en-GB', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        });
      }
      
      // Extract Employee Name - look for "Employee Name:" pattern
      let employeeName = '';
      const namePatterns = [
        /Employee\s+Name\s*:\s*([A-Za-z\s]+?)(?:\n|Employee|PAN|$)/i,
        /Name\s*:\s*([A-Za-z\s]+?)(?:\n|Employee|PAN|$)/i,
        /(?:Mr\.|Ms\.|Mrs\.)\s*([A-Za-z\s]+?)(?:\n|Employee|PAN|$)/i
      ];
      
      for (const pattern of namePatterns) {
        const nameMatch = firstPageText.match(pattern);
        if (nameMatch) {
          employeeName = nameMatch[1].trim();
          break;
        }
      }
      
      if (!employeeName) {
        const fileNameMatch = file.name.match(/([A-Z][a-zA-Z\s]+?)_/);
        if (fileNameMatch) {
          employeeName = fileNameMatch[1].replace(/_/g, ' ');
        } else {
          employeeName = 'Unknown Employee';
        }
      }
      
      // Simple PAN extraction without validation
      const employeePAN = simplePanExtraction(text, file.name);
      
      // Extract Financial Year - look for "Financial Year:" pattern
      let financialYear = '';
      const fyPatterns = [
        /Financial\s+Year\s*:\s*(\d{4}[-]\d{2})/i,
        /F\.?Y\.?\s*:\s*(\d{4}[-]\d{2})/i,
        /(\d{4}[-]\d{2})/
      ];
      
      for (const pattern of fyPatterns) {
        const fyMatch = firstPageText.match(pattern);
        if (fyMatch) {
          financialYear = fyMatch[1];
          break;
        }
      }
      
      if (!financialYear) {
        financialYear = '2024-25';
      }
      
      // Extract Assessment Year - look for "Assessment Year:" pattern
      let assessmentYear = '';
      const ayPatterns = [
        /Assessment\s+Year\s*:\s*(\d{4}[-]\d{2})/i,
        /A\.?Y\.?\s*:\s*(\d{4}[-]\d{2})/i,
        /Assessment.*?(\d{4}[-]\d{2})/i
      ];
      
      for (const pattern of ayPatterns) {
        const ayMatch = firstPageText.match(pattern);
        if (ayMatch) {
          assessmentYear = ayMatch[1];
          break;
        }
      }
      
      if (!assessmentYear) {
        assessmentYear = '2025-26';
      }
      
      console.log('Extracted data:', {
        date,
        employeeName,
        employeePAN: employeePAN || 'EXTRACTION_FAILED',
        financialYear,
        assessmentYear,
        pdfread: firstPageText.substring(0, 1000) // First 1000 chars
      });
      
      return {
        date,
        employeeName,
        employeePAN: employeePAN || 'EXTRACTION_FAILED',
        financialYear,
        assessmentYear,
        pdfread: firstPageText.substring(0, 1000)
      };
      
    } catch (error) {
      console.error('Error parsing PDF:', error);
      
      const pathParts = file.webkitRelativePath ? file.webkitRelativePath.split('/') : [];
      let fallbackName = 'Unknown Employee';
      
      if (pathParts.length >= 2) {
        fallbackName = pathParts[1];
      } else {
        const fileNameMatch = file.name.match(/([A-Z][a-zA-Z\s]+?)_/);
        if (fileNameMatch) {
          fallbackName = fileNameMatch[1].replace(/_/g, ' ');
        }
      }
      
      return {
        date: new Date().toLocaleDateString('en-GB', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        }),
        employeeName: fallbackName,
        employeePAN: 'EXTRACTION_FAILED',
        financialYear: '2024-25',
        assessmentYear: '2025-26',
        pdfread: 'Error reading PDF content'
      };
    }
  };

  const handleFileUpload = async (file: File, employeePath: string) => {
    if (!processingStarted) {
      console.log('Starting new folder processing, clearing previous data');
      setExtractedDataList([]);
      setFailedPanExtractions([]);
      setUploadedFiles([]);
      setProcessingStarted(true);
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log(`Processing file: ${file.name} from path: ${employeePath}`);

      const extractedData = await extractDataFromPdf(file);
      
      // Extract company name from path
      const pathParts = employeePath.split('/');
      const companyName = pathParts[0] || 'Unknown Company';
      
      const employeeData: PdfData = {
        ...extractedData,
        employeePath,
        companyName,
        uploadStatus: 'pending'
      };

      // Store file for API upload
      setUploadedFiles(prev => [...prev, { file, data: employeeData }]);

      // If PAN extraction failed, add to failed list
      if (!extractedData.employeePAN || extractedData.employeePAN === 'EXTRACTION_FAILED') {
        const failedExtraction: FailedPanExtraction = {
          fileName: file.name,
          employeePath,
          employeeName: extractedData.employeeName,
          companyName,
          extractedText: 'PAN extraction failed'
        };
        
        setFailedPanExtractions(prev => [...prev, failedExtraction]);
        
        toast({
          title: "PAN Extraction Failed",
          description: `Could not extract PAN for ${extractedData.employeeName} from ${file.name}`,
          variant: "destructive",
        });
      }

      setExtractedDataList(prev => [...prev, employeeData]);
      
      // Continue with Azure upload
      const updatedData = { ...employeeData, uploadStatus: 'uploading' as const };
      setExtractedDataList(prev => 
        prev.map(item => item.employeePath === employeePath ? updatedData : item)
      );

      const uploadResult = await mockAzureUpload(file, employeeData);
      
      if (uploadResult.success) {
        setExtractedDataList(prev =>
          prev.map(item =>
            item.employeePath === employeePath
              ? { ...item, uploadStatus: 'success', uploadId: uploadResult.uploadId }
              : item
          )
        );
        
        toast({
          title: "Upload Successful",
          description: `Data for ${employeeData.employeeName} uploaded to Azure`,
        });
      } else {
        setExtractedDataList(prev =>
          prev.map(item =>
            item.employeePath === employeePath
              ? { ...item, uploadStatus: 'error' }
              : item
          )
        );
        
        toast({
          title: "Upload Failed",
          description: uploadResult.message,
          variant: "destructive",
        });
      }

    } catch (err) {
      setError('Failed to process PDF file');
      console.error('Processing error:', err);
    } finally {
      setIsProcessing(false);
      
      setTimeout(() => {
        setProcessingStarted(false);
      }, 3000);
    }
  };

  const handleApiUpload = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "No Files to Upload",
        description: "Please process some files first",
        variant: "destructive",
      });
      return;
    }

    setIsApiUploading(true);
    
    try {
      // Convert PdfData to EmployeeData format
      const apiFiles = uploadedFiles.map(({ file, data }) => ({
        file,
        data: {
          date: data.date,
          employeeName: data.employeeName,
          employeePAN: data.employeePAN,
          financialYear: data.financialYear,
          assessmentYear: data.assessmentYear,
          employeePath: data.employeePath,
          companyName: data.companyName,
          document: '', // Will be filled by the API service
          pdfread: data.pdfread
        }
      }));

      const result = await uploadToApi(apiFiles);
      
      if (result.success) {
        toast({
          title: "API Upload Successful",
          description: `${uploadedFiles.length} documents uploaded to API`,
        });
      } else {
        toast({
          title: "API Upload Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "API Upload Error",
        description: "Failed to upload documents to API",
        variant: "destructive",
      });
    } finally {
      setIsApiUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <FileText className="h-12 w-12 text-indigo-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">PDF Data Extractor</h1>
          </div>
          <p className="text-lg text-gray-600">
            Upload your company folder with Form 16 PDFs to extract and upload employee information
          </p>
        </div>

        {/* Failed PAN Extractions */}
        <FailedPanList failedExtractions={failedPanExtractions} />

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Upload Section */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Upload className="h-6 w-6 text-indigo-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Upload Folder</h2>
            </div>
            <FileUpload 
              onFileUpload={handleFileUpload}
              isProcessing={isProcessing}
              error={error}
            />
            
            {/* API Upload Button */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <Button 
                  onClick={handleApiUpload}
                  disabled={isApiUploading}
                  className="w-full"
                  size="lg"
                >
                  {isApiUploading ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-spin" />
                      Uploading to API...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Upload Documents to API ({uploadedFiles.length})
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Processed Employees</h2>
              {extractedDataList.length > 0 && (
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {extractedDataList.filter(item => item.uploadStatus === 'success').length} / {extractedDataList.length} uploaded
                </div>
              )}
            </div>
            
            {extractedDataList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg">No employees processed yet</p>
                <p className="text-sm">Upload a folder to see extracted information here</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {extractedDataList.map((data, index) => (
                  <ExtractedData 
                    key={`${data.employeePath}-${index}`}
                    data={data}
                    isProcessing={data.uploadStatus === 'uploading'}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Features</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-indigo-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FileText className="h-8 w-8 text-indigo-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Enhanced PAN Extraction</h4>
              <p className="text-gray-600">Advanced patterns to extract PAN from first page of PDFs</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Upload className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">API Integration</h4>
              <p className="text-gray-600">Upload documents with base64 conversion to external API</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Failed Extractions Report</h4>
              <p className="text-gray-600">Download Excel report of failed PAN extractions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfReader;
