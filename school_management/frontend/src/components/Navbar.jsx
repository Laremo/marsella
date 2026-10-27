import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  AddCircleOutline as AddIcon,
  Person as PersonIcon,
  Wifi as WifiIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useColorTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useColorTheme();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Hide Navbar completely on the student portal / exam pages
  const isStudentPortal = location.pathname === '/' || location.pathname.startsWith('/exam/');
  if (isStudentPortal) {
    return null;
  }

  const royalBlue = '#2563EB';
  const royalBlueHover = '#1D4ED8';

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: 'text.primary',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between', py: 1.2 }}>
          {/* Logo with Cheese Icon: EVALUACIONES / Laremo */}
          <Box
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 1.5 }}
            onClick={() => navigate('/')}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '10px',
                bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7',
                border: isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #FDE68A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '26px',
                lineHeight: 1,
                userSelect: 'none',
              }}
            >
              🧀
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 900,
                  lineHeight: 1.1,
                  letterSpacing: '0.03em',
                  color: 'text.primary',
                  textTransform: 'uppercase',
                  fontSize: '1.15rem',
                }}
              >
                EVALUACIONES
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'secondary.main',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  display: 'block',
                  lineHeight: 1,
                  mt: 0.2,
                  fontSize: '0.82rem',
                }}
              >
                Laremo
              </Typography>
            </Box>
          </Box>

          {/* Navigation Links, Actions & Theme Toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
            {/* LAN connectivity indicator */}
            <Tooltip title="Conectado a la Red Local (LAN)">
              <Chip
                icon={<WifiIcon sx={{ fontSize: '15px !important', color: isDark ? '#4ade80 !important' : '#16a34a !important' }} />}
                label="Red LAN"
                size="small"
                variant="outlined"
                sx={{
                  display: { xs: 'none', sm: 'inline-flex' },
                  borderColor: isDark ? '#166534' : '#bbf7d0',
                  bgcolor: isDark ? 'rgba(22, 101, 52, 0.2)' : '#f0fdf4',
                  color: isDark ? '#4ade80' : '#15803d',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
              />
            </Tooltip>

            {/* Dark / Light Mode Toggle */}
            <Tooltip title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
              <IconButton
                onClick={toggleTheme}
                color="inherit"
                sx={{
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                  border: `1px solid ${theme.palette.divider}`,
                  p: 1,
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                  },
                }}
              >
                {isDark ? <LightModeIcon sx={{ color: '#FBBF24', fontSize: 20 }} /> : <DarkModeIcon sx={{ color: '#1B254B', fontSize: 20 }} />}
              </IconButton>
            </Tooltip>

            {isAuthenticated ? (
              <>
                <Button
                  startIcon={<DashboardIcon />}
                  variant={location.pathname === '/teacher/dashboard' ? 'contained' : 'text'}
                  color="primary"
                  onClick={() => navigate('/teacher/dashboard')}
                >
                  Exámenes
                </Button>
                <Button
                  startIcon={<SchoolIcon />}
                  variant={location.pathname.startsWith('/teacher/groups') ? 'contained' : 'text'}
                  color="primary"
                  onClick={() => navigate('/teacher/groups')}
                >
                  Gestión Escolar
                </Button>
                <Button
                  startIcon={<AddIcon />}
                  variant={location.pathname === '/teacher/exams/new' ? 'contained' : 'outlined'}
                  color="secondary"
                  onClick={() => navigate('/teacher/exams/new')}
                >
                  Nuevo Examen
                </Button>
                <Chip
                  icon={<PersonIcon />}
                  label={user?.fullName || user?.username}
                  color="default"
                  sx={{
                    bgcolor: isDark ? '#1E2945' : '#f1f5f9',
                    fontWeight: 600,
                    display: { xs: 'none', md: 'inline-flex' },
                  }}
                />
                <Tooltip title="Cerrar sesión">
                  <IconButton color="error" onClick={() => { logout(); navigate('/'); }}>
                    <LogoutIcon />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <>
                {/* Botón de presentar examen: Outlined en azul rey */}
                <Button
                  variant="outlined"
                  onClick={() => navigate('/')}
                  sx={{
                    borderColor: royalBlue,
                    color: isDark ? '#60A5FA' : royalBlue,
                    fontWeight: 700,
                    borderWidth: 1.5,
                    '&:hover': {
                      borderColor: royalBlueHover,
                      bgcolor: isDark ? 'rgba(37, 99, 235, 0.12)' : 'rgba(37, 99, 235, 0.06)',
                      borderWidth: 1.5,
                    },
                  }}
                >
                  Presentar Examen
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/teacher/login')}
                >
                  Docentes
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
