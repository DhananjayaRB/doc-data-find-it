
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, AlertCircle, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileUploadProps {
  onFileUpload: (file: File, employeePath: string) => void;
  isProcessing: boolean;
  error: string | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  isProcessing,
  error
}) => {
  const [dragActive, setDragActive] = useState(false);

  const findPdfInFolder = useCallback(async (files: File[]) => {
    console.log('Processing files:', files.map(f => f.webkitRelativePath || f.name));
    
    // Find PDF files in subfolder structure
    const pdfFiles = files.filter(file => {
      const path = file.webkitRelativePath || file.name;
      return file.type === 'application/pdf' && path.includes('/');
    });

    console.log('Found PDF files:', pdfFiles.map(f => f.webkitRelativePath));

    if (pdfFiles.length === 0) {
      throw new Error('No PDF files found in the uploaded folder structure');
    }

    // Process each PDF file found
    for (const pdfFile of pdfFiles) {
      const path = pdfFile.webkitRelativePath;
      const pathParts = path.split('/');
      
      if (pathParts.length >= 3) {
        // Extract employee path (MainFolder/SubFolder)
        const employeePath = pathParts.slice(0, 2).join('/');
        onFileUpload(pdfFile, employeePath);
      }
    }
  }, [onFileUpload]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      await findPdfInFolder(acceptedFiles);
    } catch (err) {
      console.error('Error processing folder:', err);
    }
  }, [findPdfInFolder]);

  const handleFolderSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      findPdfInFolder(files);
    }
  }, [findPdfInFolder]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
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
            <p className="text-lg font-medium text-gray-700">Processing Folder...</p>
            <p className="text-sm text-gray-500">Extracting data from PDF files</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {isDragActive ? (
              <>
                <Upload className="h-12 w-12 text-indigo-600 mb-4" />
                <p className="text-lg font-medium text-indigo-600">Drop the folder here</p>
              </>
            ) : (
              <>
                <Folder className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Drag and drop your company folder here
                </p>
                <p className="text-sm text-gray-500 mb-4">or click to select a folder</p>
                <Button variant="outline" className="mx-auto">
                  Choose Folder
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Alternative folder input */}
      <div className="text-center">
        <input
          type="file"
          {...({ webkitdirectory: "" } as any)}
          multiple
          onChange={handleFolderSelect}
          className="hidden"
          id="folder-input"
          disabled={isProcessing}
        />
        <label
          htmlFor="folder-input"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
        >
          <Folder className="h-4 w-4 mr-2" />
          Select Folder
        </label>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="text-xs text-gray-500 text-center">
        <p>Expected structure: Company Folder → Employee Subfolder → PDF files</p>
        <p>Example: GreeneStep Technologies Pvt Ltd/Amul Khandekar/Amul_Khandekar_Form16.pdf</p>
      </div>
    </div>
  );
};
