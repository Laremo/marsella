import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  Grid,
  Paper,
  Alert,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  HelpOutline as HelpIcon,
} from '@mui/icons-material';
import CodeBlockView from './CodeBlockView';

const QUESTION_TYPES = [
  { value: 'MULTIPLE_CHOICE', label: 'Opción Múltiple' },
  { value: 'CODE_BLOCK', label: 'Bloque de Código (Opción Múltiple)' },
  { value: 'TRUE_FALSE', label: 'Verdadero o Falso' },
  { value: 'RELATE_COLUMNS', label: 'Relacionar Columnas' },
  { value: 'FILL_BLANKS', label: 'Completar Espacios en Blanco' },
  { value: 'OPEN_TEXT', label: 'Pregunta Abierta (Respuesta Escrita)' },
];

export default function QuestionBuilderModal({ open, onClose, onSave, initialData }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [type, setType] = useState('MULTIPLE_CHOICE');
  const [prompt, setPrompt] = useState('');
  const [points, setPoints] = useState(2.5);
  const [error, setError] = useState('');

  // Code Block state
  const [codeSnippet, setCodeSnippet] = useState(
    'def suma(a, b):\n    return a + b\n\nprint(suma(3, 4))'
  );
  const [codeLanguage, setCodeLanguage] = useState('python');

  // Multiple Choice state
  const [mcOptions, setMcOptions] = useState(['', '', '', '']);
  const [mcCorrect, setMcCorrect] = useState([]);
  const [mcAllowMultiple, setMcAllowMultiple] = useState(false);

  // True / False state
  const [tfCorrect, setTfCorrect] = useState(true);

  // Relate Columns state: array of { left: '', right: '' }
  const [rcPairs, setRcPairs] = useState([
    { left: '', right: '' },
    { left: '', right: '' },
    { left: '', right: '' },
  ]);

  // Fill Blanks state
  const [fbTemplate, setFbTemplate] = useState('');

  // Open Text state
  const [openExpectedAnswer, setOpenExpectedAnswer] = useState('');

  useEffect(() => {
    if (initialData) {
      setType(initialData.type || 'MULTIPLE_CHOICE');
      setPrompt(initialData.prompt || '');
      setPoints(initialData.points !== undefined ? initialData.points : 2.5);

      try {
        const qData = typeof initialData.questionData === 'string'
          ? JSON.parse(initialData.questionData)
          : initialData.questionData || {};

        const cData = typeof initialData.correctAnswer === 'string'
          ? JSON.parse(initialData.correctAnswer)
          : initialData.correctAnswer;

        if (initialData.type === 'MULTIPLE_CHOICE') {
          setMcOptions(qData.options || ['', '', '', '']);
          setMcAllowMultiple(!!qData.allowMultiple);
          setMcCorrect(Array.isArray(cData) ? cData : cData ? [cData] : []);
        } else if (initialData.type === 'CODE_BLOCK') {
          setCodeSnippet(qData.code || 'def suma(a, b):\n    return a + b\n\nprint(suma(3, 4))');
          setCodeLanguage(qData.language || 'python');
          setMcOptions(qData.options || ['', '', '', '']);
          setMcAllowMultiple(!!qData.allowMultiple);
          setMcCorrect(Array.isArray(cData) ? cData : cData ? [cData] : []);
        } else if (initialData.type === 'TRUE_FALSE') {
          setTfCorrect(cData === true || cData === 'true');
        } else if (initialData.type === 'RELATE_COLUMNS') {
          if (cData && typeof cData === 'object') {
            const pairs = Object.entries(cData).map(([left, right]) => ({ left, right }));
            setRcPairs(pairs.length > 0 ? pairs : [{ left: '', right: '' }, { left: '', right: '' }]);
          }
        } else if (initialData.type === 'FILL_BLANKS') {
          setFbTemplate(qData.template || '');
        } else if (initialData.type === 'OPEN_TEXT') {
          setOpenExpectedAnswer(typeof cData === 'string' ? cData : '');
        }
      } catch (e) {
        console.error('Error parsing initial question data', e);
      }
    } else {
      // Reset defaults for a new question
      setType('MULTIPLE_CHOICE');
      setPrompt('');
      setPoints(2.5);
      setCodeSnippet('def suma(a, b):\n    return a + b\n\nprint(suma(3, 4))');
      setCodeLanguage('python');
      setMcOptions(['', '', '', '']);
      setMcCorrect([]);
      setMcAllowMultiple(false);
      setTfCorrect(true);
      setRcPairs([
        { left: '', right: '' },
        { left: '', right: '' },
        { left: '', right: '' },
      ]);
      setFbTemplate('');
      setOpenExpectedAnswer('');
      setError('');
    }
  }, [initialData, open]);

  // Multiple Choice handlers
  const handleAddOption = () => {
    setMcOptions([...mcOptions, '']);
  };

  const handleRemoveOption = (index) => {
    const optValue = mcOptions[index];
    const newOptions = mcOptions.filter((_, i) => i !== index);
    setMcOptions(newOptions);
    setMcCorrect(mcCorrect.filter((item) => item !== optValue));
  };

  const handleOptionTextChange = (index, val) => {
    const oldVal = mcOptions[index];
    const newOptions = [...mcOptions];
    newOptions[index] = val;
    setMcOptions(newOptions);

    if (mcCorrect.includes(oldVal)) {
      setMcCorrect(mcCorrect.map((item) => (item === oldVal ? val : item)));
    }
  };

  const handleToggleCorrectOption = (opt) => {
    if (!opt.trim()) return;
    if (mcAllowMultiple) {
      if (mcCorrect.includes(opt)) {
        setMcCorrect(mcCorrect.filter((item) => item !== opt));
      } else {
        setMcCorrect([...mcCorrect, opt]);
      }
    } else {
      setMcCorrect([opt]);
    }
  };

  // Relate Columns handlers
  const handleAddPair = () => {
    setRcPairs([...rcPairs, { left: '', right: '' }]);
  };

  const handleRemovePair = (index) => {
    setRcPairs(rcPairs.filter((_, i) => i !== index));
  };

  const handlePairChange = (index, field, value) => {
    const updated = [...rcPairs];
    updated[index][field] = value;
    setRcPairs(updated);
  };

  // Save validation
  const handleSave = () => {
    setError('');

    if (!prompt.trim()) {
      setError('La redacción o enunciado de la pregunta es obligatorio.');
      return;
    }

    if (points === undefined || points === null || points < 0) {
      setError('El valor en puntos debe ser igual o mayor a 0.');
      return;
    }

    let questionDataPayload = {};
    let correctAnswerPayload = null;

    if (type === 'MULTIPLE_CHOICE' || type === 'CODE_BLOCK') {
      if (type === 'CODE_BLOCK' && !codeSnippet.trim()) {
        setError('Debes ingresar el bloque de código a presentar.');
        return;
      }
      const validOptions = mcOptions.map((o) => o.trim()).filter(Boolean);
      if (validOptions.length < 2) {
        setError('Debes ingresar al menos 2 opciones de respuesta.');
        return;
      }
      if (mcCorrect.length === 0) {
        setError('Debes marcar al menos una opción correcta.');
        return;
      }
      questionDataPayload = {
        options: validOptions,
        allowMultiple: mcAllowMultiple,
        ...(type === 'CODE_BLOCK' ? { code: codeSnippet, language: codeLanguage } : {}),
      };
      correctAnswerPayload = mcCorrect;
    } else if (type === 'TRUE_FALSE') {
      questionDataPayload = {};
      correctAnswerPayload = tfCorrect;
    } else if (type === 'RELATE_COLUMNS') {
      const validPairs = rcPairs.filter((p) => p.left.trim() && p.right.trim());
      if (validPairs.length < 2) {
        setError('Debes agregar al menos 2 parejas válidas para relacionar columnas.');
        return;
      }

      const leftColumn = validPairs.map((p) => p.left.trim());
      // Right column shuffled slightly
      const rightColumn = validPairs.map((p) => p.right.trim()).sort(() => Math.random() - 0.5);

      const matches = {};
      validPairs.forEach((p) => {
        matches[p.left.trim()] = p.right.trim();
      });

      questionDataPayload = { leftColumn, rightColumn };
      correctAnswerPayload = matches;
    } else if (type === 'FILL_BLANKS') {
      if (!fbTemplate.trim()) {
        setError('Debes ingresar el texto con los corchetes [espacio].');
        return;
      }

      // Extract words inside brackets
      const regex = /\[([^\]]+)\]/g;
      const extracted = [];
      let match;
      while ((match = regex.exec(fbTemplate)) !== null) {
        extracted.push(match[1].trim());
      }

      if (extracted.length === 0) {
        setError('Debes incluir al menos un espacio con corchetes, por ejemplo: [palabra].');
        return;
      }

      questionDataPayload = { template: fbTemplate.trim() };
      correctAnswerPayload = extracted;
    } else if (type === 'OPEN_TEXT') {
      questionDataPayload = { type: 'OPEN_TEXT' };
      correctAnswerPayload = openExpectedAnswer.trim();
    }

    onSave({
      id: initialData?.id,
      prompt: prompt.trim(),
      type,
      points: parseFloat(points),
      questionData: JSON.stringify(questionDataPayload),
      correctAnswer: JSON.stringify(correctAnswerPayload),
    });

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
        {initialData ? 'Editar Pregunta' : 'Crear Nueva Pregunta'}
      </DialogTitle>

      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={2}>
          {/* Question Type */}
          <Grid item xs={12} sm={8}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo de Pregunta</InputLabel>
              <Select
                value={type}
                label="Tipo de Pregunta"
                onChange={(e) => setType(e.target.value)}
              >
                {QUESTION_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Points */}
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Valor en Puntos"
              inputProps={{ min: 0, step: 0.5 }}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
            />
          </Grid>

          {/* Prompt */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Enunciado o Instrucción de la Pregunta"
              placeholder="Escribe la pregunta que verán los alumnos..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Dynamic configuration according to question type */}

        {/* Code Block Specific Settings */}
        {type === 'CODE_BLOCK' && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Configuración del Bloque de Código
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Escribe el código fuente y selecciona el lenguaje para el formateado y colores como en un IDE.
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '240px 1fr' }, gap: 2, mb: 2 }}>
              <TextField
                select
                label="Lenguaje del Código"
                value={codeLanguage}
                onChange={(e) => setCodeLanguage(e.target.value)}
                size="small"
                fullWidth
              >
                <MenuItem value="python">🐍 Python (Por defecto)</MenuItem>
                <MenuItem value="bash">🐚 Bash / Shell</MenuItem>
                <MenuItem value="javascript">⚡ JavaScript</MenuItem>
                <MenuItem value="sql">🗄️ SQL</MenuItem>
                <MenuItem value="html">🌐 HTML</MenuItem>
              </TextField>

              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                💡 El código se presentará a los alumnos con colores, números de línea y diseño de IDE.
              </Typography>
            </Box>

            <TextField
              label="Código Fuente"
              placeholder="# Escribe o pega aquí el código..."
              multiline
              rows={6}
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              fullWidth
              InputProps={{
                sx: {
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                  fontSize: '0.88rem',
                  bgcolor: isDark ? '#0d1117' : '#f8fafc',
                },
              }}
              helperText="Escribe o edita el fragmento de código. Abajo se actualiza la vista previa interactiva."
            />

            {/* Live IDE Preview */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                Vista previa en vivo (Formato IDE):
              </Typography>
              <CodeBlockView code={codeSnippet} language={codeLanguage} />
            </Box>

            <Divider sx={{ my: 3 }} />
          </Box>
        )}

        {/* Multiple Choice Options (Applicable for MULTIPLE_CHOICE and CODE_BLOCK) */}
        {(type === 'MULTIPLE_CHOICE' || type === 'CODE_BLOCK') && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Opciones de Respuesta
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={mcAllowMultiple}
                    onChange={(e) => setMcAllowMultiple(e.target.checked)}
                  />
                }
                label="Permitir respuestas múltiples"
              />
            </Box>

            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Escribe las opciones y marca con la casilla o botón la(s) que sea(n) la respuesta correcta.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {mcOptions.map((opt, idx) => {
                const isCorrect = mcCorrect.includes(opt) && opt.trim() !== '';
                return (
                  <Paper
                    key={idx}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      borderColor: isCorrect ? 'success.main' : (isDark ? '#263554' : '#e2e8f0'),
                      bgcolor: isCorrect ? (isDark ? 'rgba(34, 197, 94, 0.12)' : '#f0fdf4') : 'background.paper',
                    }}
                  >
                    {mcAllowMultiple ? (
                      <Checkbox
                        checked={isCorrect}
                        onChange={() => handleToggleCorrectOption(opt)}
                        disabled={!opt.trim()}
                      />
                    ) : (
                      <Radio
                        checked={isCorrect}
                        onChange={() => handleToggleCorrectOption(opt)}
                        disabled={!opt.trim()}
                      />
                    )}

                    <TextField
                      fullWidth
                      size="small"
                      placeholder={`Opción ${idx + 1}`}
                      value={opt}
                      onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                    />

                    {mcOptions.length > 2 && (
                      <IconButton size="small" color="error" onClick={() => handleRemoveOption(idx)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Paper>
                );
              })}

              <Button
                startIcon={<AddIcon />}
                onClick={handleAddOption}
                variant="outlined"
                sx={{ alignSelf: 'flex-start', mt: 1 }}
              >
                Agregar Opción
              </Button>
            </Box>
          </Box>
        )}

        {/* 2. True / False */}
        {type === 'TRUE_FALSE' && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Respuesta Correcta
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Indica si la afirmación escrita en el enunciado es verdadera o falsa.
            </Typography>

            <RadioGroup
              row
              value={tfCorrect ? 'true' : 'false'}
              onChange={(e) => setTfCorrect(e.target.value === 'true')}
              sx={{ display: 'flex', gap: 2, mt: 1 }}
            >
              <Paper
                variant="outlined"
                onClick={() => setTfCorrect(true)}
                sx={{
                  flex: 1,
                  p: 1.5,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  borderColor: tfCorrect ? 'primary.main' : (isDark ? '#263554' : '#e2e8f0'),
                  bgcolor: tfCorrect ? (isDark ? 'rgba(75, 119, 216, 0.16)' : '#eff6ff') : 'background.paper',
                  borderWidth: tfCorrect ? 2 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                }}
              >
                <Radio checked={tfCorrect} color="primary" size="small" />
                <Typography sx={{ fontWeight: tfCorrect ? 700 : 500 }}>Verdadero</Typography>
              </Paper>
              <Paper
                variant="outlined"
                onClick={() => setTfCorrect(false)}
                sx={{
                  flex: 1,
                  p: 1.5,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  borderColor: !tfCorrect ? 'primary.main' : (isDark ? '#263554' : '#e2e8f0'),
                  bgcolor: !tfCorrect ? (isDark ? 'rgba(75, 119, 216, 0.16)' : '#eff6ff') : 'background.paper',
                  borderWidth: !tfCorrect ? 2 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                }}
              >
                <Radio checked={!tfCorrect} color="primary" size="small" />
                <Typography sx={{ fontWeight: !tfCorrect ? 700 : 500 }}>Falso</Typography>
              </Paper>
            </RadioGroup>
          </Box>
        )}

        {/* 3. Relate Columns */}
        {type === 'RELATE_COLUMNS' && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Parejas de Columnas
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Define los elementos de la columna izquierda y su pareja correcta en la columna derecha. El sistema barajará las opciones para los alumnos.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {rcPairs.map((pair, idx) => (
                <Grid container spacing={1.5} key={idx} alignItems="center">
                  <Grid item xs={5.5}>
                    <TextField
                      fullWidth
                      size="small"
                      label={`Elemento ${idx + 1} (Columna A)`}
                      value={pair.left}
                      onChange={(e) => handlePairChange(idx, 'left', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={5.5}>
                    <TextField
                      fullWidth
                      size="small"
                      label={`Pareja ${idx + 1} (Columna B)`}
                      value={pair.right}
                      onChange={(e) => handlePairChange(idx, 'right', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={1}>
                    {rcPairs.length > 2 && (
                      <IconButton size="small" color="error" onClick={() => handleRemovePair(idx)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Grid>
                </Grid>
              ))}

              <Button
                startIcon={<AddIcon />}
                onClick={handleAddPair}
                variant="outlined"
                sx={{ alignSelf: 'flex-start', mt: 1 }}
              >
                Agregar Pareja
              </Button>
            </Box>
          </Box>
        )}

        {/* 4. Fill in the blanks */}
        {type === 'FILL_BLANKS' && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Texto con Espacios en Blanco
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Usa corchetes <code>[palabra]</code> para indicar las palabras que el alumno deberá rellenar.
              <br />
              Ejemplo: <em>El agua hierve a <strong>[100]</strong> grados y su fórmula es <strong>[H2O]</strong>.</em>
            </Alert>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Plantilla del texto"
              placeholder="Escribe el texto usando [palabra] para los espacios..."
              value={fbTemplate}
              onChange={(e) => setFbTemplate(e.target.value)}
            />
          </Box>
        )}

        {/* 5. Open Text */}
        {type === 'OPEN_TEXT' && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Pregunta Abierta (Respuesta Escrita)
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              El alumno responderá a esta pregunta escribiendo texto libremente en un campo de respuesta en su pantalla.
            </Alert>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Respuesta sugerida o palabras clave (Opcional)"
              placeholder="Escribe la respuesta esperada o palabras clave para autoevaluación, o déjalo vacío para asignación directa..."
              value={openExpectedAnswer}
              onChange={(e) => setOpenExpectedAnswer(e.target.value)}
              helperText="Opcional. Si lo dejas vacío, cualquier respuesta entregada por el alumno se registrará para la calificación."
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Guardar Pregunta
        </Button>
      </DialogActions>
    </Dialog>
  );
}
