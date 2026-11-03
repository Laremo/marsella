import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  CircularProgress,
  Divider,
  useTheme,
  LinearProgress,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  SkipNext as SkipNextIcon,
  EmojiEvents as TrophyIcon,
  People as PeopleIcon,
  Timer as TimerIcon,
  FileDownload as ExportIcon,
  CheckCircle as CorrectIcon,
  Cancel as IncorrectIcon,
  ArrowForward as ArrowForwardIcon,
  ExitToApp as ExitIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  LocalFireDepartment as FireIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import quizApi from '../services/quizApi';

const KAHOOT_STYLES = {
  A: { name: 'Rojo', hex: '#E21B3C', shape: '▲' },
  B: { name: 'Azul', hex: '#1368CE', shape: '◆' },
  C: { name: 'Amarillo', hex: '#D89E00', shape: '●' },
  D: { name: 'Verde', hex: '#26890C', shape: '■' },
};

export default function TeacherQuizHostPage() {
  const { pin } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [advancing, setAdvancing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Local animated countdown for preview and active phases
  const [countdown, setCountdown] = useState(15);
  const countdownTimerRef = useRef(null);
  const pollingTimerRef = useRef(null);
  const hasTriggeredPodiumConfetti = useRef(false);

  // Fetch state from server
  const fetchState = async () => {
    try {
      const res = await quizApi.getLiveState(pin);
      const data = res.data;
      setState(data);
      setError('');
    } catch (err) {
      console.error('Error fetching host live state:', err);
      setError(err.response?.data?.message || 'Error al conectar con la sala del quiz.');
    } finally {
      setLoading(false);
    }
  };

  // Setup periodic polling
  useEffect(() => {
    fetchState();
    // Poll every 1000ms
    pollingTimerRef.current = setInterval(() => {
      fetchState();
    }, 1000);

    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [pin]);

  // Handle phase specific timer countdowns
  useEffect(() => {
    if (!state) return;

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    if (state.status === 'PREVIEW') {
      const previewSecs = state.previewDurationSeconds || 4;
      setCountdown(previewSecs);

      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimerRef.current);
            // Automatically advance from preview to active question!
            handleAdvancePhase();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (state.status === 'QUESTION_ACTIVE') {
      const timeLimit = state.currentQuestionTimeLimit || 15;
      setCountdown(timeLimit);

      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimerRef.current);
            // Time up! Auto-advance to closed question
            handleAdvancePhase();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (state.status === 'PODIUM' && !hasTriggeredPodiumConfetti.current) {
      hasTriggeredPodiumConfetti.current = true;
      triggerConfetti();
    }
  }, [state?.status, state?.currentQuestionIndex]);

  const triggerConfetti = () => {
    const count = 200;
    const defaults = { origin: { y: 0.7 } };
    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  };

  const handleAdvancePhase = async () => {
    if (advancing) return;
    setAdvancing(true);
    try {
      const res = await quizApi.advanceSessionPhase(pin);
      setState(res.data);
    } catch (err) {
      console.error('Error advancing quiz phase:', err);
    } finally {
      setAdvancing(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleExportExcel = () => {
    window.open(quizApi.getExportReportUrl(pin), '_blank');
  };

  if (loading && !state) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <CircularProgress size={50} />
        <Typography variant="h6" sx={{ mt: 3, fontWeight: 700 }}>
          Cargando sala del proyector...
        </Typography>
      </Box>
    );
  }

  if (error && !state) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="error" sx={{ fontWeight: 800, mb: 2 }}>
          {error}
        </Typography>
        <Button variant="contained" onClick={() => navigate('/teacher/quizzes')} sx={{ borderRadius: '8px' }}>
          Volver a Mis Quizzes
        </Button>
      </Container>
    );
  }

  const { status, quizTitle, players = [], groupRoster = [], currentQuestion, leaderboard = [], podium = [] } = state;
  const connectedPlayers = players.filter((p) => p.isConnected);
  const totalConnected = state.totalParticipantsAtStart || connectedPlayers.length;
  const answeredCount = state.answeredCount || 0;

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 70px)',
        bgcolor: isDark ? '#0b0f19' : '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Projector Bar */}
      <Box
        sx={{
          bgcolor: isDark ? '#111827' : '#ffffff',
          borderBottom: `1px solid ${theme.palette.divider}`,
          px: { xs: 2, md: 4 },
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              px: 2,
              py: 0.5,
              borderRadius: '8px',
              bgcolor: '#46178F',
              color: '#fff',
              fontWeight: 900,
              letterSpacing: '0.05em',
              fontSize: '1rem',
            }}
          >
            PIN: {pin}
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, display: { xs: 'none', sm: 'block' } }}>
            {quizTitle}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Chip
            icon={<PeopleIcon sx={{ fontSize: '16px !important' }} />}
            label={`${connectedPlayers.length} Conectados`}
            size="small"
            color="primary"
            sx={{ fontWeight: 700, borderRadius: '6px' }}
          />

          <Tooltip title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa para proyector'}>
            <IconButton onClick={toggleFullscreen} size="small">
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>

          <Button
            size="small"
            color="inherit"
            startIcon={<ExitIcon />}
            onClick={() => navigate('/teacher/quizzes')}
            sx={{ borderRadius: '6px', fontWeight: 600 }}
          >
            Salir
          </Button>
        </Box>
      </Box>

      {/* Main Dynamic Stage based on Phase */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: { xs: 2, md: 4 } }}>
        {/* PHASE 1: LOBBY */}
        {status === 'LOBBY' && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              maxWidth: 1000,
              mx: 'auto',
              width: '100%',
              textAlign: 'center',
            }}
          >
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700, mb: 1 }}>
              Únete desde tu celular o computadora en:
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                color: '#1368CE',
                letterSpacing: '-0.02em',
                mb: 2,
              }}
            >
              {window.location.origin}/quiz/live
            </Typography>

            <Paper
              elevation={4}
              sx={{
                p: { xs: 2, md: 3 },
                borderRadius: '12px',
                bgcolor: '#46178F',
                color: '#fff',
                mb: 4,
                display: 'inline-block',
                boxShadow: '0 8px 32px rgba(70, 23, 143, 0.4)',
              }}
            >
              <Typography variant="caption" sx={{ letterSpacing: '0.15em', fontWeight: 800, opacity: 0.9 }}>
                CÓDIGO PIN DEL JUEGO
              </Typography>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 900,
                  letterSpacing: '0.1em',
                  fontFamily: 'monospace',
                  lineHeight: 1.1,
                  mt: 0.5,
                }}
              >
                {pin}
              </Typography>
            </Paper>

            {/* Start Button */}
            <Button
              variant="contained"
              size="large"
              startIcon={advancing ? <CircularProgress size={24} color="inherit" /> : <PlayArrowIcon />}
              onClick={handleAdvancePhase}
              disabled={advancing || connectedPlayers.length === 0}
              sx={{
                borderRadius: '12px',
                bgcolor: '#26890C',
                fontSize: '1.25rem',
                fontWeight: 800,
                px: 5,
                py: 1.8,
                mb: 4,
                boxShadow: '0 6px 20px rgba(38, 137, 12, 0.4)',
                '&:hover': { bgcolor: '#1e6f09' },
              }}
            >
              {connectedPlayers.length === 0
                ? 'Esperando a los jugadores...'
                : `¡Iniciar Partida! (${connectedPlayers.length} listos)`}
            </Button>

            {/* Players Joined Box */}
            <Card sx={{ width: '100%', borderRadius: '12px', border: `1px solid ${theme.palette.divider}` }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Jugadores en la sala ({connectedPlayers.length})
                  </Typography>
                  {state.schoolGroupName && (
                    <Chip label={`Grupo: ${state.schoolGroupName}`} size="small" color="primary" variant="outlined" />
                  )}
                </Box>

                {connectedPlayers.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    Diles a tus alumnos que ingresen a la página e introduzcan el PIN. Sus nombres aparecerán aquí.
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center' }}>
                    {connectedPlayers.map((player) => (
                      <Chip
                        key={player.id}
                        avatar={<span style={{ fontSize: 18, marginLeft: 6 }}>{player.avatar || '🎯'}</span>}
                        label={player.nickname}
                        sx={{
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          py: 2.2,
                          px: 1,
                          bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                      />
                    ))}
                  </Box>
                )}

                {/* If linked to school group roster */}
                {groupRoster && groupRoster.length > 0 && (
                  <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${theme.palette.divider}`, textAlign: 'left' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 1 }}>
                      LISTA OFICIAL DEL GRUPO (Recordatorio: Solo los que inicien sesión participarán en la competencia):
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {groupRoster.map((st) => (
                        <Chip
                          key={st.studentId}
                          size="small"
                          label={st.fullName}
                          color={st.isConnected ? 'success' : 'default'}
                          variant={st.isConnected ? 'filled' : 'outlined'}
                          sx={{ borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        )}

        {/* PHASE 2: PREVIEW (3-5s question reveal) */}
        {status === 'PREVIEW' && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              maxWidth: 900,
              mx: 'auto',
            }}
          >
            <Chip
              label={`Pregunta ${(state.currentQuestionIndex || 0) + 1} de ${state.totalQuestions || 1}`}
              sx={{
                bgcolor: '#46178F',
                color: '#fff',
                fontWeight: 800,
                fontSize: '1rem',
                py: 2,
                px: 2,
                borderRadius: '8px',
                mb: 3,
              }}
            />

            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
                mb: 4,
                color: 'text.primary',
              }}
            >
              {currentQuestion?.prompt || 'Cargando pregunta...'}
            </Typography>

            <Box
              sx={{
                width: 90,
                height: 90,
                borderRadius: '50%',
                bgcolor: '#1368CE',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                fontWeight: 900,
                boxShadow: '0 6px 20px rgba(19, 104, 206, 0.4)',
                mb: 2,
              }}
            >
              {countdown}
            </Box>
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 700 }}>
              ¡Prepárense para responder!
            </Typography>
          </Box>
        )}

        {/* PHASE 3: QUESTION_ACTIVE */}
        {status === 'QUESTION_ACTIVE' && (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Top Question Banner */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              {/* Giant Timer Ring */}
              <Box
                sx={{
                  width: 70,
                  height: 70,
                  borderRadius: '50%',
                  bgcolor: countdown <= 5 ? '#E21B3C' : '#46178F',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontWeight: 900,
                  transition: 'background-color 0.3s',
                  flexShrink: 0,
                }}
              >
                {countdown}
              </Box>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  textAlign: 'center',
                  flex: 1,
                  px: 3,
                  lineHeight: 1.2,
                }}
              >
                {currentQuestion?.prompt}
              </Typography>

              {/* Answer counter badge */}
              <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#1368CE' }}>
                  {answeredCount} / {totalConnected}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                  Respuestas enviadas
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleAdvancePhase}
                    sx={{ borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}
                  >
                    Cerrar Pregunta
                  </Button>
                </Box>
              </Box>
            </Box>

            {/* Linear time progress bar */}
            <LinearProgress
              variant="determinate"
              value={((state.currentQuestionTimeLimit - countdown) / (state.currentQuestionTimeLimit || 15)) * 100}
              sx={{
                height: 8,
                borderRadius: '4px',
                mb: 4,
                bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
                '& .MuiLinearProgress-bar': {
                  bgcolor: countdown <= 5 ? '#E21B3C' : '#1368CE',
                },
              }}
            />

            {/* 4 Kahoot Options Grid */}
            <Grid container spacing={2.5} sx={{ flex: 1 }}>
              {currentQuestion?.options?.map((opt, idx) => {
                const style = KAHOOT_STYLES[opt.id] || Object.values(KAHOOT_STYLES)[idx % 4];
                return (
                  <Grid item xs={12} sm={6} key={opt.id || idx}>
                    <Paper
                      elevation={3}
                      sx={{
                        p: { xs: 2.5, md: 3.5 },
                        height: '100%',
                        borderRadius: '12px',
                        bgcolor: style.hex,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2.5,
                        boxShadow: `0 6px 16px ${style.hex}40`,
                      }}
                    >
                      <Box
                        sx={{
                          fontSize: '2.4rem',
                          fontWeight: 900,
                          lineHeight: 1,
                          opacity: 0.95,
                        }}
                      >
                        {style.shape}
                      </Box>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 800,
                          letterSpacing: '-0.01em',
                          lineHeight: 1.25,
                        }}
                      >
                        {opt.text}
                      </Typography>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}

        {/* PHASE 4: QUESTION_CLOSED (Shows results & bar distribution) */}
        {status === 'QUESTION_CLOSED' && (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 900 }}>
                {currentQuestion?.prompt}
              </Typography>
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                onClick={handleAdvancePhase}
                disabled={advancing}
                sx={{
                  borderRadius: '10px',
                  bgcolor: '#46178F',
                  fontWeight: 800,
                  px: 4,
                  py: 1.2,
                  '&:hover': { bgcolor: '#34106d' },
                }}
              >
                Ver Marcador
              </Button>
            </Box>

            {/* Distribution chart and feedback */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              {currentQuestion?.options?.map((opt, idx) => {
                const style = KAHOOT_STYLES[opt.id] || Object.values(KAHOOT_STYLES)[idx % 4];
                const count = opt.responseCount || 0;
                const isCorrect = opt.isCorrect;

                return (
                  <Grid item xs={12} sm={6} key={opt.id || idx}>
                    <Paper
                      elevation={isCorrect ? 6 : 1}
                      sx={{
                        p: 3,
                        borderRadius: '12px',
                        bgcolor: style.hex,
                        color: '#fff',
                        position: 'relative',
                        overflow: 'hidden',
                        opacity: isCorrect ? 1 : 0.65,
                        border: isCorrect ? '3px solid #ffffff' : 'none',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography sx={{ fontSize: '1.8rem', lineHeight: 1 }}>{style.shape}</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 800 }}>
                            {opt.text}
                          </Typography>
                        </Box>

                        {isCorrect ? (
                          <CorrectIcon sx={{ fontSize: 32, color: '#fff' }} />
                        ) : (
                          <IncorrectIcon sx={{ fontSize: 32, color: 'rgba(255,255,255,0.7)' }} />
                        )}
                      </Box>

                      {/* Vote Count Badge */}
                      <Typography variant="h4" sx={{ fontWeight: 900, mt: 1 }}>
                        {count} {count === 1 ? 'voto' : 'votos'}
                      </Typography>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>

            {currentQuestion?.explanation && (
              <Alert severity="info" sx={{ borderRadius: '10px', fontWeight: 600 }}>
                💡 <strong>Dato clave:</strong> {currentQuestion.explanation}
              </Alert>
            )}
          </Box>
        )}

        {/* PHASE 5: LEADERBOARD */}
        {status === 'LEADERBOARD' && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              maxWidth: 800,
              mx: 'auto',
              width: '100%',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 900 }}>
                🏆 Marcador - Top 5
              </Typography>
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                onClick={handleAdvancePhase}
                disabled={advancing}
                sx={{
                  borderRadius: '10px',
                  bgcolor: '#1368CE',
                  fontWeight: 800,
                  px: 4,
                  py: 1.2,
                  '&:hover': { bgcolor: '#0b4da1' },
                }}
              >
                {state.currentQuestionIndex + 1 >= (state.totalQuestions || 0)
                  ? 'Ver Podio Final'
                  : 'Siguiente Pregunta'}
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {leaderboard.map((item, idx) => (
                <Paper
                  key={item.playerId || idx}
                  elevation={idx === 0 ? 4 : 1}
                  sx={{
                    p: 2.5,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid',
                    borderColor: idx === 0 ? '#f59e0b' : theme.palette.divider,
                    bgcolor:
                      idx === 0
                        ? isDark
                          ? 'rgba(245, 158, 11, 0.12)'
                          : '#fffbeb'
                        : isDark
                        ? 'rgba(255,255,255,0.03)'
                        : '#ffffff',
                    transition: 'transform 0.3s ease',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: '10px',
                        bgcolor: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#d97706' : '#46178F',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '1.2rem',
                      }}
                    >
                      #{item.rank}
                    </Box>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span style={{ fontSize: 20 }}>{item.avatar || '🎯'}</span>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                          {item.nickname}
                        </Typography>
                        {item.currentStreak >= 2 && (
                          <Chip
                            icon={<FireIcon sx={{ fontSize: '14px !important', color: '#ea580c !important' }} />}
                            label={`Racha x${item.currentStreak}`}
                            size="small"
                            sx={{
                              bgcolor: 'rgba(234, 88, 12, 0.15)',
                              color: '#ea580c',
                              fontWeight: 800,
                              fontSize: '0.72rem',
                              borderRadius: '6px',
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>

                  <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary' }}>
                    {item.score.toLocaleString()} pts
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Box>
        )}

        {/* PHASE 6: PODIUM */}
        {(status === 'PODIUM' || status === 'FINISHED') && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              py: 2,
            }}
          >
            <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '-0.02em', mb: 1 }}>
              🎉 ¡Gran Final y Podio! 🎉
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600, mb: 4 }}>
              Partida concluida para {quizTitle}
            </Typography>

            {/* 3D Olympic Podium Component */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                gap: { xs: 1.5, md: 3 },
                mb: 5,
                width: '100%',
                maxWidth: 750,
              }}
            >
              {/* 2nd Place (Silver) */}
              {podium[1] && (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: 32, marginBottom: 4 }}>{podium[1].avatar || '🥈'}</span>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {podium[1].nickname}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1 }}>
                    {podium[1].score?.toLocaleString()} pts
                  </Typography>
                  <Paper
                    sx={{
                      width: '100%',
                      height: 180,
                      borderRadius: '12px 12px 0 0',
                      bgcolor: '#94a3b8',
                      color: '#fff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 24px rgba(148, 163, 184, 0.4)',
                    }}
                  >
                    <Typography variant="h3" sx={{ fontWeight: 900 }}>
                      2
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.1em' }}>
                      PLATA 🥈
                    </Typography>
                  </Paper>
                </Box>
              )}

              {/* 1st Place (Gold) */}
              {podium[0] && (
                <Box sx={{ flex: 1.15, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: 32, mb: 0.5 }}>👑</Typography>
                  <span style={{ fontSize: 40, marginBottom: 4 }}>{podium[0].avatar || '🥇'}</span>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: '#f59e0b' }}>
                    {podium[0].nickname}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, mb: 1 }}>
                    {podium[0].score?.toLocaleString()} pts
                  </Typography>
                  <Paper
                    sx={{
                      width: '100%',
                      height: 250,
                      borderRadius: '12px 12px 0 0',
                      bgcolor: '#f59e0b',
                      color: '#fff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 10px 30px rgba(245, 158, 11, 0.45)',
                    }}
                  >
                    <Typography variant="h2" sx={{ fontWeight: 900 }}>
                      1
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 900, letterSpacing: '0.1em' }}>
                      ORO 🥇
                    </Typography>
                  </Paper>
                </Box>
              )}

              {/* 3rd Place (Bronze) */}
              {podium[2] && (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: 32, marginBottom: 4 }}>{podium[2].avatar || '🥉'}</span>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {podium[2].nickname}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1 }}>
                    {podium[2].score?.toLocaleString()} pts
                  </Typography>
                  <Paper
                    sx={{
                      width: '100%',
                      height: 130,
                      borderRadius: '12px 12px 0 0',
                      bgcolor: '#d97706',
                      color: '#fff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 24px rgba(217, 119, 6, 0.4)',
                    }}
                  >
                    <Typography variant="h4" sx={{ fontWeight: 900 }}>
                      3
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.1em' }}>
                      BRONCE 🥉
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Box>

            {/* Actions for Teacher */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<ExportIcon />}
                onClick={handleExportExcel}
                sx={{
                  borderRadius: '10px',
                  bgcolor: '#16a34a',
                  fontWeight: 800,
                  px: 4,
                  py: 1.4,
                  boxShadow: '0 6px 18px rgba(22, 163, 74, 0.35)',
                  '&:hover': { bgcolor: '#15803d' },
                }}
              >
                Descargar Reporte Excel (.xlsx)
              </Button>

              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/teacher/quizzes')}
                sx={{ borderRadius: '10px', fontWeight: 700, px: 3 }}
              >
                Volver a Mis Quizzes
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
