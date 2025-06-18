
import React, { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { ExtractedData } from '@/components/ExtractedData';
import { FileText, Upload } from 'lucide-react';

interface PdfData {
  date: string;
  employeeName: string;
  employeePAN: string;
  financialYear: string;
  assessmentYear: string;
}

const PdfReader = () => {
  const [extractedData, setExtractedData] = useState<PdfData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setExtractedData(null);

    try {
      // Create a FileReader to read the PDF file
      const fileReader = new FileReader();
      
      fileReader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          
          // For now, we'll simulate PDF processing with mock data
          // In a real implementation, you'd use pdf-parse here
          setTimeout(() => {
            const mockData: PdfData = {
              date: "16-Jun-2025",
              employeeName: "Jeodeendra Kumar",
              employeePAN: "AGCPK3668E",
              financialYear: "2024-25",
              assessmentYear: "2025-26"
            };
            
            setExtractedData(mockData);
            setIsProcessing(false);
          }, 2000);
          
        } catch (err) {
          setError('Failed to process PDF file');
          setIsProcessing(false);
        }
      };

      fileReader.onerror = () => {
        setError('Failed to read file');
        setIsProcessing(false);
      };

      fileReader.readAsArrayBuffer(file);
      
    } catch (err) {
      setError('An error occurred while processing the file');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <FileText className="h-12 w-12 text-indigo-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">PDF Data Extractor</h1>
          </div>
          <p className="text-lg text-gray-600">
            Upload your Form 16 PDF to extract employee information automatically
          </p>
        </div>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Upload Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Upload className="h-6 w-6 text-indigo-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Upload PDF File</h2>
            </div>
            <FileUpload 
              onFileUpload={handleFileUpload}
              isProcessing={isProcessing}
              error={error}
            />
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Extracted Data</h2>
            <ExtractedData 
              data={extractedData}
              isProcessing={isProcessing}
            />
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
