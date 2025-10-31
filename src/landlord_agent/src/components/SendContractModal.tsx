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
  Send
} from 'lucide-react';

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);

  // Use real tenant data passed as prop, with fallback to empty array
  const existingTenants = tenants.length > 0 ? tenants.map(t => ({
    id: t.id,
    name: t.name,
    email: t.email,
    property: t.propertyId || ''
  })) : [];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, file: 'Please select a PDF or Word document' }));
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, file: 'File size must be less than 10MB' }));
        return;
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
      setErrors(prev => ({ ...prev, recipientName: '', recipientEmail: '' }));
    } else {
      setSelectedExistingTenant('');
    }
  };

  const handleExistingTenantSelect = (tenantId: string) => {
    const tenant = existingTenants.find(t => t.id === tenantId);
    if (tenant) {
      setSelectedExistingTenant(tenantId);
      setRecipientName(tenant.name);
      setRecipientEmail(tenant.email);
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

    try {
      const contractData = {
        file: selectedFile || undefined,
        recipientName: recipientType === 'manual' ? recipientName : existingTenants.find(t => t.id === selectedExistingTenant)?.name || '',
        recipientEmail: recipientType === 'manual' ? recipientEmail : existingTenants.find(t => t.id === selectedExistingTenant)?.email || '',
        additionalEmail: additionalEmail.trim() || undefined
      };

      onSend(contractData);
      
      // Reset form
      setSelectedFile(null);
      setRecipientName('');
      setRecipientEmail('');
      setAdditionalEmail('');
      setRecipientType('manual');
      setSelectedExistingTenant('');
      setErrors({});
    } catch (error) {
      console.error('Error sending contract:', error);
    } finally {
      setIsUploading(false);
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
                  <div className="space-y-2">
                    <Label>Select Existing Tenant</Label>
                    <Select value={selectedExistingTenant} onValueChange={handleExistingTenantSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a tenant" />
                      </SelectTrigger>
                      <SelectContent>
                        {existingTenants.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{tenant.name}</span>
                              <span className="text-sm text-gray-600">{tenant.property}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'Archivo, sans-serif' }}>
                        Drag and drop your contract file here, or click to browse
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
        <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200 flex-shrink-0">
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
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Contract
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
