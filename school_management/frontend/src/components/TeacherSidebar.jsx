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
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useColorTheme } from '../context/ThemeContext';

export default function TeacherSidebar({
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}) {
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
        width: isCollapsed ? 76 : 260,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: isDark ? '#0f172a' : '#ffffff',
        borderRight: `1px solid ${theme.palette.divider}`,
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease',
        overflowX: 'hidden',
      }}
    >
      {/* Brand & Collapse Toggle */}
      <Box
        sx={{
          p: isCollapsed ? 1.5 : 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          borderBottom: `1px solid ${theme.palette.divider}`,
          minHeight: 65,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            cursor: 'pointer',
            minWidth: 0,
          }}
          onClick={() => handleNav('/teacher/dashboard')}
        >
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7',
              border: isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #FDE68A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              userSelect: 'none',
              flexShrink: 0,
            }}
          >
            🧀
          </Box>
          {!isCollapsed && (
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 900,
                  lineHeight: 1.1,
                  letterSpacing: '0.02em',
                  color: 'text.primary',
                  whiteSpace: 'nowrap',
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
                  whiteSpace: 'nowrap',
                }}
              >
                Panel Docente
              </Typography>
            </Box>
          )}
        </Box>

        {/* Collapse button on desktop */}
        {onToggleCollapse && (
          <Tooltip title={isCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}>
            <IconButton
              onClick={onToggleCollapse}
              size="small"
              sx={{
                borderRadius: '8px',
                display: { xs: 'none', md: 'inline-flex' },
                bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              }}
            >
              {isCollapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}

        {/* Mobile close button */}
        {onClose && (
          <IconButton onClick={onClose} size="small" sx={{ display: { md: 'none' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Primary Action Button ("+ Nuevo Examen") */}
      <Box sx={{ p: isCollapsed ? 1.5 : 2, display: 'flex', justifyContent: 'center' }}>
        {isCollapsed ? (
          <Tooltip title="Nuevo Examen" placement="right">
            <IconButton
              onClick={() => handleNav('/teacher/exams/new')}
              sx={{
                width: 44,
                height: 44,
                borderRadius: '10px',
                bgcolor: '#2563EB',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                '&:hover': { bgcolor: '#1d4ed8' },
              }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        ) : (
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
              whiteSpace: 'nowrap',
            }}
          >
            Nuevo Examen
          </Button>
        )}
      </Box>

      {/* Navigation List */}
      <Box sx={{ flex: 1, px: 1, py: 1 }}>
        {!isCollapsed && (
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
              whiteSpace: 'nowrap',
            }}
          >
            Navegación
          </Typography>
        )}

        <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
          {navItems.map((item) => {
            const active = item.isActive;
            return (
              <ListItem key={item.path} disablePadding>
                <Tooltip
                  title={isCollapsed ? item.label : ''}
                  placement="right"
                  disableHoverListener={!isCollapsed}
                >
                  <ListItemButton
                    onClick={() => handleNav(item.path)}
                    sx={{
                      borderRadius: '10px',
                      py: 1.2,
                      px: isCollapsed ? 0 : 1.8,
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      bgcolor: active
                        ? isDark
                          ? 'rgba(37, 99, 235, 0.15)'
                          : '#eff6ff'
                        : 'transparent',
                      color: active ? '#2563EB' : 'text.primary',
                      border: active
                        ? `1px solid ${isDark ? 'rgba(37, 99, 235, 0.3)' : '#bfdbfe'}`
                        : '1px solid transparent',
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
                        minWidth: isCollapsed ? 'auto' : 36,
                        justifyContent: 'center',
                        color: active ? '#2563EB' : 'text.secondary',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {!isCollapsed && (
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: '0.92rem',
                          fontWeight: active ? 800 : 600,
                          whiteSpace: 'nowrap',
                        }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* LAN Chip Status */}
      <Box sx={{ px: isCollapsed ? 1 : 2, pb: 1.5, display: 'flex', justifyContent: 'center' }}>
        {isCollapsed ? (
          <Tooltip title="Red LAN Escolar Activa" placement="right">
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '8px',
                bgcolor: isDark ? 'rgba(22, 101, 52, 0.15)' : '#f0fdf4',
                border: `1px solid ${isDark ? '#166534' : '#bbf7d0'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDark ? '#4ade80' : '#16a34a',
              }}
            >
              <WifiIcon sx={{ fontSize: 18 }} />
            </Box>
          </Tooltip>
        ) : (
          <Box
            sx={{
              p: 1.2,
              width: '100%',
              borderRadius: '8px',
              bgcolor: isDark ? 'rgba(22, 101, 52, 0.15)' : '#f0fdf4',
              border: `1px solid ${isDark ? '#166534' : '#bbf7d0'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <WifiIcon sx={{ fontSize: 16, color: isDark ? '#4ade80' : '#16a34a' }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  color: isDark ? '#4ade80' : '#15803d',
                  display: 'block',
                  lineHeight: 1.1,
                  whiteSpace: 'nowrap',
                }}
              >
                Red LAN Activa
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                Servidor local escolar
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      <Divider />

      {/* Footer / Profile & Settings */}
      {isCollapsed ? (
        <Box
          sx={{
            p: 1.5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
          }}
        >
          <Tooltip title={`${user?.fullName || user?.username} (@${user?.username})`} placement="right">
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                bgcolor: isDark ? '#1e293b' : '#f1f5f9',
                border: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.primary',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {user?.fullName ? user.fullName[0].toUpperCase() : 'P'}
            </Box>
          </Tooltip>

          <Tooltip title={isDark ? 'Modo claro' : 'Modo oscuro'} placement="right">
            <IconButton onClick={toggleTheme} size="small" sx={{ borderRadius: '8px' }}>
              {isDark ? (
                <LightModeIcon sx={{ fontSize: 18, color: '#FBBF24' }} />
              ) : (
                <DarkModeIcon sx={{ fontSize: 18, color: '#1B254B' }} />
              )}
            </IconButton>
          </Tooltip>

          <Tooltip title="Cerrar sesión" placement="right">
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
      ) : (
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
      )}
    </Box>
  );
}
