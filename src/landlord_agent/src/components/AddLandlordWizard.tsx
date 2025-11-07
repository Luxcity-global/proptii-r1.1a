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
import { landlordService, type LandlordRecord } from '../services/landlordService';
import { UserProfile } from '../App';

interface AddLandlordWizardProps {
  onBack: () => void;
  onSaved?: (id: string) => void;
  userProfile?: UserProfile | null;
}

// Define form steps for Typeform-style progression
const FORM_STEPS = [
  { id: 'welcome', title: 'Hello Sarah', icon: UserPlus, description: "Let's add your new landlord" },
  { id: 'name', title: 'Full Name', icon: User, required: true, description: "What's the landlord's full name?" },
  { id: 'email', title: 'Email Address', icon: Mail, required: true, description: "What's their email address?" },
  { id: 'phone', title: 'Phone Number', icon: Phone, required: true, description: "What's their phone number?" },
  { id: 'company', title: 'Company Name', icon: Building, required: false, description: "What's their company name?" },
  { id: 'address', title: 'Address', icon: MapPin, required: false, description: "What's their address?" },
  { id: 'portfolioProps', title: 'Total Properties', icon: Home, required: false, description: "How many properties do they own?" },
  { id: 'portfolioValue', title: 'Portfolio Value', icon: PoundSterling, required: false, description: "What's the total portfolio value?" },
  { id: 'portfolioIncome', title: 'Monthly Income', icon: CreditCard, required: false, description: "What's their monthly rental income?" },
  { id: 'notes', title: 'Additional Notes', icon: FileText, required: false, description: "Any additional information?" },
  { id: 'review', title: 'Review & Confirm', icon: CheckCircle, description: "Review all information" },
  { id: 'success', title: 'Success', icon: UserPlus, description: "Landlord added successfully!" }
];

interface LandlordFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  portfolioProps: string;
  portfolioValue: string;
  portfolioIncome: string;
  notes: string;
}

// Phase 4: Advanced State Management Interfaces
interface FormState {
  formData: LandlordFormData;
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
    company: '',
    address: '',
    portfolioProps: '',
    portfolioValue: '',
    portfolioIncome: '',
    notes: ''
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
      return {
        ...state,
        ...action.state
      };
    
    default:
      return state;
  }
}

