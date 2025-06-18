
interface EmployeeData {
  date: string;
  employeeName: string;
  employeePAN: string;
  financialYear: string;
  assessmentYear: string;
  employeePath: string;
  companyName: string;
  document: string; // base64 data
  pdfread: string; // first page extracted data
}

interface ApiUploadResponse {
  success: boolean;
  message: string;
  uploadId?: string;
}

const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove the data:application/pdf;base64, prefix
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = error => reject(error);
  });
};

export const uploadToApi = async (
  files: { file: File; data: EmployeeData }[]
): Promise<ApiUploadResponse> => {
  try {
    console.log('Converting files to base64 and preparing payload...');
    
    const payload = await Promise.all(
      files.map(async ({ file, data }) => {
        const base64Document = await convertFileToBase64(file);
        return {
          ...data,
          document: base64Document
        };
      })
    );

    console.log('Uploading to API:', {
      url: 'https://ap.store.in/organizat/storeawsformfile',
      filesCount: payload.length
    });

    const response = await fetch('https://ap.store.in/organizat/storeawsformfile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      message: 'Documents uploaded successfully to API',
      uploadId: result.uploadId || `api-${Date.now()}`
    };

  } catch (error) {
    console.error('API upload error:', error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'API upload failed'
    };
  }
};
