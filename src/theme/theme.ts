import { createTheme } from '@mui/material/styles';

// Define custom colors
const colors = {
  primary: {
    main: '#136C9E', // Blue color for uploads and primary actions
    light: '#4A90E2',
    dark: '#0D4D73',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#F5F5F5',
    light: '#FFFFFF',
    dark: '#E0E0E0',
    contrastText: '#000000',
  },
  error: {
    main: '#D32F2F',
    light: '#EF5350',
    dark: '#C62828',
    contrastText: '#FFFFFF',
  },
  warning: {
    main: '#FFA000',
    light: '#FFB74D',
    dark: '#F57C00',
    contrastText: '#000000',
  },
  info: {
    main: '#1976D2',
    light: '#64B5F6',
    dark: '#1565C0',
    contrastText: '#FFFFFF',
  },
  success: {
    main: '#388E3C',
    light: '#4CAF50',
    dark: '#2E7D32',
    contrastText: '#FFFFFF',
  },
  text: {
    primary: '#333333',
    secondary: '#757575',
    disabled: '#9E9E9E',
  },
  background: {
    default: '#FFFFFF',
    paper: '#F5F5F5',
  },
};

// Create the theme
const theme = createTheme({
  palette: {
    primary: colors.primary,
    secondary: colors.secondary,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
    success: colors.success,
    text: colors.text,
    background: colors.background,
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
    },
    body2: {
      fontSize: '0.875rem',
    },
  },
  components: {
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        fullWidth: true,
        size: 'small',
      },
      styleOverrides: {
        root: {
          height: 40, // Set input box height to 40px
          marginBottom: '16px',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          height: 40, // Set outlined input height to 40px
          borderRadius: '4px',
          backgroundColor: '#FFFFFF',
          '&.Mui-focused': {
            backgroundColor: '#FFFFFF',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          height: 40, // Set select height to 40px
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Prevent uppercase text in buttons
          borderRadius: 4,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
  },
});

export default theme; 