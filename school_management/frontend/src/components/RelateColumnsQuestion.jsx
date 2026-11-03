import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Button,
  Divider,
  useTheme,
} from '@mui/material';
import {
  CompareArrows as MatchIcon,
  CheckCircle as LinkedIcon,
  RestartAlt as ResetIcon,
} from '@mui/icons-material';

const PAIR_COLORS_LIGHT = [
  { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8', badge: '#2563eb' },
  { bg: '#f0fdf4', border: '#22c55e', text: '#15803d', badge: '#16a34a' },
  { bg: '#faf5ff', border: '#a855f7', text: '#7e22ce', badge: '#9333ea' },
  { bg: '#fff7ed', border: '#f97316', text: '#c2410c', badge: '#ea580c' },
  { bg: '#fdf2f8', border: '#ec4899', text: '#be185d', badge: '#db2777' },
  { bg: '#ecfeff', border: '#06b6d4', text: '#0e7490', badge: '#0891b2' },
];

const PAIR_COLORS_DARK = [
  { bg: 'rgba(59, 130, 246, 0.18)', border: '#60a5fa', text: '#93c5fd', badge: '#2563eb' },
  { bg: 'rgba(34, 197, 94, 0.18)', border: '#4ade80', text: '#86efac', badge: '#16a34a' },
  { bg: 'rgba(168, 85, 247, 0.18)', border: '#c084fc', text: '#d8b4fe', badge: '#9333ea' },
  { bg: 'rgba(249, 115, 22, 0.18)', border: '#fb923c', text: '#fdba74', badge: '#ea580c' },
  { bg: 'rgba(236, 72, 153, 0.18)', border: '#f472b6', text: '#f9a8d4', badge: '#db2777' },
  { bg: 'rgba(6, 182, 212, 0.18)', border: '#22d3ee', text: '#67e8f9', badge: '#0891b2' },
];

export default function RelateColumnsQuestion({ question, value = {}, onChange }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [selectedLeft, setSelectedLeft] = useState(null);

  let leftColumn = [];
  let rightColumn = [];

  try {
    const data = typeof question.questionData === 'string'
      ? JSON.parse(question.questionData)
      : question.questionData;
    leftColumn = data.leftColumn || [];
    rightColumn = data.rightColumn || [];
  } catch (e) {
    leftColumn = [];
    rightColumn = [];
  }

  const currentMatches = value && typeof value === 'object' ? value : {};

  // Find color for a given left item
  const getPairStyle = (leftItem) => {
    const index = leftColumn.indexOf(leftItem);
    const palette = isDark ? PAIR_COLORS_DARK : PAIR_COLORS_LIGHT;
    return palette[index % palette.length];
  };

  // Find which left item is connected to this right item
  const findLeftForRight = (rightItem) => {
    for (const [l, r] of Object.entries(currentMatches)) {
      if (r === rightItem) return l;
    }
    return null;
  };

  const handleSelectLeft = (leftItem) => {
    if (selectedLeft === leftItem) {
      setSelectedLeft(null);
    } else {
      setSelectedLeft(leftItem);
    }
  };

  const handleSelectRight = (rightItem) => {
    if (!selectedLeft) return;

    const newMatches = { ...currentMatches };

    // If another left item was already mapped to this right item, remove old mapping
    for (const [l, r] of Object.entries(newMatches)) {
      if (r === rightItem) {
        delete newMatches[l];
      }
    }

    newMatches[selectedLeft] = rightItem;
    onChange(newMatches);
    setSelectedLeft(null);
  };

  const handleUnlink = (leftItem, e) => {
    e.stopPropagation();
    const newMatches = { ...currentMatches };
    delete newMatches[leftItem];
    onChange(newMatches);
  };

  const handleResetAll = () => {
    onChange({});
    setSelectedLeft(null);
  };

  const totalPaired = Object.keys(currentMatches).length;

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
          <MatchIcon fontSize="small" color="primary" />
          Haz clic en un elemento de la columna izquierda y luego selecciona su pareja en la derecha.
        </Typography>
        {totalPaired > 0 && (
          <Button
            size="small"
            startIcon={<ResetIcon />}
            color="inherit"
            onClick={handleResetAll}
            sx={{ textTransform: 'none', color: 'text.secondary' }}
          >
            Reiniciar enlaces
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary' }}>
            Columna A ({totalPaired}/{leftColumn.length} vinculados)
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {leftColumn.map((item, idx) => {
              const isSelected = selectedLeft === item;
              const matchedRight = currentMatches[item];
              const pairStyle = getPairStyle(item);

              return (
                <Paper
                  key={idx}
                  variant="outlined"
                  onClick={() => handleSelectLeft(item)}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    borderRadius: '8px',
                    position: 'relative',
                    borderColor: isSelected
                      ? 'primary.main'
                      : matchedRight
                      ? pairStyle.border
                      : (isDark ? '#263554' : '#e2e8f0'),
                    bgcolor: isSelected
                      ? (isDark ? 'rgba(75, 119, 216, 0.18)' : '#eff6ff')
                      : matchedRight
                      ? pairStyle.bg
                      : 'background.paper',
                    borderWidth: isSelected || matchedRight ? 2 : 1,
                    boxShadow: isSelected ? '0 0 0 3px rgba(37, 99, 235, 0.2)' : 'none',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    '&:hover': {
                      borderColor: 'primary.light',
                      bgcolor: isSelected
                        ? (isDark ? 'rgba(75, 119, 216, 0.26)' : '#eff6ff')
                        : matchedRight
                        ? pairStyle.bg
                        : (isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc'),
                      transform: 'translateX(2px)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Chip
                      label={idx + 1}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        bgcolor: matchedRight ? pairStyle.badge : (isDark ? '#1E2945' : '#94a3b8'),
                        color: 'white',
                      }}
                    />
                    <Typography sx={{ fontWeight: matchedRight || isSelected ? 600 : 400, color: 'text.primary' }}>
                      {item}
                    </Typography>
                  </Box>

                  {matchedRight && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        icon={<LinkedIcon sx={{ color: 'white !important' }} />}
                        label="Vinculado"
                        size="small"
                        onDelete={(e) => handleUnlink(item, e)}
                        sx={{
                          bgcolor: pairStyle.badge,
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                        }}
                      />
                    </Box>
                  )}
                </Paper>
              );
            })}
          </Box>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary' }}>
            Columna B (Selecciona una respuesta)
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {rightColumn.map((item, idx) => {
              const matchedLeft = findLeftForRight(item);
              const pairStyle = matchedLeft ? getPairStyle(matchedLeft) : null;
              const leftIdx = matchedLeft ? leftColumn.indexOf(matchedLeft) + 1 : null;

              return (
                <Paper
                  key={idx}
                  variant="outlined"
                  onClick={() => handleSelectRight(item)}
                  sx={{
                    p: 2,
                    cursor: selectedLeft ? 'pointer' : 'default',
                    borderRadius: '8px',
                    borderColor: matchedLeft
                      ? pairStyle.border
                      : selectedLeft
                      ? (isDark ? '#3b82f6' : '#93c5fd')
                      : (isDark ? '#263554' : '#e2e8f0'),
                    bgcolor: matchedLeft
                      ? pairStyle.bg
                      : selectedLeft
                      ? (isDark ? 'rgba(75, 119, 216, 0.12)' : '#f8fafc')
                      : 'background.paper',
                    borderWidth: matchedLeft ? 2 : 1,
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    '&:hover': {
                      borderColor: selectedLeft ? 'primary.main' : (isDark ? '#3b4d75' : '#cbd5e1'),
                      bgcolor: selectedLeft
                        ? (isDark ? 'rgba(75, 119, 216, 0.22)' : '#eff6ff')
                        : (isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc'),
                    },
                  }}
                >
                  <Typography sx={{ fontWeight: matchedLeft ? 600 : 400, color: 'text.primary' }}>
                    {item}
                  </Typography>

                  {matchedLeft ? (
                    <Chip
                      label={`Pareja de #${leftIdx}`}
                      size="small"
                      sx={{
                        bgcolor: pairStyle.badge,
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}
                    />
                  ) : (
                    selectedLeft && (
                      <Chip
                        label="Clic para unir"
                        size="small"
                        variant="outlined"
                        color="primary"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    )
                  )}
                </Paper>
              );
            })}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
