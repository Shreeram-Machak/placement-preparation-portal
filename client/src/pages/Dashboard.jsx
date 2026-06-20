import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../utils/api';
import { clearAuthSession, getAuthToken } from '../utils/auth';
import Aptitude from './Aptitude';
import Coding from './Coding';
import Companies from './Companies';
import MockTest from './MockTest';
import ResumeBuilder from './ResumeBuilder';
import InterviewPrep from './InterviewPrep';
import Leaderboard from './Leaderboard';
import Resources from './Resources';
import Progress from './Progress';
import Profile from './Profile';

const getMenuItems = (role) => {
  const common = [{ label: 'Dashboard', mobileLabel: 'Home', icon: 'home', path: '/dashboard', mobilePrimary: true }];

  if (role === 'admin') {
    return [...common,
      { label: 'Admin Panel', mobileLabel: 'Admin', icon: 'gear', path: '/admin' },
      { label: 'Companies', mobileLabel: 'Companies', icon: 'building', path: '/admin#companies' },
      { label: 'Users', mobileLabel: 'Users', icon: 'chart', path: '/admin#users' },
    ];
  }

  return [...common,
    { label: 'Aptitude', mobileLabel: 'Aptitude', icon: 'brain', path: '/dashboard/aptitude', mobilePrimary: true },
    { label: 'Coding Practice', mobileLabel: 'Coding', icon: 'code', path: '/dashboard/coding', mobilePrimary: true },
    { label: 'Mock Tests', mobileLabel: 'Tests', icon: 'calendar', path: '/dashboard/mock-test', mobilePrimary: true },
    { label: 'Companies', mobileLabel: 'Companies', icon: 'building', path: '/dashboard/companies', mobilePrimary: true },
    { label: 'Leaderboard', mobileLabel: 'Leaders', icon: 'trophy', path: '/dashboard/leaderboard' },
    { label: 'Resume Builder', mobileLabel: 'Resume', icon: 'file', path: '/dashboard/resume' },
    { label: 'Interview Prep', mobileLabel: 'Interview', icon: 'mic', path: '/dashboard/interview' },
    { label: 'Resources', mobileLabel: 'Resources', icon: 'box', path: '/dashboard/resources' },
    { label: 'Progress', mobileLabel: 'Progress', icon: 'chart', path: '/dashboard/progress' },
    { label: 'Profile', mobileLabel: 'Profile', icon: 'user', path: '/dashboard/profile' },
  ];
};

const fallbackStats = [
  { title: 'Questions Solved', value: '0', suffix: 'Correct', change: 'No test data yet', color: 'purple', icon: 'chart' },
  { title: 'Mock Tests Attempted', value: '0', suffix: 'Tests', change: 'No test data yet', color: 'orange', icon: 'calendar' },
  { title: 'Placement Readiness', value: '0%', suffix: 'Keep practicing', change: 'Based on test results', color: 'blue', icon: 'trophy' },
  { title: 'Current Streak', value: '0', suffix: 'Days', change: 'Complete a test today', color: 'green', icon: 'calendar' },
];

const mockTests = [
  ['TCS NQT Mock Test', 'Aptitude', '120 mins', 'Advanced', 'MAY 25'],
  ['Infosys Springboard', 'Aptitude', '90 mins', 'Intermediate', 'MAY 28'],
  ['Wipro Elite Mock', 'Aptitude', '100 mins', 'Advanced', 'MAY 30'],
];

const companies = [
  ['Amazon', '120 Questions Practiced', '80%', 'amazon'],
  ['Microsoft', '95 Questions Practiced', '65%', 'microsoft'],
  ['Google', '80 Questions Practiced', '55%', 'google'],
  ['TCS', '70 Questions Practiced', '45%', 'tcs'],
];

const activities = [
  ['Solved Array Rotation problem', 'Coding', '2h ago', 'code'],
  ['Completed Aptitude Mock Test', 'Mock Test', '1d ago', 'calendar'],
  ['Improved Percentage in Aptitude', 'Aptitude', '2d ago', 'chart'],
  ['Added Amazon to Companies', 'Companies', '3d ago', 'building'],
];

const recommendations = [
  ['Data Structures in C++', 'Continue Learning', '60%', 'code', 'mint'],
  ['Quantitative Aptitude', 'Practice Now', '45%', 'chart', 'lavender'],
  ['Take a Mock Test', '12 Tests Available', '', 'calendar', 'peach'],
  ['Resume Review', 'Get Expert Review', '', 'file', 'sky'],
];

