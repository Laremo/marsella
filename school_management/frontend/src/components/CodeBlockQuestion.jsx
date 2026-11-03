import React from 'react';
import {
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  Paper,
  useTheme,
} from '@mui/material';
import CodeBlockView from './CodeBlockView';

export default function CodeBlockQuestion({ question, value, onChange }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  let code = '';
  let language = 'python';
  let options = [];
  let allowMultiple = false;

  try {
    const data = typeof question.questionData === 'string'
      ? JSON.parse(question.questionData)
      : question.questionData || {};
    code = data.code || '';
    language = data.language || 'python';
    options = data.options || [];
    allowMultiple = !!data.allowMultiple;
  } catch (e) {
    console.error('Error parsing questionData in CodeBlockQuestion', e);
  }

  // Handle single selection
  const handleRadioChange = (e) => {
    onChange([e.target.value]);
  };

  // Handle multiple selection
  const handleCheckboxChange = (opt) => {
    const current = Array.isArray(value) ? [...value] : [];
    const index = current.indexOf(opt);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(opt);
    }
    onChange(current);
  };

  const selectedList = Array.isArray(value) ? value : value ? [value] : [];

  return (
    <Box sx={{ mt: 1 }}>
      {/* Formatted Code Block with IDE Visual Style */}
      <CodeBlockView code={code} language={language} />

      {/* Multiple Choice Options Prompt Header */}
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 2.5, mb: 1.5, color: 'text.secondary' }}>
        Selecciona la opción correcta:
      </Typography>

      {/* Render Options */}
      {allowMultiple ? (
        <FormGroup sx={{ gap: 1.5 }}>
          {options.map((opt, idx) => {
            const isSelected = selectedList.includes(opt);
            return (
              <Paper
                key={idx}
                variant="outlined"
                sx={{
                  p: 1.5,
                  cursor: 'pointer',
                  borderRadius: '8px',
                  borderColor: isSelected ? 'primary.main' : (isDark ? '#263554' : '#e2e8f0'),
                  bgcolor: isSelected ? (isDark ? 'rgba(75, 119, 216, 0.16)' : '#eff6ff') : 'background.paper',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    borderColor: 'primary.light',
                    bgcolor: isSelected
                      ? (isDark ? 'rgba(75, 119, 216, 0.24)' : '#eff6ff')
                      : (isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc'),
                  },
                }}
                onClick={() => handleCheckboxChange(opt)}
              >
                <FormControlLabel
                  control={<Checkbox checked={isSelected} />}
                  label={<Typography sx={{ fontWeight: isSelected ? 600 : 400, color: 'text.primary' }}>{opt}</Typography>}
                  sx={{ width: '100%', m: 0 }}
                />
              </Paper>
            );
          })}
        </FormGroup>
      ) : (
        <RadioGroup value={selectedList[0] || ''} onChange={handleRadioChange} sx={{ gap: 1.5 }}>
          {options.map((opt, idx) => {
            const isSelected = selectedList[0] === opt;
            return (
              <Paper
                key={idx}
                variant="outlined"
                sx={{
                  p: 1.5,
                  cursor: 'pointer',
                  borderRadius: '8px',
                  borderColor: isSelected ? 'primary.main' : (isDark ? '#263554' : '#e2e8f0'),
                  bgcolor: isSelected ? (isDark ? 'rgba(75, 119, 216, 0.16)' : '#eff6ff') : 'background.paper',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    borderColor: 'primary.light',
                    bgcolor: isSelected
                      ? (isDark ? 'rgba(75, 119, 216, 0.24)' : '#eff6ff')
                      : (isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc'),
                  },
                }}
                onClick={() => onChange([opt])}
              >
                <FormControlLabel
                  value={opt}
                  control={<Radio checked={isSelected} />}
                  label={<Typography sx={{ fontWeight: isSelected ? 600 : 400, color: 'text.primary' }}>{opt}</Typography>}
                  sx={{ width: '100%', m: 0 }}
                />
              </Paper>
            );
          })}
        </RadioGroup>
      )}
    </Box>
  );
}
