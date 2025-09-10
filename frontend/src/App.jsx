import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute, { 
  PublicRoute, 
  AdminRoute, 
  TeacherRoute, 
  StudentRoute,
  TeacherOrAdminRoute 
} from './components/Auth/ProtectedRoute';
import Layout from './components/Layout/Layout';

// Auth Pages
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';

// Main Pages
import Dashboard from './pages/Dashboard/Dashboard';

// Placeholder components (to be created)
import UsersPage from './pages/Users/UsersPage';
import CoursesPage from './pages/Courses/CoursesPage';
import EnrollmentsPage from './pages/Enrollments/EnrollmentsPage';
import GradesPage from './pages/Grades/GradesPage';
import TasksPage from './pages/Tasks/TasksPage';
import StudentTasksPage from './pages/Tasks/StudentTasksPage';
import ProfilePage from './pages/Profile/ProfilePage';
import UnauthorizedPage from './pages/Error/UnauthorizedPage';
import NotFoundPage from './pages/Error/NotFoundPage';

function App() {
  return (
    <ThemeProvider>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes (only accessible when not authenticated) */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />

            {/* Protected Routes (require authentication) */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              {/* Dashboard - accessible to all authenticated users */}
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile" element={<ProfilePage />} />

              {/* Admin Only Routes */}
              <Route path="users" element={
                <AdminRoute>
                  <UsersPage />
                </AdminRoute>
              } />

              <Route path="courses" element={
                <AdminRoute>
                  <CoursesPage />
                </AdminRoute>
              } />

              <Route path="enrollments" element={
                <AdminRoute>
                  <EnrollmentsPage />
                </AdminRoute>
              } />

              <Route path="tasks" element={
                <AdminRoute>
                  <TasksPage />
                </AdminRoute>
              } />

              {/* Teacher Routes */}
              <Route path="my-courses" element={
                <TeacherRoute>
                  <CoursesPage teacherMode={true} />
                </TeacherRoute>
              } />

              <Route path="my-students" element={
                <TeacherRoute>
                  <UsersPage teacherMode={true} />
                </TeacherRoute>
              } />

              <Route path="my-tasks" element={
                <TeacherOrAdminRoute>
                  <TasksPage />
                </TeacherOrAdminRoute>
              } />

              {/* Student Routes */}
              <Route path="available-courses" element={
                <StudentRoute>
                  <CoursesPage studentMode={true} />
                </StudentRoute>
              } />

              <Route path="my-enrollments" element={
                <StudentRoute>
                  <EnrollmentsPage studentMode={true} />
                </StudentRoute>
              } />

              <Route path="my-tasks" element={
                <StudentRoute>
                  <StudentTasksPage />
                </StudentRoute>
              } />

              {/* Default redirect to dashboard */}
              <Route index element={<Navigate to="/dashboard" replace />} />
            </Route>

            {/* Error Pages */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </AuthProvider>

      {/* Toast notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </ThemeProvider>
  );
}

export default App;