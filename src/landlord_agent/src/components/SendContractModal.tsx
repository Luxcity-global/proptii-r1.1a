import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  Upload, 
  X, 
  FileText, 
  User, 
  Mail, 
  AlertCircle,
  Send,
  Search,
  CheckCircle
} from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { trackEvent } from '../../../utils/analytics';

interface SendContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (contractData: {
    file?: File;
    recipientName: string;
    recipientEmail: string;
    additionalEmail?: string;
  }) => void;
  tenants?: Array<{ id: string; name: string; email: string; propertyId?: string }>;
}

export function SendContractModal({ isOpen, onClose, onSend, tenants = [] }: SendContractModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [additionalEmail, setAdditionalEmail] = useState('');
  const [recipientType, setRecipientType] = useState<'manual' | 'existing'>('manual');
  const [selectedExistingTenant, setSelectedExistingTenant] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showTenantList, setShowTenantList] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isConverting, setIsConverting] = useState(false);

  // Use real tenant data passed as prop, with fallback to empty array
  const existingTenants = tenants.length > 0 ? tenants.map(t => ({
    id: t.id,
    name: t.name,
    email: t.email,
    property: t.propertyId || ''
  })) : [];

  // Filter tenants based on search term
  const filteredTenants = existingTenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.property.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, file: 'Please select a PDF or Word document' }));
        return;
      }
      
      // Validate file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        setErrors(prev => ({ ...prev, file: `File size must be less than 50MB. Your file is ${fileSizeMB}MB` }));
        return;
      }
      
      // Warn about large files that might take longer to process
      if (file.size > 20 * 1024 * 1024) {
        console.warn('Large file detected:', file.size, 'bytes. This may take longer to process.');
      }

      setSelectedFile(file);
      setErrors(prev => ({ ...prev, file: '' }));
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setErrors(prev => ({ ...prev, file: '' }));
  };

  const handleRecipientTypeChange = (type: 'manual' | 'existing') => {
    setRecipientType(type);
    if (type === 'existing') {
      setRecipientName('');
      setRecipientEmail('');
      setShowTenantList(true); // Show list when switching to existing tenant mode
      setErrors(prev => ({ ...prev, recipientName: '', recipientEmail: '' }));
    } else {
      setSelectedExistingTenant('');
      setSearchTerm('');
      setShowTenantList(true);
    }
  };

  const handleExistingTenantSelect = (tenantId: string) => {
    const tenant = existingTenants.find(t => t.id === tenantId);
    if (tenant) {
      setSelectedExistingTenant(tenantId);
      setRecipientName(tenant.name);
      setRecipientEmail(tenant.email);
      setShowTenantList(false); // Close the list when tenant is selected
      setErrors(prev => ({ ...prev, recipientName: '', recipientEmail: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // File is optional for testing email functionality

    if (recipientType === 'manual') {
      if (!recipientName.trim()) {
        newErrors.recipientName = 'Please enter recipient name';
      }
      if (!recipientEmail.trim()) {
        newErrors.recipientEmail = 'Please enter recipient email';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
        newErrors.recipientEmail = 'Please enter a valid email address';
      }
    } else {
      if (!selectedExistingTenant) {
        newErrors.existingTenant = 'Please select an existing tenant';
      }
    }

    // No validation needed for additional notes

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSend = async () => {
    if (!validateForm()) return;

    setIsUploading(true);
    setUploadProgress(0);
    setIsConverting(false);

    try {
      const contractData = {
        file: selectedFile || undefined,
        recipientName: recipientType === 'manual' ? recipientName : existingTenants.find(t => t.id === selectedExistingTenant)?.name || '',
        recipientEmail: recipientType === 'manual' ? recipientEmail : existingTenants.find(t => t.id === selectedExistingTenant)?.email || '',
        additionalEmail: additionalEmail.trim() || undefined
      };

      // If there's a file, show conversion progress
      if (selectedFile) {
        setIsConverting(true);
        setUploadProgress(5);
        
        // Simulate progress during file processing
        // Note: Actual progress is tracked in ContractsPage during conversion
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90; // Keep at 90% until actual upload completes
            }
            return prev + 5;
          });
        }, 200);
        
        // Clear interval after a delay to prevent memory leaks
        setTimeout(() => clearInterval(progressInterval), 10000);
      }

      onSend(contractData);
      trackEvent('landlord_contract_sent', { has_file: !!selectedFile });
      
      // Reset form
      setSelectedFile(null);
      setRecipientName('');
      setRecipientEmail('');
      setAdditionalEmail('');
      setRecipientType('manual');
      setSelectedExistingTenant('');
      setSearchTerm('');
      setShowTenantList(true);
      setErrors({});
      setUploadProgress(0);
      setIsConverting(false);
    } catch (error) {
      console.error('Error sending contract:', error);
      setErrors(prev => ({ ...prev, file: 'Failed to send contract. Please try again.' }));
    } finally {
      setIsUploading(false);
      setIsConverting(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      onClose();
      // Reset form
      setSelectedFile(null);
      setRecipientName('');
      setRecipientEmail('');
      setAdditionalEmail('');
      setRecipientType('manual');
      setSelectedExistingTenant('');
      setSearchTerm('');
      setShowTenantList(true);
      setErrors({});
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-[800px] w-[calc(100vw-2rem)] max-h-[80vh] flex flex-col p-0 gap-0"
        style={{
          fontFamily: 'Archivo, sans-serif',
          top: '80%',
          left: '60%',
          transform: 'translate(-50%, -50%)',
          marginTop: '3rem'
        }}
      >
        {/* Header - Fixed */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200 flex-shrink-0">
          <DialogTitle className="flex items-center space-x-2 text-xl" style={{ fontFamily: 'Archivo, sans-serif' }}>
            <FileText className="w-5 h-5" style={{ color: '#DC5F12' }} />
            <span>Send Contract</span>
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {/* Recipient Selection */}
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Recipient</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Recipient Type</Label>
                  <Select value={recipientType} onValueChange={handleRecipientTypeChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual Entry</SelectItem>
                      <SelectItem value="existing">Select Existing Tenant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {recipientType === 'manual' ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="recipient-name">Recipient Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <Input
                          id="recipient-name"
                          placeholder="Enter recipient name"
                          value={recipientName}
                          onChange={(e) => {
                            setRecipientName(e.target.value);
                            setErrors(prev => ({ ...prev, recipientName: '' }));
                          }}
                          className="pl-10"
                        />
                      </div>
                      {errors.recipientName && (
                        <div className="flex items-center space-x-2 text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.recipientName}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recipient-email">Recipient Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <Input
                          id="recipient-email"
                          type="email"
                          placeholder="Enter recipient email"
                          value={recipientEmail}
                          onChange={(e) => {
                            setRecipientEmail(e.target.value);
                            setErrors(prev => ({ ...prev, recipientEmail: '' }));
                          }}
                          className="pl-10"
                        />
                      </div>
                      {errors.recipientEmail && (
                        <div className="flex items-center space-x-2 text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.recipientEmail}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {!selectedExistingTenant || showTenantList ? (
                      <>
                        <div className="space-y-2">
                          <Label>Search Tenants</Label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              placeholder="Search by name, email, or property..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-10 focus:border-[#4E97CC] focus:ring-2 focus:ring-[#8FCDFF] focus:ring-opacity-50 focus:outline-none"
                            />
                          </div>
                        </div>

                        {filteredTenants.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p>No tenants found</p>
                            {searchTerm && (
                              <p className="text-sm mt-2">Try adjusting your search</p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-[300px] overflow-y-auto max-w-md">
                            {filteredTenants.map((tenant) => (
                              <Card
                                key={tenant.id}
                                className={`cursor-pointer transition-all duration-200 ${
                                  selectedExistingTenant === tenant.id
                                    ? 'ring-2 shadow-lg'
                                    : 'hover:shadow-md'
                                }`}
                                style={selectedExistingTenant === tenant.id ? {
                                  borderColor: '#136C9E',
                                  boxShadow: '0 0 0 2px #136C9E'
                                } : {}}
                                onClick={() => handleExistingTenantSelect(tenant.id)}
                              >
                                <CardContent className="p-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                                      <Avatar className="h-10 w-10 flex-shrink-0">
                                        <AvatarFallback className="bg-blue-100 text-blue-600">
                                          {tenant.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-sm mb-1" style={{ color: '#374957' }}>
                                          {tenant.name}
                                        </h3>
                                        <p className="text-gray-600 text-xs truncate" title={tenant.email}>
                                          {tenant.email}
                                        </p>
                                        {tenant.property && (
                                          <p className="text-gray-500 text-xs mt-1 truncate" title={tenant.property}>
                                            {tenant.property}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2 flex-shrink-0">
                                      {selectedExistingTenant === tenant.id && (
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#136C9E' }}>
                                          <CheckCircle className="w-4 h-4 text-white" />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="space-y-2 max-w-md">
                        <Label>Selected Tenant</Label>
                        {(() => {
                          const selectedTenant = existingTenants.find(t => t.id === selectedExistingTenant);
                          return selectedTenant ? (
                            <Card className="ring-2" style={{ borderColor: '#136C9E', boxShadow: '0 0 0 2px #136C9E' }}>
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                                    <Avatar className="h-10 w-10 flex-shrink-0">
                                      <AvatarFallback className="bg-blue-100 text-blue-600">
                                        {selectedTenant.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <h3 className="font-semibold text-sm mb-1" style={{ color: '#374957' }}>
                                        {selectedTenant.name}
                                      </h3>
                                      <p className="text-gray-600 text-xs truncate" title={selectedTenant.email}>
                                        {selectedTenant.email}
                                      </p>
                                      {selectedTenant.property && (
                                        <p className="text-gray-500 text-xs mt-1 truncate" title={selectedTenant.property}>
                                          {selectedTenant.property}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedExistingTenant('');
                                      setRecipientName('');
                                      setRecipientEmail('');
                                      setShowTenantList(true);
                                    }}
                                    className="flex-shrink-0"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ) : null;
                        })()}
                      </div>
                    )}

                    {errors.existingTenant && (
                      <div className="flex items-center space-x-2 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.existingTenant}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* File Upload Section */}
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold" style={{ fontFamily: 'Archivo, sans-serif' }}>
                  Contract File (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedFile ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileSelect}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer block">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium mb-2" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>
                        Upload Contract File
                      </p>
                      <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'Archivo, sans-serif' }}>
                        Drag and drop your contract file here, or click to browse
                      </p>
                      <p className="text-xs text-gray-500 mb-4" style={{ fontFamily: 'Archivo, sans-serif' }}>
                        Maximum file size: 50MB (PDF, DOC, DOCX)
                      </p>
                      <Button type="button" variant="outline">
                        Choose File
                      </Button>
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <FileText className="w-8 h-8 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate" style={{ color: '#374957' }}>
                          {selectedFile.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          {selectedFile.size > 20 * 1024 * 1024 && (
                            <span className="text-orange-600 ml-2">(Large file - may take longer)</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      disabled={isUploading}
                      className="flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {errors.file && (
                  <div className="flex items-center space-x-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.file}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Notes Section */}
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Additional Notes (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="additional-notes">Additional Notes</Label>
                  <Textarea
                    id="additional-notes"
                    placeholder="Enter any additional notes or information (optional)"
                    value={additionalEmail}
                    onChange={(e) => {
                      setAdditionalEmail(e.target.value);
                      setErrors(prev => ({ ...prev, additionalEmail: '' }));
                    }}
                    className="min-h-[100px]"
                    rows={4}
                  />
                  {errors.additionalEmail && (
                    <div className="flex items-center space-x-2 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.additionalEmail}</span>
                    </div>
                  )}
                  <p className="text-sm text-gray-500" style={{ fontFamily: 'Archivo, sans-serif' }}>
                    Add any additional information or notes about this contract
                  </p>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0">
          {isUploading && uploadProgress > 0 && (
            <div className="mb-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1 text-center">
                {isConverting ? 'Processing file...' : 'Uploading...'} {uploadProgress}%
              </p>
            </div>
          )}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSend}
              disabled={isUploading}
              style={{ backgroundColor: '#DC5F12' }}
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {isConverting ? 'Processing file...' : 'Sending...'}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Contract
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
