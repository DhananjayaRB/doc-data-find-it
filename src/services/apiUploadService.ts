
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
    const chunkArray = <T,>(arr: T[], size: number): T[][] =>
      Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
        arr.slice(i * size, i * size + size)
      );

    // Convert all files to base64 and prepare payloads
    const allPayloads = await Promise.all(
      files.map(async ({ file, data }) => {
        const base64Document = await convertFileToBase64(file);
        return {
          ...data,
          document: base64Document
        };
      })
    );

    // Split into batches of 10
    const batches = chunkArray(allPayloads, 10);
    let allSuccess = true;
    let messages: string[] = [];
    let uploadIds: string[] = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`Uploading batch ${i + 1} of ${batches.length} to API...`);
      const response = await fetch('https://apiv1.resolvepay.in/organization/storeawsformfile-client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ form16DocumentAlls: batch }),
      });

      if (!response.ok) {
        allSuccess = false;
        messages.push(`Batch ${i + 1} failed: ${response.statusText}`);
        continue;
      }

      const result = await response.json();
      messages.push(`Batch ${i + 1} uploaded successfully`);
      if (result.uploadId) uploadIds.push(result.uploadId);
    }

    return {
      success: allSuccess,
      message: messages.join('; '),
      uploadId: uploadIds.join(',') || `api-${Date.now()}`
    };

  } catch (error) {
    console.error('API upload error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'API upload failed'
    };
  }
};
