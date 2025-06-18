
interface EmployeeData {
  date: string;
  employeeName: string;
  employeePAN: string;
  financialYear: string;
  assessmentYear: string;
  employeePath: string;
}

interface UploadResponse {
  success: boolean;
  message: string;
  uploadId?: string;
}

export const uploadToAzure = async (
  file: File,
  employeeData: EmployeeData
): Promise<UploadResponse> => {
  try {
    // Create FormData for multipart upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('employeeData', JSON.stringify(employeeData));

    console.log('Uploading to Azure:', {
      fileName: file.name,
      employeeData
    });

    // Replace with your actual Azure upload endpoint
    const uploadEndpoint = process.env.AZURE_UPLOAD_ENDPOINT || 'https://your-azure-function-url.azurewebsites.net/api/upload';

    const response = await fetch(uploadEndpoint, {
      method: 'POST',
      body: formData,
      headers: {
        // Add any required headers for Azure authentication
        'x-api-key': process.env.AZURE_API_KEY || '',
      },
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      message: 'File uploaded successfully to Azure',
      uploadId: result.uploadId
    };

  } catch (error) {
    console.error('Azure upload error:', error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Upload failed'
    };
  }
};

// Mock function for development - remove when connecting to real Azure endpoint
export const mockAzureUpload = async (
  file: File,
  employeeData: EmployeeData
): Promise<UploadResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('Mock Azure upload:', {
    fileName: file.name,
    fileSize: file.size,
    employeeData
  });

  return {
    success: true,
    message: 'File uploaded successfully (mock)',
    uploadId: `mock-${Date.now()}`
  };
};
