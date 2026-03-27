import * as z from 'zod';

export const propertySchema = z.object({
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
