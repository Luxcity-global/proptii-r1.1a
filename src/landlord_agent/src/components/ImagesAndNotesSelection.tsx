import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ArrowLeft, Upload, Image as ImageIcon, X, Info, ChevronDown, ChevronUp, Lightbulb, CheckCircle, AlertCircle, Home, Sun, Trash2, Target } from 'lucide-react';
import { ProgressTracker } from './ProgressTracker';

interface ImagesAndNotesSelectionProps {
  uploadedImages?: string[];
  additionalNotes?: string;
  onImagesChange?: (images: string[], imageFiles: File[]) => void;
  onNotesChange?: (notes: string) => void;
  onNext: () => void;
  onBack: () => void;
  onHome: () => void;
  onPropertySetup: () => void;
}

export function ImagesAndNotesSelection({ uploadedImages: propUploadedImages, additionalNotes: propAdditionalNotes, onImagesChange, onNotesChange, onNext, onBack, onHome, onPropertySetup }: ImagesAndNotesSelectionProps) {
  const [uploadedImages, setUploadedImages] = useState<string[]>(propUploadedImages || []);
  const [imageFiles, setImageFiles] = useState<File[]>([]); // Store File objects
  const [additionalNotes, setAdditionalNotes] = useState(propAdditionalNotes || '');
  
  // Update local state when props change
  useEffect(() => {
    if (propUploadedImages) {
      setUploadedImages(propUploadedImages);
    }
    if (propAdditionalNotes !== undefined) {
      setAdditionalNotes(propAdditionalNotes);
    }
  }, [propUploadedImages, propAdditionalNotes]);
  const [showTips, setShowTips] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [imageAnalysis, setImageAnalysis] = useState<{[key: number]: string}>({});
  
  // Progress tracker steps
  const progressSteps = [
    { id: 'type', title: 'Property Type', completed: true, active: false },
    { id: 'details', title: 'Property Details', completed: true, active: false },
    { id: 'amenities', title: 'Amenities', completed: true, active: false },
    { id: 'images', title: 'Images & Notes', completed: false, active: true },
    { id: 'preview', title: 'Preview & Publish', completed: false, active: false }
  ];

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      const newImages = fileArray.map(file => URL.createObjectURL(file as Blob));
      const updatedImages = [...uploadedImages, ...newImages];
      const updatedFiles = [...imageFiles, ...fileArray];
      setUploadedImages(updatedImages);
      setImageFiles(updatedFiles);
      
      // Notify parent component with both blob URLs and File objects
      if (onImagesChange) {
        onImagesChange(updatedImages, updatedFiles);
      }
      
      // Analyze new images for supportive nudges
      analyzeImages(newImages, uploadedImages.length);
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = uploadedImages.filter((_, i) => i !== index);
    const updatedFiles = imageFiles.filter((_, i) => i !== index);
    setUploadedImages(updatedImages);
    setImageFiles(updatedFiles);
    
    // Notify parent component
    if (onImagesChange) {
      onImagesChange(updatedImages, updatedFiles);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const newImages = files.map(file => URL.createObjectURL(file as Blob));
    const updatedImages = [...uploadedImages, ...newImages];
    const updatedFiles = [...imageFiles, ...files];
    setUploadedImages(updatedImages);
    setImageFiles(updatedFiles);
    
    // Notify parent component
    if (onImagesChange) {
      onImagesChange(updatedImages, updatedFiles);
    }
    
    // Analyze new images for supportive nudges
    analyzeImages(newImages, uploadedImages.length);
  };

  // First-time onboarding check
  useEffect(() => {
    const hasSeenOnboardingBefore = localStorage.getItem('hasSeenImageUploadOnboarding');
    if (!hasSeenOnboardingBefore) {
      setShowOnboarding(true);
    }
  }, []);

  const analyzeImages = (newImages: string[], currentCount: number) => {
    const analysis: {[key: number]: string} = {};
    
    newImages.forEach((image, index) => {
      const img = new Image();
      img.onload = () => {
        const isVertical = img.height > img.width;
        const isDark = getImageBrightness(img) < 0.3;
        
        if (isVertical) {
          analysis[currentCount + index] = "Landscape photos display better in listings.";
        }
        if (isDark) {
          analysis[currentCount + index] = "Try uploading brighter images — well-lit photos attract more tenants.";
        }
        
        setImageAnalysis(prev => ({...prev, ...analysis}));
      };
      img.src = image;
    });
  };

  const getImageBrightness = (img: HTMLImageElement): number => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0.5;
    
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let brightness = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    
    return brightness / (data.length / 4) / 255;
  };

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    setHasSeenOnboarding(true);
    localStorage.setItem('hasSeenImageUploadOnboarding', 'true');
  };

  return (
    <div className="min-h-screen flex flex-col px-4" style={{ backgroundColor: '#F7F7F7', fontFamily: 'Archivo, sans-serif' }}>
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
        {/* Main Content Area */}
        <div className="flex-1 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-12 px-4">
            <div className="flex items-center space-x-4">
              <img 
                src="/images/proptii-logo.png" 
                alt="Proptii Logo" 
                className="h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity"
                onClick={onHome}
              />
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="rounded-full px-4 py-2">
                Questions?
              </Button>
              <Button variant="outline" className="rounded-full px-4 py-2">
                Save & exit
              </Button>
              <Button 
                variant="outline"
                onClick={onPropertySetup}
                className="rounded-full px-4 py-2 transition-all duration-300"
                style={{ 
                  borderColor: '#DC5F12',
                  color: '#DC5F12'
                }}
              >
                Property Setup
              </Button>
            </div>
          </div>

          {/* Horizontal Progress Tracker */}
          <div className="mb-6 w-full" style={{ marginTop: '80px' }}>
            <ProgressTracker 
              steps={progressSteps}
              currentStep={4}
              totalSteps={5}
            />
          </div>

          {/* Images and Notes Section Header */}
          <div className="text-left mb-8 px-4 py-6" style={{ 
            backgroundImage: 'url("./add_prp_slide/property_iamges background.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            border: '4px solid white',
            borderRadius: '20px'
          }}>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#374957' }}>Images and Additional Notes</h2>
            <p style={{ color: '#374957' }}>Add photos and any additional information about your property</p>
          </div>

          {/* Main Content */}
          <div className="max-w-6xl mx-auto">
            
            <div className="space-y-8">
            {/* Image Upload Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Photos</h3>
              
              {/* Always-Visible Essentials Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#136C9E' }} />
                  <div className="text-sm">
                    <p className="font-medium mb-1" style={{ color: '#136C9E' }}>Photo Requirements</p>
                      <ul className="space-y-1" style={{ color: '#374957' }}>
                        <li>• Minimum 4 images recommended</li>
                        <li>• File types: JPG/PNG/HEIC</li>
                        <li>• Max size: 10MB per photo</li>
                      </ul>
                  </div>
                </div>
              </div>

              {/* First-time Onboarding Tooltip */}
              {showOnboarding && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 relative">
                  <div className="flex items-start space-x-3">
                    <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-yellow-900 mb-2">3 quick tips for great photos</p>
                      <ul className="text-yellow-800 text-sm space-y-1 mb-3">
                        <li>• 📸 Start with the exterior/front of the property</li>
                        <li>• 🌞 Take photos in daylight for best clarity</li>
                        <li>• 🛋️ Declutter rooms before taking photos</li>
                      </ul>
                      <div className="flex items-center space-x-3">
                        <Button 
                          size="sm" 
                          onClick={dismissOnboarding}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                          Got it!
                        </Button>
                        <button 
                          onClick={() => setShowTips(true)}
                          className="text-yellow-700 text-sm underline hover:text-yellow-800"
                        >
                          See more tips
                        </button>
                      </div>
                    </div>
                    <button 
                      onClick={dismissOnboarding}
                      className="text-yellow-600 hover:text-yellow-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Upload Area */}
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById('image-upload')?.click()}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">Upload property photos</p>
                <p className="text-gray-500 mb-4">Drag and drop images here, or click to browse</p>
                <Button type="button" variant="outline" className="rounded-full">
                  Choose Files
                </Button>
                <input
                  id="image-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Supportive Nudges */}
              {uploadedImages.length > 0 && uploadedImages.length < 4 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-sm text-green-800">
                      Properties with 4+ photos usually get more enquiries. Consider adding a few more?
                    </p>
                  </div>
                </div>
              )}

              {/* Uploaded Images Grid */}
              {uploadedImages.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Uploaded Images ({uploadedImages.length})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Property ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(index);
                          }}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {/* In-the-moment nudges for individual images */}
                        {imageAnalysis[index] && (
                          <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-sm rounded p-2">
                            <div className="flex items-center space-x-1">
                              <AlertCircle className="w-3 h-3 text-white" />
                              <p className="text-xs text-white">{imageAnalysis[index]}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gentle Photo Tips Section */}
              <div className="mt-6">
                <button
                  onClick={() => setShowTips(!showTips)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <Lightbulb className="w-4 h-4" />
                  <span className="text-sm font-medium">Photo Tips</span>
                  {showTips ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {showTips && (
                  <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Home className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">Start with the exterior</p>
                          <p className="text-gray-600 text-xs">First photo should be the exterior/front of the property</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <Sun className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">Natural lighting</p>
                          <p className="text-gray-600 text-xs">Take photos in daylight for clarity</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <Trash2 className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">Declutter first</p>
                          <p className="text-gray-600 text-xs">Declutter rooms before taking photos</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Target className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">Capture key areas</p>
                          <p className="text-gray-600 text-xs">Capture different angles & key rooms</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Notes Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h3>
              <Textarea
                placeholder="Add any additional information about your property (optional)..."
                value={additionalNotes}
                onChange={(e) => {
                  const newNotes = e.target.value;
                  setAdditionalNotes(newNotes);
                  
                  // Notify parent component
                  if (onNotesChange) {
                    onNotesChange(newNotes);
                  }
                }}
                className="min-h-32 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                style={{ '--tw-ring-color': '#DDE4FF' } as React.CSSProperties & { '--tw-ring-color': string }}
              />
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Fixed to Bottom */}
      <div className="max-w-6xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between" style={{ minHeight: '60px' }}>
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            style={{ height: '48px', minHeight: '48px' }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Review Amenities</span>
          </Button>

          <Button 
            onClick={() => {
              console.log('Save and Preview Property button clicked');
              onNext();
            }}
            className="px-6 py-3 rounded-full text-white transition-all duration-300"
            style={{ 
              backgroundColor: '#DC5F12',
              background: 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              height: '48px',
              minHeight: '48px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #FF6B1A 0%, #DC5F12 100%)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(220, 95, 18, 0.4), 0 6px 12px rgba(0, 0, 0, 0.15)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.transform = 'translateY(0px)';
            }}
          >
            Save and Preview Property
          </Button>
        </div>
      </div>
    </div>
  );
}