export function AddLandlordWizard({ onBack, onSaved, userProfile }: AddLandlordWizardProps) {
  // Phase 4: Replace useState with useReducer for advanced state management
  const [state, dispatch] = useReducer(formReducer, initialFormState);
  const [isGuidelinesExpanded, setIsGuidelinesExpanded] = useState(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

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

  // Load progress on component mount
  useEffect(() => {
    const loaded = loadProgress();
    if (!loaded) {
      applySmartDefaults(FORM_STEPS[0].id);
    }
  }, []);

  // Auto-save progress with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      saveProgress();
    }, 1000); // Debounce saves

    return () => clearTimeout(timer);
  }, [state.formData, state.currentStep, state.completedSteps, state.skippedSteps]);

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


  // Apply smart defaults when entering certain steps
  useEffect(() => {
    const currentStepInfo = FORM_STEPS[state.currentStep];
    if (currentStepInfo) {
      applySmartDefaults(currentStepInfo.id);
    }
  }, [state.currentStep]);


  // Phase 4: Performance optimization with useCallback
  const handleInputChange = useCallback((field: keyof LandlordFormData, value: string) => {
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
  const validateField = (field: keyof LandlordFormData, value: string) => {
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
      case 'company':
      case 'address':
      case 'notes':
        // Optional fields - no validation needed
        break;
      case 'portfolioProps':
        if (value.trim() && (isNaN(parseInt(value)) || parseInt(value) < 0)) {
          isValid = false;
          errorMessage = 'Please enter a valid number of properties';
        }
        break;
      case 'portfolioValue':
      case 'portfolioIncome':
        if (value.trim() && (isNaN(parseFloat(value)) || parseFloat(value) < 0)) {
          isValid = false;
          errorMessage = 'Please enter a valid amount';
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
    // No smart defaults needed for landlord fields
    // All fields are either required (user must fill) or optional (no defaults needed)
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
    localStorage.setItem('landlordFormProgress', JSON.stringify(progressData));
  };

  const loadProgress = () => {
    try {
      const saved = localStorage.getItem('landlordFormProgress');
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
      case 'company':
      case 'address':
      case 'notes':
        return true; // Optional fields
      case 'portfolioProps':
        return !state.formData.portfolioProps || (!isNaN(parseInt(state.formData.portfolioProps)) && parseInt(state.formData.portfolioProps) >= 0);
      case 'portfolioValue':
      case 'portfolioIncome':
        return !state.formData[stepId as keyof LandlordFormData] || (!isNaN(parseFloat(state.formData[stepId as keyof LandlordFormData] as string)) && parseFloat(state.formData[stepId as keyof LandlordFormData] as string) >= 0);
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

      // Create landlord object
      const landlordData: Omit<LandlordRecord, 'id' | 'createdAt'> = {
        name: state.formData.name,
        email: state.formData.email,
        phone: state.formData.phone,
        company: state.formData.company || undefined,
        address: state.formData.address || undefined,
        notes: state.formData.notes || undefined,
        portfolio: {
          totalProperties: state.formData.portfolioProps ? parseInt(state.formData.portfolioProps) : undefined,
          totalValue: state.formData.portfolioValue ? parseFloat(state.formData.portfolioValue) : undefined,
          monthlyIncome: state.formData.portfolioIncome ? parseFloat(state.formData.portfolioIncome) : undefined,
        }
      };

      // Call landlordService with retry logic
      let attempts = 0;
      const maxAttempts = 3;
      let landlordId: string | null = null;
      
      while (attempts < maxAttempts) {
        try {
          landlordId = await landlordService.createLandlord(landlordData);
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
      if (onSaved && landlordId) {
        onSaved(landlordId);
      }
      const successIndex = FORM_STEPS.findIndex(s => s.id === 'success');
      if (successIndex >= 0) {
        dispatch({ type: 'SET_CURRENT_STEP', step: successIndex });
      }

    } catch (error) {
      console.error('Failed to Save Landlord:', error);
      dispatch({ 
        type: 'SET_GLOBAL_ERROR', 
        error: error instanceof Error ? error.message : 'Failed to Save Landlord. Please try again.' 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', isLoading: false });
      dispatch({ type: 'SET_RETRYING', isRetrying: false });
    }
  }, [state.formData, state.errors, onSaved]);

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

      case 'company':
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
                <p className="text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>Enter their company name if applicable</p>
              </div>
              <div className="space-y-3">
              <div className="relative group">
                <Input
                  id="company"
                  type="text"
                  value={state.formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  onFocus={() => handleInputFocus('company')}
                  onBlur={() => handleInputBlur()}
                    className={`w-full text-lg py-6 px-6 border-2 transition-all duration-300 rounded-2xl focus:border-[#4E97CC] focus:ring-2 focus:ring-[#8FCDFF] focus:ring-opacity-50 focus:outline-none ${
                    state.focusedField === 'company' || state.formData.company
                        ? 'bg-white shadow-lg '
                      : 'border-gray-300 bg-gray-50'
                  } ${state.errors.company ? 'border-red-500 animate-shake' : ''}`}
                    style={{ 
                      fontFamily: 'Archivo, sans-serif',
                      borderColor: state.focusedField === 'company' || state.formData.company ? '#4E97CC' : undefined,
                      outline: 'none',
                      '--tw-ring-color': '#8FCDFF',
                      '--tw-ring-opacity': '0.5'
                    }}
                    placeholder="Enter company name"
                  />
                {state.formData.company && !state.errors.company && validateStep('company') && (
                  <CheckCircle className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 animate-bounce z-10" style={{ right: '24px' }} />
                )}
                {state.errors.company && (
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10" style={{ right: '24px' }}>
                    <AlertTriangle className="w-5 h-5 text-red-500 animate-shake" />
                  </div>
                )}
              </div>
              {state.errors.company && (
                <p className="text-red-500 text-sm animate-fade-in-up">{state.errors.company}</p>
              )}
              </div>
            </div>
          </div>
        );

      case 'address':
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
                <p className="text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>Enter their business or personal address</p>
              </div>
              <div className="space-y-3">
              <div className="relative group">
                <Input
                  id="address"
                  type="text"
                  value={state.formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  onFocus={() => handleInputFocus('address')}
                  onBlur={() => handleInputBlur()}
                    className={`w-full text-lg py-6 px-6 border-2 transition-all duration-300 rounded-2xl focus:border-[#4E97CC] focus:ring-2 focus:ring-[#8FCDFF] focus:ring-opacity-50 focus:outline-none ${
                    state.focusedField === 'address' || state.formData.address
                        ? 'bg-white shadow-lg '
                      : 'border-gray-300 bg-gray-50'
                  } ${state.errors.address ? 'border-red-500 animate-shake' : ''}`}
                    style={{ 
                      fontFamily: 'Archivo, sans-serif',
                      borderColor: state.focusedField === 'address' || state.formData.address ? '#4E97CC' : undefined,
                      outline: 'none',
                      '--tw-ring-color': '#8FCDFF',
                      '--tw-ring-opacity': '0.5'
                    }}
                    placeholder="Enter address"
                  />
                {state.formData.address && !state.errors.address && validateStep('address') && (
                  <CheckCircle className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 animate-bounce z-10" style={{ right: '24px' }} />
                )}
                {state.errors.address && (
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10" style={{ right: '24px' }}>
                    <AlertTriangle className="w-5 h-5 text-red-500 animate-shake" />
                  </div>
                )}
              </div>
              {state.errors.address && (
                <p className="text-red-500 text-sm animate-fade-in-up">{state.errors.address}</p>
              )}
              </div>
            </div>
          </div>
        );

      case 'portfolioProps':
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
                <p className="text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>Total number of properties in their portfolio</p>
              </div>
              <div className="space-y-3">
              <div className="relative group">
                <Input
                  id="portfolioProps"
                  type="number"
                  value={state.formData.portfolioProps}
                  onChange={(e) => handleInputChange('portfolioProps', e.target.value)}
                  onFocus={() => handleInputFocus('portfolioProps')}
                  onBlur={() => handleInputBlur()}
                    className={`w-full text-lg py-6 px-6 border-2 transition-all duration-300 rounded-2xl focus:border-[#4E97CC] focus:ring-2 focus:ring-[#8FCDFF] focus:ring-opacity-50 focus:outline-none ${
                    state.focusedField === 'portfolioProps' || state.formData.portfolioProps
                        ? 'bg-white shadow-lg '
                      : 'border-gray-300 bg-gray-50'
                  } ${state.errors.portfolioProps ? 'border-red-500 animate-shake' : ''}`}
                    style={{ 
                      fontFamily: 'Archivo, sans-serif',
                      borderColor: state.focusedField === 'portfolioProps' || state.formData.portfolioProps ? '#4E97CC' : undefined,
                      outline: 'none',
                      '--tw-ring-color': '#8FCDFF',
                      '--tw-ring-opacity': '0.5'
                    }}
                    placeholder="Enter number of properties"
                  />
                {state.formData.portfolioProps && !state.errors.portfolioProps && validateStep('portfolioProps') && (
                  <CheckCircle className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 animate-bounce z-10" style={{ right: '24px' }} />
                )}
                {state.errors.portfolioProps && (
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10" style={{ right: '24px' }}>
                    <AlertTriangle className="w-5 h-5 text-red-500 animate-shake" />
                  </div>
                )}
              </div>
              {state.errors.portfolioProps && (
                <p className="text-red-500 text-sm animate-fade-in-up">{state.errors.portfolioProps}</p>
              )}
              </div>
            </div>
          </div>
        );

      case 'portfolioValue':
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
                <p className="text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>Total value of their property portfolio in pounds</p>
              </div>
              <div className="space-y-3">
              <div className="relative group">
                <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-medium pointer-events-none" style={{ fontFamily: 'Archivo, sans-serif' }}>£</span>
                  <Input
                    id="portfolioValue"
                    type="text"
                    value={state.formData.portfolioValue ? formatCurrency(state.formData.portfolioValue) : ''}
                    onChange={(e) => {
                      const rawValue = parseCurrency(e.target.value);
                      handleInputChange('portfolioValue', rawValue);
                    }}
                    onFocus={() => handleInputFocus('portfolioValue')}
                    onBlur={() => handleInputBlur()}
                      className={`w-full text-lg py-6 pr-6 border-2 transition-all duration-300 rounded-2xl focus:border-[#4E97CC] focus:ring-2 focus:ring-[#8FCDFF] focus:ring-opacity-50 focus:outline-none ${
                      state.focusedField === 'portfolioValue' || state.formData.portfolioValue
                          ? 'bg-white shadow-lg '
                        : 'border-gray-300 bg-gray-50'
                    } ${state.errors.portfolioValue ? 'border-red-500 animate-shake' : ''}`}
                    style={{ 
                      fontFamily: 'Archivo, sans-serif',
                      borderColor: state.focusedField === 'portfolioValue' || state.formData.portfolioValue ? '#4E97CC' : undefined,
                      outline: 'none',
                      '--tw-ring-color': '#8FCDFF',
                      '--tw-ring-opacity': '0.5',
                      paddingLeft: '38px'
                    }}
                      placeholder="Enter portfolio value"
                    />
                </div>
                {state.formData.portfolioValue && !state.errors.portfolioValue && validateStep('portfolioValue') && (
                  <CheckCircle className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 animate-bounce z-10" style={{ right: '24px' }} />
                )}
                {state.errors.portfolioValue && (
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10" style={{ right: '24px' }}>
                    <AlertTriangle className="w-5 h-5 text-red-500 animate-shake" />
                  </div>
                )}
              </div>
              {state.errors.portfolioValue && (
                <p className="text-red-500 text-sm animate-fade-in-up">{state.errors.portfolioValue}</p>
              )}
              </div>
            </div>
          </div>
        );

      case 'portfolioIncome':
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
                <p className="text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>Monthly rental income in pounds</p>
              </div>
              <div className="space-y-3">
              <div className="relative group">
                <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-medium pointer-events-none" style={{ fontFamily: 'Archivo, sans-serif' }}>£</span>
                  <Input
                    id="portfolioIncome"
                    type="text"
                    value={state.formData.portfolioIncome ? formatCurrency(state.formData.portfolioIncome) : ''}
                    onChange={(e) => {
                      const rawValue = parseCurrency(e.target.value);
                      handleInputChange('portfolioIncome', rawValue);
                    }}
                    onFocus={() => handleInputFocus('portfolioIncome')}
                    onBlur={() => handleInputBlur()}
                      className={`w-full text-lg py-6 pr-6 border-2 transition-all duration-300 rounded-2xl focus:border-[#4E97CC] focus:ring-2 focus:ring-[#8FCDFF] focus:ring-opacity-50 focus:outline-none ${
                      state.focusedField === 'portfolioIncome' || state.formData.portfolioIncome
                          ? 'bg-white shadow-lg '
                        : 'border-gray-300 bg-gray-50'
                    } ${state.errors.portfolioIncome ? 'border-red-500 animate-shake' : ''}`}
                    style={{ 
                      fontFamily: 'Archivo, sans-serif',
                      borderColor: state.focusedField === 'portfolioIncome' || state.formData.portfolioIncome ? '#4E97CC' : undefined,
                      outline: 'none',
                      '--tw-ring-color': '#8FCDFF',
                      '--tw-ring-opacity': '0.5',
                      paddingLeft: '38px'
                    }}
                      placeholder="Enter monthly income"
                    />
                </div>
                {state.formData.portfolioIncome && !state.errors.portfolioIncome && validateStep('portfolioIncome') && (
                  <CheckCircle className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 animate-bounce z-10" style={{ right: '24px' }} />
                )}
                {state.errors.portfolioIncome && (
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10" style={{ right: '24px' }}>
                    <AlertTriangle className="w-5 h-5 text-red-500 animate-shake" />
                  </div>
                )}
              </div>
              {state.errors.portfolioIncome && (
                <p className="text-red-500 text-sm animate-fade-in-up">{state.errors.portfolioIncome}</p>
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
              <h1 className="font-bold" style={{ fontFamily: 'Archivo, sans-serif', fontSize: '2.5rem', color: '#136C9E' }}>{getStepTitle(step)}</h1>
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
                Add New Landlord
              </button>
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
                <p className="text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>Any additional information about the landlord?</p>
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
                    placeholder="Enter any additional notes about the landlord..."
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
                    <CardTitle style={{ fontFamily: 'Archivo, sans-serif' }}>Landlord Information</CardTitle>
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
                      {state.formData.company && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>Company</Label>
                          <p className="text-lg" style={{ fontFamily: 'Archivo, sans-serif' }}>{state.formData.company}</p>
                        </div>
                      )}
                      {state.formData.address && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>Address</Label>
                          <p className="text-lg" style={{ fontFamily: 'Archivo, sans-serif' }}>{state.formData.address}</p>
                        </div>
                      )}
                    </div>
                    {(state.formData.portfolioProps || state.formData.portfolioValue || state.formData.portfolioIncome) && (
                      <div className="pt-4 border-t">
                        <h3 className="font-semibold mb-2" style={{ fontFamily: 'Archivo, sans-serif' }}>Portfolio Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {state.formData.portfolioProps && (
                            <div>
                              <Label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>Total Properties</Label>
                              <p className="text-lg" style={{ fontFamily: 'Archivo, sans-serif' }}>{state.formData.portfolioProps}</p>
                            </div>
                          )}
                          {state.formData.portfolioValue && (
                            <div>
                              <Label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>Portfolio Value</Label>
                              <p className="text-lg" style={{ fontFamily: 'Archivo, sans-serif' }}>£{state.formData.portfolioValue}</p>
                            </div>
                          )}
                          {state.formData.portfolioIncome && (
                            <div>
                              <Label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>Monthly Income</Label>
                              <p className="text-lg" style={{ fontFamily: 'Archivo, sans-serif' }}>£{state.formData.portfolioIncome}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {state.formData.notes && (
                      <div className="pt-4 border-t">
                        <Label className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>Notes</Label>
                        <p className="text-lg" style={{ fontFamily: 'Archivo, sans-serif' }}>{state.formData.notes}</p>
                      </div>
                    )}
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
                <p className="text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>Enter the {step.description?.toLowerCase() || 'information'}</p>
              </div>
              <div className="space-y-3">
                <div className="relative group">
                  <Input
                    id={step.id}
                    type="date"
                    value={state.formData[step.id as keyof LandlordFormData] as string || ''}
                    onChange={(e) => handleInputChange(step.id as keyof LandlordFormData, e.target.value)}
                    onFocus={() => handleInputFocus(step.id)}
                    onBlur={() => handleInputBlur()}
                    className={`w-full text-lg py-6 px-6 border-2 transition-all duration-300 rounded-2xl focus:border-[#4E97CC] focus:ring-2 focus:ring-[#8FCDFF] focus:ring-opacity-50 focus:outline-none ${
                      state.focusedField === step.id || state.formData[step.id as keyof LandlordFormData]
                        ? 'bg-white shadow-lg '
                        : 'border-gray-300 bg-gray-50'
                    } ${state.errors[step.id as keyof LandlordFormData] ? 'border-red-500 animate-shake' : ''}`}
                    style={{ 
                      fontFamily: 'Archivo, sans-serif',
                      borderColor: state.focusedField === step.id || state.formData[step.id as keyof LandlordFormData] ? '#4E97CC' : undefined,
                      outline: 'none',
                      '--tw-ring-color': '#8FCDFF',
                      '--tw-ring-opacity': '0.5'
                    }}
                  />
                {state.formData[step.id as keyof LandlordFormData] && !state.errors[step.id as keyof LandlordFormData] && validateStep(step.id) && (
                  <CheckCircle className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 animate-bounce z-10" style={{ right: '24px' }} />
                )}
                {state.errors[step.id as keyof LandlordFormData] && (
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10" style={{ right: '24px' }}>
                    <AlertTriangle className="w-5 h-5 text-red-500 animate-shake" />
                  </div>
                )}
                </div>
                {state.errors[step.id as keyof LandlordFormData] && (
                  <p className="text-red-500 text-sm animate-fade-in-up">{state.errors[step.id as keyof LandlordFormData]}</p>
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
      aria-label="Add Landlord Form"
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
                      {getStepTitle(step)}
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
        Multi-step form for adding a new landlord. Use Ctrl/Cmd + Arrow keys to navigate between steps, or use the Previous/Next buttons.
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
                    <span>Save Landlord</span>
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
  validateFormData: (formData: LandlordFormData): boolean => {
    const requiredFields = ['name', 'email', 'phone'];
    return requiredFields.every(field => formData[field as keyof LandlordFormData]);
  },

  // Helper to generate test form data
  generateTestData: (): LandlordFormData => ({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+44 7911 123456',
    company: 'ABC Properties Ltd',
    address: '123 Business Street, London',
    portfolioProps: '5',
    portfolioValue: '2500000',
    portfolioIncome: '15000',
    notes: 'Test landlord data'
  }),

  // Helper to check if form step is valid
  isStepValid: (stepId: string, formData: LandlordFormData): boolean => {
    switch (stepId) {
      case 'name':
        return formData.name.trim().length >= 2;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(formData.email);
      case 'phone':
        const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
        return phoneRegex.test(formData.phone);
      case 'company':
      case 'address':
      case 'notes':
        return true; // Optional fields
      case 'portfolioProps':
        return !formData.portfolioProps || (!isNaN(parseInt(formData.portfolioProps)) && parseInt(formData.portfolioProps) >= 0);
      case 'portfolioValue':
      case 'portfolioIncome':
        return !formData[stepId as keyof LandlordFormData] || (!isNaN(parseFloat(formData[stepId as keyof LandlordFormData] as string)) && parseFloat(formData[stepId as keyof LandlordFormData] as string) >= 0);
      default:
        return true;
    }
  }
};
