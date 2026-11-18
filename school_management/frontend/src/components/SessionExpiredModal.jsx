import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box,
  Typography,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { LockOutlined as LockIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function SessionExpiredModal() {
  const { sessionExpired, resolveSessionExpired, cancelSessionExpired, user } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [username, setUsername] = useState(user?.username || 'admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!sessionExpired) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password.trim()) {
      setError('Por favor ingresa tu contraseña.');
      return;
    }

    setLoading(true);
    try {
      await resolveSessionExpired(username.trim(), password);
      setPassword('');
      setError('');
    } catch (err) {
      setError(
        err.response?.data?.error || 'Usuario o contraseña incorrectos. Verifica tus credenciales.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={sessionExpired}
      onClose={cancelSessionExpired}
      maxWidth="xs"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: '12px',
          border: `1px solid ${theme.palette.divider}`,
          p: 1,
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '8px',
              bgcolor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LockIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Sesión Expirada
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Vuelve a ingresar para continuar sin perder tus cambios
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2.5 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
              {error}
            </Alert>
          )}

          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Tu sesión de seguridad venció. Ingresa tu contraseña para renovar tu acceso y reintentar la acción automáticamente sin recargar la página.
          </Typography>

          <TextField
            label="Usuario"
            fullWidth
            size="small"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            sx={{ mb: 2 }}
          />

          <TextField
            label="Contraseña"
            type="password"
            fullWidth
            size="small"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={cancelSessionExpired}
            color="inherit"
            disabled={loading}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
          >
            Salir al Login
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress size={16} color="inherit" />}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
          >
            {loading ? 'Reanudando...' : 'Reanudar Sesión'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
