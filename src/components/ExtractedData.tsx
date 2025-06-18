
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, User, CreditCard, FileText, Download, Loader2, CheckCircle, AlertCircle, FolderOpen } from 'lucide-react';

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
      a.download = `${data.employeeName.replace(/\s+/g, '_')}_extracted-data.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'uploading':
        return <Badge variant="secondary" className="flex items-center"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Uploading</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-600 flex items-center"><CheckCircle className="h-3 w-3 mr-1" />Uploaded</Badge>;
      case 'error':
        return <Badge variant="destructive" className="flex items-center"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
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
        <p className="text-sm">Upload a folder to see extracted information here</p>
      </div>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <FileText className="h-5 w-5 mr-2 text-indigo-600" />
            {data.employeeName}
          </CardTitle>
          {getStatusBadge(data.uploadStatus)}
        </div>
        {data.employeePath && (
          <div className="flex items-center text-sm text-gray-600">
            <FolderOpen className="h-4 w-4 mr-1" />
            {data.employeePath}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 text-gray-500 mr-1" />
              <span className="font-medium text-gray-700">Date:</span>
            </div>
            <Badge variant="secondary" className="text-xs">{data.date}</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CreditCard className="h-3 w-3 text-gray-500 mr-1" />
              <span className="font-medium text-gray-700">PAN:</span>
            </div>
            <Badge variant="outline" className="text-xs">{data.employeePAN}</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 text-gray-500 mr-1" />
              <span className="font-medium text-gray-700">FY:</span>
            </div>
            <Badge variant="secondary" className="text-xs">{data.financialYear}</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 text-gray-500 mr-1" />
              <span className="font-medium text-gray-700">AY:</span>
            </div>
            <Badge variant="secondary" className="text-xs">{data.assessmentYear}</Badge>
          </div>
        </div>
        
        {data.uploadId && (
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-500">Upload ID: {data.uploadId}</p>
          </div>
        )}
        
        <div className="pt-2">
          <Button 
            onClick={handleExport} 
            size="sm"
            variant="outline"
            className="w-full"
          >
            <Download className="h-3 w-3 mr-1" />
            Export JSON
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
