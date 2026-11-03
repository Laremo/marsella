import api from './api';

export const quizApi = {
  // Teacher Quiz CRUD
  getTeacherQuizzes: () => api.get('/teacher/quizzes'),
  getTeacherQuiz: (id) => api.get(`/teacher/quizzes/${id}`),
  createTeacherQuiz: (data) => api.post('/teacher/quizzes', data),
  updateTeacherQuiz: (id, data) => api.put(`/teacher/quizzes/${id}`, data),
  deleteTeacherQuiz: (id) => api.delete(`/teacher/quizzes/${id}`),

  // Live session management (Teacher)
  launchQuizSession: (id, schoolGroupId) =>
    api.post(`/teacher/quizzes/${id}/launch`, null, {
      params: schoolGroupId ? { schoolGroupId } : {},
    }),
  advanceSessionPhase: (pin) => api.post(`/teacher/quizzes/live/${pin}/advance`),
  getSessionReport: (pin) => api.get(`/teacher/quizzes/live/${pin}/report`),
  getExportReportUrl: (pin) => `/api/teacher/quizzes/live/${pin}/report/export`,

  // Student / Live Quiz
  getLiveState: (pin, playerToken) =>
    api.get(`/quiz/live/${pin}/state`, {
      params: playerToken ? { playerToken } : {},
    }),
  checkLiveSession: (pin) => api.get(`/quiz/live/${pin}/check`),
  joinLiveQuiz: (pin, nickname, avatar, studentId, playerToken) =>
    api.post(`/quiz/live/${pin}/join`, {
      pin,
      nickname,
      avatar,
      studentId,
      playerToken,
    }),
  submitQuizAnswer: (pin, data) => api.post(`/quiz/live/${pin}/answer`, data),
  quizHeartbeat: (pin, playerToken) =>
    api.post(`/quiz/live/${pin}/heartbeat`, null, {
      params: { playerToken },
    }),
  getPlayerState: (pin, token) => api.get(`/quiz/live/${pin}/player/${token}`),
};

export default quizApi;
