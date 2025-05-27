import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
}

interface PropertyDetails {
  id?: string;
  street: string;
  town: string;
  city: string;
  postcode: string;
  agent: Agent;
}

interface ViewingDetails {
  date: Date | null;
  time: Date | null;
  preference: string;
}

interface BookViewingState {
  selectedProperty: PropertyDetails | null;
  viewingDetails: ViewingDetails | null;
  isLoading: boolean;
  error: string | null;
}

// Action types
type ActionType =
  | { type: 'UPDATE_PROPERTY'; payload: Partial<PropertyDetails> }
  | { type: 'UPDATE_VIEWING_DETAILS'; payload: Partial<ViewingDetails> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: BookViewingState = {
  selectedProperty: {
    street: '',
    town: '',
    city: '',
    postcode: '',
    agent: {
      id: '',
      name: '',
      email: '',
      phone: '',
      company: ''
    }
  },
  viewingDetails: {
    date: null,
    time: null,
    preference: ''
  },
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
    case 'UPDATE_PROPERTY':
      return {
        ...state,
        selectedProperty: {
          ...state.selectedProperty,
          ...action.payload,
          agent: {
            ...state.selectedProperty?.agent,
            ...(action.payload.agent || {})
          }
        }
      };
    case 'UPDATE_VIEWING_DETAILS':
      return {
        ...state,
        viewingDetails: {
          ...state.viewingDetails,
          ...action.payload
        }
      };
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

export type { BookViewingState, PropertyDetails, ViewingDetails, Agent }; 