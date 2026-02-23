import React, { useState, useMemo } from 'react';
import { Search, Filter, AlertTriangle, Clock, CheckCircle, FileText, Calendar, Building2, Download, Eye, Trash2, Archive, CheckSquare, Square, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Alert, AlertDescription } from './ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Property, PropertyDocument, UserProfile } from '../App';
import { LandlordEmptyState } from './LandlordEmptyState';

interface DocumentsPageProps {
  properties: Property[];
  userProfile?: UserProfile | null;
  onSignIn?: () => void;
  onViewProperty: (property: Property) => void;
  onManageDocuments: (property: Property) => void;
  onDeleteDocuments?: (documentIds: string[]) => void;
  onArchiveDocuments?: (documentIds: string[]) => void;
  onExportDocuments?: (format: 'json' | 'csv' | 'excel' | 'pdf', documentIds: string[]) => void;
}

interface DocumentWithProperty extends PropertyDocument {
  propertyAddress: string;
  propertyId: string;
}

export function DocumentsPage({ properties, userProfile, onSignIn, onViewProperty, onManageDocuments, onDeleteDocuments, onArchiveDocuments, onExportDocuments }: DocumentsPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Flatten all documents with property information
  const allDocuments = useMemo<DocumentWithProperty[]>(() => {
    return properties.flatMap(property => 
      property.documents.map(document => ({
        ...document,
        propertyAddress: property.address,
        propertyId: property.id,
      }))
    );
  }, [properties]);

  // Filter documents
  const filteredDocuments = useMemo(() => {
    return allDocuments.filter((document) => {
      const matchesSearch = 
        document.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        document.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        document.type.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || document.status === statusFilter;
      const matchesType = typeFilter === 'all' || document.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [allDocuments, searchTerm, statusFilter, typeFilter]);

  // Selection functions
  const toggleDocumentSelection = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId) 
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const selectAllDocuments = () => {
    if (selectedDocuments.length === filteredDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(filteredDocuments.map(doc => doc.id));
    }
  };

  const clearSelection = () => {
    setSelectedDocuments([]);
    setShowBulkActions(false);
  };

  // Bulk action handlers
  const handleBulkDelete = () => {
    if (onDeleteDocuments) {
      onDeleteDocuments(selectedDocuments);
      clearSelection();
    }
  };

  const handleBulkArchive = () => {
    if (onArchiveDocuments) {
      onArchiveDocuments(selectedDocuments);
      clearSelection();
    }
  };

  const handleBulkExport = (format: 'json' | 'csv' | 'excel' | 'pdf') => {
    if (onExportDocuments) {
      onExportDocuments(format, selectedDocuments);
    }
  };

  // Update showBulkActions based on selection
  React.useEffect(() => {
    setShowBulkActions(selectedDocuments.length > 0);
  }, [selectedDocuments]);

  // Calculate summary statistics
  const documentStats = useMemo(() => {
    const total = allDocuments.length;
    const expired = allDocuments.filter(doc => doc.status === 'expired').length;
    const expiringSoon = allDocuments.filter(doc => doc.status === 'expiring-soon').length;
    const valid = allDocuments.filter(doc => doc.status === 'valid').length;
    
    return { total, expired, expiringSoon, valid };
  }, [allDocuments]);

  const getStatusIcon = (status: PropertyDocument['status']) => {
    switch (status) {
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'expiring-soon':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: PropertyDocument['status']) => {
    switch (status) {
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expiring-soon':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'valid':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDocumentType = (type: PropertyDocument['type']) => {
    switch (type) {
      case 'epc':
        return 'EPC Certificate';
      case 'gas-cert':
        return 'Gas Safety Certificate';
      case 'tenancy-agreement':
        return 'Tenancy Agreement';
      case 'insurance':
        return 'Insurance Policy';
      case 'other':
        return 'Other Document';
      default:
        return type;
    }
  };

  const getDocumentTypes = () => {
    const types = new Set(allDocuments.map(doc => doc.type));
    return Array.from(types);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const getDaysUntilExpiry = (expiryDate?: Date) => {
    if (!expiryDate) return null;
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPropertyByDocument = (propertyId: string) => {
    return properties.find(p => p.id === propertyId);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      <div>
        <h1 style={{ color: '#374957' }}>Documents</h1>
        <p className="text-muted-foreground">
          Manage and track compliance across all your properties
        </p>
      </div>

      {/* Document Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground mb-1">
                Total Documents
              </p>
              <p className="text-2xl font-semibold">
                {documentStats.total}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground mb-1">
                Valid Documents
              </p>
              <p className="text-2xl font-semibold text-green-600">
                {documentStats.valid}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground mb-1">
                Expiring Soon
              </p>
              <p className="text-2xl font-semibold text-orange-600">
                {documentStats.expiringSoon}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground mb-1">
                Expired
              </p>
              <p className="text-2xl font-semibold text-red-600">
                {documentStats.expired}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Compliance Alerts */}
      {documentStats.expired > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <span className="font-medium">{documentStats.expired} documents have expired</span> and require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {documentStats.expiringSoon > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <Clock className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <span className="font-medium">{documentStats.expiringSoon} documents are expiring soon</span> and should be renewed.
          </AlertDescription>
        </Alert>
      )}

      {!userProfile && onSignIn ? (
        <Card className="p-12">
          <LandlordEmptyState onSignIn={onSignIn} />
        </Card>
      ) : (
      <>
      {/* Filters and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center bg-white border border-[#f3f3f3] rounded-lg p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 focus:border-[#4E97CC] focus:ring-2 focus:ring-[#8FCDFF] focus:ring-opacity-50 focus:outline-none"
            style={{
              '--tw-ring-color': '#8FCDFF',
              '--tw-ring-opacity': '0.5'
            } as React.CSSProperties}
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={selectAllDocuments}
            className="flex items-center space-x-2"
          >
            {selectedDocuments.length === filteredDocuments.length ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            <span>Select All</span>
          </Button>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="valid">Valid</SelectItem>
              <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Document Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {getDocumentTypes().map((type) => (
                <SelectItem key={type} value={type}>
                  {formatDocumentType(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2" style={{ color: '#374957' }}>No documents found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'Add documents to your properties to see them here'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Bulk Actions Bar */}
              {showBulkActions && selectedDocuments.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-blue-900">
                        {selectedDocuments.length} document{selectedDocuments.length > 1 ? 's' : ''} selected
                      </span>
                      <Button variant="outline" size="sm" onClick={clearSelection}>
                        Clear Selection
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={handleBulkArchive}>
                        <Archive className="h-4 w-4 mr-1" />
                        Archive
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Export
                            <ChevronDown className="h-4 w-4 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleBulkExport('json')}>
                            Export as JSON
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleBulkExport('csv')}>
                            Export as CSV
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleBulkExport('excel')}>
                            Export as Excel
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleBulkExport('pdf')}>
                            Export as PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0}
                        onChange={selectAllDocuments}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((document) => {
                    const property = getPropertyByDocument(document.propertyId);
                    const daysUntilExpiry = getDaysUntilExpiry(document.expiryDate);
                    
                    return (
                      <TableRow key={`${document.propertyId}-${document.id}`} className={selectedDocuments.includes(document.id) ? 'bg-blue-50' : ''}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedDocuments.includes(document.id)}
                            onChange={() => toggleDocumentSelection(document.id)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(document.status)}
                            <span className="font-medium">{document.name}</span>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <button
                            onClick={() => property && onViewProperty(property)}
                            className="text-left hover:text-primary hover:underline"
                          >
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span>{document.propertyAddress}</span>
                            </div>
                          </button>
                        </TableCell>
                        
                        <TableCell>{formatDocumentType(document.type)}</TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {formatDate(document.issueDate)}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          {document.expiryDate ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(document.expiryDate)}</span>
                              {daysUntilExpiry !== null && (
                                <span className={`text-xs ${
                                  daysUntilExpiry < 0 ? 'text-red-600' : 
                                  daysUntilExpiry < 30 ? 'text-orange-600' : 
                                  'text-muted-foreground'
                                }`}>
                                  ({daysUntilExpiry < 0 ? 'Expired' : `${daysUntilExpiry} days`})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">No expiry</span>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <Badge className={getStatusColor(document.status)}>
                            {document.status.replace('-', ' ')}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <a href={document.url} target="_blank" rel="noopener noreferrer" download>
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => property && onManageDocuments(property)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </>
      )}
    </div>
  );
}