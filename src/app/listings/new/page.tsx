import React from 'react';
import SubmissionForm from '@/components/listings/submission/SubmissionForm';

export const metadata = {
  title: 'Submit New Property Listing - Proptii',
  description: 'List your property for rent or sale on Proptii',
};

export default function NewListingPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <SubmissionForm />
    </main>
  );
} 