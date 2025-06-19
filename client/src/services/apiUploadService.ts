
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

    // Helper to chunk array into batches of 10
    const chunkArray = <T,>(arr: T[], size: number): T[][] => {
      const res: T[][] = [];
      for (let i = 0; i < arr.length; i += size) {
        res.push(arr.slice(i, i + size));
      }
      return res;
    };

    const fileBatches = chunkArray(files, 10);
    let allUploadIds: string[] = [];
    let allSuccess = true;
    let allMessages: string[] = [];

    for (const batch of fileBatches) {
      const payload = await Promise.all(
        batch.map(async ({ file, data }) => {
          const base64Document = await convertFileToBase64(file);
          return {
            ...data,
            document: base64Document
          };
        })
      );

      console.log('Uploading batch to API:', {
        url: 'https://apiv1.resolvepay.in/organization/storeawsformfile-client',
        filesCount: payload.length
      });

      const response = await fetch('https://apiv1.resolvepay.in/organization/storeawsformfile-client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ form16DocumentAlls: payload }),
      });

      if (!response.ok) {
        allSuccess = false;
        allMessages.push(`Batch upload failed: ${response.statusText}`);
        continue;
      }

      const result = await response.json();
      allUploadIds.push(result.uploadId || `api-${Date.now()}`);
      allMessages.push('Batch uploaded successfully');
    }

    return {
      success: allSuccess,
      message: allMessages.join('; '),
      uploadId: allUploadIds.join(',')
    };

  } catch (error) {
    console.error('API upload error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'API upload failed'
    };
  }
};
