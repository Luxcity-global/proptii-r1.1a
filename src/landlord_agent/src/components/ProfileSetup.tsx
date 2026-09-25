import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Upload, User, Building, Mail, Phone, X, Loader2 } from 'lucide-react';
import { UserRole, UserProfile } from '../App';
import { uploadToFirebaseStorage } from '../../../services/storageService';

interface ProfileSetupProps {
  role: UserRole;
  onProfileComplete: (profile: UserProfile) => void;
  onSkip: () => void;
}

export function ProfileSetup({ role, onProfileComplete, onSkip }: ProfileSetupProps) {
  const [formData, setFormData] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    logo: ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate size (max 2 MB)
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Logo must be under 2 MB.');
      return;
    }
    setLogoError(null);
    setLogoFile(file);
    setIsUploadingLogo(true);

    try {
      const result = await uploadToFirebaseStorage(file, 'profile-logos');
      if (result.success && result.url) {
        setFormData(prev => ({ ...prev, logo: result.url! }));
      } else {
        setLogoError(result.error || 'Upload failed. Please try again.');
        // Fall back to blob URL for preview only
        setFormData(prev => ({ ...prev, logo: URL.createObjectURL(file) }));
      }
    } catch {
      setLogoError('Upload failed. Please try again.');
      setFormData(prev => ({ ...prev, logo: URL.createObjectURL(file) }));
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setFormData(prev => ({ ...prev, logo: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (role === 'agent' && !formData.companyName?.trim()) {
      newErrors.companyName = 'Company name is required for agents';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onProfileComplete(formData);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto w-full">
        <div className="text-center mb-8">
          <h1 className="mb-4">Set up your profile</h1>
          <p className="text-muted-foreground">
            {role === 'landlord' 
              ? 'Tell us a bit about yourself to personalize your experience'
              : 'Set up your company profile to get started'
            }
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {role === 'agent' && (
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-muted rounded-xl flex items-center justify-center overflow-hidden">
                    {formData.logo ? (
                      <img 
                        src={formData.logo} 
                        alt="Company logo" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  {formData.logo ? (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                      onClick={removeLogo}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute -bottom-2 -right-2 rounded-full p-2"
                      disabled={isUploadingLogo}
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      {isUploadingLogo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    </Button>
                  )}
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">Company Logo (Optional)</p>
                {logoError && <p className="text-sm text-destructive mt-1">{logoError}</p>}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {role === 'landlord' ? 'Full Name' : 'Contact Name'} *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    className="pl-10"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone"
                    className="pl-10"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
              </div>

              {role === 'agent' && (
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name *</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="company"
                      type="text"
                      placeholder="Enter company name"
                      className="pl-10"
                      value={formData.companyName || ''}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                    />
                  </div>
                  {errors.companyName && <p className="text-sm text-destructive">{errors.companyName}</p>}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={onSkip}
              >
                Skip for now
              </Button>
              <Button type="submit">
                Continue
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}