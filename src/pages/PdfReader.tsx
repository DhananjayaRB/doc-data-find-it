
import React, { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { ExtractedData } from '@/components/ExtractedData';
import { FileText, Upload, CheckCircle } from 'lucide-react';
import { mockAzureUpload } from '@/services/azureUploadService';
import { useToast } from '@/hooks/use-toast';

interface PdfData {
  date: string;
  employeeName: string;
  employeePAN: string;
  financialYear: string;
  assessmentYear: string;
  employeePath: string;
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error';
  uploadId?: string;
}

const PdfReader = () => {
  const [extractedDataList, setExtractedDataList] = useState<PdfData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const extractDataFromPdf = async (file: File): Promise<Omit<PdfData, 'employeePath'>> => {
    // Simulate PDF processing - replace with actual PDF parsing logic
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock data extraction - in real implementation, use pdf-parse or similar
    return {
      date: "16-Jun-2025",
      employeeName: "Jeodeendra Kumar",
      employeePAN: "AGCPK3668E",
      financialYear: "2024-25",
      assessmentYear: "2025-26"
    };
  };

  const handleFileUpload = async (file: File, employeePath: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      console.log(`Processing file: ${file.name} from path: ${employeePath}`);

      // Extract data from PDF
      const extractedData = await extractDataFromPdf(file);
      
      const employeeData: PdfData = {
        ...extractedData,
        employeePath,
        uploadStatus: 'pending'
      };

      // Add to the list
      setExtractedDataList(prev => [...prev, employeeData]);
      
      // Upload to Azure
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
              <h4 className="font-semibold text-gray-900 mb-2">PDF Processing</h4>
              <p className="text-gray-600">Automatically extracts data from Form 16 PDFs</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Upload className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Easy Upload</h4>
              <p className="text-gray-600">Drag and drop or click to upload your files</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Structured Output</h4>
              <p className="text-gray-600">Get organized, structured data instantly</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfReader;
