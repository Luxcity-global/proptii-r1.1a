import React, { useReducer, useMemo, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import { User, Mail, Phone, Building2, MapPin, FileText, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { landlordService } from '../services/landlordService';

interface AddLandlordWizardProps {
  onBack: () => void;
  onSaved?: (id: string) => void;
}

const FORM_STEPS = [
  { id: 'welcome', title: 'Welcome', icon: User },
  { id: 'name', title: 'Landlord Name', icon: User, required: true },
  { id: 'email', title: 'Email', icon: Mail, required: true },
  { id: 'phone', title: 'Phone', icon: Phone, required: true },
  { id: 'company', title: 'Company', icon: Building2 },
  { id: 'address', title: 'Address', icon: MapPin },
  { id: 'portfolioProps', title: 'Total Properties', icon: Building2 },
  { id: 'portfolioValue', title: 'Portfolio Value', icon: PoundIcon },
  { id: 'portfolioIncome', title: 'Monthly Income', icon: PoundIcon },
  { id: 'notes', title: 'Notes', icon: FileText },
  { id: 'review', title: 'Review', icon: CheckCircle },
  { id: 'success', title: 'Success', icon: CheckCircle },
];

function PoundIcon(props: any) { return <span {...props}>£</span>; }

type WizardData = {
  name: string;
  email: string;
  phone: string;
  company?: string;
  address?: string;
  portfolioProps?: string;
  portfolioValue?: string;
  portfolioIncome?: string;
  notes?: string;
};

type State = { step: number; data: WizardData; saving: boolean; error?: string };
type Action = { type: 'next' } | { type: 'prev' } | { type: 'update'; field: keyof WizardData; value: string } | { type: 'saving'; value: boolean } | { type: 'error'; value?: string } | { type: 'goto'; step: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'next':
      return { ...state, step: Math.min(state.step + 1, FORM_STEPS.length - 1) };
    case 'prev':
      return { ...state, step: Math.max(state.step - 1, 0) };
    case 'goto':
      return { ...state, step: action.step };
    case 'update':
      return { ...state, data: { ...state.data, [action.field]: action.value } };
    case 'saving':
      return { ...state, saving: action.value };
    case 'error':
      return { ...state, error: action.value };
    default:
      return state;
  }
}

export function AddLandlordWizard({ onBack, onSaved }: AddLandlordWizardProps) {
  const [state, dispatch] = useReducer(reducer, { step: 0, data: { name: '', email: '', phone: '' }, saving: false });

  const current = useMemo(() => FORM_STEPS[state.step], [state.step]);

  const canContinue = useMemo(() => {
    switch (current.id) {
      case 'name':
        return state.data.name.trim().length >= 2;
      case 'email':
        return /^\S+@\S+\.\S+$/.test(state.data.email);
      case 'phone':
        return /[\d\+\-\s()]{7,}/.test(state.data.phone);
      default:
        return true;
    }
  }, [current.id, state.data]);

  const save = useCallback(async () => {
    try {
      dispatch({ type: 'saving', value: true });
      dispatch({ type: 'error', value: undefined });
      const id = await landlordService.createLandlord({
        name: state.data.name,
        email: state.data.email,
        phone: state.data.phone,
        company: state.data.company,
        address: state.data.address,
        notes: state.data.notes,
        portfolio: {
          totalProperties: state.data.portfolioProps ? parseInt(state.data.portfolioProps) : undefined,
          totalValue: state.data.portfolioValue ? parseFloat(state.data.portfolioValue) : undefined,
          monthlyIncome: state.data.portfolioIncome ? parseFloat(state.data.portfolioIncome) : undefined,
        },
        createdAt: new Date(), // not used on create
        id: '',
      } as any);
      if (onSaved) onSaved(id);
      dispatch({ type: 'goto', step: FORM_STEPS.findIndex(s => s.id === 'success') });
    } catch (e: any) {
      dispatch({ type: 'error', value: e?.message || 'Failed to save landlord' });
    } finally {
      dispatch({ type: 'saving', value: false });
    }
  }, [state.data, onSaved]);

  const renderField = () => {
    switch (current.id) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-white shadow-lg rounded-full flex items-center justify-center">
                <User className="w-10 h-10" style={{ color: '#378800' }} />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: '#136C9E' }}>Add Landlord</h1>
              <p className="text-gray-600">We’ll walk you through the details in quick steps.</p>
            </div>
          </div>
        );
      case 'name':
      case 'email':
      case 'phone':
      case 'company':
      case 'address':
      case 'portfolioProps':
      case 'portfolioValue':
      case 'portfolioIncome':
        return (
          <div className="space-y-2">
            <label className="text-sm text-gray-600">{current.title}</label>
            <Input
              value={(state.data as any)[current.id] || ''}
              onChange={(e) => dispatch({ type: 'update', field: current.id as keyof WizardData, value: e.target.value })}
              placeholder={current.title}
            />
          </div>
        );
      case 'notes':
        return (
          <div className="space-y-2">
            <label className="text-sm text-gray-600">Notes</label>
            <Textarea
              value={state.data.notes || ''}
              onChange={(e) => dispatch({ type: 'update', field: 'notes', value: e.target.value })}
              placeholder="Add any notes about this landlord"
            />
          </div>
        );
      case 'review':
        return (
          <div className="space-y-3 text-sm">
            <div><strong>Name:</strong> {state.data.name}</div>
            <div><strong>Email:</strong> {state.data.email}</div>
            <div><strong>Phone:</strong> {state.data.phone}</div>
            {state.data.company && <div><strong>Company:</strong> {state.data.company}</div>}
            {state.data.address && <div><strong>Address:</strong> {state.data.address}</div>}
            <div className="grid grid-cols-3 gap-3">
              {state.data.portfolioProps && <div><strong>Properties:</strong> {state.data.portfolioProps}</div>}
              {state.data.portfolioValue && <div><strong>Value:</strong> £{state.data.portfolioValue}</div>}
              {state.data.portfolioIncome && <div><strong>Income:</strong> £{state.data.portfolioIncome}/mo</div>}
            </div>
            {state.data.notes && <div><strong>Notes:</strong> {state.data.notes}</div>}
          </div>
        );
      case 'success':
        return (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-green-100 mx-auto flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold" style={{ color: '#136C9E' }}>Landlord added!</h2>
            <Button onClick={onBack}>Done</Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ backgroundColor: '#F7F7F7', fontFamily: 'Archivo, sans-serif' }}>
      <div className="max-w-3xl mx-auto w-full flex-1 px-6 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" onClick={onBack} className="p-2"><ArrowLeft className="w-4 h-4" /></Button>
          <h1 className="text-xl font-semibold" style={{ color: '#374957' }}>Add Landlord</h1>
        </div>

        <Card className="bg-white">
          <CardContent className="p-6 space-y-6">
            {state.error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">{state.error}</div>
            )}
            {renderField()}
            {current.id !== 'success' && (
              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" onClick={() => dispatch({ type: 'prev' })} disabled={state.step === 0}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                {current.id === 'review' ? (
                  <Button onClick={save} disabled={state.saving}>
                    {state.saving ? 'Saving...' : 'Save Landlord'}
                  </Button>
                ) : (
                  <Button onClick={() => canContinue && dispatch({ type: 'next' })} disabled={!canContinue}>
                    Continue <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AddLandlordWizard;


