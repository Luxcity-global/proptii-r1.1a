import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Progress } from './ui/progress';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Eye, 
  AlertTriangle,
  Download,
  FileSpreadsheet,
  FileJson
} from 'lucide-react';
import { Property } from '../App';

interface ImportPropertiesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (properties: Property[]) => void;
}

interface ImportedProperty {
  address: string;
  type: string;
  bedrooms: number;
  rent: number;
  status: 'vacant' | 'occupied' | 'under-renovation';
  amenities: string[];
  notes?: string;
  rowIndex: number;
  errors: string[];
  isValid: boolean;
}

interface ImportStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

export function ImportPropertiesDialog({ isOpen, onClose, onImport }: ImportPropertiesDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [importedProperties, setImportedProperties] = useState<ImportedProperty[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps: ImportStep[] = [
    {
      id: 'upload',
      title: 'Upload File',
      description: 'Select a CSV, Excel, or JSON file to import',
      completed: currentStep > 0,
      current: currentStep === 0
    },
    {
      id: 'validate',
      title: 'Validate Data',
      description: 'Review and validate the imported properties',
      completed: currentStep > 1,
      current: currentStep === 1
    },
    {
      id: 'preview',
      title: 'Preview Import',
      description: 'Review the properties before importing',
      completed: currentStep > 2,
      current: currentStep === 2
    },
    {
      id: 'complete',
      title: 'Import Complete',
      description: 'Properties have been successfully imported',
      completed: currentStep > 3,
      current: currentStep === 3
    }
  ];

  const resetDialog = () => {
    setCurrentStep(0);
    setFile(null);
    setImportedProperties([]);
    setImportErrors([]);
    setIsProcessing(false);
    setImportProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processFile(selectedFile);
    }
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setImportProgress(0);
    setCurrentStep(1);

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      let properties: ImportedProperty[] = [];
      let errors: string[] = [];

      setImportProgress(25);

      switch (fileExtension) {
        case 'csv':
          const csvData = await processCsvFile(file);
          properties = csvData.properties;
          errors = csvData.errors;
          break;
        case 'xlsx':
        case 'xls':
          const excelData = await processExcelFile(file);
          properties = excelData.properties;
          errors = excelData.errors;
          break;
        case 'json':
          const jsonData = await processJsonFile(file);
          properties = jsonData.properties;
          errors = jsonData.errors;
          break;
        default:
          errors.push(`Unsupported file format: ${fileExtension}. Please use CSV, Excel, or JSON files.`);
      }

      setImportProgress(75);
      setImportedProperties(properties);
      setImportErrors(errors);
      setImportProgress(100);

      if (properties.length > 0) {
        setCurrentStep(2);
      } else {
        setCurrentStep(1);
      }

    } catch (error) {
      setImportErrors([`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      setCurrentStep(1);
    } finally {
      setIsProcessing(false);
    }
  };

  const processCsvFile = async (file: File): Promise<{ properties: ImportedProperty[]; errors: string[] }> => {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    const properties: ImportedProperty[] = [];
    const errors: string[] = [];

    if (lines.length < 2) {
      errors.push('CSV file must contain at least a header row and one data row');
      return { properties, errors };
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const requiredHeaders = ['address', 'type', 'bedrooms', 'rent', 'status'];
    const missingHeaders = requiredHeaders.filter(h => !headers.some(header => header.toLowerCase() === h));
    
    if (missingHeaders.length > 0) {
      errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
      return { properties, errors };
    }

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const property = parsePropertyRow(headers, values, i + 1);
      properties.push(property);
    }

    return { properties, errors };
  };

  const processExcelFile = async (file: File): Promise<{ properties: ImportedProperty[]; errors: string[] }> => {
    // For now, treat Excel files as CSV since we don't have xlsx library
    // In a real app, you'd use a library like xlsx
    const errors = ['Excel file processing requires additional library. Please use CSV format for now.'];
    return { properties: [], errors };
  };

  const processJsonFile = async (file: File): Promise<{ properties: ImportedProperty[]; errors: string[] }> => {
    const text = await file.text();
    const properties: ImportedProperty[] = [];
    const errors: string[] = [];

    try {
      const data = JSON.parse(text);
      const propertyArray = Array.isArray(data) ? data : [data];

      propertyArray.forEach((item, index) => {
        const property = parsePropertyObject(item, index + 1);
        properties.push(property);
      });

    } catch (error) {
      errors.push('Invalid JSON format');
    }

    return { properties, errors };
  };

  const parsePropertyRow = (headers: string[], values: string[], rowIndex: number): ImportedProperty => {
    const errors: string[] = [];
    
    // Create a map of header to value
    const data: Record<string, string> = {};
    headers.forEach((header, index) => {
      data[header.toLowerCase()] = values[index] || '';
    });

    // Validate required fields
    if (!data.address) errors.push('Address is required');
    if (!data.type) errors.push('Type is required');
    if (!data.bedrooms || isNaN(Number(data.bedrooms))) errors.push('Valid bedrooms number is required');
    if (!data.rent || isNaN(Number(data.rent))) errors.push('Valid rent amount is required');
    if (!data.status) errors.push('Status is required');
    if (data.status && !['vacant', 'occupied', 'under-renovation'].includes(data.status.toLowerCase())) {
      errors.push('Status must be vacant, occupied, or under-renovation');
    }

    // Parse amenities
    const amenities = data.amenities ? data.amenities.split(';').map(a => a.trim()).filter(a => a) : [];

    return {
      address: data.address || '',
      type: data.type || '',
      bedrooms: Number(data.bedrooms) || 0,
      rent: Number(data.rent) || 0,
      status: (data.status?.toLowerCase() as any) || 'vacant',
      amenities,
      notes: data.notes || '',
      rowIndex,
      errors,
      isValid: errors.length === 0
    };
  };

  const parsePropertyObject = (obj: any, rowIndex: number): ImportedProperty => {
    const errors: string[] = [];

    // Validate required fields
    if (!obj.address) errors.push('Address is required');
    if (!obj.type) errors.push('Type is required');
    if (!obj.bedrooms || typeof obj.bedrooms !== 'number') errors.push('Valid bedrooms number is required');
    if (!obj.rent || typeof obj.rent !== 'number') errors.push('Valid rent amount is required');
    if (!obj.status) errors.push('Status is required');
    if (obj.status && !['vacant', 'occupied', 'under-renovation'].includes(obj.status.toLowerCase())) {
      errors.push('Status must be vacant, occupied, or under-renovation');
    }

    return {
      address: obj.address || '',
      type: obj.type || '',
      bedrooms: Number(obj.bedrooms) || 0,
      rent: Number(obj.rent) || 0,
      status: (obj.status?.toLowerCase() as any) || 'vacant',
      amenities: Array.isArray(obj.amenities) ? obj.amenities : [],
      notes: obj.notes || '',
      rowIndex,
      errors,
      isValid: errors.length === 0
    };
  };

  const handleImport = () => {
    const validProperties = importedProperties
      .filter(p => p.isValid)
      .map(p => ({
        id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        address: p.address,
        type: p.type,
        bedrooms: p.bedrooms,
        rent: p.rent,
        status: p.status,
        amenities: p.amenities,
        notes: p.notes,
        photos: [],
        documents: [],
        createdAt: new Date()
      } as Property));

    onImport(validProperties);
    setCurrentStep(3);
  };

  const validProperties = importedProperties.filter(p => p.isValid);
  const invalidProperties = importedProperties.filter(p => !p.isValid);

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'csv':
        return <FileSpreadsheet className="h-5 w-5" />;
      case 'xlsx':
      case 'xls':
        return <FileSpreadsheet className="h-5 w-5" />;
      case 'json':
        return <FileJson className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="overflow-y-auto"
        style={{ 
          width: '90vw', 
          maxWidth: '90vw', 
          height: '90vh', 
          maxHeight: '90vh',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        <DialogHeader>
          <DialogTitle>Import Properties</DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                step.completed ? 'bg-green-500 border-green-500 text-white' :
                step.current ? 'bg-orange-500 border-orange-500 text-white' :
                'bg-gray-100 border-gray-300 text-gray-500'
              }`}>
                {step.completed ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <div className="ml-2">
                <p className={`text-sm font-medium ${
                  step.current ? 'text-orange-600' : step.completed ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  step.completed ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: File Upload */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Property File</h3>
              <p className="text-gray-500 mb-4 text-sm">
                Select a CSV, Excel, or JSON file containing property data
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="font-medium text-blue-900 mb-2 text-sm">Supported Formats</h4>
                <div className="space-y-1 text-xs text-blue-800">
                  <div className="flex items-center">
                    <FileSpreadsheet className="h-3 w-3 mr-1" />
                    <span><strong>CSV:</strong> Comma-separated</span>
                  </div>
                  <div className="flex items-center">
                    <FileSpreadsheet className="h-3 w-3 mr-1" />
                    <span><strong>Excel:</strong> .xlsx/.xls</span>
                  </div>
                  <div className="flex items-center">
                    <FileJson className="h-3 w-3 mr-1" />
                    <span><strong>JSON:</strong> Object notation</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-2 text-sm">Required Fields</h4>
                <div className="grid grid-cols-1 gap-1 text-xs text-gray-700">
                  <span>• Address, Type, Bedrooms</span>
                  <span>• Rent, Status</span>
                  <span>• Amenities (optional)</span>
                  <span>• Notes (optional)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Processing/Validation */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {isProcessing ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <h3 className="text-xl font-medium mb-3">Processing File...</h3>
                <p className="text-gray-500 mb-6 text-lg">Validating and parsing property data</p>
                <Progress value={importProgress} className="w-full h-3" />
              </div>
            ) : (
              <div className="space-y-4">
                {file && (
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    {getFileIcon(file.name)}
                    <div className="ml-3">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                )}

                {importErrors.length > 0 && (
                  <Card className="border-red-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-red-800 flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        Import Errors
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {importErrors.map((error, index) => (
                          <li key={index} className="flex items-start text-sm text-red-700">
                            <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                            {error}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {importedProperties.length > 0 && (
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-green-50 rounded-lg">
                      <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                      <p className="text-3xl font-bold text-green-600">{validProperties.length}</p>
                      <p className="text-base text-green-700">Valid Properties</p>
                    </div>
                    <div className="text-center p-6 bg-red-50 rounded-lg">
                      <X className="h-12 w-12 text-red-600 mx-auto mb-3" />
                      <p className="text-3xl font-bold text-red-600">{invalidProperties.length}</p>
                      <p className="text-base text-red-700">Invalid Properties</p>
                    </div>
                    <div className="text-center p-6 bg-blue-50 rounded-lg">
                      <FileText className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                      <p className="text-3xl font-bold text-blue-600">{importedProperties.length}</p>
                      <p className="text-base text-blue-700">Total Properties</p>
                    </div>
                  </div>
                )}

                {validProperties.length > 0 && (
                  <Button
                    onClick={() => setCurrentStep(2)}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    Continue to Preview
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Preview */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Preview Properties</h3>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {validProperties.length} properties ready to import
              </Badge>
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-3">
              {validProperties.map((property, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="font-semibold text-lg min-w-0 flex-1">{property.address}</h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-sm px-3 py-1">
                            {property.type}
                          </Badge>
                          <Badge variant="outline" className="text-sm px-3 py-1">
                            {property.bedrooms} bed
                          </Badge>
                          <Badge variant="outline" className="text-sm px-3 py-1 bg-green-50 text-green-700 border-green-200">
                            £{property.rent.toLocaleString()}/mo
                          </Badge>
                          <Badge variant="outline" className="text-sm px-3 py-1 bg-blue-50 text-blue-700 border-blue-200">
                            {property.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-8 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Amenities:</span><br/>
                          <span className="text-xs">{property.amenities.join(', ') || 'None'}</span>
                        </div>
                        <div>
                          <span className="font-medium">Row:</span><br/>
                          <span className="text-xs">#{property.rowIndex}</span>
                        </div>
                        <div>
                          <span className="font-medium">Type:</span><br/>
                          <span className="text-xs">{property.type}</span>
                        </div>
                        <div>
                          <span className="font-medium">Bedrooms:</span><br/>
                          <span className="text-xs">{property.bedrooms}</span>
                        </div>
                      </div>
                      {property.notes && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                          <span className="font-medium">Notes:</span> {property.notes}
                        </div>
                      )}
                    </div>
                    <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0 ml-4" />
                  </div>
                </Card>
              ))}
            </div>

            {invalidProperties.length > 0 && (
              <details className="border border-red-200 rounded-lg">
                <summary className="p-3 cursor-pointer text-red-700 font-medium">
                  {invalidProperties.length} properties with errors (click to view)
                </summary>
                <div className="p-4 border-t border-red-200 max-h-[300px] overflow-y-auto space-y-3">
                  {invalidProperties.map((property, index) => (
                    <div key={index} className="border border-red-100 rounded-lg p-3 bg-red-50">
                      <div className="font-semibold text-red-800 mb-2">{property.address}</div>
                      <div className="text-red-600 space-y-1">
                        {property.errors.map((error, errorIndex) => (
                          <div key={errorIndex} className="flex items-start">
                            <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        {/* Step 4: Complete */}
        {currentStep === 3 && (
          <div className="text-center space-y-4 py-6">
            <CheckCircle className="h-24 w-24 text-green-500 mx-auto" />
            <h3 className="text-2xl font-semibold text-green-800">Import Complete!</h3>
            <p className="text-lg text-gray-600">
              Successfully imported {validProperties.length} properties into your system.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-green-700">
                Your properties are now available in the Properties page and ready for management.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {currentStep === 0 && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
          
          {currentStep === 1 && !isProcessing && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(0)}
              >
                Upload Different File
              </Button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Back
              </Button>
              <Button 
                onClick={handleImport}
                className="bg-orange-500 hover:bg-orange-600"
                disabled={validProperties.length === 0}
              >
                Import {validProperties.length} Properties
              </Button>
            </div>
          )}

          {currentStep === 3 && (
            <Button onClick={handleClose} className="bg-orange-500 hover:bg-orange-600">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
