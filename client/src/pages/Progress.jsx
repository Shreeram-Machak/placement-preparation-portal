import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { API_BASE_URL } from '../utils/api';
import { getAuthToken } from '../utils/auth';

const API_URL = `${API_BASE_URL}/api/dashboard/progress`;
const moduleLabels = { aptitude: 'Aptitude', coding: 'Coding', mockTests: 'Mock Tests' };

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

function Progress() {
  const [progress, setProgress] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    const loadProgress = () => {
      axios.get(API_URL, { headers: { Authorization: `Bearer ${getAuthToken()}` } })
        .then(({ data }) => {
          if (!active) return;
          setProgress(data);
          setMessage('');
        })
        .catch((error) => {
          if (active) setMessage(error.response?.data?.message || 'Unable to load progress.');
        });
    };

    loadProgress();
    const refreshTimer = window.setInterval(loadProgress, 30000);
    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  if (!progress) return <main className="progress-page"><p className={`progress-message ${message ? 'error' : ''}`}>{message || 'Loading your progress...'}</p></main>;

  return (
    <main className="progress-page">
      <header className="progress-header"><div><span>Performance Center</span><h1>Your Progress</h1><p>Track accuracy, consistency, time spent, and improvement across every practice module.</p></div><div className="readiness-badge"><strong>{progress.overview.overallAccuracy}%</strong><span>Overall Accuracy</span></div></header>

      <section className="progress-summary-grid">
        <article><span>Total Attempts</span><strong>{progress.overview.attempts}</strong><small>Completed activities</small></article>
        <article><span>Questions Solved</span><strong>{progress.overview.questionsSolved}</strong><small>Correct answers</small></article>
        <article><span>Current Streak</span><strong>{progress.overview.currentStreak} days</strong><small>Keep practicing daily</small></article>
        <article><span>Time Spent</span><strong>{formatDuration(progress.overview.timeSpentSeconds)}</strong><small>Recorded practice time</small></article>
      </section>

      <section className="progress-dashboard-grid">
        <article className="progress-card progress-trend-card">
          <header><div><h2>14-Day Performance</h2><p>Accuracy on days when you completed practice.</p></div><span>Accuracy %</span></header>
          <div className="progress-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={progress.trendDays} margin={{ top: 10, right: 18, left: -15, bottom: 0 }}><CartesianGrid stroke="#e8ecf3" strokeDasharray="4 4" /><XAxis dataKey="date" fontSize={11} tickLine={false} /><YAxis domain={[0, 100]} fontSize={11} tickLine={false} /><Tooltip formatter={(value) => [value === null ? 'No activity' : `${value}%`, 'Accuracy']} /><Line connectNulls dataKey="accuracy" dot={{ r: 4 }} stroke="#3157f2" strokeWidth={3} type="monotone" /></LineChart></ResponsiveContainer></div>
        </article>

        <article className="progress-card module-progress-card"><h2>Module Breakdown</h2><p>Accuracy and best score by practice type.</p>{Object.entries(progress.moduleProgress).map(([key, value]) => <section key={key}><div><strong>{moduleLabels[key]}</strong><span>{value.attempts} attempts</span></div><div className="module-progress-bar"><i style={{ width: `${value.accuracy}%` }} /></div><footer><span>Accuracy: {value.accuracy}%</span><span>Best: {value.bestScore}%</span></footer></section>)}</article>

        <article className="progress-card progress-recommendation"><span>Recommended Next Step</span><h2>Keep improving strategically</h2><p>{progress.recommendation}</p><div><a href="/dashboard/aptitude">Practice Aptitude</a><a href="/dashboard/coding">Solve Coding</a><a href="/dashboard/mock-test">Take Mock Test</a></div></article>
      </section>

      <section className="progress-insight-grid">
        <article className="progress-card">
          <header><div><h2>Aptitude Score History</h2><p>Score trend across recent aptitude practice.</p></div><span>Score %</span></header>
          <div className="progress-chart compact"><ResponsiveContainer width="100%" height="100%"><LineChart data={progress.aptitudeHistory} margin={{ top: 10, right: 18, left: -15, bottom: 0 }}><CartesianGrid stroke="#e8ecf3" strokeDasharray="4 4" /><XAxis dataKey="label" fontSize={11} tickLine={false} /><YAxis domain={[0, 100]} fontSize={11} tickLine={false} /><Tooltip formatter={(value) => [`${value}%`, 'Aptitude Score']} labelFormatter={(_, items) => items?.[0]?.payload?.date || ''} /><Line dataKey="score" dot={{ r: 4 }} stroke="#7345e9" strokeWidth={3} type="monotone" /></LineChart></ResponsiveContainer></div>
        </article>

        <article className="progress-card">
          <header><div><h2>Coding Solved Count</h2><p>Problems solved during the last seven days.</p></div><span>Solved</span></header>
          <div className="progress-chart compact"><ResponsiveContainer width="100%" height="100%"><BarChart data={progress.codingSolvedHistory} margin={{ top: 10, right: 18, left: -20, bottom: 0 }}><CartesianGrid stroke="#e8ecf3" strokeDasharray="4 4" /><XAxis dataKey="date" fontSize={11} tickLine={false} /><YAxis allowDecimals={false} fontSize={11} tickLine={false} /><Tooltip formatter={(value) => [value, 'Problems Solved']} /><Bar dataKey="solved" fill="#1aa777" radius={[7, 7, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </article>

        <article className="progress-card">
          <header><div><h2>Mock Test Scores</h2><p>Recent company mock test performance.</p></div><span>Score %</span></header>
          <div className="progress-chart compact"><ResponsiveContainer width="100%" height="100%"><BarChart data={progress.mockTestScores} margin={{ top: 10, right: 18, left: -15, bottom: 0 }}><CartesianGrid stroke="#e8ecf3" strokeDasharray="4 4" /><XAxis dataKey="date" fontSize={11} tickLine={false} /><YAxis domain={[0, 100]} fontSize={11} tickLine={false} /><Tooltip formatter={(value) => [`${value}%`, 'Mock Score']} labelFormatter={(_, items) => items?.[0]?.payload?.label || ''} /><Bar dataKey="score" fill="#f59f2a" radius={[7, 7, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </article>

        <article className="progress-card">
          <header><div><h2>Weekly Improvement</h2><p>Accuracy movement and practice volume by week.</p></div><span>Change</span></header>
          <div className="progress-chart compact"><ResponsiveContainer width="100%" height="100%"><LineChart data={progress.weeklyImprovement} margin={{ top: 10, right: 18, left: -15, bottom: 0 }}><CartesianGrid stroke="#e8ecf3" strokeDasharray="4 4" /><XAxis dataKey="label" fontSize={11} tickLine={false} /><YAxis fontSize={11} tickLine={false} /><Tooltip formatter={(value, name) => [name === 'accuracy' ? `${value}%` : value > 0 ? `+${value}%` : `${value}%`, name === 'accuracy' ? 'Accuracy' : 'Improvement']} /><Legend /><Line dataKey="accuracy" name="accuracy" dot={{ r: 4 }} stroke="#3157f2" strokeWidth={3} type="monotone" /><Line dataKey="improvement" name="improvement" dot={{ r: 4 }} stroke="#1aa777" strokeWidth={3} type="monotone" /></LineChart></ResponsiveContainer></div>
        </article>
      </section>

      <section className="progress-card recent-progress-card"><header><div><h2>Recent Attempts</h2><p>Your latest saved test and coding results.</p></div></header><div className="progress-table-wrap"><table><thead><tr><th>Activity</th><th>Module</th><th>Score</th><th>Accuracy</th><th>Time</th><th>Date</th></tr></thead><tbody>{progress.recentAttempts.map((attempt) => <tr key={attempt.id}><td><strong>{attempt.title}</strong></td><td><span className={`progress-type ${attempt.type}`}>{attempt.type.replace('-', ' ')}</span></td><td>{attempt.score}/{attempt.total}</td><td><strong>{attempt.percentage}%</strong></td><td>{formatDuration(attempt.timeTaken)}</td><td>{new Date(attempt.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table>{!progress.recentAttempts.length && <p>No attempts yet. Complete a practice activity to start tracking progress.</p>}</div></section>
    </main>
  );
}

export default Progress;
