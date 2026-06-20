import { useState } from 'react';
import axios from 'axios';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { getAuthUser, isAuthenticated } from '../utils/auth';

const loginFeatures = [
  {
    title: 'Aptitude Practice',
    text: 'Practice topic-wise aptitude questions',
    icon: 'book',
  },
  {
    title: 'Coding Challenges',
    text: 'Solve coding problems and improve skills',
    icon: 'code',
  },
  {
    title: 'Mock Tests',
    text: 'Take mock tests and track your progress',
    icon: 'bars',
  },
  {
    title: 'Placement Resources',
    text: 'Get access to interview experiences and company resources',
    icon: 'bag',
  },
];

function LoginIcon({ name }) {
  const paths = {
    book: 'M5 5h6a3 3 0 0 1 3 3v11H8a3 3 0 0 0-3 3V5Zm9 3a3 3 0 0 1 3-3h2v17h-5V8Z',
    code: 'm9 17-5-5 5-5m6 0 5 5-5 5',
    bars: 'M5 13h3v6H5v-6Zm6-5h3v11h-3V8Zm6-3h3v14h-3V5Z',
    bag: 'M7 8h10v11H7V8Zm3 0V6a2 2 0 0 1 4 0v2',
    mail: 'M4 6h16v12H4V6Zm0 1 8 6 8-6',
    lock: 'M7 11h10v9H7v-9Zm2 0V8a3 3 0 0 1 6 0v3',
    eye: 'M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    eyeOff: 'm3 3 18 18M10.6 10.6A3 3 0 0 0 14 14m2.1 2.1A9.6 9.6 0 0 1 12 18C6 18 2 12 2 12a18 18 0 0 1 4.4-4.8m3.3-1A10.4 10.4 0 0 1 12 6c6 0 10 6 10 6a17.4 17.4 0 0 1-2.1 2.8',
    arrow: 'M5 12h14m-6-6 6 6-6 6',
    check: 'M5 12l4 4L19 6',
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

function LoginIllustration() {
  return (
    <div className="login-illustration" aria-hidden="true">
      <div className="login-plant" />
      <div className="login-person">
        <div className="login-face">
          <span />
        </div>
        <div className="login-hair" />
        <div className="login-hoodie" />
        <div className="login-laptop">
          <i />
        </div>
      </div>
      <div className="login-books" />
      <div className="login-table" />
      <div className="login-dots" />
    </div>
  );
}

function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setStatusMessage('');
    setStatusType('');

    if (!formData.email || !formData.password) {
      setStatusType('error');
      setStatusMessage('Please enter your email and password.');
      return;
    }

    try {
      setIsSubmitting(true);

      const { data } = await axios.post('http://localhost:5000/api/auth/login', {
        email: formData.email,
        password: formData.password,
      });

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('placementPrepUser', JSON.stringify(data.user));
      storage.setItem('placementPrepToken', data.token);
      storage.setItem('user', JSON.stringify(data.user));
      storage.setItem('token', data.token);

      setStatusType('success');
      setStatusMessage('Login successful. Redirecting...');

      setTimeout(() => {
        if (data.user.role === 'admin') {
          navigate('/admin', {
            replace: true,
            state: null,
          });
        } else {
          navigate('/dashboard', {
            replace: true,
            state: null,
          });
        }
      }, 600);
    } catch (error) {
      setStatusType('error');
      setStatusMessage(
        error.response?.data?.message || 'Unable to login. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated()) {
    const user = getAuthUser();
    return <Navigate replace to={user?.role === 'admin' ? '/admin' : '/dashboard'} />;
  }

  return (
    <main className="login-page">
      <section className="login-info-panel">
        <Link className="login-brand" to="/">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32">
              <path d="M16 3 3 10l13 7 13-7-13-7Z" />
              <path d="M7 14v7l9 5 9-5v-7l-9 5-9-5Z" />
            </svg>
          </span>
          <span>Placement Prep</span>
        </Link>

        <div className="login-welcome">
          <h1>Welcome Back!</h1>
          <p>Login to continue your placement preparation and achieve your dream career.</p>
        </div>

        <div className="login-feature-list">
          {loginFeatures.map((feature) => (
            <article className="login-feature" key={feature.title}>
              <div className={`login-feature-icon ${feature.icon}`}>
                <LoginIcon name={feature.icon} />
              </div>
              <div>
                <h2>{feature.title}</h2>
                <p>{feature.text}</p>
              </div>
            </article>
          ))}
        </div>

        <LoginIllustration />
      </section>

      <section className="login-form-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-card-heading">
            <h2>Login</h2>
            <p>Enter your credentials to access your account</p>
          </div>

          <label className="field-group">
            <span>Email Address</span>
            <div className="input-shell">
              <LoginIcon name="mail" />
              <input
                name="email"
                onChange={handleChange}
                placeholder="Enter your email"
                type="email"
                value={formData.email}
              />
            </div>
          </label>

          <label className="field-group">
            <span className="field-row">
              Password
              <Link to="/forgot-password">Forgot Password?</Link>
            </span>
            <div className="input-shell">
              <LoginIcon name="lock" />
              <input
                name="password"
                onChange={handleChange}
                placeholder="Enter your password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
              />
              <button
                className="icon-button"
                onClick={() => setShowPassword((current) => !current)}
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <LoginIcon name={showPassword ? 'eyeOff' : 'eye'} />
              </button>
            </div>
          </label>

          <button
            className="remember-row"
            onClick={() => setRememberMe((current) => !current)}
            type="button"
            aria-pressed={rememberMe}
          >
            <span className={rememberMe ? 'check-box checked' : 'check-box'}>
              {rememberMe && <LoginIcon name="check" />}
            </span>
            Remember me
          </button>

          <button className="login-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Logging in...' : 'Login'}
            <LoginIcon name="arrow" />
          </button>

          {statusMessage && (
            <p className={`form-message ${statusType}`} role="status">
              {statusMessage}
            </p>
          )}

          <div className="divider">
            <span>or continue with</span>
          </div>

          <div className="social-login-grid">
            <button type="button">
              <span className="google-mark">G</span>
              Login with Google
            </button>
            <button type="button">
              <span className="github-mark">GH</span>
              Login with GitHub
            </button>
          </div>

          <p className="register-link">
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </form>
      </section>
    </main>
  );
}

export default Login;
