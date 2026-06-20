import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';
import { getAuthToken } from '../utils/auth';

const API_URL = `${API_BASE_URL}/api/leaderboard`;

const sections = [
  ['aptitude', 'Top Aptitude Scores', 'aptitudeScore', '%'],
  ['mockTests', 'Top Mock Test Scores', 'mockTestScore', '%'],
  ['coding', 'Coding Problems Solved', 'codingProblemsSolved', ' solved'],
  ['overall', 'Overall Readiness', 'overallReadiness', '%'],
];

function LeaderboardTable({ rows, scoreKey, suffix, title }) {
  return (
    <article className="leaderboard-card">
      <h2>{title}</h2>
      <div className="leaderboard-list">
        {rows.map((row, index) => (
          <div className="leaderboard-row" key={`${title}-${row.user.id || index}`}>
            <strong>{index + 1}</strong>
            <span>{row.user.name}</span>
            <small>{row[scoreKey]}{suffix}</small>
          </div>
        ))}
        {!rows.length && <p>No results yet.</p>}
      </div>
    </article>
  );
}

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState({ aptitude: [], mockTests: [], coding: [], overall: [] });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    axios.get(API_URL, { headers: { Authorization: `Bearer ${getAuthToken()}` } })
      .then(({ data }) => { if (active) setLeaderboard(data); })
      .catch((error) => { if (active) setMessage(error.response?.data?.message || 'Unable to load leaderboard.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <main className="leaderboard-page">
      <header className="leaderboard-header">
        <div><span>Rankings</span><h1>Student Leaderboard</h1><p>Top performers by aptitude, mock tests, coding, and overall readiness.</p></div>
      </header>

      {loading && <div className="loading-spinner"><i />Loading leaderboard...</div>}
      {message && <p className="leaderboard-message error">{message}</p>}

      <section className="leaderboard-grid">
        {sections.map(([key, title, scoreKey, suffix]) => (
          <LeaderboardTable
            key={key}
            rows={leaderboard[key] || []}
            scoreKey={scoreKey}
            suffix={suffix}
            title={title}
          />
        ))}
      </section>
    </main>
  );
}

export default Leaderboard;
