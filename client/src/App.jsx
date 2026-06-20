import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

const navItems = [
  { path: '/', label: 'Home' },
];

function App() {
  const location = useLocation();
  const hideHeader =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/dashboard');

  return (
    <div className="app-shell">
      {!hideHeader && (
        <header className="app-header">
          <Link className="brand" to="/">
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 32 32">
                <path d="M16 3 3 10l13 7 13-7-13-7Z" />
                <path d="M7 14v7l9 5 9-5v-7l-9 5-9-5Z" />
              </svg>
            </span>
            <span>Placement Prep</span>
          </Link>
          <nav aria-label="Primary navigation">
            {navItems.map((item) => (
              <NavLink
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                key={item.path}
                to={item.path}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="auth-links">
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </div>
        </header>
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/aptitude" element={<ProtectedRoute allowedRoles={['student']}><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/coding" element={<ProtectedRoute allowedRoles={['student']}><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/mock-test" element={<ProtectedRoute allowedRoles={['student']}><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/companies" element={<ProtectedRoute allowedRoles={['student']}><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/leaderboard" element={<ProtectedRoute allowedRoles={['student']}><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/resume" element={<ProtectedRoute allowedRoles={['student']}><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/interview" element={<ProtectedRoute allowedRoles={['student']}><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/resources" element={<ProtectedRoute allowedRoles={['student']}><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/progress" element={<ProtectedRoute allowedRoles={['student']}><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/profile" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/aptitude" element={<Navigate replace to="/dashboard/aptitude" />} />
        <Route path="/coding" element={<Navigate replace to="/dashboard/coding" />} />
        <Route path="/mock-test" element={<Navigate replace to="/dashboard/mock-test" />} />
        <Route path="/companies" element={<Navigate replace to="/dashboard/companies" />} />
        <Route path="/leaderboard" element={<Navigate replace to="/dashboard/leaderboard" />} />
        <Route path="/resume-builder" element={<Navigate replace to="/dashboard/resume" />} />
        <Route path="/interview-prep" element={<Navigate replace to="/dashboard/interview" />} />
        <Route path="/resources" element={<Navigate replace to="/dashboard/resources" />} />
        <Route path="/about" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<Navigate replace to="/admin/dashboard" />} />
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/questions" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/companies" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/results" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
