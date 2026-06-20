import { Link } from 'react-router-dom';

const features = [
  { title: 'Aptitude Practice', text: 'Topic-wise practice with detailed solutions', icon: 'book' },
  { title: 'Coding Practice', text: 'Solve problems from easy to hard with progress', icon: 'code' },
  { title: 'Mock Tests', text: 'Company-specific tests with real exam pattern', icon: 'test' },
  { title: 'Companies', text: 'Explore company info, eligibility and past papers', icon: 'company' },
  { title: 'Progress Tracking', text: 'Track performance and improve every day', icon: 'chart', path: '/dashboard' },
];

const stats = [
  { value: '10,000+', label: 'Active Students', icon: 'users' },
  { value: '500+', label: 'Aptitude Topics', icon: 'check' },
  { value: '2000+', label: 'Coding Problems', icon: 'code' },
  { value: '100+', label: 'Mock Tests', icon: 'board' },
  { value: 'Top Companies', label: 'Placement Resources', icon: 'trophy' },
];

const steps = [
  { number: '1', title: 'Sign Up', text: 'Create your free account in seconds' },
  { number: '2', title: 'Choose Your Path', text: 'Select aptitude, coding or mock tests' },
  { number: '3', title: 'Practice & Improve', text: 'Solve problems, take tests and track progress' },
  { number: '4', title: 'Get Placed', text: 'Boost your skills and crack interviews' },
];

function Icon({ name }) {
  const paths = {
    book: 'M6 5h7a4 4 0 0 1 4 4v10H9a3 3 0 0 0-3 3V5Zm0 0h7a4 4 0 0 1 4 4m1-4h1a3 3 0 0 1 3 3v14h-8a3 3 0 0 0-3 3',
    code: 'm9 18-6-6 6-6m6 0 6 6-6 6',
    test: 'M9 5h6m-6 4h6m-6 4h4m-8-9h14v18H5V4Zm4-2h6v4H9V2Z',
    company: 'M4 21h16M6 21V5h8v16M14 9h4v12M9 9h2m-2 4h2m-2 4h2',
    chart: 'M4 19h16M6 16l4-5 4 3 5-8',
    users: 'M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2m12-10a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm6 10v-2a4 4 0 0 0-3-3.87M17 3.13a4 4 0 0 1 0 7.75',
    check: 'M20 6 9 17l-5-5',
    board: 'M8 3h8v4H8V3Zm-3 4h14v14H5V7Zm5 5h4m-4 4h6',
    trophy: 'M8 21h8m-4-4v4M7 4h10v5a5 5 0 0 1-10 0V4Zm10 2h3a3 3 0 0 1-3 3M7 6H4a3 3 0 0 0 3 3',
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

function HeroIllustration() {
  return (
    <div className="hero-art">
      <div className="art-blob" />
      <button className="score-card card-top" type="button" aria-label="Aptitude score 75 percent">
        <span>Aptitude Score</span>
        <div className="ring"><strong>75%</strong></div>
        <small>Good</small>
      </button>
      <button className="score-card card-bottom" type="button" aria-label="450 coding problems solved">
        <span>Coding Problems</span>
        <strong>450</strong>
        <small>Solved</small>
      </button>
      <button className="score-card card-right-top" type="button" aria-label="12 mock tests attempted">
        <span>Mock Tests</span>
        <strong>12</strong>
        <small>Attempted</small>
      </button>
      <button className="score-card card-right-bottom" type="button" aria-label="Placement readiness 82 percent">
        <span>Placement Readiness</span>
        <strong>82%</strong>
        <small>Keep it up!</small>
        <div className="mini-line" />
      </button>
      <div className="student" aria-hidden="true">
        <div className="head">
          <div className="hair" />
        </div>
        <div className="body" />
        <div className="laptop">
          <span />
        </div>
      </div>
      <div className="desk-line" aria-hidden="true" />
      <div className="books" aria-hidden="true" />
      <div className="plant" aria-hidden="true" />
      <div className="mug" aria-hidden="true" />
    </div>
  );
}

function Home() {
  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow">Your Journey to Dream Placement Starts Here</div>
          <h1>
            Prepare Smarter.
            <span>Get Placed Better.</span>
          </h1>
          <p>
            Practice aptitude, solve coding problems, take mock tests and track your
            progress all in one place.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to="/register">Get Started for Free</Link>
            <a className="btn btn-secondary" href="#features">Explore Features</a>
          </div>
          <div className="social-proof">
            <div className="avatars">
              <span />
              <span />
              <span />
              <span />
            </div>
            <p>Join 10,000+ students preparing together</p>
            <div className="trend-line" />
          </div>
        </div>
        <HeroIllustration />
      </section>

      <section className="feature-strip" id="features" aria-label="Platform features">
        {features.map((feature) => (
          <article className="feature-item" key={feature.title}>
            <div className={`feature-icon ${feature.icon}`}>
              <Icon name={feature.icon} />
            </div>
            <div>
              <h2>{feature.title}</h2>
              <p>{feature.text}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="stats-panel">
        <h2>Why Choose Placement Prep?</h2>
        <div className="stats-grid">
          {stats.map((stat) => (
            <article className="stat-item" key={stat.label}>
              <div className={`stat-icon ${stat.icon}`}>
                <Icon name={stat.icon} />
              </div>
              <div>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="steps-section">
        <h2>How It Works</h2>
        <div className="steps-grid">
          {steps.map((step, index) => (
            <article className="step-card" key={step.number}>
              <div className={`step-number step-${step.number}`}>{step.number}</div>
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
              {index < steps.length - 1 && <span className="step-arrow">-&gt;</span>}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default Home;
