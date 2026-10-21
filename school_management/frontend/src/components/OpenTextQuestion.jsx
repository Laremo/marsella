import React from 'react';
import { Box, TextField, Typography, useTheme } from '@mui/material';
import { Create as PenIcon } from '@mui/icons-material';

export default function OpenTextQuestion({ question, value = '', onChange }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const textValue = typeof value === 'string' ? value : value ? String(value) : '';

  return (
    <Box sx={{ mt: 2 }}>
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          display: 'flex',
          alignItems: 'center',
          gap: 0.8,
          mb: 1.5,
          fontWeight: 600,
        }}
      >
        <PenIcon fontSize="small" color="primary" />
        Escribe tu respuesta desarrollada en el siguiente campo:
      </Typography>

      <TextField
        fullWidth
        multiline
        rows={4}
        placeholder="Escribe aquí tu respuesta con el teclado..."
        value={textValue}
        onChange={(e) => onChange(e.target.value)}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            bgcolor: textValue.trim().length > 0
              ? (isDark ? 'rgba(75, 119, 216, 0.08)' : '#F0F6FF')
              : (isDark ? '#141C33' : '#FFFFFF'),
            fontSize: '1rem',
            lineHeight: 1.6,
            transition: 'all 0.2s ease',
            '& fieldset': {
              borderColor: textValue.trim().length > 0
                ? (isDark ? '#3B64C2' : '#93C5FD')
                : (isDark ? '#263554' : '#CBD5E1'),
              borderWidth: textValue.trim().length > 0 ? 1.5 : 1,
            },
            '&:hover fieldset': {
              borderColor: 'primary.main',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'primary.main',
              borderWidth: 2,
            },
          },
        }}
        helperText={
          <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mt: 0.5 }}>
            <span>{textValue.trim().length > 0 ? 'Respuesta guardada' : 'Escribe tu respuesta'}</span>
            <span>{textValue.length} caracteres</span>
          </Box>
        }
      />
    </Box>
  );
}