const fallbackData = {
  user: {
    name: 'Student',
    role: 'student',
  },
  stats: fallbackStats,
  currentStreak: 0,
  subjectProgress: {
    overall: 75,
    aptitude: 75,
    coding: 60,
    mockTests: 40,
    interviewPrep: 30,
  },
  weeklyProgress: [
    { day: 'Mon', aptitude: null, coding: null, mockTests: null },
    { day: 'Tue', aptitude: null, coding: null, mockTests: null },
    { day: 'Wed', aptitude: null, coding: null, mockTests: null },
    { day: 'Thu', aptitude: null, coding: null, mockTests: null },
    { day: 'Fri', aptitude: null, coding: null, mockTests: null },
    { day: 'Sat', aptitude: null, coding: null, mockTests: null },
    { day: 'Sun', aptitude: null, coding: null, mockTests: null },
  ],
  mockTests,
  companies,
  activities,
  recommendations,
};

const getInitialDashboardData = () => {
  const savedUser =
    localStorage.getItem('placementPrepUser') ||
    sessionStorage.getItem('placementPrepUser');

  if (!savedUser) return fallbackData;

  try {
    return { ...fallbackData, user: JSON.parse(savedUser) };
  } catch {
    return fallbackData;
  }
};

function DashIcon({ name }) {
  const paths = {
    home: 'M3 11 12 4l9 7v9h-6v-6H9v6H3v-9Z',
    brain: 'M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0 0 6v1a3 3 0 0 0 5 2.2M15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 0 6v1a3 3 0 0 1-5 2.2M12 5v14',
    code: 'm9 18-6-6 6-6m6 0 6 6-6 6',
    calendar: 'M7 3v4m10-4v4M4 8h16v12H4V8Zm4 5h3m3 0h3',
    building: 'M4 21h16M6 21V5h8v16m0-12h4v12M9 9h2m-2 4h2m-2 4h2',
    file: 'M6 3h9l3 3v15H6V3Zm8 0v5h5M9 13h6m-6 4h6',
    mic: 'M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Zm-7-3a7 7 0 0 0 14 0M12 18v3',
    box: 'M4 7 12 3l8 4-8 4-8-4Zm0 4 8 4 8-4M4 15l8 4 8-4',
    chart: 'M4 19h16M6 16l4-5 4 3 5-8',
    bookmark: 'M6 4h12v17l-6-4-6 4V4Z',
    gear: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-5v3m0 12v3m9-9h-3M6 12H3m15.4-6.4-2.1 2.1M7.7 16.3l-2.1 2.1m12.8 0-2.1-2.1M7.7 7.7 5.6 5.6',
    trophy: 'M8 21h8m-4-4v4M7 4h10v5a5 5 0 0 1-10 0V4Zm10 2h3a3 3 0 0 1-3 3M7 6H4a3 3 0 0 0 3 3',
    search: 'M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm5.5-2 5 5',
    bell: 'M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16l-2-2Zm-8 4h4',
    logout: 'M10 5H5v14h5m4-4 4-3-4-3m4 3H9',
    user: 'M20 21a8 8 0 0 0-16 0m12-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

function Sparkline({ color }) {
  return (
    <svg className={`sparkline ${color}`} viewBox="0 0 240 70" aria-hidden="true">
      <path className="spark-fill" d="M0 58 20 50 42 55 66 48 89 52 112 43 136 47 158 38 182 42 205 30 230 12 240 12v58H0Z" />
      <path className="spark-line" d="M0 58 20 50 42 55 66 48 89 52 112 43 136 47 158 38 182 42 205 30 230 12" />
    </svg>
  );
}

const chartXs = [80, 185, 290, 395, 500, 605, 710];
const chartY = (value) => 260 - ((Number(value) || 0) / 100) * 220;
const chartPath = (items, key) => items
  .map((item, index) => `${index === 0 ? 'M' : 'L'}${chartXs[index]} ${chartY(item[key])}`)
  .join(' ');
const chartPoints = (items, key, className) => items.map((item, index) => (
  <circle
    className={className}
    cx={chartXs[index]}
    cy={chartY(item[key])}
    key={`${key}-${item.day}-${index}`}
    r="6"
  />
));

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [dashboardData, setDashboardData] = useState(getInitialDashboardData);
  const [isLoading, setIsLoading] = useState(() => Boolean(getAuthToken()));

  useEffect(() => {
    const token = getAuthToken();
    if (location.pathname !== '/dashboard') {
      setIsLoading(false);
      return;
    }
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    axios
      .get(`${API_BASE_URL}/api/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(({ data }) => {
        setDashboardData({
          ...fallbackData,
          ...data,
        });
      })
      .catch(() => {
        setDashboardData((current) => current);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [location.pathname]);

  const firstName = dashboardData.user?.name?.split(' ')[0] || 'Student';
  const userRole = dashboardData.user?.role || 'student';
  const menuItems = getMenuItems(userRole);
  const avatarInitial = firstName.charAt(0).toUpperCase();
  const streakDays = Math.min(dashboardData.currentStreak || 0, 7);
  const weeklyProgress = dashboardData.weeklyProgress?.length
    ? dashboardData.weeklyProgress
    : fallbackData.weeklyProgress;
  const practicePages = {
    '/dashboard/aptitude': <Aptitude />,
    '/dashboard/coding': <Coding />,
    '/dashboard/mock-test': <MockTest />,
    '/dashboard/companies': <Companies />,
    '/dashboard/leaderboard': <Leaderboard />,
    '/dashboard/resume': <ResumeBuilder />,
    '/dashboard/interview': <InterviewPrep />,
    '/dashboard/resources': <Resources />,
    '/dashboard/progress': <Progress />,
    '/dashboard/profile': <Profile />,
  };
  const practicePage = userRole === 'student' ? practicePages[location.pathname] : null;

  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to log out?')) return;
    clearAuthSession();
    navigate('/login', { replace: true });
  };

  return (
    <main className="dashboard-page">
      <aside className="dashboard-sidebar">
        <Link className="dashboard-brand" to="/">
          <span className="dashboard-brand-mark">
            <svg viewBox="0 0 32 32"><path d="M16 3 3 10l13 7 13-7-13-7Z" /><path d="M7 14v7l9 5 9-5v-7l-9 5-9-5Z" /></svg>
          </span>
          Placement Prep
        </Link>

        <nav className="dashboard-menu" aria-label="Dashboard navigation">
          {menuItems.map((item) => (
            item.path ? (
              <Link className={`${location.pathname === item.path ? 'active' : ''} ${item.mobilePrimary ? 'mobile-primary-nav' : ''}`} key={item.label} to={item.path}>
                <DashIcon name={item.icon} />
                <span data-mobile-label={item.mobileLabel || item.label}>{item.label}</span>
              </Link>
            ) : (
              <button key={item.label} type="button">
                <DashIcon name={item.icon} />
                <span data-mobile-label={item.mobileLabel || item.label}>{item.label}</span>
              </button>
            )
          ))}
          <button className="mobile-nav-logout mobile-primary-nav" onClick={handleLogout} type="button">
            <DashIcon name="logout" />
            <span data-mobile-label="Logout">Logout</span>
          </button>
        </nav>

        <section className="sidebar-progress-card">
          <h2>Keep Going!</h2>
          <p>You&apos;re doing great. Consistency is the key to success.</p>
          <div className="sidebar-ring"><strong>75%</strong></div>
          <span>Weekly Goal</span>
          <small>15/20 Tasks Completed</small>
          <div className="sidebar-progress"><i /></div>
          <button type="button">View Progress</button>
        </section>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <label className="dashboard-search">
            <DashIcon name="search" />
            <input placeholder="Search topics, tests, companies..." />
            <kbd>Ctrl K</kbd>
          </label>
          <div className="dashboard-profile">
            <button className="notification-button" type="button">
              <DashIcon name="bell" />
              <span>3</span>
            </button>
            <div className="profile-avatar">{avatarInitial}</div>
            <div>
              <strong>Hi, {firstName}</strong>
              <small>{dashboardData.user?.role || 'student'}</small>
            </div>
            <button className="dashboard-logout" onClick={handleLogout} type="button">
              <DashIcon name="logout" />
              <span>Log out</span>
            </button>
          </div>
        </header>

        <div className={`dashboard-content ${practicePage ? 'dashboard-practice-content' : ''}`}>
          {practicePage || (
          <>
          <div className="dashboard-heading">
            <div>
              <h1>Welcome back, {firstName}!</h1>
              <p>Let&apos;s continue your placement preparation journey.</p>
            </div>
            <button className="date-filter" type="button">May 20 - May 26, 2024</button>
          </div>

          {isLoading && <div className="loading-spinner"><i />Loading dashboard data...</div>}

          <section className="dashboard-stats">
            {dashboardData.stats.map((item) => (
              <article className="dashboard-stat-card" key={item.title}>
                <div className={`dashboard-stat-icon ${item.color}`}><DashIcon name={item.icon} /></div>
                <div>
                  <h2>{item.title}</h2>
                  <strong>{item.value}<span>{item.suffix}</span></strong>
                  <small>{item.change}</small>
                </div>
                <Sparkline color={item.color} />
              </article>
            ))}
          </section>

          <section className="dashboard-grid">
            <article className="dashboard-card progress-overview">
              <div className="card-title-row">
                <h2>Weekly Progress Overview</h2>
                <button type="button">This Week</button>
              </div>
              <div className="chart-legend">
                <span className="purple-dot">Aptitude</span>
                <span className="green-dot">Coding</span>
                <span className="orange-dot">Mock Tests</span>
              </div>
              <svg className="line-chart" viewBox="0 0 760 300" aria-label="Weekly progress chart">
                <g className="grid-lines">
                  <path d="M55 40h670M55 95h670M55 150h670M55 205h670M55 260h670" />
                </g>
                <g className="axis-labels">
                  <text x="20" y="45">100%</text><text x="28" y="100">75%</text><text x="28" y="155">50%</text><text x="28" y="210">25%</text><text x="36" y="265">0%</text>
                  {weeklyProgress.map((item, index) => <text key={item.day} x={chartXs[index] - 10} y="286">{item.day}</text>)}
                </g>
                <path className="aptitude-line" d={chartPath(weeklyProgress, 'aptitude')} />
                <path className="coding-line" d={chartPath(weeklyProgress, 'coding')} />
                <path className="mock-line" d={chartPath(weeklyProgress, 'mockTests')} />
                {chartPoints(weeklyProgress, 'aptitude', 'point purple')}
                {chartPoints(weeklyProgress, 'coding', 'point green')}
                {chartPoints(weeklyProgress, 'mockTests', 'point orange')}
              </svg>
            </article>

            <aside className="dashboard-side-stack">
              <article className="dashboard-card streak-card">
                <h2>Current Streak</h2>
                <strong>{dashboardData.currentStreak || 0} Days</strong>
                <p>{dashboardData.currentStreak ? 'Keep the streak alive!' : 'Complete a test to start your streak.'}</p>
                <div className="streak-days">{['M','T','W','T','F','S','S'].map((day, index) => <span className={index < streakDays ? 'done' : ''} key={`${day}-${index}`}>{index < streakDays ? 'ok' : ''}<small>{day}</small></span>)}</div>
              </article>

              <article className="dashboard-card list-card">
                <div className="card-title-row"><h2>Upcoming Mock Tests</h2><a href="#tests">View All</a></div>
                {dashboardData.mockTests.map((test) => (
                  <div className="mini-list-item" key={test[0]}>
                    <div className="mini-icon"><DashIcon name="calendar" /></div>
                    <div><strong>{test[0]}</strong><span>{test[1]} / {test[2]} / {test[3]}</span></div>
                    <time>{test[4]}</time>
                  </div>
                ))}
              </article>
            </aside>

            <article className="dashboard-card subject-progress">
              <h2>Subject Progress</h2>
              <div className="donut-chart" style={{ '--overall-progress': `${dashboardData.subjectProgress.overall}%` }}><strong>{dashboardData.subjectProgress.overall}%</strong><span>Overall</span></div>
              <div className="subject-list">
                <span><i className="purple-bg" />Aptitude <strong>{dashboardData.subjectProgress.aptitude}%</strong></span>
                <span><i className="green-bg" />Coding <strong>{dashboardData.subjectProgress.coding}%</strong></span>
                <span><i className="orange-bg" />Mock Tests <strong>{dashboardData.subjectProgress.mockTests}%</strong></span>
                <span><i className="blue-bg" />Interview Prep <strong>{dashboardData.subjectProgress.interviewPrep}%</strong></span>
              </div>
            </article>

            <article className="dashboard-card activity-card">
              <div className="card-title-row"><h2>Recent Activity</h2><a href="#activity">View All</a></div>
              {dashboardData.activities.map((activity) => (
                <div className="activity-item" key={activity[0]}>
                  <div className={`activity-icon ${activity[3]}`}><DashIcon name={activity[3]} /></div>
                  <strong>{activity[0]}</strong>
                  <span>{activity[1]}</span>
                  <time>{activity[2]}</time>
                </div>
              ))}
            </article>

            <article className="dashboard-card companies-card">
              <div className="card-title-row"><h2>Top Companies</h2><Link to="/dashboard/companies">View All</Link></div>
              {dashboardData.companies.map((company) => (
                <div className="company-item" key={company[0]}>
                  <div className={`company-logo ${company[3]}`}>{company[0][0]}</div>
                  <div><strong>{company[0]}</strong><span>{company[1]}</span></div>
                  <div className="company-bar"><i style={{ width: company[2] }} /></div>
                  <small>{company[2]}</small>
                </div>
              ))}
            </article>
          </section>

          <section className="recommended-row">
            <h2>Recommended for You</h2>
            <div>
              {dashboardData.recommendations.map((item) => (
                <article className={`recommend-card ${item[4]}`} key={item[0]}>
                  <div><h3>{item[0]}</h3><p>{item[1]}</p>{item[2] && <div className="recommend-progress"><i style={{ width: item[2] }} /></div>}</div>
                  <DashIcon name={item[3]} />
                </article>
              ))}
            </div>
          </section>
          </>
          )}
        </div>
      </section>
    </main>
  );
}

export default Dashboard;

