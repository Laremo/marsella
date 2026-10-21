import React, { useState } from 'react';
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
  Paper,
  useTheme,
} from '@mui/material';
import { LockOutlined as LockIcon, School as TeacherIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function TeacherLoginPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/teacher/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ py: 8 }}>
      <Card sx={{ p: { xs: 1, sm: 2 } }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 54,
                height: 54,
                borderRadius: '10px',
                bgcolor: isDark ? 'rgba(75, 119, 216, 0.15)' : '#eff6ff',
                color: 'primary.main',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1.5,
              }}
            >
              <TeacherIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Acceso a Profesores
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Administra exámenes, preguntas y calificaciones
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              autoFocus
            />

            <TextField
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ py: 1.4, fontWeight: 700, mt: 1 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Iniciar Sesión'}
            </Button>
          </Box>

          <Paper
            variant="outlined"
            sx={{
              mt: 3,
              p: 1.5,
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
              borderRadius: '8px',
              textAlign: 'center',
              fontSize: '0.85rem',
              color: 'text.secondary',
            }}
          >
            Cuenta predeterminada: <strong>admin</strong> / <strong>admin123</strong>
          </Paper>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              ¿No tienes cuenta?{' '}
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/teacher/register')}
                sx={{ fontWeight: 700 }}
              >
                Crear una cuenta de profesor
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
