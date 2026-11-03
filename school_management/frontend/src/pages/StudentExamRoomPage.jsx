import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Send as SubmitIcon,
  Person as StudentIcon,
  CheckCircleOutline as AnsweredIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from '@mui/icons-material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useColorTheme } from '../context/ThemeContext';
import MultipleChoiceQuestion from '../components/MultipleChoiceQuestion';
import CodeBlockQuestion from '../components/CodeBlockQuestion';
import TrueFalseQuestion from '../components/TrueFalseQuestion';
import RelateColumnsQuestion from '../components/RelateColumnsQuestion';
import FillBlanksQuestion from '../components/FillBlanksQuestion';
import OpenTextQuestion from '../components/OpenTextQuestion';

export default function StudentExamRoomPage() {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { isDark, toggleTheme } = useColorTheme();

  const [session, setSession] = useState(() => {
    return location.state?.session || JSON.parse(sessionStorage.getItem('studentSession') || 'null');
  });

  const [answers, setAnswers] = useState(() => {
    if (session?.savedAnswersJson) {
      try {
        return JSON.parse(session.savedAnswersJson);
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'error'
  const [lastSavedTime, setLastSavedTime] = useState(new Date());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const saveTimeoutRef = useRef(null);

  const localSubmitted = sessionStorage.getItem(`exam_submitted_${submissionId}`);
  const isAlreadyFinished = Boolean(
    localSubmitted ||
    session?.isCompleted ||
    session?.status === 'ALREADY_SUBMITTED'
  );

  // If already submitted or no session, redirect accordingly
  useEffect(() => {
    // 1. Check if already marked as submitted in this browser session
    if (localSubmitted) {
      try {
        const parsed = JSON.parse(localSubmitted);
        navigate(`/exam/finished/${submissionId}`, { replace: true, state: parsed });
        return;
      } catch (e) {}
    }

    // 2. Check if the session object itself is completed
    if (session?.isCompleted || session?.status === 'ALREADY_SUBMITTED') {
      navigate(`/exam/finished/${submissionId}`, {
        replace: true,
        state: {
          session,
          examTitle: session.examTitle,
          studentName: session.studentName,
        },
      });
      return;
    }

    // 3. If no session found in state or storage, redirect back to join
    if (!session || String(session.submissionId) !== String(submissionId)) {
      navigate('/', { replace: true });
      return;
    }

    // 4. Check backend to verify if already completed in case of backward navigation or external submission
    let isMounted = true;
    api.get(`/student/exams/${submissionId}`)
      .then((res) => {
        if (!isMounted) return;
        if (res.data?.isCompleted) {
          const finishedPayload = {
            result: res.data,
            examTitle: res.data.examTitle || session.examTitle,
            studentName: res.data.studentName || session.studentName,
            session: {
              ...session,
              isCompleted: true,
              status: 'ALREADY_SUBMITTED',
            },
          };
          sessionStorage.setItem(`exam_submitted_${submissionId}`, JSON.stringify(finishedPayload));
          navigate(`/exam/finished/${submissionId}`, { replace: true, state: finishedPayload });
        }
      })
      .catch((err) => {
        console.warn('Could not verify submission status from backend', err);
      });

    return () => {
      isMounted = false;
    };
  }, [session, submissionId, navigate, localSubmitted]);

  // Debounced auto-save function
  const triggerAutoSave = (updatedAnswers) => {
    setSaveStatus('saving');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.put(`/student/exams/${submissionId}/save`, {
          answersJson: JSON.stringify(updatedAnswers),
        });
        setSaveStatus('saved');
        setLastSavedTime(new Date());
      } catch (err) {
        console.error('Failed to auto-save answers', err);
        setSaveStatus('error');
      }
    }, 800);
  };

  const handleAnswerChange = (questionId, newAnswer) => {
    const updated = {
      ...answers,
      [String(questionId)]: newAnswer,
    };
    setAnswers(updated);
    triggerAutoSave(updated);
  };

  const handleSubmitExam = async () => {
    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await api.post(`/student/exams/${submissionId}/submit`, {
        answersJson: JSON.stringify(answers),
      });

      const finishedPayload = {
        result: res.data,
        examTitle: res.data.examTitle || session.examTitle,
        studentName: res.data.studentName || session.studentName,
        session: {
          ...session,
          isCompleted: true,
          status: 'ALREADY_SUBMITTED',
        },
      };

      // Store submitted exam payload so that navigating back or refreshing immediately shows results
      sessionStorage.setItem(`exam_submitted_${submissionId}`, JSON.stringify(finishedPayload));
      sessionStorage.removeItem('studentSession');

      // Use replace: true so the room page is replaced in the history stack
      navigate(`/exam/finished/${submissionId}`, {
        replace: true,
        state: finishedPayload,
      });
    } catch (err) {
      setSubmitError(
        err.response?.data?.error || 'Error al enviar el examen. Por favor intenta nuevamente.'
      );
      setSubmitting(false);
    }
  };

  if (isAlreadyFinished || !session) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const questions = session.questions || [];
  const answeredCount = questions.filter((q) => {
    const ans = answers[String(q.id)];
    if (ans === undefined || ans === null) return false;
    if (Array.isArray(ans)) return ans.length > 0 && ans.some((x) => x && String(x).trim() !== '');
    if (typeof ans === 'object') return Object.keys(ans).length > 0;
    return String(ans).trim() !== '';
  }).length;

  const progressPercent = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  return (
    <Box sx={{ pb: 10, width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* Sticky Top Header */}
      <Paper
        elevation={2}
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          bgcolor: 'background.paper',
          borderBottom: `1px solid ${theme.palette.divider}`,
          py: { xs: 1.2, sm: 1.5 },
          px: 0,
          width: '100%',
          boxSizing: 'border-box',
          transition: 'background-color 0.2s ease, border-color 0.2s ease',
        }}
      >
        <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
              width: '100%',
            }}
          >
            {/* Solo Nombre del Examen, Nombre del Alumno y Grupo */}
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 800,
                  color: 'text.primary',
                  lineHeight: 1.2,
                  fontSize: { xs: '0.95rem', sm: '1.15rem' },
                  wordBreak: 'break-word',
                }}
              >
                {session.examTitle}
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: { xs: 0.8, sm: 1.5 },
                  mt: 0.4,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: 'text.secondary',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  }}
                >
                  <StudentIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                  {session.studentName}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 800,
                    color: 'secondary.main',
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  }}
                >
                  • Grupo: {session.groupName || 'A'}
                </Typography>
              </Box>
            </Box>

            {/* Solo Botón de cambiar tema */}
            <Tooltip title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
              <IconButton
                size="small"
                onClick={toggleTheme}
                sx={{
                  flexShrink: 0,
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                  border: `1px solid ${theme.palette.divider}`,
                  p: 1,
                }}
              >
                {isDark ? (
                  <LightModeIcon sx={{ color: '#FBBF24', fontSize: 20 }} />
                ) : (
                  <DarkModeIcon sx={{ color: '#1B254B', fontSize: 20 }} />
                )}
              </IconButton>
            </Tooltip>
          </Box>

          {/* Barra de progreso visual */}
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.72rem' }}>
                Progreso: {answeredCount} de {questions.length} respondidas
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'secondary.main', fontSize: '0.72rem' }}>
                {Math.round(progressPercent)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progressPercent}
              color="secondary"
              sx={{ height: 4, borderRadius: '4px', bgcolor: isDark ? '#1E2945' : '#f1f5f9' }}
            />
          </Box>
        </Container>
      </Paper>

      {/* Questions Container */}
      <Container maxWidth="md" sx={{ mt: { xs: 2.5, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
        {session.examDescription && (
          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'background.paper', borderRadius: '10px' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {session.examDescription}
            </Typography>
          </Paper>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {questions.map((q, idx) => {
            const currentAnswer = answers[String(q.id)];

            return (
              <Card key={q.id} id={`q-${q.id}`} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
                <CardContent sx={{ p: { xs: 2, sm: 3.5 } }}>
                  {/* Question Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Chip
                        label={`Pregunta ${idx + 1}`}
                        color="primary"
                        sx={{ fontWeight: 800, fontSize: '0.85rem' }}
                      />
                      <Chip
                        label={`${q.points} pts`}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 700, borderColor: '#cbd5e1' }}
                      />
                    </Box>

                    {/* Answered badge */}
                    {currentAnswer !== undefined && currentAnswer !== null && (
                      <Chip
                        icon={<AnsweredIcon sx={{ fontSize: '16px !important', color: '#16a34a !important' }} />}
                        label="Respondida"
                        size="small"
                        sx={{
                          bgcolor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4',
                          color: isDark ? '#4ade80' : '#15803d',
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </Box>

                  {/* Question Prompt */}
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                    {q.prompt}
                  </Typography>

                  {/* Render based on Question Type */}
                  {q.type === 'MULTIPLE_CHOICE' && (
                    <MultipleChoiceQuestion
                      question={q}
                      value={currentAnswer}
                      onChange={(val) => handleAnswerChange(q.id, val)}
                    />
                  )}

                  {q.type === 'CODE_BLOCK' && (
                    <CodeBlockQuestion
                      question={q}
                      value={currentAnswer}
                      onChange={(val) => handleAnswerChange(q.id, val)}
                    />
                  )}

                  {q.type === 'TRUE_FALSE' && (
                    <TrueFalseQuestion
                      value={currentAnswer}
                      onChange={(val) => handleAnswerChange(q.id, val)}
                    />
                  )}

                  {q.type === 'RELATE_COLUMNS' && (
                    <RelateColumnsQuestion
                      question={q}
                      value={currentAnswer}
                      onChange={(val) => handleAnswerChange(q.id, val)}
                    />
                  )}

                  {q.type === 'FILL_BLANKS' && (
                    <FillBlanksQuestion
                      question={q}
                      value={currentAnswer}
                      onChange={(val) => handleAnswerChange(q.id, val)}
                    />
                  )}

                  {q.type === 'OPEN_TEXT' && (
                    <OpenTextQuestion
                      question={q}
                      value={currentAnswer}
                      onChange={(val) => handleAnswerChange(q.id, val)}
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>

        {/* Bottom Submit Action */}
        <Box sx={{ mt: 5, textAlign: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<SubmitIcon />}
            onClick={() => setConfirmOpen(true)}
            sx={{ px: 4, py: 1.8, fontSize: '1.1rem', fontWeight: 700, borderRadius: '10px' }}
          >
            Finalizar y Entregar Examen
          </Button>
        </Box>
      </Container>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={() => !submitting && setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>¿Entregar tu examen?</DialogTitle>
        <DialogContent>
          {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}

          <Typography variant="body1" sx={{ mb: 2 }}>
            Has respondido <strong>{answeredCount}</strong> de <strong>{questions.length}</strong> preguntas.
          </Typography>

          {answeredCount < questions.length && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Aún tienes {questions.length - answeredCount} pregunta(s) sin responder. Una vez entregado no podrás modificar tus respuestas.
            </Alert>
          )}

          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            El sistema evaluará automáticamente tus respuestas y guardará tu calificación final.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} disabled={submitting} color="inherit">
            Continuar respondiendo
          </Button>
          <Button
            onClick={handleSubmitExam}
            disabled={submitting}
            variant="contained"
            color="primary"
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Sí, Entregar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
