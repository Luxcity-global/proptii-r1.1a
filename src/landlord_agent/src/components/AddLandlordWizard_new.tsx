import React, { useState, useEffect, useReducer, useMemo, useCallback, memo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  ArrowLeft, 
  ArrowRight,
  User, 
  Mail, 
  Phone, 
  Home, 
  Calendar, 
  PoundSterling, 
  MapPin, 
  AlertTriangle,
  CheckCircle,
  UserPlus,
  Shield,
  FileText,
  CreditCard,
  Users,
  Building,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Property, Tenant, UserProfile } from '../App';

interface AddTenantProps {
  properties: Property[];
  onSave: (tenant: Omit<Tenant, 'id'>) => void;
  onBack: () => void;
  preselectedPropertyId?: string;
  userProfile?: UserProfile | null;
  initialTenant?: Tenant | null;
}

// Define form steps for Typeform-style progression
const FORM_STEPS = [
  { id: 'welcome', title: 'Hello Sarah', icon: UserPlus, description: "Let's add your new tenant" },
  { id: 'name', title: 'Full Name', icon: User, required: true, description: "What's the tenant's full name?" },
  { id: 'email', title: 'Email Address', icon: Mail, required: true, description: "What's their email address?" },
  { id: 'phone', title: 'Phone Number', icon: Phone, required: true, description: "What's their phone number?" },
  { id: 'property', title: 'Property Selection', icon: Home, required: true, description: "Which property will they occupy?" },
  { id: 'rent', title: 'Rent Amount', icon: PoundSterling, required: true, description: "What's the monthly rent?" },
  { id: 'paymentFrequency', title: 'Payment Frequency', icon: Calendar, required: true, description: "How often does the tenant pay rent?" },
  { id: 'leaseStart', title: 'Lease Start Date', icon: Calendar, required: true, description: "When does the lease start?" },
  { id: 'leaseEnd', title: 'Lease End Date', icon: Calendar, required: true, description: "When does the lease end?" },
  { id: 'emergencyName', title: 'Emergency Contact Name', icon: Users, required: true, description: "Who is their emergency contact?" },
  { id: 'emergencyPhone', title: 'Emergency Contact Phone', icon: Phone, required: true, description: "What's the emergency contact's phone?" },
  { id: 'emergencyRelation', title: 'Emergency Contact Relationship', icon: Shield, required: true, description: "What's their relationship?" },
  { id: 'employment', title: 'Employment Status', icon: Building, required: false, description: "What's their employment status?" },
  { id: 'income', title: 'Monthly Income', icon: CreditCard, required: false, description: "What's their monthly income?" },
  { id: 'notes', title: 'Additional Notes', icon: FileText, required: false, description: "Any additional information?" },
  { id: 'review', title: 'Review & Confirm', icon: CheckCircle, description: "Review all information" },
  { id: 'success', title: 'Success', icon: UserPlus, description: "Tenant added successfully!" }
];

interface TenantFormData {
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  propertyAddress: string;
  rentAmount: string;
  paymentFrequency: 'monthly' | 'yearly' | 'fixed-time';
  firstPaymentDate: string;
  leaseStart: string;
  leaseEnd: string;
  status: 'active' | 'pending' | 'inactive';
  referencingStatus: 'not-started' | 'in-progress' | 'completed' | 'failed';
  paymentStatus: 'current' | 'overdue' | 'partial';
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  defaultRiskScore: string;
  notes: string;
  employer: string;
  jobTitle: string;
  annualIncome: string;
  employmentType: 'full-time' | 'part-time' | 'self-employed' | 'student' | 'unemployed' | 'retired';
  previousLandlordName: string;
  previousLandlordPhone: string;
  previousRentAmount: string;
  previousLeaseStart: string;
  previousLeaseEnd: string;
  previousLandlordReference: string;
  bankName: string;
  accountNumber: string;
  sortCode: string;
  documentsUploaded: File[];
}

// Phase 4: Advanced State Management Interfaces
interface FormState {
  formData: TenantFormData;
  errors: Record<string, string>;
  validationStatus: Record<string, 'valid' | 'invalid' | 'pending'>;
  completedSteps: Set<number>;
  skippedSteps: Set<number>;
  currentStep: number;
  isTransitioning: boolean;
  isLoading: boolean;
  focusedField: string | null;
  globalError: string | null;
  isRetrying: boolean;
}

type FormAction = 
  | { type: 'UPDATE_FIELD'; field: string; value: any }
  | { type: 'SET_ERROR'; field: string; error: string }
  | { type: 'CLEAR_ERROR'; field: string }
  | { type: 'SET_VALIDATION_STATUS'; field: string; status: 'valid' | 'invalid' | 'pending' }
  | { type: 'MARK_STEP_COMPLETED'; step: number }
  | { type: 'MARK_STEP_SKIPPED'; step: number }
  | { type: 'SET_CURRENT_STEP'; step: number }
  | { type: 'SET_TRANSITIONING'; isTransitioning: boolean }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_FOCUSED_FIELD'; field: string | null }
  | { type: 'SET_GLOBAL_ERROR'; error: string | null }
  | { type: 'SET_RETRYING'; isRetrying: boolean }
  | { type: 'RESET_FORM' }
  | { type: 'LOAD_STATE'; state: Partial<FormState> };

// Phase 4: Advanced State Management - formReducer
const initialFormState: FormState = {
  formData: {
    name: '',
    email: '',
    phone: '',
    propertyId: '',
    propertyAddress: '',
    rentAmount: '',
    paymentFrequency: 'monthly',
    firstPaymentDate: '',
    leaseStart: '',
    leaseEnd: '',
    status: 'pending',
    referencingStatus: 'not-started',
    paymentStatus: 'current',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    defaultRiskScore: '',
    notes: '',
    employer: '',
    jobTitle: '',
    annualIncome: '',
    employmentType: 'full-time',
    previousLandlordName: '',
    previousLandlordPhone: '',
    previousRentAmount: '',
    previousLeaseStart: '',
    previousLeaseEnd: '',
    previousLandlordReference: '',
    bankName: '',
    accountNumber: '',
    sortCode: '',
    documentsUploaded: []
  },
  errors: {},
  validationStatus: {},
  completedSteps: new Set(),
  skippedSteps: new Set(),
  currentStep: 0,
  isTransitioning: false,
  isLoading: false,
  focusedField: null,
  globalError: null,
  isRetrying: false
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.field]: action.value
        },
        errors: {
          ...state.errors,
          [action.field]: '' // Clear field error when updating
        }
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.field]: action.error
        }
      };
    
    case 'CLEAR_ERROR':
      const { [action.field]: _, ...remainingErrors } = state.errors;
      return {
        ...state,
        errors: remainingErrors
      };
    
    case 'SET_VALIDATION_STATUS':
      return {
        ...state,
        validationStatus: {
          ...state.validationStatus,
          [action.field]: action.status
        }
      };
    
    case 'MARK_STEP_COMPLETED':
      return {
        ...state,
        completedSteps: new Set([...state.completedSteps, action.step])
      };
    
    case 'MARK_STEP_SKIPPED':
      return {
        ...state,
        skippedSteps: new Set([...state.skippedSteps, action.step])
      };
    
    case 'SET_CURRENT_STEP':
      return {
        ...state,
        currentStep: action.step
      };
    
    case 'SET_TRANSITIONING':
      return {
        ...state,
        isTransitioning: action.isTransitioning
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.isLoading
      };
    
    case 'SET_FOCUSED_FIELD':
      return {
        ...state,
        focusedField: action.field
      };
    
    case 'SET_GLOBAL_ERROR':
      return {
        ...state,
        globalError: action.error
      };
    
    case 'SET_RETRYING':
      return {
        ...state,
        isRetrying: action.isRetrying
      };
    
    case 'RESET_FORM':
      return initialFormState;
    
    case 'LOAD_STATE':
      console.log('🔍 LOAD_STATE action received:', action.state);
      const { formData: newFormData, ...restState } = action.state;
      const newState = {
        ...state,
        ...restState,
        formData: newFormData ? {
          ...state.formData,
          ...newFormData
        } : state.formData
      };
      console.log('🔍 New state after LOAD_STATE - formData.name:', newState.formData.name, 'formData.email:', newState.formData.email, 'formData.phone:', newState.formData.phone);
      return newState;
    
    default:
      return state;
  }
}

