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

  const extractDataFromPdf = async (file: File): Promise<Omit<PdfData, 'employeePath' | 'companyName'>> => {
    console.log(`Starting PDF extraction for file: ${file.name}`);
    
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      
      fileReader.onload = function() {
        const typedArray = new Uint8Array(this.result as ArrayBuffer);
        
        // Load PDF.js from CDN if not already loaded
        const loadPdfJs = () => {
          return new Promise<void>((resolveLoad) => {
            if ((window as any).pdfjsLib) {
              resolveLoad();
              return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.min.js';
            script.onload = () => {
              (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';
              resolveLoad();
            };
            document.head.appendChild(script);
          });
        };
        
        loadPdfJs().then(() => {
          (window as any).pdfjsLib.getDocument(typedArray).promise.then((pdf: any) => {
            pdf.getPage(1).then((page: any) => {
              page.getTextContent().then((textContent: any) => {
                let text = '';
                textContent.items.forEach((item: any) => {
                  text += item.str + ' ';
                });
                
                console.log('PDF text extracted successfully, length:', text.length);
                console.log('First page text:', text.substring(0, 1000));
                
                // Use exact C# regex patterns for extraction
                const dateMatch = text.match(/Date:\s+(\d{2}-[A-Za-z]{3}-\d{4})/);
                const date = dateMatch ? dateMatch[1] : new Date().toLocaleDateString('en-GB', { 
                  day: '2-digit', 
                  month: 'short', 
                  year: 'numeric' 
                });
                
                const employeeNameMatch = text.match(/Employee Name:\s+([A-Za-z\s]+)/);
                let employeeName = employeeNameMatch ? employeeNameMatch[1].trim() : '';
                
                if (!employeeName) {
                  const fileNameMatch = file.name.match(/([A-Z][a-zA-Z\s]+?)_/);
                  if (fileNameMatch) {
                    employeeName = fileNameMatch[1].replace(/_/g, ' ');
                  } else {
                    employeeName = 'Unknown Employee';
                  }
                }
                
                // Use exact C# regex pattern for PAN extraction
                const employeePANMatch = text.match(/Employee PAN:\s+([A-Z0-9]+)/);
                const employeePAN = employeePANMatch ? employeePANMatch[1] : '';
                
                const financialYearMatch = text.match(/Financial Year:\s+(\d{4}-\d{2})/);
                const financialYear = financialYearMatch ? financialYearMatch[1] : '2024-25';
                
                const assessmentYearMatch = text.match(/Assessment Year:\s+(\d{4}-\d{2})/);
                const assessmentYear = assessmentYearMatch ? assessmentYearMatch[1] : '2025-26';
                
                const rawFirstPageText = text.substring(0, 2000);
                
                console.log('Extracted data:', {
                  date,
                  employeeName,
                  employeePAN: employeePAN || 'EXTRACTION_FAILED',
                  financialYear,
                  assessmentYear,
                  pdfread: rawFirstPageText
                });
                
                resolve({
                  date,
                  employeeName,
                  employeePAN: employeePAN || 'EXTRACTION_FAILED',
                  financialYear,
                  assessmentYear,
                  pdfread: rawFirstPageText
                });
              }).catch((error: any) => {
                console.error('Error getting text content:', error);
                reject(error);
              });
            }).catch((error: any) => {
              console.error('Error getting page:', error);
              reject(error);
            });
          }).catch((error: any) => {
            console.error('Error loading PDF:', error);
            reject(error);
          });
        }).catch((error: any) => {
          console.error('Error loading PDF.js:', error);
          reject(error);
        });
      };
      
      fileReader.onerror = () => {
        console.error('Error reading file');
        reject(new Error('Error reading file'));
      };
      
      fileReader.readAsArrayBuffer(file);
    }).catch((error) => {
      console.error('Error parsing PDF:', error);
      
      return {
        date: new Date().toLocaleDateString('en-GB', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        }),
        employeeName: file.name.replace('_Form16.pdf', '').replace(/_/g, ' '),
        employeePAN: 'EXTRACTION_FAILED',
        financialYear: '2024-25',
        assessmentYear: '2025-26',
        pdfread: 'Error reading PDF content'
      };
    });
  };

  const handleFileUpload = async (file: File, employeePath: string) => {
    setError(null);
    setIsProcessing(true);
    
    try {
      console.log(`Processing file: ${file.name} from path: ${employeePath}`);
      
      const extractedData = await extractDataFromPdf(file);
      const companyName = employeePath.split('/')[0];
      
      const employeeData: PdfData = {
        ...extractedData,
        employeePath,
        companyName,
        uploadStatus: 'pending'
      };

      if (employeeData.employeePAN === 'EXTRACTION_FAILED') {
        const failedExtraction: FailedPanExtraction = {
          fileName: file.name,
          employeePath,
          employeeName: employeeData.employeeName,
          companyName,
          extractedText: employeeData.pdfread
        };
        
        setFailedPanExtractions(prev => [...prev, failedExtraction]);
      }

      const fileWithData = { file, data: employeeData };
      setUploadedFiles(prev => [...prev, fileWithData]);
      setExtractedDataList(prev => [...prev, employeeData]);

      await mockAzureUpload(file, {
        date: employeeData.date,
        employeeName: employeeData.employeeName,
        employeePAN: employeeData.employeePAN,
        financialYear: employeeData.financialYear,
        assessmentYear: employeeData.assessmentYear,
        employeePath: employeeData.employeePath
      });

    } catch (error) {
      console.error('Error processing file:', error);
      setError(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkApiUpload = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "No files to upload",
        description: "Please upload some PDF files first",
        variant: "destructive"
      });
      return;
    }

    setIsApiUploading(true);
    setError(null);

    try {
      const result = await uploadToApi(uploadedFiles);
      
      if (result.success) {
        toast({
          title: "Upload Successful!",
          description: `Successfully uploaded ${uploadedFiles.length} files to the API`,
          variant: "default"
        });
        
        setUploadedFiles(prev => 
          prev.map(item => ({
            ...item,
            data: { ...item.data, uploadStatus: 'success' as const }
          }))
        );
        
        setExtractedDataList(prev => 
          prev.map(item => ({ ...item, uploadStatus: 'success' as const }))
        );
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('API upload error:', error);
      setError(`API upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setIsApiUploading(false);
    }
  };

  const exportAsJSON = () => {
    const dataStr = JSON.stringify(extractedDataList, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'extracted_employee_data.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <FileText className="h-8 w-8 text-indigo-600" />
            PDF Data Extractor
          </h1>
          <p className="text-lg text-gray-600">
            Extract employee information from Form 16 PDFs
          </p>
        </div>

        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <FileUpload 
              onFileUpload={handleFileUpload}
              isProcessing={isProcessing}
              error={error}
            />
            
            {extractedDataList.length > 0 && (
              <div className="flex gap-3">
                <Button 
                  onClick={exportAsJSON}
                  variant="outline"
                  className="flex-1"
                >
                  Export JSON
                </Button>
                <Button 
                  onClick={handleBulkApiUpload}
                  disabled={isApiUploading || uploadedFiles.length === 0}
                  className="flex-1"
                >
                  {isApiUploading ? (
                    <>
                      <Upload className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Upload to API ({uploadedFiles.length})
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {extractedDataList.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Processed Employees</h2>
                  <div className="flex items-center text-sm text-gray-500">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    {extractedDataList.length} / {extractedDataList.length} uploaded
                  </div>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {extractedDataList.map((data, index) => (
                    <ExtractedData 
                      key={index} 
                      data={data} 
                      isProcessing={false}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {failedPanExtractions.length > 0 && (
              <FailedPanList failedExtractions={failedPanExtractions} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfReader;