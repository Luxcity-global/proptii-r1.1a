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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onBack} className="p-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="mb-1">Document Management</h1>
                <p className="text-muted-foreground">{property.address}</p>
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
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-1">Total Documents</p>
                <p className="text-2xl font-semibold">{property.documents.length}</p>
              </div>
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-1">Valid</p>
                <p className="text-2xl font-semibold text-green-600">
                  {property.documents.filter(d => getDocumentStatus(d) === 'valid').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-1">Expiring Soon</p>
                <p className="text-2xl font-semibold text-orange-600">
                  {property.documents.filter(d => getDocumentStatus(d) === 'expiring-soon').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-1">Expired</p>
                <p className="text-2xl font-semibold text-red-600">
                  {property.documents.filter(d => getDocumentStatus(d) === 'expired').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {documentTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="valid">Valid</SelectItem>
                  <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Documents List */}
        {filteredDocuments.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="mb-2">
              {property.documents.length === 0 
                ? 'No documents uploaded' 
                : 'No documents match your filters'
              }
            </h3>
            <p className="text-muted-foreground mb-6">
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
                <Card key={document.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(status)}
                      <div>
                        <h3 className="mb-1">{document.name}</h3>
                        <p className="text-muted-foreground">
                          {getTypeLabel(document.type)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm mb-1">
                          Issued: {formatDate(document.issueDate)}
                        </p>
                        {document.expiryDate && (
                          <p className="text-sm text-muted-foreground">
                            Expires: {formatDate(document.expiryDate)}
                          </p>
                        )}
                      </div>
                      
                      {getStatusBadge(status)}

                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
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
        <Card className="p-6 mt-8 bg-muted/50">
          <h3 className="mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
            Compliance Reminders
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Gas Safety Certificate</h4>
              <p className="text-muted-foreground">
                Required annually for all rental properties with gas appliances
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">EPC Certificate</h4>
              <p className="text-muted-foreground">
                Valid for 10 years, minimum rating of E required for rentals
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Insurance Policy</h4>
              <p className="text-muted-foreground">
                Landlord insurance should cover property damage and liability
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Tenancy Agreement</h4>
              <p className="text-muted-foreground">
                Keep signed agreements for all current and past tenancies
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}