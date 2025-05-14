import React, { createContext, useContext } from 'react';

interface ThemeContextType {
  breakpoints: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
  };
  spacing: {
    containerXs: string;
    containerMd: string;
    containerLg: string;
  };
}

const ThemeContext = createContext<ThemeContextType>({
  breakpoints: {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
  spacing: {
    containerXs: '16px',
    containerMd: '24px',
    containerLg: '32px',
  },
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = {
    breakpoints: {
      xs: 0,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536,
    },
    spacing: {
      containerXs: '16px',
      containerMd: '24px',
      containerLg: '32px',
    },
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeProvider; 