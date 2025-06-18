
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
  error: string | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  isProcessing,
  error
}) => {
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type === 'application/pdf') {
        onFileUpload(file);
      }
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false,
    disabled: isProcessing
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive 
            ? 'border-indigo-500 bg-indigo-50' 
            : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {isProcessing ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
            <p className="text-lg font-medium text-gray-700">Processing PDF...</p>
            <p className="text-sm text-gray-500">This may take a few moments</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {isDragActive ? (
              <>
                <Upload className="h-12 w-12 text-indigo-600 mb-4" />
                <p className="text-lg font-medium text-indigo-600">Drop the PDF file here</p>
              </>
            ) : (
              <>
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Drag and drop your PDF file here
                </p>
                <p className="text-sm text-gray-500 mb-4">or click to select a file</p>
                <Button variant="outline" className="mx-auto">
                  Choose File
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="text-xs text-gray-500 text-center">
        Supported format: PDF files only
      </div>
    </div>
  );
};
