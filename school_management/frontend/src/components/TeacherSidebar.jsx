import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  IconButton,
  Divider,
  Chip,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  SportsEsports as GamepadIcon,
  Add as AddIcon,
  Logout as LogoutIcon,
  Close as CloseIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Wifi as WifiIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useColorTheme } from '../context/ThemeContext';

export default function TeacherSidebar({ onClose }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user, logout } = useAuth();
  const { toggleTheme } = useColorTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      label: 'Exámenes',
      icon: <DashboardIcon />,
      path: '/teacher/dashboard',
      isActive: location.pathname === '/teacher/dashboard' || location.pathname.startsWith('/teacher/exams/'),
    },
    {
      label: 'Gestión Escolar',
      icon: <SchoolIcon />,
      path: '/teacher/groups',
      isActive: location.pathname.startsWith('/teacher/groups'),
    },
    {
      label: 'Quizzes en Vivo',
      icon: <GamepadIcon />,
      path: '/teacher/quizzes',
      isActive: location.pathname.startsWith('/teacher/quizzes'),
    },
  ];

  const handleNav = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  return (
    <Box
      sx={{
        width: 260,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: isDark ? '#0f172a' : '#ffffff',
        borderRight: `1px solid ${theme.palette.divider}`,
        transition: 'background-color 0.2s ease',
      }}
    >
      {/* Brand & Mobile Close */}
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
          onClick={() => handleNav('/teacher/dashboard')}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7',
              border: isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #FDE68A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              userSelect: 'none',
            }}
          >
            🧀
          </Box>
          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: '0.02em',
                color: 'text.primary',
              }}
            >
              Marsella
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'secondary.main',
                fontWeight: 800,
                display: 'block',
                lineHeight: 1,
                fontSize: '0.75rem',
              }}
            >
              Panel Docente
            </Typography>
          </Box>
        </Box>

        {onClose && (
          <IconButton onClick={onClose} size="small" sx={{ display: { md: 'none' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Primary Action Button */}
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleNav('/teacher/exams/new')}
          sx={{
            py: 1.2,
            borderRadius: '10px',
            bgcolor: '#2563EB',
            fontWeight: 800,
            fontSize: '0.88rem',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
            '&:hover': { bgcolor: '#1d4ed8' },
          }}
        >
          Nuevo Examen
        </Button>
      </Box>

      {/* Navigation List */}
      <Box sx={{ flex: 1, px: 1.5, py: 1 }}>
        <Typography
          variant="caption"
          sx={{
            px: 1.5,
            mb: 1,
            display: 'block',
            fontWeight: 800,
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontSize: '0.7rem',
          }}
        >
          Navegación
        </Typography>

        <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
          {navItems.map((item) => {
            const active = item.isActive;
            return (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  onClick={() => handleNav(item.path)}
                  sx={{
                    borderRadius: '10px',
                    py: 1.2,
                    px: 1.8,
                    bgcolor: active
                      ? isDark
                        ? 'rgba(37, 99, 235, 0.15)'
                        : '#eff6ff'
                      : 'transparent',
                    color: active ? '#2563EB' : 'text.primary',
                    border: active
                      ? `1px solid ${isDark ? 'rgba(37, 99, 235, 0.3)' : '#bfdbfe'}`
                      : '1px solid transparent',
                    fontWeight: active ? 800 : 600,
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      bgcolor: active
                        ? isDark
                          ? 'rgba(37, 99, 235, 0.2)'
                          : '#e0edff'
                        : isDark
                        ? 'rgba(255, 255, 255, 0.04)'
                        : 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 36,
                      color: active ? '#2563EB' : 'text.secondary',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.92rem',
                      fontWeight: active ? 800 : 600,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* LAN Chip Status */}
      <Box sx={{ px: 2, pb: 1.5 }}>
        <Box
          sx={{
            p: 1.2,
            borderRadius: '8px',
            bgcolor: isDark ? 'rgba(22, 101, 52, 0.15)' : '#f0fdf4',
            border: `1px solid ${isDark ? '#166534' : '#bbf7d0'}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <WifiIcon sx={{ fontSize: 16, color: isDark ? '#4ade80' : '#16a34a' }} />
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="caption"
              sx={{ fontWeight: 800, color: isDark ? '#4ade80' : '#15803d', display: 'block', lineHeight: 1.1 }}
            >
              Red LAN Activa
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>
              Servidor local escolar
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider />

      {/* Footer / Profile & Settings */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0, flex: 1 }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '8px',
              bgcolor: isDark ? '#1e293b' : '#f1f5f9',
              border: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.primary',
              fontSize: '14px',
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {user?.fullName ? user.fullName[0].toUpperCase() : 'P'}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                lineHeight: 1.1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.fullName || user?.username}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: 'block',
                lineHeight: 1,
                fontSize: '0.7rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              @{user?.username}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          <Tooltip title={isDark ? 'Modo claro' : 'Modo oscuro'}>
            <IconButton onClick={toggleTheme} size="small" sx={{ borderRadius: '8px' }}>
              {isDark ? (
                <LightModeIcon sx={{ fontSize: 18, color: '#FBBF24' }} />
              ) : (
                <DarkModeIcon sx={{ fontSize: 18, color: '#1B254B' }} />
              )}
            </IconButton>
          </Tooltip>

          <Tooltip title="Cerrar sesión">
            <IconButton
              onClick={() => {
                logout();
                navigate('/');
              }}
              color="error"
              size="small"
              sx={{ borderRadius: '8px' }}
            >
              <LogoutIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
}
