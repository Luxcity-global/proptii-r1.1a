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
  Building2,
  AlertCircle,
  CheckCircle,
  Send
} from 'lucide-react';

interface SendContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (contractData: {
    file: File;
    recipientName: string;
    recipientEmail: string;
    additionalInfo?: string;
  }) => void;
}

export function SendContractModal({ isOpen, onClose, onSend }: SendContractModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [recipientType, setRecipientType] = useState<'manual' | 'existing'>('manual');
  const [selectedExistingTenant, setSelectedExistingTenant] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);

  // Mock existing tenants for selection
  const existingTenants = [
    { id: '1', name: 'Sarah Johnson', email: 'sarah.johnson@email.com', property: '123 Regent Street, London W1B 4EA' },
    { id: '2', name: 'Michael Chen', email: 'michael.chen@email.com', property: '45 Victoria Park Road, London E9 7JN' },
    { id: '3', name: 'Emma Watson', email: 'emma.watson@email.com', property: '78 Oak Gardens, London SW4 9AL' },
    { id: '4', name: 'David Rodriguez', email: 'david.rodriguez@email.com', property: '92 Maple Court, London N1 5QT' }
  ];

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

    if (!selectedFile) {
      newErrors.file = 'Please select a contract file';
    }

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSend = async () => {
    if (!validateForm()) return;

    setIsUploading(true);

    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const contractData = {
        file: selectedFile!,
        recipientName: recipientType === 'manual' ? recipientName : existingTenants.find(t => t.id === selectedExistingTenant)?.name || '',
        recipientEmail: recipientType === 'manual' ? recipientEmail : existingTenants.find(t => t.id === selectedExistingTenant)?.email || '',
        additionalInfo: additionalInfo.trim() || undefined
      };

      onSend(contractData);
      
      // Reset form
      setSelectedFile(null);
      setRecipientName('');
      setRecipientEmail('');
      setAdditionalInfo('');
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
      setAdditionalInfo('');
      setRecipientType('manual');
      setSelectedExistingTenant('');
      setErrors({});
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto mx-auto mt-20">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2" style={{ fontFamily: 'Archivo, sans-serif' }}>
            <FileText className="w-5 h-5" style={{ color: '#DC5F12' }} />
            <span>Send Contract</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg" style={{ fontFamily: 'Archivo, sans-serif' }}>Contract File</CardTitle>
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
                  <label htmlFor="file-upload" className="cursor-pointer">
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
                  <div className="flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="font-medium" style={{ color: '#374957' }}>
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

          {/* Recipient Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recipient</CardTitle>
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
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
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

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Information (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add any additional notes or instructions for the recipient..."
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
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
              disabled={isUploading || !selectedFile}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
