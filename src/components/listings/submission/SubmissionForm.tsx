import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Building2, Loader2, Eye, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ImageUpload from './ImageUpload';
import ListingPreview from './ListingPreview';
import { api } from '@/services/api';

// Form validation schema
const propertySchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  type: z.enum(['rent', 'sale'], { required_error: 'Please select a property type' }),
  price: z.number().min(1, 'Price must be greater than 0'),
  isAvailableNow: z.boolean(),
  propertyType: z.enum(['flat', 'house', 'studio'], { required_error: 'Please select a property type' }),
  bedrooms: z.number().min(0, 'Number of bedrooms must be 0 or greater'),
  bathrooms: z.number().min(0, 'Number of bathrooms must be 0 or greater'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  address: z.string().min(5, 'Please enter a valid address'),
  postcode: z.string().min(5, 'Please enter a valid postcode'),
  city: z.string().min(2, 'Please enter a valid city'),
  agentName: z.string().min(2, 'Please enter your name'),
  agentCompany: z.string().min(2, 'Please enter your company name'),
  contactEmail: z.string().email('Please enter a valid email'),
  contactPhone: z.string().min(10, 'Please enter a valid phone number'),
  images: z.array(z.any()).min(1, 'Please upload at least one image'),
});

export type PropertyFormData = z.infer<typeof propertySchema>;

