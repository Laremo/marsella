import React from 'react';
import { Box, Typography, TextField, Paper, useTheme } from '@mui/material';
import { EditNote as EditIcon } from '@mui/icons-material';

export default function FillBlanksQuestion({ question, value = [], onChange }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  let template = '';

  try {
    const data = typeof question.questionData === 'string'
      ? JSON.parse(question.questionData)
      : question.questionData;
    template = data.template || '';
  } catch (e) {
    template = '';
  }

  const valuesArray = Array.isArray(value) ? value : [];

  // Parse template segments: e.g. "Water boils at [100] degrees and..."
  const regex = /\[([^\]]*)\]/g;
  const segments = [];
  let lastIndex = 0;
  let match;
  let blankIndex = 0;

  while ((match = regex.exec(template)) !== null) {
    // Text before blank
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: template.substring(lastIndex, match.index),
      });
    }

    // Blank itself
    segments.push({
      type: 'blank',
      index: blankIndex,
      placeholder: `Espacio #${blankIndex + 1}`,
    });

    blankIndex++;
    lastIndex = regex.lastIndex;
  }

  // Trailing text
  if (lastIndex < template.length) {
    segments.push({
      type: 'text',
      content: template.substring(lastIndex),
    });
  }

  const handleBlankChange = (index, val) => {
    const updated = [...valuesArray];
    while (updated.length <= index) {
      updated.push('');
    }
    updated[index] = val;
    onChange(updated);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <EditIcon fontSize="small" color="primary" />
        Escribe las palabras o números faltantes dentro de los campos de texto:
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          p: 3,
          bgcolor: 'background.paper',
          borderRadius: '10px',
          lineHeight: 2.4,
          fontSize: '1.05rem',
          color: 'text.primary',
        }}
      >
        {segments.map((seg, idx) => {
          if (seg.type === 'text') {
            return (
              <span key={idx} style={{ display: 'inline', whiteSpace: 'pre-wrap' }}>
                {seg.content}
              </span>
            );
          }

          const currentVal = valuesArray[seg.index] || '';
          const hasValue = currentVal.trim().length > 0;

          return (
            <TextField
              key={idx}
              size="small"
              variant="outlined"
              value={currentVal}
              onChange={(e) => handleBlankChange(seg.index, e.target.value)}
              placeholder={seg.placeholder}
              sx={{
                mx: 1,
                my: 0.5,
                verticalAlign: 'middle',
                minWidth: 150,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '6px',
                  bgcolor: hasValue
                    ? (isDark ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4')
                    : (isDark ? '#141C33' : '#f8fafc'),
                  fontWeight: 600,
                  color: 'text.primary',
                  '& input': {
                    color: 'text.primary',
                  },
                  '& fieldset': {
                    borderColor: hasValue
                      ? (isDark ? '#4ade80' : '#86efac')
                      : (isDark ? '#263554' : '#cbd5e1'),
                    borderWidth: hasValue ? 2 : 1,
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
          );
        })}
      </Paper>
    </Box>
  );
}
