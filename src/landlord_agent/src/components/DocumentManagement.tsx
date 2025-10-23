import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  X,
  Search,
  Filter,
  Plus
} from 'lucide-react';
import { Property, PropertyDocument } from '../App';

interface DocumentManagementProps {
  property: Property | null;
  onBack: () => void;
  onDocumentAdd: (propertyId: string, document: Omit<PropertyDocument, 'id'>) => void;
}

export function DocumentManagement({ property, onBack, onDocumentAdd }: DocumentManagementProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [uploadForm, setUploadForm] = useState({
    name: '',
    type: '',
    issueDate: '',
    expiryDate: ''
  });
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4">Property not found</h2>
          <Button onClick={onBack}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const documentTypes = [
    { value: 'epc', label: 'EPC Certificate' },
    { value: 'gas-cert', label: 'Gas Safety Certificate' },
    { value: 'tenancy-agreement', label: 'Tenancy Agreement' },
    { value: 'insurance', label: 'Insurance Policy' },
    { value: 'other', label: 'Other Document' }
  ];

  const getDocumentStatus = (document: PropertyDocument): PropertyDocument['status'] => {
    if (!document.expiryDate) return 'valid';
    
    const now = new Date();
    const expiry = new Date(document.expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring-soon';
    return 'valid';
  };

  const getStatusIcon = (status: PropertyDocument['status']) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'expiring-soon':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'expired':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: PropertyDocument['status']) => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Valid</Badge>;
      case 'expiring-soon':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Expiring Soon</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Expired</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadForm.name || !uploadForm.type || !uploadForm.issueDate) {
      return;
    }

    const newDocument: Omit<PropertyDocument, 'id'> = {
      name: uploadForm.name,
      type: uploadForm.type as PropertyDocument['type'],
      url: '#', // In a real app, this would be the uploaded file URL
      issueDate: new Date(uploadForm.issueDate),
      expiryDate: uploadForm.expiryDate ? new Date(uploadForm.expiryDate) : undefined,
      status: 'valid'
    };

    // Update status based on expiry date
    if (newDocument.expiryDate) {
      const tempDoc = { ...newDocument, id: 'temp' } as PropertyDocument;
      newDocument.status = getDocumentStatus(tempDoc);
    }

    onDocumentAdd(property.id, newDocument);
    
    setUploadForm({
      name: '',
      type: '',
      issueDate: '',
      expiryDate: ''
    });
    setIsUploadOpen(false);
  };

  const filteredDocuments = property.documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         documentTypes.find(t => t.value === doc.type)?.label.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || doc.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getTypeLabel = (type: string) => {
    return documentTypes.find(t => t.value === type)?.label || type;
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: 'Archivo, sans-serif', backgroundColor: '#f2f2f2' }}>
      {/* Header */}
      <div className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack} className="p-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="mb-1" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957', fontSize: '1.5rem', fontWeight: '600' }}>Document Management</h1>
                <p className="text-muted-foreground" style={{ fontFamily: 'Archivo, sans-serif' }}>{property.address}</p>
              </div>
            </div>

            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload New Document</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpload} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="doc-name">Document Name *</Label>
                    <Input
                      id="doc-name"
                      placeholder="e.g., Gas Safety Certificate 2024"
                      value={uploadForm.name}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="doc-type">Document Type *</Label>
                    <Select 
                      value={uploadForm.type} 
                      onValueChange={(value) => setUploadForm(prev => ({ ...prev, type: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="issue-date">Issue Date *</Label>
                      <Input
                        id="issue-date"
                        type="date"
                        value={uploadForm.issueDate}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, issueDate: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expiry-date">Expiry Date</Label>
                      <Input
                        id="expiry-date"
                        type="date"
                        value={uploadForm.expiryDate}
                        onChange={(e) => setUploadForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Drag and drop your file here, or click to browse
                    </p>
                    <Button type="button" variant="outline" size="sm">
                      Browse Files
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      PDF, JPG, PNG up to 10MB
                    </p>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsUploadOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Upload Document</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 bg-white" style={{ border: '1px solid #D1D5DB' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ fontFamily: 'Archivo, sans-serif', fontSize: '0.875rem', fontWeight: '500', color: '#374957' }}>Total Documents</p>
                <p className="text-2xl font-semibold" style={{ fontFamily: 'Archivo, sans-serif', fontSize: '1.5rem', fontWeight: '600' }}>{property.documents.length}</p>
              </div>
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-6 bg-white" style={{ border: '1px solid #D1D5DB' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ fontFamily: 'Archivo, sans-serif', fontSize: '0.875rem', fontWeight: '500', color: '#374957' }}>Valid</p>
                <p className="text-2xl font-semibold text-green-600" style={{ fontFamily: 'Archivo, sans-serif', fontSize: '1.5rem', fontWeight: '600' }}>
                  {property.documents.filter(d => getDocumentStatus(d) === 'valid').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-6 bg-white" style={{ border: '1px solid #D1D5DB' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ fontFamily: 'Archivo, sans-serif', fontSize: '0.875rem', fontWeight: '500', color: '#374957' }}>Expiring Soon</p>
                <p className="text-2xl font-semibold text-orange-600" style={{ fontFamily: 'Archivo, sans-serif', fontSize: '1.5rem', fontWeight: '600' }}>
                  {property.documents.filter(d => getDocumentStatus(d) === 'expiring-soon').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </Card>

          <Card className="p-6 bg-white" style={{ border: '1px solid #D1D5DB' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ fontFamily: 'Archivo, sans-serif', fontSize: '0.875rem', fontWeight: '500', color: '#374957' }}>Expired</p>
                <p className="text-2xl font-semibold text-red-600" style={{ fontFamily: 'Archivo, sans-serif', fontSize: '1.5rem', fontWeight: '600' }}>
                  {property.documents.filter(d => getDocumentStatus(d) === 'expired').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </Card>
        </div>

        {/* Custom Filter Bar */}
        <div className="bg-white rounded-xl p-6 mb-6" style={{ border: '1px solid #E5E7EB' }}>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search documents..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-[#f3f3f3] placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#8FCDFF] focus:border-[#8FCDFF] text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="lg:w-48">
              <div className="relative">
                <button
                  type="button"
                  className="block w-full px-4 py-2 pr-8 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-[#8FCDFF] focus:border-[#8FCDFF] text-left text-sm text-[#374957]"
                  onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
                >
                  {typeFilter === 'all' ? 'All Types' : getTypeLabel(typeFilter)}
                </button>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {typeDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
                    <div className="py-1">
                      <button
                        className="block w-full px-4 py-2 text-left text-sm text-[#374957] hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                        onClick={() => { setTypeFilter('all'); setTypeDropdownOpen(false); }}
                      >
                        All Types
                      </button>
                      {documentTypes.map((type) => (
                        <button
                          key={type.value}
                          className="block w-full px-4 py-2 text-left text-sm text-[#374957] hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                          onClick={() => { setTypeFilter(type.value); setTypeDropdownOpen(false); }}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status Filter */}
            <div className="lg:w-48">
              <div className="relative">
                <button
                  type="button"
                  className="block w-full px-4 py-2 pr-8 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-[#8FCDFF] focus:border-[#8FCDFF] text-left text-sm text-[#374957]"
                  onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                >
                  {statusFilter === 'all' ? 'All Status' :
                   statusFilter === 'valid' ? 'Valid' :
                   statusFilter === 'expiring-soon' ? 'Expiring Soon' : 'Expired'}
                </button>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {statusDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
                    <div className="py-1">
                      <button
                        className="block w-full px-4 py-2 text-left text-sm text-[#374957] hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                        onClick={() => { setStatusFilter('all'); setStatusDropdownOpen(false); }}
                      >
                        All Status
                      </button>
                      <button
                        className="block w-full px-4 py-2 text-left text-sm text-[#374957] hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                        onClick={() => { setStatusFilter('valid'); setStatusDropdownOpen(false); }}
                      >
                        Valid
                      </button>
                      <button
                        className="block w-full px-4 py-2 text-left text-sm text-[#374957] hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                        onClick={() => { setStatusFilter('expiring-soon'); setStatusDropdownOpen(false); }}
                      >
                        Expiring Soon
                      </button>
                      <button
                        className="block w-full px-4 py-2 text-left text-sm text-[#374957] hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                        onClick={() => { setStatusFilter('expired'); setStatusDropdownOpen(false); }}
                      >
                        Expired
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Documents List */}
        {filteredDocuments.length === 0 ? (
          <Card className="p-12 text-center bg-white" style={{ border: '1px solid #D1D5DB' }}>
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="mb-2" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>
              {property.documents.length === 0 
                ? 'No documents uploaded' 
                : 'No documents match your filters'
              }
            </h3>
            <p className="text-muted-foreground mb-6" style={{ fontFamily: 'Archivo, sans-serif' }}>
              {property.documents.length === 0
                ? 'Upload compliance documents to track their status and never miss renewals'
                : 'Try adjusting your search or filters'
              }
            </p>
            <Button onClick={() => setIsUploadOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredDocuments.map((document) => {
              const status = getDocumentStatus(document);
              return (
                <Card key={document.id} className="p-6 bg-white" style={{ border: '1px solid #D1D5DB' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(status)}
                      <div>
                        <h3 className="mb-1" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>{document.name}</h3>
                        <p className="text-muted-foreground" style={{ fontFamily: 'Archivo, sans-serif' }}>
                          {getTypeLabel(document.type)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm mb-1" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>
                          Issued: {formatDate(document.issueDate)}
                        </p>
                        {document.expiryDate && (
                          <p className="text-sm text-muted-foreground" style={{ fontFamily: 'Archivo, sans-serif' }}>
                            Expires: {formatDate(document.expiryDate)}
                          </p>
                        )}
                      </div>
                      
                      {getStatusBadge(status)}

                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" className="border-[#D1D5DB] text-[#374957] hover:border-[#DC5F12] hover:text-[#DC5F12] transition-all">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="border-[#D1D5DB] text-[#374957] hover:border-[#DC5F12] hover:text-[#DC5F12] transition-all">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Compliance Tips */}
        <Card className="p-6 mt-8 bg-white" style={{ border: '1px solid #D1D5DB' }}>
          <h3 className="mb-4 flex items-center" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>
            <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
            Compliance Reminders
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>Gas Safety Certificate</h4>
              <p className="text-muted-foreground" style={{ fontFamily: 'Archivo, sans-serif' }}>
                Required annually for all rental properties with gas appliances
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>EPC Certificate</h4>
              <p className="text-muted-foreground" style={{ fontFamily: 'Archivo, sans-serif' }}>
                Valid for 10 years, minimum rating of E required for rentals
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>Insurance Policy</h4>
              <p className="text-muted-foreground" style={{ fontFamily: 'Archivo, sans-serif' }}>
                Landlord insurance should cover property damage and liability
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>Tenancy Agreement</h4>
              <p className="text-muted-foreground" style={{ fontFamily: 'Archivo, sans-serif' }}>
                Keep signed agreements for all current and past tenancies
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}