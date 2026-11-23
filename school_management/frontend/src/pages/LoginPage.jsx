import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Link,
  useTheme,
  Tabs,
  Tab,
} from '@mui/material';
import {
  School as TeacherIcon,
  Face as StudentIcon,
  AdminPanelSettings as DirectorIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roleTab, setRoleTab] = useState('ALL');

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated && user) {
      const role = user.role;
      if (role === 'ROLE_DIRECTOR' || role === 'DIRECTOR') {
        navigate('/director/dashboard', { replace: true });
      } else if (role === 'ROLE_STUDENT' || role === 'STUDENT') {
        navigate('/student/dashboard', { replace: true });
      } else {
        navigate('/teacher/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  if (isAuthenticated) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Por favor ingresa usuario y contraseña.');
      return;
    }

    setLoading(true);

    try {
      const loggedUser = await login(username.trim(), password);
      const role = loggedUser?.role;
      if (role === 'ROLE_DIRECTOR' || role === 'DIRECTOR') {
        navigate('/director/dashboard', { replace: true });
      } else if (role === 'ROLE_STUDENT' || role === 'STUDENT') {
        navigate('/student/dashboard', { replace: true });
      } else {
        navigate('/teacher/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ py: { xs: 4, sm: 8 } }}>
      <Card
        sx={{
          p: { xs: 1, sm: 2 },
          borderRadius: '12px',
          boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.06)',
        }}
      >
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '12px',
                bgcolor: isDark ? 'rgba(37, 99, 235, 0.15)' : '#eff6ff',
                color: 'primary.main',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1.5,
                fontSize: 32,
              }}
            >
              🧀
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.02em' }}>
              Plataforma Escolar
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Inicia sesión con tu cuenta institucional
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: '8px' }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              autoFocus
              size="small"
            />

            <TextField
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              size="small"
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ py: 1.3, fontWeight: 800, mt: 1, borderRadius: '8px' }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Iniciar Sesión'}
            </Button>
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              ¿Eres nuevo docente o directivo?{' '}
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/register')}
                sx={{ fontWeight: 700 }}
              >
                Regístrate aquí
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
