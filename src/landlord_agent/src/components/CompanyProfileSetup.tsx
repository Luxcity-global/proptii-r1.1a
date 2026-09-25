import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { 
  Building2, 
  Upload, 
  Phone, 
  Mail, 
  MapPin,
  Globe,
  ArrowLeft,
  Save,
  Loader2
} from 'lucide-react';
import { uploadToFirebaseStorage } from '../../../services/storageService';
import apiService from '../../../services/api';

interface CompanyProfile {
  companyName: string;
  companyDescription?: string;
  website?: string;
  officeAddress?: string;
  officePhone?: string;
  officeEmail?: string;
  logo?: string;
  brandColor?: string;
  vatNumber?: string;
  registrationNumber?: string;
}

interface CompanyProfileSetupProps {
  onCompanyProfileComplete: (profile: CompanyProfile) => void;
  onBack: () => void;
  initialProfile?: Partial<CompanyProfile>;
}

export function CompanyProfileSetup({ 
  onCompanyProfileComplete, 
  onBack,
  initialProfile
}: CompanyProfileSetupProps) {
  const [profile, setProfile] = useState<CompanyProfile>({
    companyName: initialProfile?.companyName || '',
    companyDescription: initialProfile?.companyDescription || '',
    website: initialProfile?.website || '',
    officeAddress: initialProfile?.officeAddress || '',
    officePhone: initialProfile?.officePhone || '',
    officeEmail: initialProfile?.officeEmail || '',
    logo: initialProfile?.logo || '',
    brandColor: initialProfile?.brandColor || '#DC5F12',
    vatNumber: initialProfile?.vatNumber || '',
    registrationNumber: initialProfile?.registrationNumber || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  const handleInputChange = (field: keyof CompanyProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!profile.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (profile.officeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.officeEmail)) {
      newErrors.officeEmail = 'Please enter a valid email address';
    }

    if (profile.website && !/^https?:\/\/.+/.test(profile.website)) {
      newErrors.website = 'Please enter a valid website URL (starting with http:// or https://)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      // Persist company profile to backend
      await apiService.put('/user/company-profile', profile);
    } catch (err) {
      // Non-fatal: profile is still passed up to parent (stored in app state)
      console.warn('[CompanyProfileSetup] Could not persist to backend:', err);
    } finally {
      setIsSaving(false);
    }
    onCompanyProfileComplete(profile);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate: images only, max 2 MB
    if (!file.type.startsWith('image/')) {
      setLogoError('Please select an image file (JPG, PNG, SVG, etc.).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Logo must be under 2 MB.');
      return;
    }
    setLogoError(null);
    setIsUploadingLogo(true);

    try {
      const result = await uploadToFirebaseStorage(file, 'company-logos');
      if (result.success && result.url) {
        setProfile(prev => ({ ...prev, logo: result.url! }));
      } else {
        setLogoError(result.error || 'Upload failed. Please try again.');
        // Show a local preview while upload failed
        const localUrl = URL.createObjectURL(file);
        setProfile(prev => ({ ...prev, logo: localUrl }));
      }
    } catch {
      setLogoError('Upload failed. Please try again.');
      const localUrl = URL.createObjectURL(file);
      setProfile(prev => ({ ...prev, logo: localUrl }));
    } finally {
      setIsUploadingLogo(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={onBack} className="mr-4 p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="mb-2">Company Profile Setup</h1>
            <p className="text-muted-foreground">
              Complete your company information to personalize your property management system
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Company Information
            </CardTitle>
            <CardDescription>
              This information will be used in reports, documents, and communication with tenants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Company Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={profile.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="Your Company Name"
                    className={errors.companyName ? 'border-destructive' : ''}
                  />
                  {errors.companyName && (
                    <p className="text-sm text-destructive mt-1">{errors.companyName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="companyDescription">Company Description</Label>
                  <Textarea
                    id="companyDescription"
                    value={profile.companyDescription}
                    onChange={(e) => handleInputChange('companyDescription', e.target.value)}
                    placeholder="Brief description of your company and services"
                    rows={3}
                  />
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Information
                </h3>
                
                <div>
                  <Label htmlFor="officeEmail">Office Email</Label>
                  <Input
                    id="officeEmail"
                    type="email"
                    value={profile.officeEmail}
                    onChange={(e) => handleInputChange('officeEmail', e.target.value)}
                    placeholder="office@yourcompany.com"
                    className={errors.officeEmail ? 'border-destructive' : ''}
                  />
                  {errors.officeEmail && (
                    <p className="text-sm text-destructive mt-1">{errors.officeEmail}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="officePhone">Office Phone</Label>
                  <Input
                    id="officePhone"
                    value={profile.officePhone}
                    onChange={(e) => handleInputChange('officePhone', e.target.value)}
                    placeholder="+44 20 1234 5678"
                  />
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={profile.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://www.yourcompany.com"
                    className={errors.website ? 'border-destructive' : ''}
                  />
                  {errors.website && (
                    <p className="text-sm text-destructive mt-1">{errors.website}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="officeAddress">Office Address</Label>
                  <Textarea
                    id="officeAddress"
                    value={profile.officeAddress}
                    onChange={(e) => handleInputChange('officeAddress', e.target.value)}
                    placeholder="123 Business Street, London, SW1A 1AA"
                    rows={2}
                  />
                </div>
              </div>

              <Separator />

              {/* Branding */}
              <div className="space-y-4">
                <h3>Branding</h3>
                
                <div>
                  <Label htmlFor="logo">Company Logo</Label>
                  <div className="mt-2">
                    <div className="flex items-center space-x-4">
                      {profile.logo && (
                        <img 
                          src={profile.logo} 
                          alt="Company logo" 
                          className="h-16 w-16 object-contain rounded-lg border"
                        />
                      )}
                      <div>
                        <input
                          type="file"
                          id="logo"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          disabled={isUploadingLogo}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isUploadingLogo}
                          onClick={() => document.getElementById('logo')?.click()}
                        >
                          {isUploadingLogo
                            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading…</>
                            : <><Upload className="h-4 w-4 mr-2" />Upload Logo</>}
                        </Button>
                        <p className="text-sm text-muted-foreground mt-1">
                          PNG, JPG, SVG — max 2 MB
                        </p>
                        {logoError && <p className="text-sm text-destructive mt-1">{logoError}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="brandColor">Brand Color</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <input
                      type="color"
                      id="brandColor"
                      value={profile.brandColor}
                      onChange={(e) => handleInputChange('brandColor', e.target.value)}
                      className="h-10 w-20 rounded border cursor-pointer"
                    />
                    <Input
                      value={profile.brandColor}
                      onChange={(e) => handleInputChange('brandColor', e.target.value)}
                      placeholder="#DC5F12"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Legal Information */}
              <div className="space-y-4">
                <h3>Legal Information (Optional)</h3>
                
                <div>
                  <Label htmlFor="registrationNumber">Company Registration Number</Label>
                  <Input
                    id="registrationNumber"
                    value={profile.registrationNumber}
                    onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                    placeholder="12345678"
                  />
                </div>

                <div>
                  <Label htmlFor="vatNumber">VAT Number</Label>
                  <Input
                    id="vatNumber"
                    value={profile.vatNumber}
                    onChange={(e) => handleInputChange('vatNumber', e.target.value)}
                    placeholder="GB123456789"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Button type="button" variant="outline" onClick={onBack}>
                  Back
                </Button>
                <Button type="submit" disabled={isSaving || isUploadingLogo}>
                  {isSaving
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
                    : <><Save className="h-4 w-4 mr-2" />Save Company Profile</>}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}