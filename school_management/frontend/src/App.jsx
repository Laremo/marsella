import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { ThemeModeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';

// Pages
import StudentJoinPage from './pages/StudentJoinPage';
import StudentExamRoomPage from './pages/StudentExamRoomPage';
import StudentExamFinishedPage from './pages/StudentExamFinishedPage';
import TeacherLoginPage from './pages/TeacherLoginPage';
import TeacherRegisterPage from './pages/TeacherRegisterPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import TeacherExamEditorPage from './pages/TeacherExamEditorPage';
import TeacherSubmissionsPage from './pages/TeacherSubmissionsPage';
import TeacherGroupsPage from './pages/TeacherGroupsPage';
import TeacherGroupDetailPage from './pages/TeacherGroupDetailPage';

// Protected Route Component for Teachers
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) {
    return <Navigate to="/teacher/login" replace />;
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
              {/* Student Routes */}
              <Route path="/" element={<StudentJoinPage />} />
              <Route path="/exam/:submissionId" element={<StudentExamRoomPage />} />
              <Route path="/exam/finished/:submissionId" element={<StudentExamFinishedPage />} />

              {/* Teacher Public Routes */}
              <Route path="/teacher/login" element={<TeacherLoginPage />} />
              <Route path="/teacher/register" element={<TeacherRegisterPage />} />

              {/* Teacher Protected Routes */}
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

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
        </Box>
      </AuthProvider>
    </ThemeModeProvider>
  );
}
