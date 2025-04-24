interface FormSubmission {
  formData: any;
  userId: string;
  submittedAt: string;
  formType: string;
}

// Update this to use your Azure Function URL
const API_BASE_URL = 'https://referencing-backend.azurewebsites.net';

export const submitFormToDatabase = async (submission: FormSubmission): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/forms/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(submission),
      credentials: 'include' // Add this for CORS
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Server response:', errorData);
      throw new Error(errorData?.message || 'Failed to submit form to database');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error submitting form:', error);
    throw error;
  }
};
