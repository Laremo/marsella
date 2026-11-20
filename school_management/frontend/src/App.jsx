import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { ThemeModeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import SessionExpiredModal from './components/SessionExpiredModal';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import DirectorDashboardPage from './pages/DirectorDashboardPage';
import StudentJoinPage from './pages/StudentJoinPage';
import StudentExamRoomPage from './pages/StudentExamRoomPage';
import StudentExamFinishedPage from './pages/StudentExamFinishedPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import TeacherExamEditorPage from './pages/TeacherExamEditorPage';
import TeacherSubmissionsPage from './pages/TeacherSubmissionsPage';
import TeacherGroupsPage from './pages/TeacherGroupsPage';
import TeacherGroupDetailPage from './pages/TeacherGroupDetailPage';
import TeacherQuizzesPage from './pages/TeacherQuizzesPage';
import TeacherQuizEditorPage from './pages/TeacherQuizEditorPage';
import TeacherQuizHostPage from './pages/TeacherQuizHostPage';
import StudentQuizRoomPage from './pages/StudentQuizRoomPage';
import TeacherLayout from './components/TeacherLayout';

// Root Route: checks session and immediately redirects to role-based dashboard, or to /login if unauthenticated
const RootRoute = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role;
  if (role === 'ROLE_DIRECTOR' || role === 'DIRECTOR') {
    return <Navigate to="/director/dashboard" replace />;
  }
  if (role === 'ROLE_STUDENT' || role === 'STUDENT') {
    return <Navigate to="/student/dashboard" replace />;
  }
  return <Navigate to="/teacher/dashboard" replace />;
};

// Protected Route Component for Authenticated Staff (Teacher / Director)
const ProtectedRoute = ({ children, useLayout = true }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return useLayout ? <TeacherLayout>{children}</TeacherLayout> : children;
};

// Protected Route specifically for Students
const ProtectedStudentRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Public Route (redirects to RootRoute if already authenticated)
const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) {
    return <RootRoute />;
  }
  return children;
};

export default function App() {
  return (
    <ThemeModeProvider>
      <AuthProvider>
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
          <Navbar />
          <Box component="main" sx={{ flex: 1 }}>
            <Routes>
              {/* Root Entry Point: Dispatches by Role or asks to Login */}
              <Route path="/" element={<RootRoute />} />

              {/* Public Auth Routes */}
              <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
              <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
              <Route path="/teacher/login" element={<Navigate to="/login" replace />} />
              <Route path="/teacher/register" element={<Navigate to="/register" replace />} />

              {/* Student Portal Routes */}
              <Route path="/student/dashboard" element={<ProtectedStudentRoute><StudentDashboardPage /></ProtectedStudentRoute>} />
              <Route path="/student/exam-join" element={<StudentJoinPage />} />
              <Route path="/exam/:submissionId" element={<StudentExamRoomPage />} />
              <Route path="/exam/finished/:submissionId" element={<StudentExamFinishedPage />} />
              <Route path="/quiz/live" element={<StudentQuizRoomPage />} />
              <Route path="/quiz/live/:pin" element={<StudentQuizRoomPage />} />

              {/* Director Dashboard */}
              <Route
                path="/director/dashboard"
                element={
                  <ProtectedRoute useLayout={false}>
                    <DirectorDashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Teacher & Director Workspaces (Exams, Groups, Quizzes) */}
              <Route
                path="/teacher"
                element={
                  <ProtectedRoute>
                    <Navigate to="/teacher/dashboard" replace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/dashboard"
                element={
                  <ProtectedRoute>
                    <TeacherDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/exams/new"
                element={
                  <ProtectedRoute>
                    <TeacherExamEditorPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/exams/:id/edit"
                element={
                  <ProtectedRoute>
                    <TeacherExamEditorPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/exams/:id/submissions"
                element={
                  <ProtectedRoute>
                    <TeacherSubmissionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/groups"
                element={
                  <ProtectedRoute>
                    <TeacherGroupsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/groups/:id"
                element={
                  <ProtectedRoute>
                    <TeacherGroupDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/quizzes"
                element={
                  <ProtectedRoute>
                    <TeacherQuizzesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/quizzes/new"
                element={
                  <ProtectedRoute>
                    <TeacherQuizEditorPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/quizzes/:id/edit"
                element={
                  <ProtectedRoute>
                    <TeacherQuizEditorPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/quiz/live/:pin"
                element={
                  <ProtectedRoute useLayout={false}>
                    <TeacherQuizHostPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
          <SessionExpiredModal />
        </Box>
      </AuthProvider>
    </ThemeModeProvider>
  );
}
