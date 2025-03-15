import React, { useState } from 'react';
import {
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  FormHelperText,
  FormControl,
  InputLabel,
  FormGroup
} from '@mui/material';

interface Option {
  value: string;
  label: string;
}

interface FormFieldProps {
  id: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'select' | 'checkbox' | 'textarea';
  label: string;
  value?: string | boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  options?: Option[];
  rows?: number;
  checked?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  helperText?: string;
  'aria-describedby'?: string;
}

/**
 * Reusable form field component that supports different input types
 * with enhanced accessibility features
 */
const FormField: React.FC<FormFieldProps> = ({
  id,
  type,
  label,
  value,
  onChange,
  error,
  required = false,
  placeholder,
  options = [],
  rows = 1,
  checked,
  disabled = false,
  autoFocus = false,
  helperText,
  'aria-describedby': ariaDescribedby
}) => {
  // Add state to track field focus
  const [isFocused, setIsFocused] = useState(false);
  
  // Generate unique IDs for accessibility
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;
  const describedBy = [
    error ? errorId : null,
    helperText ? helperId : null,
    ariaDescribedby
  ].filter(Boolean).join(' ') || undefined;
  
  // For checkbox type, use the checked prop
  const isChecked = type === 'checkbox' ? checked : undefined;
  
  // For select type, ensure value is a string
  const selectValue = type === 'select' ? (value as string || '') : undefined;
  
  // For text inputs, ensure value is a string
  const textValue = type !== 'checkbox' ? (value as string || '') : undefined;
  
  // Handle focus and blur events
  const handleFocus = () => {
    setIsFocused(true);
  };
  
  const handleBlur = () => {
    setIsFocused(false);
  };
  
  // Determine placeholder based on field type and focus state
  const getPlaceholder = () => {
    if (type === 'date' && isFocused) {
      return 'dd/mm/yyyy';
    }
    return placeholder;
  };
  
  // Render different field types
  const renderField = () => {
    switch (type) {
      case 'checkbox':
        return (
          <FormGroup>
            <FormControl error={!!error} required={required}>
              <FormControlLabel
                control={
                  <Checkbox
                    id={id}
                    name={id}
                    checked={isChecked}
                    onChange={onChange}
                    disabled={disabled}
                    inputProps={{
                      'aria-describedby': describedBy,
                      'aria-invalid': !!error
                    }}
                  />
                }
                label={label}
              />
              {error && (
                <FormHelperText id={errorId} error>
                  {error}
                </FormHelperText>
              )}
              {helperText && !error && (
                <FormHelperText id={helperId}>
                  {helperText}
                </FormHelperText>
              )}
            </FormControl>
          </FormGroup>
        );
        
      case 'select':
        return (
          <TextField
            id={id}
            name={id}
            select
            label={label}
            value={selectValue}
            onChange={onChange}
            error={!!error}
            helperText={error || helperText}
            required={required}
            fullWidth
            disabled={disabled}
            autoFocus={autoFocus}
            FormHelperTextProps={{
              id: error ? errorId : (helperText ? helperId : undefined)
            }}
            inputProps={{
              'aria-describedby': describedBy,
              'aria-invalid': !!error
            }}
          >
            <MenuItem value="">
              <em>Select an option</em>
            </MenuItem>
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        );
        
      case 'textarea':
        return (
          <TextField
            id={id}
            name={id}
            label={label}
            value={textValue}
            onChange={onChange}
            error={!!error}
            helperText={error || helperText}
            required={required}
            fullWidth
            multiline
            rows={rows}
            placeholder={getPlaceholder()}
            disabled={disabled}
            autoFocus={autoFocus}
            onFocus={handleFocus}
            onBlur={handleBlur}
            FormHelperTextProps={{
              id: error ? errorId : (helperText ? helperId : undefined)
            }}
            inputProps={{
              'aria-describedby': describedBy,
              'aria-invalid': !!error
            }}
          />
        );
        
      case 'date':
        return (
          <TextField
            id={id}
            name={id}
            type={type}
            label={label}
            value={textValue}
            onChange={onChange}
            error={!!error}
            helperText={error || helperText}
            required={required}
            fullWidth
            placeholder={getPlaceholder()}
            disabled={disabled}
            autoFocus={autoFocus}
            onFocus={handleFocus}
            onBlur={handleBlur}
            FormHelperTextProps={{
              id: error ? errorId : (helperText ? helperId : undefined)
            }}
            inputProps={{
              'aria-describedby': describedBy,
              'aria-invalid': !!error
            }}
          />
        );
        
      default:
        return (
          <TextField
            id={id}
            name={id}
            type={type}
            label={label}
            value={textValue}
            onChange={onChange}
            error={!!error}
            helperText={error || helperText}
            required={required}
            fullWidth
            placeholder={getPlaceholder()}
            disabled={disabled}
            autoFocus={autoFocus}
            onFocus={handleFocus}
            onBlur={handleBlur}
            FormHelperTextProps={{
              id: error ? errorId : (helperText ? helperId : undefined)
            }}
            inputProps={{
              'aria-describedby': describedBy,
              'aria-invalid': !!error
            }}
          />
        );
    }
  };
  
  return renderField();
};

export default FormField; 