export function AddTenant({ properties, onSave, onBack, preselectedPropertyId, userProfile, initialTenant }: AddTenantProps) {
  // Phase 4: Replace useState with useReducer for advanced state management
  const [state, dispatch] = useReducer(formReducer, initialFormState);
  const [isGuidelinesExpanded, setIsGuidelinesExpanded] = useState(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Debug: Log initialTenant on mount and after state updates
  console.log('🔍 AddTenant mounted with initialTenant:', initialTenant);
  console.log('🔍 AddTenant - initialTenant?.name:', initialTenant?.name, 'initialTenant?.email:', initialTenant?.email);
  
  // Log form data changes
  useEffect(() => {
    console.log('🔍 Form data changed - name:', state.formData.name, 'email:', state.formData.email, 'phone:', state.formData.phone);
  }, [state.formData.name, state.formData.email, state.formData.phone]);

  // Helper function to convert Tenant to TenantFormData
  const tenantToFormData = (tenant: Tenant): Partial<TenantFormData> => {
    const formatDate = (date: Date | string | undefined): string => {
      if (!date) return '';
      const d = date instanceof Date ? date : new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      name: tenant.name || '',
      email: tenant.email || '',
      phone: tenant.phone || '',
      propertyId: tenant.propertyId || '',
      propertyAddress: tenant.propertyAddress || '',
      rentAmount: tenant.rentAmount?.toString() || '',
      paymentFrequency: tenant.paymentFrequency || 'monthly',
      firstPaymentDate: formatDate(tenant.firstPaymentDate),
      leaseStart: formatDate(tenant.leaseStart),
      leaseEnd: formatDate(tenant.leaseEnd),
      status: tenant.status === 'ended' ? 'inactive' : (tenant.status || 'pending'),
      referencingStatus: tenant.referencingStatus === 'complete' ? 'completed' : (tenant.referencingStatus || 'not-started'),
      paymentStatus: tenant.paymentStatus === 'payment-plan' ? 'current' : (tenant.paymentStatus === 'overdue' ? 'overdue' : 'current'),
      emergencyContactName: tenant.emergencyContact?.name || '',
      emergencyContactPhone: tenant.emergencyContact?.phone || '',
      emergencyContactRelationship: tenant.emergencyContact?.relationship || '',
      defaultRiskScore: tenant.defaultRiskScore?.toString() || '',
      notes: '',
      employer: '',
      jobTitle: '',
      annualIncome: '',
      employmentType: 'full-time',
      previousLandlordName: '',
      previousLandlordPhone: '',
      previousRentAmount: '',
      previousLeaseStart: '',
      previousLeaseEnd: '',
      previousLandlordReference: '',
      bankName: '',
      accountNumber: '',
      sortCode: '',
      documentsUploaded: []
    };
  };

  // Currency formatting functions
  const formatCurrency = (value: string) => {
    // Remove all non-numeric characters except decimal point
    const numericValue = value.replace(/[^\d.]/g, '');
    if (!numericValue) return '';
    
    // Convert to number and format with commas
    const number = parseFloat(numericValue);
    if (isNaN(number)) return '';
    
    return number.toLocaleString('en-GB', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  const parseCurrency = (value: string) => {
    return value.replace(/[^\d.]/g, '');
  };

  // Date helpers to avoid timezone pitfalls with date-only strings
  const toDateOnly = (value: string) => {
    if (!value) return null;
    const [y, m, d] = value.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d, 12, 0, 0); // noon local to avoid TZ edge cases
  };
  const isTodayOrFuture = (value: string) => {
    const dt = toDateOnly(value);
    if (!dt) return false;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    return dt.getTime() >= today.getTime();
  };

  // Load progress on component mount or pre-fill with initialTenant
  useEffect(() => {
    console.log('🔍 useEffect triggered with initialTenant:', initialTenant);
    if (initialTenant) {
      console.log('✅ initialTenant exists, pre-filling form');
      // Clear any saved progress when editing
      localStorage.removeItem('tenantFormProgress');
      
      // Pre-fill form with tenant data
      const formData = tenantToFormData(initialTenant);
      console.log('🔍 Pre-filling form with tenant data:', initialTenant, 'formData:', formData);
      console.log('🔍 Form data keys:', Object.keys(formData));
      console.log('🔍 Form data values - name:', formData.name, 'email:', formData.email, 'phone:', formData.phone);
      
      // Dispatch each field individually to ensure they're set
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          console.log(`🔍 Dispatching UPDATE_FIELD for ${key}:`, value);
          dispatch({ type: 'UPDATE_FIELD', field: key as keyof TenantFormData, value });
        }
      });
      
      // Mark steps as completed
      dispatch({ 
        type: 'LOAD_STATE', 
        state: {
          completedSteps: new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
        }
      });
      
      console.log('✅ Dispatched all field updates');
    } else {
      console.log('⚠️ No initialTenant, loading progress or applying defaults');
    const loaded = loadProgress();
    if (!loaded) {
      applySmartDefaults(FORM_STEPS[0].id);
    }
    }
  }, [initialTenant]);

  // Auto-save progress with debouncing (skip when editing)
  useEffect(() => {
    if (initialTenant) {
      // Don't auto-save when editing an existing tenant
      return;
    }
    const timer = setTimeout(() => {
      saveProgress();
    }, 1000); // Debounce saves

    return () => clearTimeout(timer);
  }, [state.formData, state.currentStep, state.completedSteps, state.skippedSteps, initialTenant]);

  // Auto-expand guidelines on step 1 for 5 seconds
  useEffect(() => {
    if (state.currentStep === 0) {
      setIsGuidelinesExpanded(true);
      const timer = setTimeout(() => {
        setIsGuidelinesExpanded(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.currentStep]);

  // Set preselected property on mount (skip if editing existing tenant)
  useEffect(() => {
    if (initialTenant) {
      // Don't override property when editing
      return;
    }
    if (preselectedPropertyId && !state.formData.propertyId) {
      dispatch({ type: 'UPDATE_FIELD', field: 'propertyId', value: preselectedPropertyId });
    }
  }, [preselectedPropertyId, initialTenant]);

  // Update property address when property is selected
  useEffect(() => {
    if (state.formData.propertyId) {
      const selectedProperty = properties.find(p => p.id === state.formData.propertyId);
      if (selectedProperty) {
        dispatch({ type: 'UPDATE_FIELD', field: 'propertyAddress', value: selectedProperty.address });
      }
    }
  }, [state.formData.propertyId, properties]);

  // Apply smart defaults when entering certain steps
  useEffect(() => {
    const currentStepInfo = FORM_STEPS[state.currentStep];
    if (currentStepInfo) {
      applySmartDefaults(currentStepInfo.id);
    }
  }, [state.currentStep]);


  // Phase 4: Performance optimization with useCallback
  const handleInputChange = useCallback((field: keyof TenantFormData, value: string) => {
    dispatch({ type: 'UPDATE_FIELD', field, value });
    
    // Real-time validation
    validateField(field, value);
    
    // Mark step as completed if valid
    const currentStepInfo = FORM_STEPS[state.currentStep];
    if (currentStepInfo && validateStep(currentStepInfo.id)) {
      dispatch({ type: 'MARK_STEP_COMPLETED', step: state.currentStep });
    }
  }, [state.currentStep]);

  // Enhanced validation function
  const validateField = (field: keyof TenantFormData, value: string) => {
    let isValid = true;
    let errorMessage = '';

    switch (field) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value.trim()) {
          isValid = false;
          errorMessage = 'Email is required';
        } else if (!emailRegex.test(value)) {
          isValid = false;
          errorMessage = 'Please enter a valid email address';
        }
        break;
      case 'phone':
        const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
        if (!value.trim()) {
          isValid = false;
          errorMessage = 'Phone number is required';
        } else if (!phoneRegex.test(value)) {
          isValid = false;
          errorMessage = 'Please enter a valid phone number';
        }
        break;
      case 'name':
        if (!value.trim()) {
          isValid = false;
          errorMessage = 'Name is required';
        } else if (value.trim().length < 2) {
          isValid = false;
          errorMessage = 'Name must be at least 2 characters';
        }
        break;
      case 'propertyId':
        if (!value) {
          isValid = false;
          errorMessage = 'Please select a property';
        }
        break;
      case 'rentAmount':
        const rent = parseFloat(value);
        if (!value.trim()) {
          isValid = false;
          errorMessage = 'Rent amount is required';
        } else if (isNaN(rent) || rent <= 0) {
          isValid = false;
          errorMessage = 'Please enter a valid rent amount';
        }
        break;
      case 'firstPaymentDate':
        if (!value) {
          isValid = false;
          errorMessage = 'First payment date is required';
        } else if (!toDateOnly(value)) {
          isValid = false;
          errorMessage = 'Please enter a valid date';
        }
        break;
      case 'leaseStart':
      case 'leaseEnd':
        if (!value) {
          isValid = false;
          errorMessage = 'Date is required';
        } else if (!isTodayOrFuture(value)) {
          isValid = false;
          errorMessage = 'Date cannot be in the past';
        }
        break;
      case 'emergencyContactName':
        if (!value.trim()) {
          isValid = false;
          errorMessage = 'Emergency contact name is required';
        } else if (value.trim().length < 2) {
          isValid = false;
          errorMessage = 'Name must be at least 2 characters';
        }
        break;
      case 'emergencyContactPhone':
        if (!value.trim()) {
          isValid = false;
          errorMessage = 'Emergency contact phone is required';
        } else {
          const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
          if (!phoneRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid phone number';
          }
        }
        break;
      case 'emergencyContactRelationship':
        if (!value) {
          isValid = false;
          errorMessage = 'Relationship is required';
        }
        break;
      case 'employmentType':
        if (!value) {
          isValid = false;
          errorMessage = 'Employment status is required';
        }
        break;
      case 'annualIncome':
        if (!value.trim()) {
          isValid = false;
          errorMessage = 'Annual income is required';
        } else if (isNaN(parseFloat(value)) || parseFloat(value) <= 0) {
          isValid = false;
          errorMessage = 'Please enter a valid income amount';
        }
        break;
    }

    dispatch({ 
      type: 'SET_VALIDATION_STATUS', 
      field, 
      status: isValid ? 'valid' : 'invalid' 
    });
    
    if (!isValid) {
      dispatch({ type: 'SET_ERROR', field, error: errorMessage });
    } else {
      dispatch({ type: 'CLEAR_ERROR', field });
    }

    return isValid;
  };

  // Step navigation functions with enhanced animations and validation
  const goToNextStep = useCallback(() => {
    // Validate current step before proceeding
    const currentStepInfo = FORM_STEPS[state.currentStep];
    if (currentStepInfo && currentStepInfo.required && !validateStep(currentStepInfo.id)) {
      console.log('❌ Validation failed for step:', currentStepInfo.id);
      return; // Don't proceed if validation fails
    }

    if (state.currentStep < FORM_STEPS.length - 1) {
      const nextStep = state.currentStep + 1;
      console.log('✅ Navigating to step:', nextStep);
      dispatch({ type: 'SET_TRANSITIONING', isTransitioning: true });
      // Mark current step as completed
      dispatch({ type: 'MARK_STEP_COMPLETED', step: state.currentStep });
      
      // Add a slight delay for smoother transition
      setTimeout(() => {
        dispatch({ type: 'SET_CURRENT_STEP', step: nextStep });
        setTimeout(() => {
          dispatch({ type: 'SET_TRANSITIONING', isTransitioning: false });
        }, 100);
      }, 200);
    }
  }, [state.currentStep, state.formData]);

  const goToPreviousStep = useCallback(() => {
    if (state.currentStep > 0) {
      const prevStep = state.currentStep - 1;
      dispatch({ type: 'SET_TRANSITIONING', isTransitioning: true });
      setTimeout(() => {
        dispatch({ type: 'SET_CURRENT_STEP', step: prevStep });
        setTimeout(() => {
          dispatch({ type: 'SET_TRANSITIONING', isTransitioning: false });
        }, 100);
      }, 200);
    }
  }, [state.currentStep]);

  const handleStepSubmit = (value: string) => {
    // Auto-advance on successful input
    setTimeout(() => {
      if (validateStep(FORM_STEPS[state.currentStep].id)) {
        goToNextStep();
      }
    }, 500);
  };

  const handleInputFocus = (field: string) => {
    dispatch({ type: 'SET_FOCUSED_FIELD', field });
  };

  const handleInputBlur = () => {
    dispatch({ type: 'SET_FOCUSED_FIELD', field: null });
  };

  // Smart defaults function
  const applySmartDefaults = (stepId: string) => {
    switch (stepId) {
      case 'rent':
        if (state.formData.propertyId && !state.formData.rentAmount) {
          const property = properties.find(p => p.id === state.formData.propertyId);
          if (property) {
            dispatch({ type: 'UPDATE_FIELD', field: 'rentAmount', value: property.rent.toString() });
          }
        }
        break;
      case 'leaseStart':
        if (!state.formData.leaseStart) {
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          dispatch({ type: 'UPDATE_FIELD', field: 'leaseStart', value: nextMonth.toISOString().split('T')[0] });
        }
        break;
      case 'leaseEnd':
        if (!state.formData.leaseEnd && state.formData.leaseStart) {
          const startDate = new Date(state.formData.leaseStart);
          startDate.setFullYear(startDate.getFullYear() + 1);
          dispatch({ type: 'UPDATE_FIELD', field: 'leaseEnd', value: startDate.toISOString().split('T')[0] });
        }
        break;
    }
  };

  // Skip optional step functionality
  const skipCurrentStep = () => {
    if (state.currentStep < FORM_STEPS.length - 1) {
      dispatch({ type: 'MARK_STEP_SKIPPED', step: state.currentStep });
      goToNextStep();
    }
  };

  // Check if current step is optional
  const isCurrentStepOptional = () => {
    const step = FORM_STEPS[state.currentStep];
    return step && !step.required;
  };

  // Progress persistence functions
  const saveProgress = () => {
    const progressData = {
      formData: state.formData,
      currentStep: state.currentStep,
      completedSteps: Array.from(state.completedSteps),
      skippedSteps: Array.from(state.skippedSteps),
      timestamp: Date.now()
    };
    localStorage.setItem('tenantFormProgress', JSON.stringify(progressData));
  };

  const loadProgress = () => {
    try {
      const saved = localStorage.getItem('tenantFormProgress');
      if (saved) {
        const progressData = JSON.parse(saved);
        
        // Check if saved data is recent (within 24 hours)
        const isRecent = Date.now() - progressData.timestamp < 24 * 60 * 60 * 1000;
        
        if (isRecent && progressData.formData) {
          dispatch({ 
            type: 'LOAD_STATE', 
            state: {
              formData: progressData.formData,
              currentStep: progressData.currentStep || 0,
              completedSteps: new Set(progressData.completedSteps || []),
              skippedSteps: new Set(progressData.skippedSteps || [])
            }
          });
          return true;
        }
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
    return false;
  };

  // Validate entire step
  const validateStep = (stepId: string) => {
    const step = FORM_STEPS.find(s => s.id === stepId);
    if (!step) return true;
    
    switch (stepId) {
      case 'name':
        return state.formData.name.trim().length >= 2;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(state.formData.email);
      case 'phone':
        const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
        return phoneRegex.test(state.formData.phone);
      case 'property':
        return !!state.formData.propertyId;
      case 'rent':
        return !isNaN(parseFloat(state.formData.rentAmount)) && parseFloat(state.formData.rentAmount) > 0;
      case 'paymentFrequency':
        return !!state.formData.paymentFrequency && ['monthly', 'yearly', 'fixed-time'].includes(state.formData.paymentFrequency) && !!state.formData.firstPaymentDate;
      case 'leaseStart':
      case 'leaseEnd':
        return !!state.formData[stepId as keyof TenantFormData] && isTodayOrFuture(state.formData[stepId as keyof TenantFormData] as string);
      case 'emergencyName':
        return !!state.formData.emergencyContactName;
      case 'emergencyPhone':
        return !!state.formData.emergencyContactPhone;
      case 'emergencyRelation':
        return !!state.formData.emergencyContactRelationship;
      case 'employment':
        return true; // Employment is optional
      case 'income':
        return !state.formData.annualIncome || (!isNaN(parseFloat(state.formData.annualIncome)) && parseFloat(state.formData.annualIncome) > 0);
      case 'notes':
        return true; // Notes are optional
    }
    return true;
  };

  // Phase 4: Comprehensive error handling and recovery
  const handleSubmit = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', isLoading: true });
      dispatch({ type: 'SET_GLOBAL_ERROR', error: null });

      // Validate all required fields
      const requiredSteps = FORM_STEPS.filter(step => step.required);
      let hasErrors = false;
      const errors: string[] = [];

      for (const step of requiredSteps) {
        if (!validateStep(step.id)) {
          hasErrors = true;
          errors.push(`Please complete the ${step.title} step`);
        }
      }

      if (hasErrors) {
        // Go to first step with error
        const firstErrorStep = requiredSteps.find(step => {
          validateStep(step.id);
          return state.errors[step.id];
        });
        
        if (firstErrorStep) {
          const stepIndex = FORM_STEPS.findIndex(s => s.id === firstErrorStep.id);
          dispatch({ type: 'SET_CURRENT_STEP', step: stepIndex });
          dispatch({ type: 'SET_GLOBAL_ERROR', error: `Please complete all required fields. ${errors.join(', ')}` });
          return;
        }
      }

      // Create tenant object
      // Normalize enums for backend compatibility
      const normalizedReferencing =
        state.formData.referencingStatus === 'completed' ? 'complete' : state.formData.referencingStatus;
      const normalizedPayment =
        (state.formData.paymentStatus as any) === 'partial' ? 'payment-plan' : state.formData.paymentStatus;

      const tenant: Omit<Tenant, 'id'> = {
        name: state.formData.name,
        email: state.formData.email,
        phone: state.formData.phone,
        propertyId: state.formData.propertyId,
        propertyAddress: state.formData.propertyAddress,
        rentAmount: parseFloat(state.formData.rentAmount) || 0,
        paymentFrequency: state.formData.paymentFrequency,
        firstPaymentDate: toDateOnly(state.formData.firstPaymentDate) || new Date(),
        leaseStart: toDateOnly(state.formData.leaseStart) || new Date(),
        leaseEnd: toDateOnly(state.formData.leaseEnd) || new Date(),
        status: state.formData.status,
        referencingStatus: normalizedReferencing as any,
        paymentStatus: normalizedPayment as any,
        emergencyContact: {
          name: state.formData.emergencyContactName,
          phone: state.formData.emergencyContactPhone,
          relationship: state.formData.emergencyContactRelationship
        },
        defaultRiskScore: parseInt(state.formData.defaultRiskScore) || 75
      };

      // Simulate API call with retry logic
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          onSave(tenant);
          break; // Success
        } catch (error) {
          attempts++;
          if (attempts >= maxAttempts) {
            throw error;
          }
          dispatch({ type: 'SET_RETRYING', isRetrying: true });
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts)); // Exponential backoff
        }
      }

      // Mark saved and move to success step
      setIsSaved(true);
      const successIndex = FORM_STEPS.findIndex(s => s.id === 'success');
      if (successIndex >= 0) {
        dispatch({ type: 'SET_CURRENT_STEP', step: successIndex });
      }

    } catch (error) {
      console.error('Failed to save tenant:', error);
      dispatch({ 
        type: 'SET_GLOBAL_ERROR', 
        error: error instanceof Error ? error.message : 'Failed to save tenant. Please try again.' 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', isLoading: false });
      dispatch({ type: 'SET_RETRYING', isRetrying: false });
    }
  }, [state.formData, state.errors, onSave]);

  // Phase 4: Accessibility - Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'ArrowRight':
            event.preventDefault();
            if (state.currentStep < FORM_STEPS.length - 1) {
              goToNextStep();
            }
            break;
          case 'ArrowLeft':
            event.preventDefault();
            if (state.currentStep > 0) {
              goToPreviousStep();
            }
            break;
          case 'Escape':
            event.preventDefault();
            onBack();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.currentStep, goToNextStep, goToPreviousStep, onBack]);

  // Helper function to get dynamic title with user's first name
  const getStepTitle = useCallback((step: typeof FORM_STEPS[0]) => {
    if (step.id === 'welcome') {
      // Extract first name from full name
      const fullName = userProfile?.name || '';
      const firstName = fullName.split(' ')[0] || 'there';
      console.log('🔍 getStepTitle - userProfile:', userProfile, 'fullName:', fullName, 'firstName:', firstName);
      return `Hello ${firstName}`;
    }
    return step.title;
  }, [userProfile]);

  // Phase 4: Performance optimization with useMemo
  const currentStepInfo = useMemo(() => FORM_STEPS[state.currentStep], [state.currentStep]);
  const progress = useMemo(() => ((state.currentStep + 1) / FORM_STEPS.length) * 100, [state.currentStep]);
  
  // Memoized computed values
  const isCurrentStepValid = useMemo(() => {
    if (!currentStepInfo) return false;
    return validateStep(currentStepInfo.id);
  }, [currentStepInfo, state.formData]);

  const progressData = useMemo(() => ({
    completed: state.completedSteps.size,
    skipped: state.skippedSteps.size,
    total: FORM_STEPS.length - 1,
    current: state.currentStep
  }), [state.completedSteps.size, state.skippedSteps.size, state.currentStep]);

  // Render current step content
  const renderCurrentStep = () => {
    const step = currentStepInfo;
    const IconComponent = step.icon;

    // Step-specific rendering
    switch (step.id) {
      case 'welcome':
        return (
          <div className="text-center space-y-8 animate-fade-in-up">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-white shadow-lg rounded-full flex items-center justify-center  animate-bounce-in">
                <IconComponent className="w-12 h-12" style={{ color: '#10b981' }} />
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="font-bold" style={{ fontFamily: 'Archivo, sans-serif', fontSize: '2.5rem', color: '#136C9E' }}>{getStepTitle(step)}</h1>
              <p className="text-xl text-gray-600 max-w-md mx-auto" style={{ fontFamily: 'Archivo, sans-serif' }}>{step.description}</p>
            </div>
          </div>
        );

      case 'name':
        return (
          <div className="space-y-8 animate-fade-in-up">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-white shadow-lg rounded-full flex items-center justify-center ">
                <IconComponent className="w-10 h-10" style={{ color: '#378800' }} />
              </div>
            </div>
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold" style={{ fontFamily: 'Archivo, sans-serif', color: '#136C9E' }}>
                  {step.description}
                  {step.required && <span className="text-red-500 ml-1">*</span>}
                  {!step.required && step.id !== 'welcome' && step.id !== 'review' && step.id !== 'success' && <span className="text-gray-500 ml-2 font-normal">(Optional)</span>}
                </h1>
                <p className="text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>This will help us personalize their experience</p>
              </div>
              <div className="space-y-3">
              <div className="relative group">
                <Input
                  id="name"
                  type="text"
                  value={state.formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  onFocus={() => handleInputFocus('name')}
                  onBlur={() => handleInputBlur()}
                    className={`w-full text-lg py-6 px-6 border-2 transition-all duration-300 rounded-2xl focus:border-[#4E97CC] focus:ring-2 focus:ring-[#8FCDFF] focus:ring-opacity-50 focus:outline-none ${
                    state.focusedField === 'name' || state.formData.name
                        ? 'bg-white shadow-lg'
                      : 'border-gray-300 bg-gray-50'
                  } ${state.errors.name ? 'border-red-500 animate-shake' : ''}`}
                    style={{ 
                      fontFamily: 'Archivo, sans-serif',
                      borderColor: state.focusedField === 'name' || state.formData.name ? '#4E97CC' : undefined,
                      outline: 'none',
                      '--tw-ring-color': '#8FCDFF',
                      '--tw-ring-opacity': '0.5'
                    }}
                    placeholder="Enter full name"
                  />
                {state.formData.name && !state.errors.name && validateStep('name') && (
                  <CheckCircle className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 animate-bounce z-10" style={{ right: '24px' }} />
                )}
                {state.errors.name && (
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10" style={{ right: '24px' }}>
                    <AlertTriangle className="w-5 h-5 text-red-500 animate-shake" />
                  </div>
                )}
              </div>
              {state.errors.name && (
                <p className="text-red-500 text-sm animate-fade-in-up">{state.errors.name}</p>
              )}
              </div>
            </div>
          </div>
        );

      case 'email':
        return (
          <div className="space-y-8 animate-fade-in-up">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-white shadow-lg rounded-full flex items-center justify-center ">
                <IconComponent className="w-10 h-10" style={{ color: '#378800' }} />
              </div>
            </div>
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold" style={{ fontFamily: 'Archivo, sans-serif', color: '#136C9E' }}>
                  {step.description}
                  {step.required && <span className="text-red-500 ml-1">*</span>}
                  {!step.required && step.id !== 'welcome' && step.id !== 'review' && step.id !== 'success' && <span className="text-gray-500 ml-2 font-normal">(Optional)</span>}
                </h1>
                <p className="text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>We'll use this for important communications</p>
              </div>
              <div className="space-y-3">
              <div className="relative group">
                <Input
                  id="email"
                  type="email"
                  value={state.formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onFocus={() => handleInputFocus('email')}
                  onBlur={() => handleInputBlur()}
                    className={`w-full text-lg py-6 px-6 border-2 transition-all duration-300 rounded-2xl focus:border-[#4E97CC] focus:ring-2 focus:ring-[#8FCDFF] focus:ring-opacity-50 focus:outline-none ${
                    state.focusedField === 'email' || state.formData.email
                        ? 'bg-white shadow-lg '
                      : 'border-gray-300 bg-gray-50'
                  } ${state.errors.email ? 'border-red-500 animate-shake' : ''}`}
                    style={{ 
                      fontFamily: 'Archivo, sans-serif',
                      borderColor: state.focusedField === 'email' || state.formData.email ? '#4E97CC' : undefined,
                      outline: 'none',
                      '--tw-ring-color': '#8FCDFF',
                      '--tw-ring-opacity': '0.5'
                    }}
                    placeholder="Enter email address"
                  />
                {state.formData.email && !state.errors.email && validateStep('email') && (
                  <CheckCircle className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 animate-bounce z-10" style={{ right: '24px' }} />
                )}
                {state.errors.email && (
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10" style={{ right: '24px' }}>
                    <AlertTriangle className="w-5 h-5 text-red-500 animate-shake" />
                  </div>
                )}
              </div>
              {state.errors.email && (
                <p className="text-red-500 text-sm animate-fade-in-up">{state.errors.email}</p>
              )}
              </div>
            </div>
          </div>
        );

      case 'phone':
        return (
          <div className="space-y-8 animate-fade-in-up">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-white shadow-lg rounded-full flex items-center justify-center ">
                <IconComponent className="w-10 h-10" style={{ color: '#378800' }} />
              </div>
            </div>
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold" style={{ fontFamily: 'Archivo, sans-serif', color: '#136C9E' }}>
                  {step.description}
                  {step.required && <span className="text-red-500 ml-1">*</span>}
                  {!step.required && step.id !== 'welcome' && step.id !== 'review' && step.id !== 'success' && <span className="text-gray-500 ml-2 font-normal">(Optional)</span>}
                </h1>
                <p className="text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>Include country code for international numbers</p>
              </div>
              <div className="space-y-3">
              <div className="relative group">
                <Input
                  id="phone"
                  type="tel"
                  value={state.formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  onFocus={() => handleInputFocus('phone')}
                  onBlur={() => handleInputBlur()}
                    className={`w-full text-lg py-6 px-6 border-2 transition-all duration-300 rounded-2xl focus:border-[#4E97CC] focus:ring-2 focus:ring-[#8FCDFF] focus:ring-opacity-50 focus:outline-none ${
                    state.focusedField === 'phone' || state.formData.phone
                        ? 'bg-white shadow-lg '
                      : 'border-gray-300 bg-gray-50'
                  } ${state.errors.phone ? 'border-red-500 animate-shake' : ''}`}
                    style={{ 
                      fontFamily: 'Archivo, sans-serif',
                      borderColor: state.focusedField === 'phone' || state.formData.phone ? '#4E97CC' : undefined,
                      outline: 'none',
                      '--tw-ring-color': '#8FCDFF',
                      '--tw-ring-opacity': '0.5'
                    }}
                    placeholder="Enter phone number"
                  />
                {state.formData.phone && !state.errors.phone && validateStep('phone') && (
                  <CheckCircle className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 animate-bounce z-10" style={{ right: '24px' }} />
                )}
                {state.errors.phone && (
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10" style={{ right: '24px' }}>
                    <AlertTriangle className="w-5 h-5 text-red-500 animate-shake" />
                  </div>
                )}
              </div>
              {state.errors.phone && (
                <p className="text-red-500 text-sm animate-fade-in-up">{state.errors.phone}</p>
              )}
              </div>
            </div>
          </div>
        );

      case 'property':
        return (
          <div className="space-y-8 animate-fade-in-up">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-white shadow-lg rounded-full flex items-center justify-center ">
                <IconComponent className="w-10 h-10" style={{ color: '#378800' }} />
              </div>
            </div>
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold" style={{ fontFamily: 'Archivo, sans-serif', color: '#136C9E' }}>
                  {step.description}
                  {step.required && <span className="text-red-500 ml-1">*</span>}
                  {!step.required && step.id !== 'welcome' && step.id !== 'review' && step.id !== 'success' && <span className="text-gray-500 ml-2 font-normal">(Optional)</span>}
                </h1>
                <p className="text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>Select the property they'll be renting</p>
              </div>
              <div className="relative group">
                <Select
                  value={state.formData.propertyId}
                  onValueChange={(value) => handleInputChange('propertyId', value)}
                >
                    <SelectTrigger className={`w-full text-lg py-6 px-6 border-2 transition-all duration-300 rounded-2xl focus:border-[#4E97CC] focus:ring-2 focus:ring-[#8FCDFF] focus:ring-opacity-50 focus:outline-none focus:ring-0 focus:ring-transparent focus-visible:ring-0 focus-visible:ring-transparent ${
                    state.formData.propertyId
                        ? 'bg-white shadow-lg '
                      : 'border-gray-300 bg-gray-50'
                    }`} style={{
                      borderColor: state.formData.propertyId ? '#4E97CC' : undefined,
                      boxShadow: 'none',
                      outline: 'none',
                      fontFamily: 'Archivo, sans-serif'
                    }}>
                    <SelectValue placeholder="Choose a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {state.formData.propertyId && !state.errors.propertyId && validateStep('property') && (
                  <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 animate-bounce z-10" style={{ right: '16px' }} />
                )}
                {state.errors.propertyId && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10" style={{ right: '16px' }}>
                    <AlertTriangle className="w-5 h-5 text-red-500 animate-shake" />
                  </div>
                )}
              </div>
              {state.errors.propertyId && (
                <p className="text-red-500 text-sm animate-fade-in-up">{state.errors.propertyId}</p>
              )}
            </div>
          </div>
        );

      case 'rent':
        return (
          <div className="space-y-8 animate-fade-in-up">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-white shadow-lg rounded-full flex items-center justify-center ">
                <IconComponent className="w-10 h-10" style={{ color: '#378800' }} />
              </div>
            </div>
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold" style={{ fontFamily: 'Archivo, sans-serif', color: '#136C9E' }}>
                  {step.description}
                  {step.required && <span className="text-red-500 ml-1">*</span>}
                  {!step.required && step.id !== 'welcome' && step.id !== 'review' && step.id !== 'success' && <span className="text-gray-500 ml-2 font-normal">(Optional)</span>}
                </h1>
                <p className="text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>Monthly rent amount in pounds</p>
              </div>
              <div className="space-y-3">
              <div className="relative group">
                <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-medium pointer-events-none" style={{ fontFamily: 'Archivo, sans-serif' }}>£</span>
                  <Input
                    id="rentAmount"
                    type="text"
                    value={state.formData.rentAmount ? formatCurrency(state.formData.rentAmount) : ''}
                    onChange={(e) => {
                      const rawValue = parseCurrency(e.target.value);
                      handleInputChange('rentAmount', rawValue);
                    }}
                    onFocus={() => handleInputFocus('rentAmount')}
                    onBlur={() => handleInputBlur()}
                      className={`w-full text-lg py-6 pr-6 border-2 transition-all duration-300 rounded-2xl focus:border-[#4E97CC] focus:ring-2 focus:ring-[#8FCDFF] focus:ring-opacity-50 focus:outline-none ${
                      state.focusedField === 'rentAmount' || state.formData.rentAmount
                          ? 'bg-white shadow-lg '
                        : 'border-gray-300 bg-gray-50'
                    } ${state.errors.rentAmount ? 'border-red-500 animate-shake' : ''}`}
                    style={{ 
                      fontFamily: 'Archivo, sans-serif',
                      borderColor: state.focusedField === 'rentAmount' || state.formData.rentAmount ? '#4E97CC' : undefined,
                      outline: 'none',
                      '--tw-ring-color': '#8FCDFF',
                      '--tw-ring-opacity': '0.5',
                      paddingLeft: '38px'
                    }}
                      placeholder="Enter monthly rent"
                    />
                </div>
                {state.formData.rentAmount && !state.errors.rentAmount && validateStep('rent') && (
                  <CheckCircle className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 animate-bounce z-10" style={{ right: '24px' }} />
                )}
                {state.errors.rentAmount && (
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10" style={{ right: '24px' }}>
                    <AlertTriangle className="w-5 h-5 text-red-500 animate-shake" />
                  </div>
                )}
              </div>
              {state.errors.rentAmount && (
                <p className="text-red-500 text-sm animate-fade-in-up">{state.errors.rentAmount}</p>
              )}
              </div>
            </div>
          </div>
        );

      case 'paymentFrequency':
        return (
          <div className="space-y-8 animate-fade-in-up">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8F4F8' }}>
                  <IconComponent className="w-8 h-8" style={{ color: '#4E97CC' }} />
                </div>
              </div>
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Archivo, sans-serif', color: '#136C9E' }}>{step.title}</h2>
              <p className="text-lg text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>{step.description}</p>
            </div>
            <div className="space-y-6">
              <div className="space-y-3">
                {(['monthly', 'yearly', 'fixed-time'] as const).map((frequency) => (
                  <button
                    key={frequency}
                    type="button"
                    onClick={() => handleInputChange('paymentFrequency', frequency)}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                      state.formData.paymentFrequency === frequency
                        ? 'border-[#4E97CC] bg-[#E8F4F8] shadow-lg'
                        : 'border-gray-300 bg-white hover:border-[#4E97CC] hover:bg-gray-50'
                    } ${state.errors.paymentFrequency ? 'border-red-500' : ''}`}
                    style={{ fontFamily: 'Archivo, sans-serif' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium capitalize">
                        {frequency === 'fixed-time' ? 'Fixed Time' : frequency.charAt(0).toUpperCase() + frequency.slice(1)}
                      </span>
                      {state.formData.paymentFrequency === frequency && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              {state.errors.paymentFrequency && (
                <p className="text-red-500 text-sm animate-fade-in-up">{state.errors.paymentFrequency}</p>
              )}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Archivo, sans-serif' }}>
                  Date of First Payment <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Input
                    id="firstPaymentDate"
                    type="date"
                    value={state.formData.firstPaymentDate}
                    onChange={(e) => handleInputChange('firstPaymentDate', e.target.value)}
                    onFocus={() => handleInputFocus('firstPaymentDate')}
                    onBlur={() => handleInputBlur()}
                    className={`w-full text-lg py-6 px-6 border-2 transition-all duration-300 rounded-2xl focus:border-[#4E97CC] focus:ring-2 focus:ring-[#8FCDFF] focus:ring-opacity-50 focus:outline-none ${
                      state.focusedField === 'firstPaymentDate' || state.formData.firstPaymentDate
                        ? 'bg-white shadow-lg '
                        : 'border-gray-300 bg-gray-50'
                    } ${state.errors.firstPaymentDate ? 'border-red-500 animate-shake' : ''}`}
                    style={{ 
                      fontFamily: 'Archivo, sans-serif',
                      borderColor: state.focusedField === 'firstPaymentDate' || state.formData.firstPaymentDate ? '#4E97CC' : undefined,
                      outline: 'none',
                      '--tw-ring-color': '#8FCDFF',
                      '--tw-ring-opacity': '0.5'
                    }}
                  />
                  {state.formData.firstPaymentDate && !state.errors.firstPaymentDate && toDateOnly(state.formData.firstPaymentDate) && (
                    <CheckCircle className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 animate-bounce z-10" style={{ right: '24px' }} />
                  )}
                  {state.errors.firstPaymentDate && (
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10" style={{ right: '24px' }}>
                      <AlertTriangle className="w-5 h-5 text-red-500 animate-shake" />
                    </div>
                  )}
                </div>
                {state.errors.firstPaymentDate && (
                  <p className="text-red-500 text-sm animate-fade-in-up">{state.errors.firstPaymentDate}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-8 animate-fade-in-up">
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full flex items-center justify-center  animate-bounce-in" style={{ backgroundColor: '#dcfce7' }}>
                  <UserPlus className="w-12 h-12" style={{ color: '#10b981' }} />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white shadow-lg rounded-full flex items-center justify-center animate-bounce-in animation-delay-200">
                  <CheckCircle className="w-6 h-6" style={{ color: '#10b981' }} />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="font-bold" style={{ fontFamily: 'Archivo, sans-serif', fontSize: '2.5rem', color: '#136C9E' }}>{step.title}</h1>
              <p className="text-xl text-gray-600 max-w-md mx-auto" style={{ fontFamily: 'Archivo, sans-serif' }}>{step.description}</p>
              <button
                onClick={() => {
                  // Reset form to initial state
                  dispatch({ type: 'RESET_FORM' });
                  // Go back to step 1
                  dispatch({ type: 'SET_CURRENT_STEP', step: 0 });
                }}
                className="px-8 py-3 rounded-full border-2 font-medium transition-all duration-300 hover:bg-opacity-10"
                style={{ 
                  fontFamily: 'Archivo, sans-serif',
                  borderColor: '#136C9E',
                  color: '#136C9E',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#136C9E';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#136C9E';
                }}
              >
                Add New Tenant
              </button>
            </div>
          </div>
        );

      case 'emergencyName':
        return (
          <div className="space-y-8 animate-fade-in-up">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-white shadow-lg rounded-full flex items-center justify-center ">
                <IconComponent className="w-10 h-10" style={{ color: '#378800' }} />
              </div>
            </div>
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold" style={{ fontFamily: 'Archivo, sans-serif', color: '#136C9E' }}>
                  {step.description}
                  {step.required && <span className="text-red-500 ml-1">*</span>}
                  {!step.required && step.id !== 'welcome' && step.id !== 'review' && step.id !== 'success' && <span className="text-gray-500 ml-2 font-normal">(Optional)</span>}
                </h1>
                <p className="text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>Enter the full name of their emergency contact</p>
              </div>
              <div className="space-y-3">
                <div className="relative group">
                  <Input
                    id="emergencyName"
                    type="text"
                    value={state.formData.emergencyContactName}
                    onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                    onFocus={() => handleInputFocus('emergencyContactName')}
                    onBlur={() => handleInputBlur()}
                    className={`w-full text-lg py-6 px-6 border-2 transition-all duration-300 rounded-2xl focus:border-[#4E97CC] focus:ring-2 focus:ring-[#8FCDFF] focus:ring-opacity-50 focus:outline-none ${
                      state.focusedField === 'emergencyContactName' || state.formData.emergencyContactName
                        ? 'bg-white shadow-lg '
                        : 'border-gray-300 bg-gray-50'
                    } ${state.errors.emergencyContactName ? 'border-red-500 animate-shake' : ''}`}
                    style={{ 
                      fontFamily: 'Archivo, sans-serif',
                      borderColor: state.focusedField === 'emergencyContactName' || state.formData.emergencyContactName ? '#4E97CC' : undefined,
                      outline: 'none',
                      '--tw-ring-color': '#8FCDFF',
                      '--tw-ring-opacity': '0.5'
                    }}
                    placeholder="Enter emergency contact name"
                  />
                {state.formData.emergencyContactName && !state.errors.emergencyContactName && validateStep('emergencyName') && (
                  <CheckCircle className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 animate-bounce z-10" style={{ right: '24px' }} />
                )}
                {state.errors.emergencyContactName && (
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10" style={{ right: '24px' }}>
                    <AlertTriangle className="w-5 h-5 text-red-500 animate-shake" />
                  </div>
                )}
                </div>
                {state.errors.emergencyContactName && (
                  <p className="text-red-500 text-sm animate-fade-in-up">{state.errors.emergencyContactName}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'emergencyPhone':
        return (
          <div className="space-y-8 animate-fade-in-up">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-white shadow-lg rounded-full flex items-center justify-center ">
                <IconComponent className="w-10 h-10" style={{ color: '#378800' }} />
              </div>
            </div>
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold" style={{ fontFamily: 'Archivo, sans-serif', color: '#136C9E' }}>
                  {step.description}
                  {step.required && <span className="text-red-500 ml-1">*</span>}
                  {!step.required && step.id !== 'welcome' && step.id !== 'review' && step.id !== 'success' && <span className="text-gray-500 ml-2 font-normal">(Optional)</span>}
                </h1>
                <p className="text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>Include country code for international numbers</p>
              </div>
              <div className="space-y-3">
                <div className="relative group">
                  <Input
                    id="emergencyPhone"
                    type="tel"
                    value={state.formData.emergencyContactPhone}
                    onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                    onFocus={() => handleInputFocus('emergencyContactPhone')}
                    onBlur={() => handleInputBlur()}
                    className={`w-full text-lg py-6 px-6 border-2 transition-all duration-300 rounded-2xl focus:border-[#4E97CC] focus:ring-2 focus:ring-[#8FCDFF] focus:ring-opacity-50 focus:outline-none ${
                      state.focusedField === 'emergencyContactPhone' || state.formData.emergencyContactPhone
                        ? 'bg-white shadow-lg '
                        : 'border-gray-300 bg-gray-50'
                    } ${state.errors.emergencyContactPhone ? 'border-red-500 animate-shake' : ''}`}
                    style={{ 
                      fontFamily: 'Archivo, sans-serif',
                      borderColor: state.focusedField === 'emergencyContactPhone' || state.formData.emergencyContactPhone ? '#4E97CC' : undefined,
                      outline: 'none',
                      '--tw-ring-color': '#8FCDFF',
                      '--tw-ring-opacity': '0.5'
                    }}
                    placeholder="Enter emergency contact phone number"
                  />
                {state.formData.emergencyContactPhone && !state.errors.emergencyContactPhone && validateStep('emergencyPhone') && (
                  <CheckCircle className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 animate-bounce z-10" style={{ right: '24px' }} />
                )}
                {state.errors.emergencyContactPhone && (
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10" style={{ right: '24px' }}>
                    <AlertTriangle className="w-5 h-5 text-red-500 animate-shake" />
                  </div>
                )}
                </div>
                {state.errors.emergencyContactPhone && (
                  <p className="text-red-500 text-sm animate-fade-in-up">{state.errors.emergencyContactPhone}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'emergencyRelation':
        return (
          <div className="space-y-8 animate-fade-in-up">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-white shadow-lg rounded-full flex items-center justify-center ">
                <IconComponent className="w-10 h-10" style={{ color: '#378800' }} />
              </div>
            </div>
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold" style={{ fontFamily: 'Archivo, sans-serif', color: '#136C9E' }}>
                  {step.description}
                  {step.required && <span className="text-red-500 ml-1">*</span>}
                  {!step.required && step.id !== 'welcome' && step.id !== 'review' && step.id !== 'success' && <span className="text-gray-500 ml-2 font-normal">(Optional)</span>}
                </h1>
                <p className="text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>How are they related to the tenant?</p>
              </div>
              <div className="space-y-3">
                <div className="relative group">
                  <Select
                    value={state.formData.emergencyContactRelationship}
                    onValueChange={(value) => handleInputChange('emergencyContactRelationship', value)}
                  >
                    <SelectTrigger className={`w-full text-lg py-6 px-6 border-2 transition-all duration-300 rounded-2xl focus:border-[#4E97CC] focus:ring-2 focus:ring-[#8FCDFF] focus:ring-opacity-50 focus:outline-none focus:ring-0 focus:ring-transparent focus-visible:ring-0 focus-visible:ring-transparent ${
                      state.formData.emergencyContactRelationship
                        ? 'bg-white shadow-lg '
                        : 'border-gray-300 bg-gray-50'
                    }`} style={{
                      borderColor: state.formData.emergencyContactRelationship ? '#4E97CC' : undefined,
                      boxShadow: 'none',
                      outline: 'none',
                      fontFamily: 'Archivo, sans-serif'
                    }}>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spouse">Spouse</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="friend">Friend</SelectItem>
                      <SelectItem value="colleague">Colleague</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                {state.formData.emergencyContactRelationship && !state.errors.emergencyContactRelationship && validateStep('emergencyRelation') && (
                  <CheckCircle className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 animate-bounce z-10" style={{ right: '24px' }} />
                )}
                {state.errors.emergencyContactRelationship && (
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10" style={{ right: '24px' }}>
                    <AlertTriangle className="w-5 h-5 text-red-500 animate-shake" />
                  </div>
                )}
                </div>
                {state.errors.emergencyContactRelationship && (
                  <p className="text-red-500 text-sm animate-fade-in-up">{state.errors.emergencyContactRelationship}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'employment':
        return (
          <div className="space-y-8 animate-fade-in-up">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-white shadow-lg rounded-full flex items-center justify-center ">
                <IconComponent className="w-10 h-10" style={{ color: '#378800' }} />
              </div>
            </div>
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold" style={{ fontFamily: 'Archivo, sans-serif', color: '#136C9E' }}>
                  {step.description}
                  {step.required && <span className="text-red-500 ml-1">*</span>}
                  {!step.required && step.id !== 'welcome' && step.id !== 'review' && step.id !== 'success' && <span className="text-gray-500 ml-2 font-normal">(Optional)</span>}
                </h1>
                <p className="text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>What is their current employment status?</p>
              </div>
              <div className="space-y-3">
                <div className="relative group">
                  <Select
                    value={state.formData.employmentType}
                    onValueChange={(value) => handleInputChange('employmentType', value)}
                  >
                    <SelectTrigger className={`w-full text-lg py-6 px-6 border-2 transition-all duration-300 rounded-2xl focus:border-[#4E97CC] focus:ring-2 focus:ring-[#8FCDFF] focus:ring-opacity-50 focus:outline-none focus:ring-0 focus:ring-transparent focus-visible:ring-0 focus-visible:ring-transparent ${
                      state.formData.employmentType
                        ? 'bg-white shadow-lg '
                        : 'border-gray-300 bg-gray-50'
                    }`} style={{
                      borderColor: state.formData.employmentType ? '#4E97CC' : undefined,
                      boxShadow: 'none',
                      outline: 'none',
                      fontFamily: 'Archivo, sans-serif'
                    }}>
                      <SelectValue placeholder="Select employment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="self-employed">Self-employed</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="unemployed">Unemployed</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {state.errors.employmentType && (
                  <p className="text-red-500 text-sm animate-fade-in-up">{state.errors.employmentType}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'income':
        return (
          <div className="space-y-8 animate-fade-in-up">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-white shadow-lg rounded-full flex items-center justify-center ">
                <IconComponent className="w-10 h-10" style={{ color: '#378800' }} />
              </div>
            </div>
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold" style={{ fontFamily: 'Archivo, sans-serif', color: '#136C9E' }}>
                  {step.description}
                  {step.required && <span className="text-red-500 ml-1">*</span>}
                  {!step.required && step.id !== 'welcome' && step.id !== 'review' && step.id !== 'success' && <span className="text-gray-500 ml-2 font-normal">(Optional)</span>}
                </h1>
                <p className="text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>Annual income in pounds</p>
              </div>
              <div className="space-y-3">
                <div className="relative group">
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-medium pointer-events-none" style={{ fontFamily: 'Archivo, sans-serif' }}>£</span>
                    <Input
                      id="income"
                      type="text"
                      value={state.formData.annualIncome ? formatCurrency(state.formData.annualIncome) : ''}
                      onChange={(e) => {
                        const rawValue = parseCurrency(e.target.value);
                        handleInputChange('annualIncome', rawValue);
                      }}
                      onFocus={() => handleInputFocus('annualIncome')}
                      onBlur={() => handleInputBlur()}
                      className={`w-full text-lg py-6 pr-6 border-2 transition-all duration-300 rounded-2xl focus:border-[#4E97CC] focus:ring-2 focus:ring-[#8FCDFF] focus:ring-opacity-50 focus:outline-none ${
                        state.focusedField === 'annualIncome' || state.formData.annualIncome
                          ? 'bg-white shadow-lg '
                          : 'border-gray-300 bg-gray-50'
                      } ${state.errors.annualIncome ? 'border-red-500 animate-shake' : ''}`}
                      style={{ 
                        fontFamily: 'Archivo, sans-serif',
                        borderColor: state.focusedField === 'annualIncome' || state.formData.annualIncome ? '#4E97CC' : undefined,
                        boxShadow: 'none',
                        outline: 'none',
                        paddingLeft: '38px'
                      }}
                      placeholder="Enter annual income"
                    />
                    {state.formData.annualIncome && !state.errors.annualIncome && validateStep('income') && (
                      <CheckCircle className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 animate-bounce z-10" style={{ right: '24px' }} />
                    )}
                    {state.errors.annualIncome && (
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10" style={{ right: '24px' }}>
                        <AlertTriangle className="w-5 h-5 text-red-500 animate-shake" />
                      </div>
                    )}
                  </div>
                </div>
                {state.errors.annualIncome && (
                  <p className="text-red-500 text-sm animate-fade-in-up">{state.errors.annualIncome}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'notes':
        return (
          <div className="space-y-8 animate-fade-in-up">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-white shadow-lg rounded-full flex items-center justify-center ">
                <IconComponent className="w-10 h-10" style={{ color: '#378800' }} />
              </div>
            </div>
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold" style={{ fontFamily: 'Archivo, sans-serif', color: '#136C9E' }}>
                  {step.description}
                  {step.required && <span className="text-red-500 ml-1">*</span>}
                  {!step.required && step.id !== 'welcome' && step.id !== 'review' && step.id !== 'success' && <span className="text-gray-500 ml-2 font-normal">(Optional)</span>}
                </h1>
                <p className="text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>Any additional information about the tenant?</p>
              </div>
              <div className="space-y-3">
                <div className="relative group">
                  <Textarea
                    id="notes"
                    value={state.formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    onFocus={() => handleInputFocus('notes')}
                    onBlur={() => handleInputBlur()}
                    className={`w-full text-lg py-6 px-6 border-2 transition-all duration-300 rounded-2xl min-h-[120px] focus:border-[#4E97CC] focus:ring-2 focus:ring-[#8FCDFF] focus:ring-opacity-50 focus:outline-none ${
                      state.focusedField === 'notes' || state.formData.notes
                        ? 'bg-white shadow-lg '
                        : 'border-gray-300 bg-gray-50'
                    } ${state.errors.notes ? 'border-red-500 animate-shake' : ''}`}
                    style={{ 
                      fontFamily: 'Archivo, sans-serif',
                      borderColor: state.focusedField === 'notes' || state.formData.notes ? '#4E97CC' : undefined,
                      outline: 'none',
                      '--tw-ring-color': '#8FCDFF',
                      '--tw-ring-opacity': '0.5'
                    }}
                    placeholder="Enter any additional notes about the tenant..."
                  />
                </div>
                {state.errors.notes && (
                  <p className="text-red-500 text-sm animate-fade-in-up">{state.errors.notes}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-8 animate-fade-in-up">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center ">
                <IconComponent className="w-10 h-10 text-white" />
              </div>
            </div>
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold" style={{ fontFamily: 'Archivo, sans-serif', color: '#136C9E' }}>
                  {step.description}
                  {step.required && <span className="text-red-500 ml-1">*</span>}
                  {!step.required && step.id !== 'welcome' && step.id !== 'review' && step.id !== 'success' && <span className="text-gray-500 ml-2 font-normal">(Optional)</span>}
                </h1>
                <p className="text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>Please review all information before submitting</p>
            </div>
            <div className="space-y-4">
                <Card className="p-6">
                  <CardHeader>
                    <CardTitle style={{ fontFamily: 'Archivo, sans-serif' }}>Tenant Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>Name</Label>
                        <p className="text-lg" style={{ fontFamily: 'Archivo, sans-serif' }}>{state.formData.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>Email</Label>
                        <p className="text-lg" style={{ fontFamily: 'Archivo, sans-serif' }}>{state.formData.email}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>Phone</Label>
                        <p className="text-lg" style={{ fontFamily: 'Archivo, sans-serif' }}>{state.formData.phone}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>Rent Amount</Label>
                        <p className="text-lg" style={{ fontFamily: 'Archivo, sans-serif' }}>£{state.formData.rentAmount}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>Payment Frequency</Label>
                        <p className="text-lg capitalize" style={{ fontFamily: 'Archivo, sans-serif' }}>
                          {state.formData.paymentFrequency === 'fixed-time' ? 'Fixed Time' : state.formData.paymentFrequency.charAt(0).toUpperCase() + state.formData.paymentFrequency.slice(1)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>First Payment Date</Label>
                        <p className="text-lg" style={{ fontFamily: 'Archivo, sans-serif' }}>{state.formData.firstPaymentDate || 'Not set'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>Lease Start</Label>
                        <p className="text-lg" style={{ fontFamily: 'Archivo, sans-serif' }}>{state.formData.leaseStart}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>Lease End</Label>
                        <p className="text-lg" style={{ fontFamily: 'Archivo, sans-serif' }}>{state.formData.leaseEnd}</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <h3 className="font-semibold mb-2" style={{ fontFamily: 'Archivo, sans-serif' }}>Emergency Contact</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>Name</Label>
                          <p className="text-lg" style={{ fontFamily: 'Archivo, sans-serif' }}>{state.formData.emergencyContactName}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>Phone</Label>
                          <p className="text-lg" style={{ fontFamily: 'Archivo, sans-serif' }}>{state.formData.emergencyContactPhone}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>Relationship</Label>
                          <p className="text-lg" style={{ fontFamily: 'Archivo, sans-serif' }}>{state.formData.emergencyContactRelationship}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-8 animate-fade-in-up">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-white shadow-lg rounded-full flex items-center justify-center ">
                <IconComponent className="w-10 h-10" style={{ color: '#378800' }} />
              </div>
            </div>
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold" style={{ fontFamily: 'Archivo, sans-serif', color: '#136C9E' }}>
                  {step.description}
                  {step.required && <span className="text-red-500 ml-1">*</span>}
                  {!step.required && step.id !== 'welcome' && step.id !== 'review' && step.id !== 'success' && <span className="text-gray-500 ml-2 font-normal">(Optional)</span>}
                </h1>
                <p className="text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>Select the {step.id === 'leaseStart' ? 'start' : step.id === 'leaseEnd' ? 'end' : 'date'}</p>
              </div>
              <div className="space-y-3">
                <div className="relative group">
                  <Input
                    id={step.id}
                    type="date"
                    value={state.formData[step.id as keyof TenantFormData] as string || ''}
                    onChange={(e) => handleInputChange(step.id as keyof TenantFormData, e.target.value)}
                    onFocus={() => handleInputFocus(step.id)}
                    onBlur={() => handleInputBlur()}
                    className={`w-full text-lg py-6 px-6 border-2 transition-all duration-300 rounded-2xl focus:border-[#4E97CC] focus:ring-2 focus:ring-[#8FCDFF] focus:ring-opacity-50 focus:outline-none ${
                      state.focusedField === step.id || state.formData[step.id as keyof TenantFormData]
                        ? 'bg-white shadow-lg '
                        : 'border-gray-300 bg-gray-50'
                    } ${state.errors[step.id as keyof TenantFormData] ? 'border-red-500 animate-shake' : ''}`}
                    style={{ 
                      fontFamily: 'Archivo, sans-serif',
                      borderColor: state.focusedField === step.id || state.formData[step.id as keyof TenantFormData] ? '#4E97CC' : undefined,
                      outline: 'none',
                      '--tw-ring-color': '#8FCDFF',
                      '--tw-ring-opacity': '0.5'
                    }}
                  />
                {state.formData[step.id as keyof TenantFormData] && !state.errors[step.id as keyof TenantFormData] && validateStep(step.id) && (
                  <CheckCircle className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 animate-bounce z-10" style={{ right: '24px' }} />
                )}
                {state.errors[step.id as keyof TenantFormData] && (
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10" style={{ right: '24px' }}>
                    <AlertTriangle className="w-5 h-5 text-red-500 animate-shake" />
                  </div>
                )}
                </div>
                {state.errors[step.id as keyof TenantFormData] && (
                  <p className="text-red-500 text-sm animate-fade-in-up">{state.errors[step.id as keyof TenantFormData]}</p>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex flex-col relative"
      style={{ 
        backgroundImage: 'url(/assets/add_prp_slide/addtenbg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        width: '100%'
      }}
      role="main"
      aria-label="Add Tenant Form"
      aria-describedby="form-description"
    >
      {/* Mini Floating Navigation - Left Side */}
      <div className="fixed z-20" style={{ left: '40px', top: '50%', transform: 'translateY(-50%)' }}>
        <div className={`bg-white rounded-lg shadow-lg border border-gray-200 transition-all duration-500 ease-in-out ${
          isNavCollapsed ? 'p-4' : 'p-3'
        }`}
        style={{ width: isNavCollapsed ? '64px' : '280px', height: isNavCollapsed ? '64px' : 'auto' }}>
          {isNavCollapsed ? (
            <div className="w-full h-full flex items-center justify-center">
              <button
                onClick={() => setIsNavCollapsed(!isNavCollapsed)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors duration-200 rounded-lg"
                title="Expand navigation"
              >
                <svg 
                  className="w-5 h-5 text-gray-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              {/* Toggle Button */}
              <button
                onClick={() => setIsNavCollapsed(!isNavCollapsed)}
                className="w-full flex items-center justify-center mb-2 p-1 rounded-md hover:bg-gray-100 transition-colors duration-200"
                title="Collapse navigation"
              >
                <svg 
                  className="w-4 h-4 text-gray-600 transition-transform duration-200" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            <div className="flex flex-col space-y-2 animate-slide-in-left">
              {FORM_STEPS.map((step, index) => {
                const isCurrentStep = index === state.currentStep;
                const isCompleted = state.completedSteps.has(index);
                const isSkipped = state.skippedSteps.has(index);
                
                return (
                  <button
                    key={step.id}
                    onClick={() => {
                      if (index < state.currentStep || isCompleted || isSkipped) {
                        dispatch({ type: 'SET_CURRENT_STEP', step: index });
                      }
                    }}
                    className={`flex items-center space-x-2 px-1.5 rounded-lg transition-all duration-200 ${
                      isCurrentStep
                        ? 'border text-[#136C9E]'
                        : isCompleted
                        ? 'bg-green-50 border border-green-200 text-green-700 hover:bg-green-100'
                        : isSkipped
                        ? 'bg-yellow-50 border border-yellow-200 text-yellow-700 hover:bg-yellow-100'
                        : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
                    } ${index < state.currentStep || isCompleted || isSkipped ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                    style={{
                      paddingTop: '6px',
                      paddingBottom: '6px',
                      ...(isCurrentStep ? { backgroundColor: '#E6F3FF', borderColor: '#136C9E' } : {})
                    }}
                    disabled={index > state.currentStep && !isCompleted && !isSkipped}
                    title={step.description}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCurrentStep
                        ? 'text-white'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : isSkipped
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                    style={isCurrentStep ? { backgroundColor: '#136C9E' } : {}}
                    >
                      {isCompleted ? '✓' : isSkipped ? '○' : index + 1}
                    </div>
                    <span className="font-medium truncate" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957', fontSize: '13px' }}>
                      {step.title}
                    </span>
                  </button>
                );
              })}
            </div>
            </>
          )}
        </div>
      </div>

      {/* Information Section - Lower Right */}
      <div className="absolute z-10" style={{ bottom: '120px', right: '60px' }}>
        <div 
          className={`bg-blue-50 rounded-xl border border-blue-200 shadow-lg transition-all duration-300 cursor-pointer ${
            isGuidelinesExpanded ? 'p-6 max-w-lg' : 'p-4'
          }`}
          style={isGuidelinesExpanded ? {} : { width: '64px', height: '64px' }}
          onClick={() => setIsGuidelinesExpanded(!isGuidelinesExpanded)}
        >
          {isGuidelinesExpanded ? (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#136C9E' }}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>
                  Form Guidelines
                </h3>
                <p className="text-sm leading-relaxed" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>
                  Questions marked with a <span className="text-red-500 font-bold">*</span> are required and must be completed to proceed.
                  <br />
                  You can use the "Skip" button for optional questions or leave them blank.
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#136C9E' }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Form Description - Hidden but accessible */}
      <div id="form-description" className="sr-only">
        Multi-step form for adding a new tenant. Use Ctrl/Cmd + Arrow keys to navigate between steps, or use the Previous/Next buttons.
      </div>

      {/* Global Error Display */}
      {state.globalError && (
        <div className="w-full bg-red-50 border-l-4 border-red-400 p-4 mb-4" role="alert">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{state.globalError}</p>
              {state.isRetrying && (
                <p className="text-xs text-red-600 mt-1">Retrying...</p>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Progress Bar */}
      <div className="w-full bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6" style={{ paddingTop: '20px', paddingBottom: '20px' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>
              Step {state.currentStep + 1} of {FORM_STEPS.length}
            </span>
            <span className="text-sm text-gray-500" style={{ fontFamily: 'Archivo, sans-serif' }}>
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 relative">
            <div
              className="bg-gradient-to-r from-[#DC5F12] to-[#DC5F12] h-2 rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #DC5F12 0%, #DC5F12 100%)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl mx-auto">
          <div 
            className={`transition-all duration-700 ease-out ${
              state.isTransitioning 
                ? 'opacity-0 transform scale-75' 
                : 'opacity-100 transform scale-100'
            }`}
          >
            {/* Step Content */}
            {renderCurrentStep()}
          </div>
        </div>
      </div>


      {/* Navigation */}
      <div className="w-full bg-white shadow-lg border-t border-gray-200 ">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={state.currentStep === 0 ? onBack : goToPreviousStep}
              className="flex items-center space-x-2"
              style={{ fontFamily: 'Archivo, sans-serif' }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{state.currentStep === 0 ? 'Back to Selection' : 'Previous'}</span>
            </Button>

            {state.currentStep < FORM_STEPS.length - 1 ? (
              <div className="flex items-center space-x-3">
                {isCurrentStepOptional() && (
                  <button
                    onClick={skipCurrentStep}
                    disabled={state.isTransitioning || state.isLoading}
                    className="text-gray-500 hover:text-gray-700 px-4 py-2 rounded-full transition-all duration-300 hover:bg-gray-100 font-medium"
                    style={{ fontFamily: 'Archivo, sans-serif' }}
                  >
                    Skip
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    // Force validation check with current state
                    const currentStepInfo = FORM_STEPS[state.currentStep];
                    const isValid = currentStepInfo ? validateStep(currentStepInfo.id) : true;
                    console.log('🔍 Continue clicked - Step:', state.currentStep, 'Valid:', isValid, 'Data:', state.formData);
                    if (isValid && !state.isTransitioning && !state.isLoading) {
                      goToNextStep();
                    } else {
                      console.log('⚠️ Cannot proceed - Valid:', isValid, 'Transitioning:', state.isTransitioning, 'Loading:', state.isLoading);
                    }
                  }}
                  disabled={state.isTransitioning || state.isLoading || !isCurrentStepValid}
                  className={`px-8 py-3 rounded-full flex items-center space-x-2 transition-all duration-300 min-w-[140px] font-medium ${
                    isCurrentStepValid 
                      ? 'bg-gradient-to-r from-[#DC5F12] to-[#DC5F12]/80 hover:from-[#DC5F12]/90 hover:to-[#DC5F12]/70 text-white hover:scale-105 hover:shadow-lg' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                  style={{
                    background: isCurrentStepValid ? 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)' : '#D1D5DB',
                    boxShadow: isCurrentStepValid ? '0 4px 14px 0 rgba(220, 95, 18, 0.39)' : 'none',
                    border: 'none',
                    outline: 'none',
                    fontFamily: 'Archivo, sans-serif'
                  }}
                >
                  {state.isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            ) : state.currentStep === FORM_STEPS.length - 2 ? (
              <button
                onClick={handleSubmit}
                disabled={state.isTransitioning || state.isLoading}
                className="bg-gradient-to-r from-[#DC5F12] to-[#DC5F12]/80 hover:from-[#DC5F12]/90 hover:to-[#DC5F12]/70 text-white px-8 py-3 rounded-full flex items-center space-x-2 transition-all duration-300 hover:scale-105 hover: disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-[140px] font-medium"
                style={{
                  background: 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)',
                  boxShadow: '0 4px 14px 0 rgba(220, 95, 18, 0.39)',
                  border: 'none',
                  outline: 'none'
                }}
              >
                {state.isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Save Tenant</span>
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={async () => {
                  if (!isSaved) {
                    await handleSubmit();
                  }
                  onBack();
                }}
                className="bg-gradient-to-r from-[#DC5F12] to-[#DC5F12]/80 hover:from-[#DC5F12]/90 hover:to-[#DC5F12]/70 text-white px-8 py-3 rounded-full transition-all duration-300 hover:scale-105 hover: min-w-[140px] font-medium"
                style={{
                  background: 'linear-gradient(135deg, #DC5F12 0%, #DC5F12 100%)',
                  boxShadow: '0 4px 14px 0 rgba(220, 95, 18, 0.39)',
                  border: 'none',
                  outline: 'none'
                }}
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Phase 4: Form Testing Utilities
export const FormTestUtils = {
  // Helper to validate form data structure
  validateFormData: (formData: TenantFormData): boolean => {
    const requiredFields = ['name', 'email', 'phone', 'propertyId', 'rentAmount', 'leaseStart', 'leaseEnd'];
    return requiredFields.every(field => formData[field as keyof TenantFormData]);
  },

  // Helper to generate test form data
  generateTestData: (): TenantFormData => ({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+44 7911 123456',
    propertyId: '1',
    propertyAddress: '123 Test Street',
    rentAmount: '1500',
    leaseStart: '2024-01-01',
    leaseEnd: '2025-01-01',
    status: 'pending',
    referencingStatus: 'not-started',
    paymentStatus: 'current',
    emergencyContactName: 'Jane Doe',
    emergencyContactPhone: '+44 7911 654321',
    emergencyContactRelationship: 'Spouse',
    defaultRiskScore: '75',
    notes: 'Test tenant data',
    employer: 'Test Company',
    jobTitle: 'Software Developer',
    annualIncome: '50000',
    employmentType: 'full-time',
    previousLandlordName: 'Previous Landlord',
    previousLandlordPhone: '+44 7911 999999',
    previousRentAmount: '1400',
    previousLeaseStart: '2022-01-01',
    previousLeaseEnd: '2023-01-01',
    previousLandlordReference: 'Good tenant',
    bankName: 'Test Bank',
    accountNumber: '12345678',
    sortCode: '12-34-56',
    documentsUploaded: []
  }),

  // Helper to check if form step is valid
  isStepValid: (stepId: string, formData: TenantFormData): boolean => {
    switch (stepId) {
      case 'name':
        return formData.name.trim().length >= 2;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(formData.email);
      case 'phone':
        const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
        return phoneRegex.test(formData.phone);
      case 'property':
        return !!formData.propertyId;
      case 'rent':
        return !isNaN(parseFloat(formData.rentAmount)) && parseFloat(formData.rentAmount) > 0;
      case 'leaseStart':
      case 'leaseEnd':
        return !!formData[stepId as keyof TenantFormData] && new Date(formData[stepId as keyof TenantFormData] as string) >= new Date();
      case 'emergencyName':
        return !!formData.emergencyContactName;
      case 'emergencyPhone':
        return !!formData.emergencyContactPhone;
      case 'emergencyRelation':
        return !!formData.emergencyContactRelationship;
      case 'employment':
        return true; // Employment is optional
      case 'income':
        return !formData.annualIncome || (!isNaN(parseFloat(formData.annualIncome)) && parseFloat(formData.annualIncome) > 0);
      case 'notes':
        return true; // Notes are optional
      default:
        return true;
    }
  }
};