import { createTheme } from '@mui/material/styles';

// Mac/Swift-inspired color palette
const colors = {
  primary: {
    main: '#007AFF', // iOS blue
    light: '#5AC8FA', // iOS light blue
    dark: '#0062CC', // Darker blue
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#FF9500', // iOS orange
    light: '#FFCC00', // iOS yellow
    dark: '#FF3B30', // iOS red
    contrastText: '#FFFFFF',
  },
  success: {
    main: '#34C759', // iOS green
    light: '#4CD964',
    dark: '#30B650',
    contrastText: '#FFFFFF',
  },
  error: {
    main: '#FF3B30', // iOS red
    light: '#FF6B6B',
    dark: '#CC2F26',
    contrastText: '#FFFFFF',
  },
  warning: {
    main: '#FF9500', // iOS orange
    light: '#FFCC00',
    dark: '#CC7A00',
    contrastText: '#FFFFFF',
  },
  info: {
    main: '#5AC8FA', // iOS light blue
    light: '#64D2FF',
    dark: '#4AA0C8',
    contrastText: '#FFFFFF',
  },
  grey: {
    50: '#F9F9F9',
    100: '#F2F2F7',
    200: '#E5E5EA',
    300: '#D1D1D6',
    400: '#C7C7CC',
    500: '#AEAEB2',
    600: '#8E8E93',
    700: '#636366',
    800: '#48484A',
    900: '#3A3A3C',
    A100: '#F2F2F7',
    A200: '#E5E5EA',
    A400: '#C7C7CC',
    A700: '#8E8E93',
  },
  background: {
    default: '#F2F2F7', // iOS light background
    paper: '#FFFFFF',
  },
  text: {
    primary: '#000000',
    secondary: '#8E8E93',
    disabled: '#C7C7CC',
  },
};

// Create the Mac/Swift-inspired theme
const macTheme = createTheme({
  palette: colors,
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: '1rem',
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: '0.875rem',
    },
    body1: {
      fontWeight: 400,
      fontSize: '1rem',
    },
    body2: {
      fontWeight: 400,
      fontSize: '0.875rem',
    },
    button: {
      fontWeight: 600,
      fontSize: '0.875rem',
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: 'none',
          },
        },
        outlined: {
          borderWidth: 1.5,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
        },
        elevation1: {
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
        },
        elevation2: {
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': {
              borderWidth: 1.5,
            },
            '&:hover fieldset': {
              borderWidth: 1.5,
            },
            '&.Mui-focused fieldset': {
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          marginBottom: 4,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-selected': {
            backgroundColor: colors.primary.light + '33', // 20% opacity
            '&:hover': {
              backgroundColor: colors.primary.light + '4D', // 30% opacity
            },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 40,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          margin: '8px 0',
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: colors.primary.main,
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 42,
          height: 26,
          padding: 0,
        },
        switchBase: {
          padding: 1,
          '&.Mui-checked': {
            transform: 'translateX(16px)',
            color: '#fff',
            '& + .MuiSwitch-track': {
              opacity: 1,
              backgroundColor: colors.success.main,
            },
          },
        },
        thumb: {
          width: 24,
          height: 24,
        },
        track: {
          borderRadius: 13,
          opacity: 1,
          backgroundColor: colors.grey[400],
        },
      },
    },
  },
});

export default macTheme; 