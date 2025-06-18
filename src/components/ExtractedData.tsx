
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, User, CreditCard, FileText, Download, Loader2 } from 'lucide-react';

interface PdfData {
  date: string;
  employeeName: string;
  employeePAN: string;
  financialYear: string;
  assessmentYear: string;
}

interface ExtractedDataProps {
  data: PdfData | null;
  isProcessing: boolean;
}

export const ExtractedData: React.FC<ExtractedDataProps> = ({ data, isProcessing }) => {
  const handleExport = () => {
    if (data) {
      const jsonData = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'extracted-data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-600">Extracting data from PDF...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <FileText className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg">No data extracted yet</p>
        <p className="text-sm">Upload a PDF file to see extracted information here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <FileText className="h-5 w-5 mr-2 text-indigo-600" />
            Form 16 Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Date:</span>
              </div>
              <Badge variant="secondary">{data.date}</Badge>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <User className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Employee Name:</span>
              </div>
              <Badge variant="outline">{data.employeeName}</Badge>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CreditCard className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Employee PAN:</span>
              </div>
              <Badge variant="outline">{data.employeePAN}</Badge>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Financial Year:</span>
              </div>
              <Badge variant="secondary">{data.financialYear}</Badge>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Assessment Year:</span>
              </div>
              <Badge variant="secondary">{data.assessmentYear}</Badge>
            </div>
          </div>
          
          <div className="pt-4">
            <Button 
              onClick={handleExport} 
              className="w-full"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Export as JSON
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
