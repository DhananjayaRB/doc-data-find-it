
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload, Download, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <FileText className="h-16 w-16 text-indigo-600 mr-4" />
            <h1 className="text-5xl font-bold text-gray-900">PDF Data Extractor</h1>
          </div>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Automatically extract employee information from Form 16 PDFs with our intelligent document processing system
          </p>
          <Button 
            onClick={() => navigate('/pdf-reader')} 
            size="lg" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 text-lg"
          >
            Start Extracting Data
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          What You Can Extract
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-6 w-6 text-indigo-600 mr-2" />
                Date Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Extract document dates and timestamps from your Form 16 PDFs automatically
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-6 w-6 text-green-600 mr-2" />
                Employee Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get employee names and PAN card information structured and ready to use
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-6 w-6 text-purple-600 mr-2" />
                Financial Years
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Extract financial year and assessment year information for tax records
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* How it Works Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-indigo-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Upload className="h-10 w-10 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">1. Upload PDF</h3>
              <p className="text-gray-600">
                Simply drag and drop your Form 16 PDF file or click to browse and select
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <FileText className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">2. AI Processing</h3>
              <p className="text-gray-600">
                Our intelligent system reads and extracts key information from your document
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Download className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">3. Get Results</h3>
              <p className="text-gray-600">
                View extracted data in a clean format and export as JSON if needed
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Extract Your Data?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Start processing your Form 16 PDFs in seconds
          </p>
          <Button 
            onClick={() => navigate('/pdf-reader')} 
            size="lg" 
            variant="secondary"
            className="px-8 py-3 text-lg"
          >
            Get Started Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
