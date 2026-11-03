import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  useTheme,
} from '@mui/material';
import {
  CheckCircle as CorrectIcon,
  Cancel as IncorrectIcon,
  LocalFireDepartment as FireIcon,
  EmojiEvents as TrophyIcon,
  ArrowForward as ArrowForwardIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import quizApi from '../services/quizApi';

const AVATARS = ['🦊', '🚀', '🐼', '⚡', '🦁', '🐯', '🦄', '🎯', '🌟', '👾', '🔥', '🐬', '🏆', '🍕'];

const OPTION_BUTTONS = [
  { id: 'A', name: 'Rojo', hex: '#E21B3C', shape: '▲' },
  { id: 'B', name: 'Azul', hex: '#1368CE', shape: '◆' },
  { id: 'C', name: 'Amarillo', hex: '#D89E00', shape: '●' },
  { id: 'D', name: 'Verde', hex: '#26890C', shape: '■' },
];

export default function StudentQuizRoomPage() {
  const { pin: urlPin } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Session / Join State
  const [pin, setPin] = useState(urlPin || localStorage.getItem('quiz_pin') || '');
  const [nickname, setNickname] = useState(localStorage.getItem('quiz_nickname') || '');
  const [avatar, setAvatar] = useState(localStorage.getItem('quiz_avatar') || '🦊');
  const [playerToken, setPlayerToken] = useState(localStorage.getItem('quiz_player_token') || '');
  const [isJoined, setIsJoined] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  // Live Game State
  const [roomState, setRoomState] = useState(null);
  const [playerState, setPlayerState] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasAnsweredCurrentQuestion, setHasAnsweredCurrentQuestion] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  // Time tracking for velocity formula
  const questionStartTimeRef = useRef(null);
  const pollingTimerRef = useRef(null);
  const heartbeatTimerRef = useRef(null);
  const lastQuestionIdRef = useRef(null);
  const hasTriggeredPodiumConfetti = useRef(false);

  // Auto-reconnect if token is saved in localStorage
  useEffect(() => {
    if (playerToken && pin) {
      reconnectPlayer(pin, playerToken);
    }
  }, []);

  const reconnectPlayer = async (roomPin, token) => {
    try {
      const res = await quizApi.getPlayerState(roomPin, token);
      if (res.data) {
        setIsJoined(true);
        setPlayerState(res.data);
      }
    } catch (err) {
      console.log('No existing session to resume, asking to join.');
      localStorage.removeItem('quiz_player_token');
      setPlayerToken('');
    }
  };

  // Heartbeat loop to keep connection alive
  useEffect(() => {
    if (!isJoined || !pin || !playerToken) return;

    heartbeatTimerRef.current = setInterval(() => {
      quizApi.quizHeartbeat(pin, playerToken).catch(() => {});
    }, 4000);

    return () => {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    };
  }, [isJoined, pin, playerToken]);

  // Polling loop for room & player state sync
  useEffect(() => {
    if (!isJoined || !pin) return;

    const syncState = async () => {
      try {
        const [roomRes, playerRes] = await Promise.all([
          quizApi.getLiveState(pin, playerToken),
          playerToken ? quizApi.getPlayerState(pin, playerToken).catch(() => null) : null,
        ]);

        const rState = roomRes.data;
        setRoomState(rState);

        if (playerRes?.data) {
          setPlayerState(playerRes.data);
        }

        // Detect new question to reset local answer state
        if (rState.currentQuestion && rState.currentQuestion.id !== lastQuestionIdRef.current) {
          lastQuestionIdRef.current = rState.currentQuestion.id;
          setSelectedOption(null);
          setHasAnsweredCurrentQuestion(false);
          questionStartTimeRef.current = Date.now();
        }

        // If player already answered on backend, sync local state
        if (rState.currentQuestion && playerRes?.data?.answers && playerRes.data.answers[rState.currentQuestion.id]) {
          setHasAnsweredCurrentQuestion(true);
          setSelectedOption(playerRes.data.answers[rState.currentQuestion.id].selectedOption);
        }

        // Trigger confetti on podium
        if ((rState.status === 'PODIUM' || rState.status === 'FINISHED') && !hasTriggeredPodiumConfetti.current) {
          hasTriggeredPodiumConfetti.current = true;
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }
      } catch (err) {
        console.error('Error syncing player live quiz state:', err);
      }
    };

    syncState();
    pollingTimerRef.current = setInterval(syncState, 800);

    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, [isJoined, pin, playerToken]);

  const handleJoin = async (e) => {
    if (e) e.preventDefault();
    if (!pin.trim() || !nickname.trim()) {
      setJoinError('Por favor ingresa el PIN de la sala y tu apodo.');
      return;
    }

    setJoinLoading(true);
    setJoinError('');

    try {
      const res = await quizApi.joinLiveQuiz(pin.trim(), nickname.trim(), avatar, null, playerToken || null);
      const data = res.data;

      setPlayerToken(data.sessionToken);
      setPlayerState(data);
      setIsJoined(true);

      localStorage.setItem('quiz_pin', pin.trim());
      localStorage.setItem('quiz_nickname', nickname.trim());
      localStorage.setItem('quiz_avatar', avatar);
      localStorage.setItem('quiz_player_token', data.sessionToken);
    } catch (err) {
      console.error('Error joining quiz:', err);
      setJoinError(err.response?.data?.message || 'No se pudo unir a la sala. Verifica el PIN.');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleSelectAnswer = async (optId) => {
    if (hasAnsweredCurrentQuestion || submittingAnswer || !roomState?.currentQuestion) return;

    setSelectedOption(optId);
    setHasAnsweredCurrentQuestion(true);
    setSubmittingAnswer(true);

    const responseTimeMs = questionStartTimeRef.current ? Date.now() - questionStartTimeRef.current : 3000;

    try {
      const res = await quizApi.submitQuizAnswer(pin, {
        playerToken,
        questionId: roomState.currentQuestion.id,
        selectedOption: optId,
        clientResponseTimeMs: responseTimeMs,
      });
      setPlayerState(res.data);
    } catch (err) {
      console.error('Error submitting answer:', err);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleLeave = () => {
    localStorage.removeItem('quiz_player_token');
    localStorage.removeItem('quiz_pin');
    setIsJoined(false);
    setPlayerToken('');
    setRoomState(null);
    setPlayerState(null);
  };

  // STEP 1: JOIN SCREEN (PIN & Nickname)
  if (!isJoined) {
    return (
      <Container maxWidth="xs" sx={{ py: 6 }}>
        <Card
          sx={{
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(70, 23, 143, 0.15)',
            border: `1px solid ${theme.palette.divider}`,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              bgcolor: '#46178F',
              color: '#fff',
              p: 3,
              textAlign: 'center',
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-0.02em', mb: 0.5 }}>
              ⚡ Quizz en Vivo
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85, fontWeight: 600 }}>
              Ingresa el PIN proyectado por el profesor
            </Typography>
          </Box>

          <CardContent sx={{ p: 3 }}>
            {joinError && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: '8px' }}>
                {joinError}
              </Alert>
            )}

            <form onSubmit={handleJoin}>
              <TextField
                fullWidth
                label="PIN del Juego (6 dígitos)"
                placeholder="Ej. 123456"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputProps={{ style: { textAlign: 'center', fontSize: '1.4rem', fontWeight: 900, letterSpacing: '0.2em' } }}
                sx={{ mb: 2.5 }}
              />

              <TextField
                fullWidth
                label="Tu Nombre o Apodo"
                placeholder="Ej. Juan Pérez"
                value={nickname}
                onChange={(e) => setNickname(e.target.value.slice(0, 25))}
                inputProps={{ style: { fontWeight: 700 } }}
                sx={{ mb: 2.5 }}
              />

              {/* Avatar picker */}
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
                Elige tu Avatar:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 3 }}>
                {AVATARS.map((av) => (
                  <Box
                    key={av}
                    onClick={() => setAvatar(av)}
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      cursor: 'pointer',
                      bgcolor: avatar === av ? 'rgba(70, 23, 143, 0.2)' : 'transparent',
                      border: '2px solid',
                      borderColor: avatar === av ? '#46178F' : 'transparent',
                      transition: 'all 0.15s ease',
                      '&:hover': { transform: 'scale(1.15)' },
                    }}
                  >
                    {av}
                  </Box>
                ))}
              </Box>

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={joinLoading}
                startIcon={joinLoading ? <CircularProgress size={20} color="inherit" /> : null}
                sx={{
                  borderRadius: '10px',
                  bgcolor: '#26890C',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  py: 1.5,
                  boxShadow: '0 4px 14px rgba(38, 137, 12, 0.4)',
                  '&:hover': { bgcolor: '#1e6f09' },
                }}
              >
                {joinLoading ? 'Entrando a la sala...' : '¡Entrar a Jugar!'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // STEP 2: IN ROOM PLAYER VIEW
  const status = roomState?.status || 'LOBBY';
  const currentQId = roomState?.currentQuestion?.id;
  const currentAnswer = currentQId && playerState?.answers ? playerState.answers[currentQId] : null;

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 70px)',
        bgcolor: isDark ? '#0b0f19' : '#f1f5f9',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Player Header Bar */}
      <Box
        sx={{
          bgcolor: isDark ? '#111827' : '#ffffff',
          borderBottom: `1px solid ${theme.palette.divider}`,
          px: 2,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span style={{ fontSize: 22 }}>{avatar}</span>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            {nickname}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Chip
            icon={<TrophyIcon sx={{ fontSize: '15px !important', color: '#d97706 !important' }} />}
            label={`${playerState?.totalScore || 0} pts`}
            size="small"
            sx={{ fontWeight: 800, borderRadius: '6px' }}
          />
          {playerState?.currentStreak >= 2 && (
            <Chip
              icon={<FireIcon sx={{ fontSize: '14px !important', color: '#ea580c !important' }} />}
              label={`x${playerState.currentStreak}`}
              size="small"
              sx={{
                bgcolor: 'rgba(234, 88, 12, 0.15)',
                color: '#ea580c',
                fontWeight: 900,
                borderRadius: '6px',
              }}
            />
          )}
        </Box>
      </Box>

      {/* Main Container based on phase */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: { xs: 2, sm: 3 } }}>
        {/* LOBBY PHASE */}
        {status === 'LOBBY' && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              maxWidth: 450,
              mx: 'auto',
            }}
          >
            <Box
              sx={{
                width: 90,
                height: 90,
                borderRadius: '50%',
                bgcolor: 'rgba(70, 23, 143, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 48,
                mb: 2,
              }}
            >
              {avatar}
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
              ¡Estás dentro, {nickname}! 🎉
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              ¿Ves tu nombre en la pantalla del proyector? La partida comenzará en cualquier momento.
            </Typography>
            <CircularProgress size={32} sx={{ color: '#46178F', mb: 3 }} />
            <Button size="small" color="inherit" onClick={handleLeave} sx={{ borderRadius: '6px' }}>
              Salir de la sala
            </Button>
          </Box>
        )}

        {/* PREVIEW PHASE */}
        {status === 'PREVIEW' && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 800, mb: 1 }}>
              ¡Pregunta {(roomState?.currentQuestionIndex || 0) + 1}!
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 3, maxWidth: 500 }}>
              {roomState?.currentQuestion?.prompt}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#1368CE' }}>
              👀 Mira las opciones y prepárate para tocar...
            </Typography>
          </Box>
        )}

        {/* QUESTION_ACTIVE PHASE */}
        {status === 'QUESTION_ACTIVE' && (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {!hasAnsweredCurrentQuestion ? (
              <Grid container spacing={2} sx={{ flex: 1 }}>
                {OPTION_BUTTONS.map((btn) => {
                  const optionData = roomState?.currentQuestion?.options?.find((o) => o.id === btn.id);
                  const optionText = optionData ? optionData.text : `Opción ${btn.id}`;

                  return (
                    <Grid item xs={12} sm={6} key={btn.id} sx={{ display: 'flex' }}>
                      <Button
                        fullWidth
                        onClick={() => handleSelectAnswer(btn.id)}
                        disabled={submittingAnswer}
                        sx={{
                          flex: 1,
                          minHeight: { xs: 130, sm: 160 },
                          borderRadius: '12px',
                          bgcolor: btn.hex,
                          color: '#fff',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1.5,
                          p: 2,
                          boxShadow: `0 6px 16px ${btn.hex}40`,
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            bgcolor: btn.hex,
                            transform: 'scale(1.02)',
                          },
                          '&:active': {
                            transform: 'scale(0.97)',
                          },
                        }}
                      >
                        <Box sx={{ fontSize: '2.5rem', lineHeight: 1 }}>{btn.shape}</Box>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 800,
                            letterSpacing: '-0.01em',
                            textAlign: 'center',
                            lineHeight: 1.2,
                          }}
                        >
                          {optionText}
                        </Typography>
                      </Button>
                    </Grid>
                  );
                })}
              </Grid>
            ) : (
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
              >
                <LockIcon sx={{ fontSize: 64, color: '#1368CE', mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
                  ¡Respuesta enviada!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Esperando a que el tiempo termine o todos respondan...
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* QUESTION_CLOSED / PERSONAL FEEDBACK PHASE */}
        {status === 'QUESTION_CLOSED' && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            {currentAnswer ? (
              currentAnswer.isCorrect ? (
                <Paper
                  sx={{
                    p: 4,
                    borderRadius: '12px',
                    bgcolor: '#26890C',
                    color: '#fff',
                    maxWidth: 400,
                    width: '100%',
                    boxShadow: '0 8px 30px rgba(38, 137, 12, 0.4)',
                  }}
                >
                  <CorrectIcon sx={{ fontSize: 64, mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
                    ¡Correcto!
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                    +{currentAnswer.totalPointsEarned} pts
                  </Typography>
                  {currentAnswer.streakBonus > 0 && (
                    <Chip
                      icon={<FireIcon sx={{ fontSize: '15px !important', color: '#fff !important' }} />}
                      label={`¡Racha x${playerState?.currentStreak}! (+${currentAnswer.streakBonus} pts)`}
                      sx={{ bgcolor: 'rgba(0,0,0,0.2)', color: '#fff', fontWeight: 800, mb: 1 }}
                    />
                  )}
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Puntaje total: {playerState?.totalScore} pts
                  </Typography>
                </Paper>
              ) : (
                <Paper
                  sx={{
                    p: 4,
                    borderRadius: '12px',
                    bgcolor: '#E21B3C',
                    color: '#fff',
                    maxWidth: 400,
                    width: '100%',
                    boxShadow: '0 8px 30px rgba(226, 27, 60, 0.4)',
                  }}
                >
                  <IncorrectIcon sx={{ fontSize: 64, mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
                    Incorrecto
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    +0 pts
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Racha reiniciada a 0
                  </Typography>
                </Paper>
              )
            ) : (
              <Paper
                sx={{
                  p: 4,
                  borderRadius: '12px',
                  bgcolor: '#94a3b8',
                  color: '#fff',
                  maxWidth: 400,
                  width: '100%',
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
                  ¡Tiempo agotado!
                </Typography>
                <Typography variant="body2">No alcanzaste a responder a tiempo (+0 pts)</Typography>
              </Paper>
            )}
          </Box>
        )}

        {/* LEADERBOARD PHASE */}
        {status === 'LEADERBOARD' && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <TrophyIcon sx={{ fontSize: 64, color: '#f59e0b', mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
              Lugar #{playerState?.currentRank || 1}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1368CE', mb: 3 }}>
              {playerState?.totalScore} puntos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ¡Observa el proyector para ver el marcador general de la clase!
            </Typography>
          </Box>
        )}

        {/* PODIUM / FINISHED PHASE */}
        {(status === 'PODIUM' || status === 'FINISHED') && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              py: 4,
            }}
          >
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 1 }}>
              🎉 ¡Fin del Juego! 🎉
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#f59e0b', mb: 1 }}>
              Posición #{playerState?.currentRank || 1}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 4 }}>
              Puntaje Final: {playerState?.totalScore} pts
            </Typography>

            <Button
              variant="contained"
              size="large"
              onClick={handleLeave}
              sx={{ borderRadius: '10px', bgcolor: '#46178F', fontWeight: 800, px: 4 }}
            >
              Salir de la Partida
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}