const SubmissionForm: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  // Add state to store image previews
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    getValues,
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      type: 'rent',
      propertyType: 'flat',
      isAvailableNow: true,
      bedrooms: 1,
      bathrooms: 1,
      images: [],
    },
    mode: 'onChange',
  });

  const handleImagesChange = (newImages: File[]) => {
    setImages(newImages);
    setValue('images', newImages);
    
    // Generate and store preview URLs for the images
    const newPreviews: string[] = [];
    newImages.forEach(file => {
      const url = URL.createObjectURL(file);
      newPreviews.push(url);
    });
    setImagePreviews(newPreviews);
  };

  const onSubmit = async (data: PropertyFormData) => {
    setIsSubmitting(true);
    try {
      // Use our API service
      const response = await api.submitListing(data);
      
      // Redirect to success page
      navigate('/listings/success');
    } catch (error) {
      console.error('Error submitting form:', error);
      // In a real implementation, we would show an error message to the user
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePreview = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  const goToHome = () => {
    navigate('/Agent');
  };

  if (isPreviewMode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Preview Your Listing</h1>
            <button
              onClick={togglePreview}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              <span>Back to Form</span>
            </button>
          </div>
          
          {/* Pass the image previews to the ListingPreview component */}
          <ListingPreview data={getValues()} imagePreviews={imagePreviews} />
          
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting || !isValid}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Listing</span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header with navigation */}
      <header className="bg-white shadow-sm">
  <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
    {/* Left side: Back to Home */}
    <button
      onClick={goToHome}
      className="flex items-center px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
    >
      <img src="/images/Proptii-logo-icon.png" alt="Proptii Logo" className="h-6 w-6 mr-2" />
      <span>Back to Home</span>
    </button>

    {/* Right side: Property Listings title */}
    <div className="flex items-center">
      <Building2 className="h-6 w-6 text-primary mr-2" />
      <h1 className="text-xl font-bold text-gray-900">Property Listings</h1>
    </div>
  </div>
</header>

      {/* Form container with background design */}
      <div className="max-w-4xl mx-auto mt-8 px-4">
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          {/*<div className="bg-[#DC5F12] p-6 text-white">
            <h2 className="text-2xl font-bold">List Your Property</h2>
            <p className="mt-1 opacity-90">Fill in the details below to create your property listing</p>
  </div>*/}
          <div className="relative bg-cover bg-center h-32" style={{ backgroundImage: "url('/images/nav-image-01.jpg')" }}>
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      
      {/* Text content positioned on top of the overlay */}
      <div className="relative z-10 p-6 text-white">
        <h2 className="text-2xl font-bold">List Your Property</h2>
        <p className="mt-1">Fill in the details below to create your property listing</p>
      </div>
    </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
            {/* Basic Details Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <span className="bg-primary bg-opacity-10 text-primary p-1 rounded-md mr-2">1</span>
                Basic Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Title
                  </label>
                  <input
                    type="text"
                    {...register('title')}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., Modern 2 Bed Apartment in Swiss Cottage"
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Property Type
                    </label>
                    <select
                      {...register('type')}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="rent">For Rent</option>
                      <option value="sale">For Sale</option>
                    </select>
                    {errors.type && (
                      <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price {watch('type') === 'rent' ? '(per month)' : ''}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">£</span>
                      <input
                        type="number"
                        {...register('price', { valueAsNumber: true })}
                        className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Enter price"
                      />
                    </div>
                    {errors.price && (
                      <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register('isAvailableNow')}
                      className="rounded text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">Available Now</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Property Details Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <span className="bg-primary bg-opacity-10 text-primary p-1 rounded-md mr-2">2</span>
                Property Details
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Property Type
                    </label>
                    <select
                      {...register('propertyType')}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="flat">Flat</option>
                      <option value="house">House</option>
                      <option value="studio">Studio</option>
                    </select>
                    {errors.propertyType && (
                      <p className="text-red-500 text-sm mt-1">{errors.propertyType.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bedrooms
                    </label>
                    <input
                      type="number"
                      {...register('bedrooms', { valueAsNumber: true })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      min="0"
                    />
                    {errors.bedrooms && (
                      <p className="text-red-500 text-sm mt-1">{errors.bedrooms.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bathrooms
                    </label>
                    <input
                      type="number"
                      {...register('bathrooms', { valueAsNumber: true })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      min="0"
                    />
                    {errors.bathrooms && (
                      <p className="text-red-500 text-sm mt-1">{errors.bathrooms.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Describe your property..."
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <span className="bg-primary bg-opacity-10 text-primary p-1 rounded-md mr-2">3</span>
                Location
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    {...register('address')}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Street name and number"
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      {...register('city')}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                    <input
                      type="text"
                      {...register('postcode')}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    {errors.postcode && (
                      <p className="text-red-500 text-sm mt-1">{errors.postcode.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Agent Contact Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <span className="bg-primary bg-opacity-10 text-primary p-1 rounded-md mr-2">4</span>
                Agent Information
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                    <input
                      type="text"
                      {...register('agentName')}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    {errors.agentName && (
                      <p className="text-red-500 text-sm mt-1">{errors.agentName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input
                      type="text"
                      {...register('agentCompany')}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    {errors.agentCompany && (
                      <p className="text-red-500 text-sm mt-1">{errors.agentCompany.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                    <input
                      type="email"
                      {...register('contactEmail')}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    {errors.contactEmail && (
                      <p className="text-red-500 text-sm mt-1">{errors.contactEmail.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      {...register('contactPhone')}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    {errors.contactPhone && (
                      <p className="text-red-500 text-sm mt-1">{errors.contactPhone.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <span className="bg-primary bg-opacity-10 text-primary p-1 rounded-md mr-2">5</span>
                Property Photos
              </h2>
              <p className="text-sm text-gray-500 mb-2">
                Upload clear images that best represent the property
              </p>
              {/* Pass hidePreview prop to disable the default thumbnails */}
              <ImageUpload images={images} onChange={handleImagesChange} hidePreview={true} />
              {errors.images && (
                <p className="text-red-500 text-sm mt-2">{errors.images.message}</p>
              )}
              
              {/* Custom preview thumbnails of uploaded images */}
              {imagePreviews.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Images:</p>
                  <div className="flex flex-wrap gap-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative w-24 h-24 rounded-md overflow-hidden border border-gray-200">
                        <img 
                          src={preview} 
                          alt={`Property image ${index + 1}`} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={togglePreview}
                className="flex items-center text-gray-700 hover:text-primary transition px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                <Eye className="w-5 h-5 mr-2" />
                Preview Listing
              </button>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={goToHome}
                  className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !isValid}
                  className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Listing</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubmissionForm;