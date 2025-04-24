import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { submitFormToDatabase } from '../services/formService';

interface FormData {
  id: string;
  formData: any;
  lastSaved: string;
  userId: string;
}

interface FormsContextType {
  saveForm: (formId: string, data: any) => Promise<void>;
  getForm: (formId: string) => Promise<any>;
  getForms: () => Promise<FormData[]>;
  deleteForm: (formId: string) => Promise<void>;
  submitFormToDb: (formId: string, data: any) => Promise<void>;
}

const FormsContext = createContext<FormsContextType>({
  saveForm: async () => {},
  getForm: async () => null,
  getForms: async () => [],
  deleteForm: async () => {},
  submitFormToDb: async () => {},
});

export const useFormsStorage = () => useContext(FormsContext);

export const FormsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [forms, setForms] = useState<Map<string, FormData>>(new Map());

  const getStorageKey = useCallback((formId: string) => {
    return `form_${user?.localAccountId || 'anonymous'}_${formId}`;
  }, [user]);

  const saveForm = useCallback(async (formId: string, data: any) => {
    if (!formId) throw new Error('Form ID is required');

    const formData: FormData = {
      id: formId,
      formData: data,
      lastSaved: new Date().toISOString(),
      userId: user?.localAccountId || 'anonymous'
    };

    // Save to local storage as fallback
    localStorage.setItem(getStorageKey(formId), JSON.stringify(formData));
    
    // Update internal state
    setForms(prev => {
      const newForms = new Map(prev);
      newForms.set(formId, formData);
      return newForms;
    });
  }, [user, getStorageKey]);

  const getForm = useCallback(async (formId: string) => {
    const storedForm = localStorage.getItem(getStorageKey(formId));
    if (storedForm) {
      const formData = JSON.parse(storedForm) as FormData;
      return formData.formData;
    }
    return null;
  }, [getStorageKey]);

  const getForms = useCallback(async () => {
    const userForms: FormData[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`form_${user?.localAccountId || 'anonymous'}`)) {
        const formData = JSON.parse(localStorage.getItem(key) || '{}') as FormData;
        userForms.push(formData);
      }
    }
    return userForms;
  }, [user]);

  const deleteForm = useCallback(async (formId: string) => {
    localStorage.removeItem(getStorageKey(formId));
    setForms(prev => {
      const newForms = new Map(prev);
      newForms.delete(formId);
      return newForms;
    });
  }, [getStorageKey]);

  const submitFormToDb = useCallback(async (formId: string, data: any) => {
    if (!formId || !user?.localAccountId) throw new Error('Form ID and user ID are required');

    const submission = {
      formData: data,
      userId: user.localAccountId,
      submittedAt: new Date().toISOString(),
      formType: formId
    };

    await submitFormToDatabase(submission);
  }, [user]);

  return (
    <FormsContext.Provider value={{
      saveForm,
      getForm,
      getForms,
      deleteForm,
      submitFormToDb
    }}>
      {children}
    </FormsContext.Provider>
  );
};
