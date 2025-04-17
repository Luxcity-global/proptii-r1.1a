import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
export interface Property {
  id: string;
  title: string;
  price: string;
  location: string;
  image: string;
  specs: {
    beds: number;
    baths: number;
    area: string;
  };
  propertyUrl?: string;
  agentDetails?: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface ViewingSchedule {
  date: Date | null;
  time: string | null;
}

export interface Requirement {
  id: number;
  text: string;
  matched: boolean;
}

export interface BookViewingState {
  selectedProperty: Property | null;
  propertyResults: Property[];
  viewingSchedule: ViewingSchedule;
  requirements: Requirement[];
  comparisonProperties: Property[];
  isLoading: boolean;
  error: string | null;
}

// Action types
type ActionType =
  | { type: 'SET_PROPERTY'; payload: Property }
  | { type: 'SET_PROPERTY_RESULTS'; payload: Property[] }
  | { type: 'SET_SCHEDULE'; payload: ViewingSchedule }
  | { type: 'SET_REQUIREMENTS'; payload: Requirement[] }
  | { type: 'SET_COMPARISON'; payload: Property[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: BookViewingState = {
  selectedProperty: null,
  propertyResults: [],
  viewingSchedule: { date: null, time: null },
  requirements: [],
  comparisonProperties: [],
  isLoading: false,
  error: null
};

// Context
const BookViewingContext = createContext<{
  state: BookViewingState;
  dispatch: React.Dispatch<ActionType>;
} | undefined>(undefined);

// Reducer
function bookViewingReducer(state: BookViewingState, action: ActionType): BookViewingState {
  switch (action.type) {
    case 'SET_PROPERTY':
      return { ...state, selectedProperty: action.payload };
    case 'SET_PROPERTY_RESULTS':
      return { ...state, propertyResults: action.payload };
    case 'SET_SCHEDULE':
      return { ...state, viewingSchedule: action.payload };
    case 'SET_REQUIREMENTS':
      return { ...state, requirements: action.payload };
    case 'SET_COMPARISON':
      return { ...state, comparisonProperties: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

// Provider component
export function BookViewingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bookViewingReducer, initialState);

  return (
    <BookViewingContext.Provider value={{ state, dispatch }}>
      {children}
    </BookViewingContext.Provider>
  );
}

// Custom hook for using the context
export function useBookViewing() {
  const context = useContext(BookViewingContext);
  if (context === undefined) {
    throw new Error('useBookViewing must be used within a BookViewingProvider');
  }
  return context;
} 