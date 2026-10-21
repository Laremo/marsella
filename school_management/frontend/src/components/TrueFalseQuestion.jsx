import React from 'react';
import { Box, Paper, Typography, Radio, useTheme } from '@mui/material';

export default function TrueFalseQuestion({ value, onChange }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const isTrue = value === true || value === 'true';
  const isFalse = value === false || value === 'false';

  const options = [
    { label: 'Verdadero', val: true, isSelected: isTrue },
    { label: 'Falso', val: false, isSelected: isFalse },
  ];

  return (
    <Box sx={{ mt: 1.5, display: 'flex', gap: 2 }}>
      {options.map((opt) => (
        <Paper
          key={opt.label}
          variant="outlined"
          onClick={() => onChange(opt.val)}
          sx={{
            flex: 1,
            py: 1.2,
            px: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.2,
            cursor: 'pointer',
            borderRadius: '8px',
            borderColor: opt.isSelected
              ? 'primary.main'
              : (isDark ? '#263554' : '#e2e8f0'),
            bgcolor: opt.isSelected
              ? (isDark ? 'rgba(75, 119, 216, 0.16)' : '#eff6ff')
              : 'background.paper',
            borderWidth: opt.isSelected ? 2 : 1,
            transition: 'all 0.15s ease',
            userSelect: 'none',
            '&:hover': {
              borderColor: 'primary.light',
              bgcolor: opt.isSelected
                ? (isDark ? 'rgba(75, 119, 216, 0.24)' : '#eff6ff')
                : (isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc'),
            },
          }}
        >
          <Radio
            checked={opt.isSelected}
            color="primary"
            size="small"
            sx={{ p: 0.5 }}
          />
          <Typography
            variant="body1"
            sx={{
              fontWeight: opt.isSelected ? 700 : 500,
              color: 'text.primary',
              fontSize: '0.95rem',
            }}
          >
            {opt.label}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}
