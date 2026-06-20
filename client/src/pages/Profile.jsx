import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';
import { getAuthToken, getAuthUser } from '../utils/auth';

const API_URL = `${API_BASE_URL}/api/dashboard/progress`;

function Profile() {
  const [user] = useState(() => getAuthUser() || { name: 'Student', email: '', role: 'student' });
  const [progress, setProgress] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    axios.get(API_URL, { headers: { Authorization: `Bearer ${getAuthToken()}` } })
      .then(({ data }) => { if (active) setProgress(data); })
      .catch((error) => { if (active) setMessage(error.response?.data?.message || 'Unable to load profile stats.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <main className="profile-page">
      <header className="profile-header">
        <div className="profile-avatar-large">{user.name?.charAt(0).toUpperCase() || 'S'}</div>
        <div>
          <span>My Profile</span>
          <h1>{user.name || 'Student'}</h1>
          <p>{user.email || 'No email saved'} · {user.role || 'student'}</p>
        </div>
      </header>

      {loading && <p className="profile-message">Loading profile...</p>}
      {message && <p className="profile-message error">{message}</p>}

      <section className="profile-grid">
        <article>
          <span>Total Attempts</span>
          <strong>{progress?.overview?.attempts ?? 0}</strong>
          <p>Practice activities completed</p>
        </article>
        <article>
          <span>Questions Solved</span>
          <strong>{progress?.overview?.questionsSolved ?? 0}</strong>
          <p>Correct answers recorded</p>
        </article>
        <article>
          <span>Overall Accuracy</span>
          <strong>{progress?.overview?.overallAccuracy ?? 0}%</strong>
          <p>Across aptitude, coding, and mock tests</p>
        </article>
        <article>
          <span>Current Streak</span>
          <strong>{progress?.overview?.currentStreak ?? 0} days</strong>
          <p>Daily practice consistency</p>
        </article>
      </section>

      <section className="profile-card">
        <h2>Account Details</h2>
        <dl>
          <div><dt>Name</dt><dd>{user.name || 'Student'}</dd></div>
          <div><dt>Email</dt><dd>{user.email || 'Not available'}</dd></div>
          <div><dt>Role</dt><dd>{user.role || 'student'}</dd></div>
        </dl>
      </section>
    </main>
  );
}

export default Profile;
