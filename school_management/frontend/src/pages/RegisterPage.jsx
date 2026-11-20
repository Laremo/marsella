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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { HowToReg as RegisterIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ROLE_TEACHER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'ROLE_DIRECTOR') navigate('/director/dashboard', { replace: true });
      else if (user.role === 'ROLE_STUDENT') navigate('/student/dashboard', { replace: true });
      else navigate('/teacher/dashboard', { replace: true });
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

    if (!username.trim() || !fullName.trim() || !email.trim() || !password) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await register(username.trim(), password, fullName.trim(), email.trim(), role);
      if (loggedUser.role === 'ROLE_DIRECTOR') navigate('/director/dashboard');
      else if (loggedUser.role === 'ROLE_STUDENT') navigate('/student/dashboard');
      else navigate('/teacher/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
      <Card sx={{ p: { xs: 1, sm: 2 }, borderRadius: '12px' }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 54,
                height: 54,
                borderRadius: '10px',
                bgcolor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4',
                color: 'success.main',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1.5,
              }}
            >
              <RegisterIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Registro Institucional
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Crea tu cuenta seleccionando tu perfil escolar
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: '8px' }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo de Perfil</InputLabel>
              <Select
                value={role}
                label="Tipo de Perfil"
                onChange={(e) => setRole(e.target.value)}
              >
                <MenuItem value="ROLE_TEACHER">Profesor / Docente</MenuItem>
                <MenuItem value="ROLE_DIRECTOR">Directivo / Coordinación</MenuItem>
                <MenuItem value="ROLE_STUDENT">Alumno / Estudiante</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Nombre completo"
              placeholder="Ej: Lic. Roberto García"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              fullWidth
              size="small"
            />

            <TextField
              label="Nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              size="small"
            />

            <TextField
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
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
              sx={{ py: 1.3, fontWeight: 700, mt: 1, borderRadius: '8px' }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Registrarse'}
            </Button>
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              ¿Ya tienes una cuenta?{' '}
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/login')}
                sx={{ fontWeight: 700 }}
              >
                Inicia sesión aquí
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
