
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface FailedPanExtraction {
  fileName: string;
  employeePath: string;
  employeeName: string;
  companyName: string;
  extractedText: string;
}

interface FailedPanListProps {
  failedExtractions: FailedPanExtraction[];
}

export const FailedPanList: React.FC<FailedPanListProps> = ({ failedExtractions }) => {
  const handleDownloadExcel = () => {
    if (failedExtractions.length === 0) return;

    const excelData = failedExtractions.map(failed => ({
      'Employee Name': failed.employeeName,
      'Company Name': failed.companyName,
      'File Path': failed.employeePath,
      'File Name': failed.fileName
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Failed PAN Extractions');
    
    XLSX.writeFile(workbook, `Failed_PAN_Extractions_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (failedExtractions.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-red-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Failed PAN Extractions ({failedExtractions.length})
          </CardTitle>
          <Button onClick={handleDownloadExcel} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {failedExtractions.map((failed, index) => (
            <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="text-sm">
                <div><strong>Employee:</strong> {failed.employeeName}</div>
                <div><strong>Company:</strong> {failed.companyName}</div>
                <div><strong>File:</strong> {failed.fileName}</div>
                <div className="text-xs text-gray-600 mt-1">Path: {failed.employeePath}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
