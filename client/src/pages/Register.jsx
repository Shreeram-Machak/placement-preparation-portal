import { useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const registerFeatures = [
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
    text: 'Get access to interview experiences, company info & more',
    icon: 'bag',
  },
];

function RegisterIcon({ name }) {
  const paths = {
    book: 'M5 5h6a3 3 0 0 1 3 3v11H8a3 3 0 0 0-3 3V5Zm9 3a3 3 0 0 1 3-3h2v17h-5V8Z',
    code: 'm9 17-5-5 5-5m6 0 5 5-5 5',
    bars: 'M5 13h3v6H5v-6Zm6-5h3v11h-3V8Zm6-3h3v14h-3V5Z',
    bag: 'M7 8h10v11H7V8Zm3 0V6a2 2 0 0 1 4 0v2',
    user: 'M20 21a8 8 0 0 0-16 0m12-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
    mail: 'M4 6h16v12H4V6Zm0 1 8 6 8-6',
    lock: 'M7 11h10v9H7v-9Zm2 0V8a3 3 0 0 1 6 0v3',
    eye: 'M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    eyeOff: 'm3 3 18 18M10.6 10.6A3 3 0 0 0 14 14m2.1 2.1A9.6 9.6 0 0 1 12 18C6 18 2 12 2 12a18 18 0 0 1 4.4-4.8m3.3-1A10.4 10.4 0 0 1 12 6c6 0 10 6 10 6a17.4 17.4 0 0 1-2.1 2.8',
    cap: 'M22 9 12 4 2 9l10 5 10-5Zm-16 3v5c2 2 10 2 12 0v-5',
    calendar: 'M7 3v4m10-4v4M4 8h16v12H4V8Zm4 5h3m3 0h3m-9 4h3m3 0h3',
    chevron: 'm7 10 5 5 5-5',
    check: 'M5 12l4 4L19 6',
    userPlus: 'M16 21a7 7 0 0 0-14 0m10-12a5 5 0 1 1-10 0 5 5 0 0 1 10 0Zm5 2v6m-3-3h6',
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

function RegisterIllustration() {
  return (
    <div className="register-illustration" aria-hidden="true">
      <div className="register-plant" />
      <div className="register-person">
        <div className="register-hair" />
        <div className="register-face">
          <span />
        </div>
        <div className="register-shirt" />
        <div className="register-laptop">
          <i />
        </div>
      </div>
      <div className="register-books" />
      <div className="register-cup" />
      <div className="register-table" />
      <div className="register-dots" />
      <div className="register-proof">
        <div className="register-avatars">
          <span />
          <span />
          <span />
        </div>
        <p>10,000+ students already joined and improving their placement skills</p>
      </div>
    </div>
  );
}

function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    college: '',
    graduationYear: '',
  });

  const strength = useMemo(() => {
    let score = 0;
    if (formData.password.length >= 6) score += 1;
    if (/[A-Z]/.test(formData.password)) score += 1;
    if (/[0-9]/.test(formData.password)) score += 1;
    if (/[^A-Za-z0-9]/.test(formData.password)) score += 1;
    return score;
  }, [formData.password]);

  const strengthLabel = ['Weak', 'Weak', 'Good', 'Strong', 'Excellent'][strength];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setStatusMessage('');
    setStatusType('');

    if (!formData.name || !formData.email || !formData.password) {
      setStatusType('error');
      setStatusMessage('Please fill in your name, email, and password.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setStatusType('error');
      setStatusMessage('Password and confirm password do not match.');
      return;
    }

    if (!acceptedTerms) {
      setStatusType('error');
      setStatusMessage('Please accept the Terms of Service and Privacy Policy.');
      return;
    }

    try {
      setIsSubmitting(true);

      const { data } = await axios.post('http://localhost:5000/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      localStorage.setItem('placementPrepUser', JSON.stringify(data.user));
      localStorage.setItem('placementPrepToken', data.token);

      setStatusType('success');
      setStatusMessage('Account created successfully. Redirecting to home...');
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        college: '',
        graduationYear: '',
      });

      setTimeout(() => {
        navigate('/');
      }, 600);
    } catch (error) {
      setStatusType('error');
      setStatusMessage(
        error.response?.data?.message || 'Unable to create account. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="register-page">
      <section className="register-info-panel">
        <Link className="register-brand" to="/">
          <span className="register-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32">
              <path d="M16 3 3 10l13 7 13-7-13-7Z" />
              <path d="M7 14v7l9 5 9-5v-7l-9 5-9-5Z" />
            </svg>
          </span>
          <span>Placement Prep</span>
        </Link>

        <div className="register-welcome">
          <h1>
            Create Your Account
            <span>and Get Started!</span>
          </h1>
          <p>Join thousands of students preparing smarter for placements every day.</p>
        </div>

        <div className="register-feature-list">
          {registerFeatures.map((feature) => (
            <article className="register-feature" key={feature.title}>
              <div className={`register-feature-icon ${feature.icon}`}>
                <RegisterIcon name={feature.icon} />
              </div>
              <div>
                <h2>{feature.title}</h2>
                <p>{feature.text}</p>
              </div>
            </article>
          ))}
        </div>

        <RegisterIllustration />
      </section>

      <section className="register-form-panel">
        <form className="register-card" onSubmit={handleSubmit}>
          <div className="register-card-heading">
            <h2>Create an Account</h2>
            <p>Fill in the details to create your account</p>
          </div>

          <div className="register-two-column">
            <label className="field-group compact">
              <span>Full Name</span>
              <div className="input-shell">
                <RegisterIcon name="user" />
                <input
                  name="name"
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  type="text"
                  value={formData.name}
                />
              </div>
            </label>

            <label className="field-group compact">
              <span>Email Address</span>
              <div className="input-shell">
                <RegisterIcon name="mail" />
                <input
                  name="email"
                  onChange={handleChange}
                  placeholder="Enter your email"
                  type="email"
                  value={formData.email}
                />
              </div>
            </label>
          </div>

          <label className="field-group compact">
            <span>Password</span>
            <div className="input-shell">
              <RegisterIcon name="lock" />
              <input
                name="password"
                onChange={handleChange}
                placeholder="Create a password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
              />
              <button
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="icon-button"
                onClick={() => setShowPassword((current) => !current)}
                type="button"
              >
                <RegisterIcon name={showPassword ? 'eyeOff' : 'eye'} />
              </button>
            </div>
            <div className="password-strength">
              <span>Password strength: <strong>{strengthLabel}</strong></span>
              <div className="strength-bars">
                {[1, 2, 3, 4].map((item) => (
                  <i className={item <= Math.max(strength, 1) ? `active level-${strength}` : ''} key={item} />
                ))}
              </div>
            </div>
          </label>

          <label className="field-group compact">
            <span>Confirm Password</span>
            <div className="input-shell">
              <RegisterIcon name="lock" />
              <input
                name="confirmPassword"
                onChange={handleChange}
                placeholder="Confirm your password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
              />
              <button
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                className="icon-button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                type="button"
              >
                <RegisterIcon name={showConfirmPassword ? 'eyeOff' : 'eye'} />
              </button>
            </div>
          </label>

          <label className="field-group compact">
            <span>College / University</span>
            <div className="input-shell">
              <RegisterIcon name="cap" />
              <input
                name="college"
                onChange={handleChange}
                placeholder="Enter your college or university"
                type="text"
                value={formData.college}
              />
            </div>
          </label>

          <label className="field-group compact">
            <span>Year of Graduation</span>
            <div className="input-shell select-shell">
              <RegisterIcon name="calendar" />
              <select
                name="graduationYear"
                onChange={handleChange}
                value={formData.graduationYear}
              >
                <option value="">Select your graduation year</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
                <option value="2029">2029</option>
                <option value="2030">2030</option>
              </select>
              <RegisterIcon name="chevron" />
            </div>
          </label>

          <button
            aria-pressed={acceptedTerms}
            className="terms-row"
            onClick={() => setAcceptedTerms((current) => !current)}
            type="button"
          >
            <span className={acceptedTerms ? 'check-box checked' : 'check-box'}>
              {acceptedTerms && <RegisterIcon name="check" />}
            </span>
            <span>
              I agree to the <Link to="/terms">Terms of Service</Link> and{' '}
              <Link to="/privacy">Privacy Policy</Link>
            </span>
          </button>

          <button className="register-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
            <RegisterIcon name="userPlus" />
          </button>

          {statusMessage && (
            <p className={`form-message ${statusType}`} role="status">
              {statusMessage}
            </p>
          )}

          <div className="divider register-divider">
            <span>or sign up with</span>
          </div>

          <div className="social-login-grid">
            <button type="button">
              <span className="google-mark">G</span>
              Sign up with Google
            </button>
            <button type="button">
              <span className="github-mark">GH</span>
              Sign up with GitHub
            </button>
          </div>

          <p className="register-link">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </form>
      </section>
    </main>
  );
}

export default Register;
