import { createTheme } from '@mui/material/styles';

export const getAppTheme = (mode = 'light') => {
  const isDark = mode === 'dark';

  // Generic Navy & Crimson Palette
  const navyPrimary = '#1B254B';
  const navyDark = '#101730';
  const navyLight = '#2E3F7A';

  const crimsonSecondary = '#A31934';
  const crimsonLight = '#C52749';
  const crimsonDark = '#7A1024';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#4B77D8' : navyPrimary,
        light: isDark ? '#7398E6' : navyLight,
        dark: isDark ? '#2E53B0' : navyDark,
        contrastText: '#ffffff',
      },
      secondary: {
        main: isDark ? '#E11D48' : crimsonSecondary,
        light: isDark ? '#FB7185' : crimsonLight,
        dark: isDark ? '#BE123C' : crimsonDark,
        contrastText: '#ffffff',
      },
      success: {
        main: isDark ? '#22c55e' : '#16a34a',
        light: '#4ade80',
        dark: '#15803d',
      },
      warning: {
        main: '#f59e0b',
        light: '#fbbf24',
        dark: '#d97706',
      },
      error: {
        main: isDark ? '#f87171' : '#dc2626',
        light: '#fca5a5',
        dark: '#b91c1c',
      },
      background: {
        default: isDark ? '#0A0F1D' : '#F4F6FB',
        paper: isDark ? '#131B31' : '#FFFFFF',
      },
      text: {
        primary: isDark ? '#F8FAFC' : '#141B34',
        secondary: isDark ? '#94A3B8' : '#4B5569',
      },
      divider: isDark ? '#1E2945' : '#E2E8F0',
    },
    typography: {
      fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h1: { fontWeight: 800, letterSpacing: '-0.025em' },
      h2: { fontWeight: 800, letterSpacing: '-0.025em' },
      h3: { fontWeight: 700, letterSpacing: '-0.02em' },
      h4: { fontWeight: 700, letterSpacing: '-0.02em' },
      h5: { fontWeight: 600, letterSpacing: '-0.01em' },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 500 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isDark ? '#0A0F1D' : '#F4F6FB',
            color: isDark ? '#F8FAFC' : '#141B34',
            transition: 'background-color 0.25s ease, color 0.25s ease',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '8px 20px',
            boxShadow: 'none',
            fontWeight: 700,
            '&:hover': {
              boxShadow: isDark
                ? '0 4px 14px rgba(75, 119, 216, 0.35)'
                : '0 4px 14px rgba(27, 37, 75, 0.2)',
            },
          },
          containedPrimary: {
            backgroundColor: isDark ? '#4B77D8' : navyPrimary,
            '&:hover': {
              backgroundColor: isDark ? '#3B64C2' : '#121A38',
            },
          },
          containedSecondary: {
            backgroundColor: isDark ? '#E11D48' : crimsonSecondary,
            '&:hover': {
              backgroundColor: isDark ? '#BE123C' : crimsonDark,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: isDark
              ? '0 6px 24px -2px rgba(0, 0, 0, 0.45), 0 2px 8px -1px rgba(0, 0, 0, 0.3)'
              : '0 6px 24px -2px rgba(27, 37, 75, 0.07), 0 2px 8px -1px rgba(27, 37, 75, 0.04)',
            border: `1px solid ${isDark ? '#1F2B48' : '#E2E8F0'}`,
            backgroundImage: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            backgroundImage: 'none',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 700,
            borderRadius: 6,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              backgroundColor: isDark ? '#141C33' : '#FFFFFF',
              color: isDark ? '#F8FAFC' : '#141B34',
              '& fieldset': {
                borderColor: isDark ? '#263554' : '#CBD5E1',
              },
              '&:hover fieldset': {
                borderColor: isDark ? '#4B77D8' : navyPrimary,
              },
              '&.Mui-focused fieldset': {
                borderColor: isDark ? '#4B77D8' : navyPrimary,
              },
              '& input': {
                color: isDark ? '#F8FAFC' : '#141B34',
              },
              '& textarea': {
                color: isDark ? '#F8FAFC' : '#141B34',
              },
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: isDark ? '#141C33' : '#FFFFFF',
            color: isDark ? '#F8FAFC' : '#141B34',
            '& fieldset': {
              borderColor: isDark ? '#263554' : '#CBD5E1',
            },
            '&:hover fieldset': {
              borderColor: isDark ? '#4B77D8' : navyPrimary,
            },
            '&.Mui-focused fieldset': {
              borderColor: isDark ? '#4B77D8' : navyPrimary,
            },
            '& input': {
              color: isDark ? '#F8FAFC' : '#141B34',
            },
            '& textarea': {
              color: isDark ? '#F8FAFC' : '#141B34',
            },
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            color: isDark ? '#F8FAFC' : '#141B34',
          },
          input: {
            color: isDark ? '#F8FAFC' : '#141B34',
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: isDark ? '#94A3B8' : '#64748B',
            '&.Mui-focused': {
              color: isDark ? '#7398E6' : navyPrimary,
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? '#131B31' : '#FFFFFF',
            backgroundImage: 'none',
            border: `1px solid ${isDark ? '#1F2B48' : '#E2E8F0'}`,
            color: isDark ? '#F8FAFC' : '#141B34',
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#18223C' : '#F1F5F9',
            '& .MuiTableCell-root': {
              backgroundColor: isDark ? '#18223C' : '#F1F5F9',
              color: isDark ? '#94A3B8' : '#475569',
              fontWeight: 700,
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: isDark ? '#1E2945' : '#E2E8F0',
            color: isDark ? '#F8FAFC' : '#141B34',
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? '#131B31' : '#FFFFFF',
            backgroundImage: 'none',
            border: `1px solid ${isDark ? '#1F2B48' : '#E2E8F0'}`,
            color: isDark ? '#F8FAFC' : '#141B34',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: isDark ? '#F8FAFC' : '#141B34',
            '&:hover': {
              backgroundColor: isDark ? 'rgba(75, 119, 216, 0.12)' : 'rgba(0, 0, 0, 0.04)',
            },
            '&.Mui-selected': {
              backgroundColor: isDark ? 'rgba(75, 119, 216, 0.2)' : 'rgba(27, 37, 75, 0.08)',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(75, 119, 216, 0.28)' : 'rgba(27, 37, 75, 0.12)',
              },
            },
          },
        },
      },
    },
  });
};

export const getMarsellaTheme = getAppTheme;
