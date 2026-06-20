import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../utils/api';
import { getAuthToken } from '../utils/auth';

const API_URL = `${API_BASE_URL}/api/mock-tests`;
const companyOptions = [
  { name: 'General Placement', mark: 'GP', tone: 'general', description: 'A balanced placement simulation covering the core sections used across major recruiters.' },
  { name: 'TCS NQT', mark: 'TCS', tone: 'tcs', description: 'Practice the aptitude, reasoning, verbal, and technical mix commonly seen in TCS NQT.' },
  { name: 'Infosys', mark: 'INF', tone: 'infosys', description: 'Prepare for Infosys-style logical reasoning, aptitude, communication, and technical screening.' },
  { name: 'Wipro Elite', mark: 'W', tone: 'wipro', description: 'A focused Wipro Elite simulation with placement aptitude and technical fundamentals.' },
  { name: 'Accenture', mark: 'A', tone: 'accenture', description: 'Practice a balanced Accenture-style assessment across cognitive and technical skills.' },
];
const subjects = ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability', 'Technical MCQs'];

const formatTime = (seconds) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

function MockTest() {
  const [view, setView] = useState('setup');
  const [company, setCompany] = useState(companyOptions[0].name);
  const [difficulty, setDifficulty] = useState('medium');
  const [history, setHistory] = useState({ attempts: 0, lastAttempt: null, bestScore: null });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [initialSeconds, setInitialSeconds] = useState(0);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const authConfig = useMemo(() => ({ headers: { Authorization: `Bearer ${getAuthToken()}` } }), []);
  const selectedCompany = companyOptions.find((item) => item.name === company) || companyOptions[0];
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.values(answers).filter(Boolean).length;

  useEffect(() => {
    let active = true;
    axios.get(`${API_URL}/history`, { ...authConfig, params: { company } })
      .then(({ data }) => { if (active) setHistory(data); })
      .catch(() => { if (active) setHistory({ attempts: 0, lastAttempt: null, bestScore: null }); });
    return () => { active = false; };
  }, [authConfig, company, view]);

  const submitTest = useCallback(async () => {
    if (isSubmitting || !questions.length) return;
    setIsSubmitting(true);
    setMessage('');
    try {
      const { data } = await axios.post(`${API_URL}/submit`, {
        answers,
        company,
        questionIds: questions.map((item) => item._id),
        timeTaken: initialSeconds - secondsLeft,
      }, authConfig);
      setResult(data);
      setView('result');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to submit mock test.');
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, authConfig, company, initialSeconds, isSubmitting, questions, secondsLeft]);

  useEffect(() => {
    if (view !== 'test') return undefined;
    if (secondsLeft <= 0) {
      const autoSubmit = window.setTimeout(() => submitTest(), 0);
      return () => window.clearTimeout(autoSubmit);
    }
    const timer = window.setInterval(() => setSecondsLeft((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft, submitTest, view]);

  const startTest = async () => {
    setShowConfirmation(false);
    setIsLoading(true);
    setMessage('');
    try {
      const { data } = await axios.post(`${API_URL}/generate`, { company, difficulty }, authConfig);
      setQuestions(data.questions);
      setAnswers({});
      setCurrentIndex(0);
      setSecondsLeft(data.durationSeconds);
      setInitialSeconds(data.durationSeconds);
      setMessage(data.fallback ? data.message : '');
      setView('test');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to prepare mock test.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetTest = () => {
    setView('setup');
    setQuestions([]);
    setAnswers({});
    setResult(null);
    setMessage('');
  };

  if (view === 'result' && result) {
    return (
      <main className="mock-test-page">
        <section className="mock-result-card">
          <span>Mock test complete</span>
          <h1>{company} Result</h1>
          <div className="mock-result-score"><strong>{result.percentage}%</strong><small>{result.score}/{result.totalQuestions} correct</small></div>
          <div className="mock-result-stats">
            <article><strong>{result.score}</strong><span>Correct</span></article>
            <article><strong>{result.wrongAnswers}</strong><span>Wrong</span></article>
            <article><strong>{result.skippedQuestions}</strong><span>Skipped</span></article>
          </div>
          <section className="mock-analytics-section">
            <h2>Performance Analytics</h2>
            <div className="mock-analytics-grid">
              <article><span>Accuracy</span><strong>{result.analytics.accuracy}%</strong></article>
              <article><span>Time Taken</span><strong>{formatDuration(result.analytics.timeTaken)}</strong></article>
              <article><span>Strong Area</span><strong>{result.analytics.strongArea}</strong></article>
              <article><span>Weak Area</span><strong>{result.analytics.weakArea}</strong></article>
            </div>
          </section>
          <div className="mock-result-actions"><button onClick={resetTest} type="button">Take Another Test</button><Link to="/dashboard">Dashboard Overview</Link></div>
          <section className="mock-review">
            <h2>Answer Review</h2>
            {result.review.map((item, index) => (
              <article className={item.isCorrect ? 'correct' : 'incorrect'} key={item.questionId}>
                <h3>{index + 1}. {item.question}</h3>
                <p>Your answer: <strong>{item.selectedAnswer || 'Skipped'}</strong></p>
                {!item.isCorrect && <p>Correct answer: <strong>{item.correctAnswer}</strong></p>}
                <p>{item.explanation}</p>
              </article>
            ))}
          </section>
        </section>
      </main>
    );
  }

  if (view === 'test' && currentQuestion) {
    return (
      <main className="mock-test-page">
        <section className="mock-test-shell">
          <header><div><span>{company}</span><h1>Placement Mock Test</h1></div><time className={secondsLeft <= 60 ? 'ending' : ''}>{formatTime(secondsLeft)}</time></header>
          <div className="mock-test-progress"><i style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} /></div>
          {message && <p className="mock-message">{message}</p>}
          <div className="mock-test-grid">
            <aside><strong>{answeredCount}/{questions.length} Answered</strong><div>{questions.map((question, index) => <button className={`${index === currentIndex ? 'active' : ''} ${answers[question._id] ? 'answered' : ''}`} key={question._id} onClick={() => setCurrentIndex(index)} type="button">{index + 1}</button>)}</div></aside>
            <article className="mock-question-card">
              <div className="question-meta"><span>{currentQuestion.category}</span><span>{currentQuestion.difficulty}</span></div>
              <h2>{currentIndex + 1}. {currentQuestion.question}</h2>
              <div className="answer-options">{currentQuestion.options.map((option, index) => <button className={answers[currentQuestion._id] === option ? 'selected' : ''} key={option} onClick={() => setAnswers((current) => ({ ...current, [currentQuestion._id]: option }))} type="button"><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>
              <footer><button disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => index - 1)} type="button">Previous</button>{currentIndex < questions.length - 1 ? <button onClick={() => setCurrentIndex((index) => index + 1)} type="button">Save & Next</button> : <button disabled={isSubmitting} onClick={submitTest} type="button">{isSubmitting ? 'Submitting...' : 'Submit Test'}</button>}</footer>
            </article>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mock-test-page">
      <section className="mock-setup-card">
        <span>Placement Simulation</span>
        <h1>Company Mock Tests</h1>
        <p>Choose a company pattern and attempt a timed assessment saved to your dashboard.</p>

        <div className="mock-company-grid">
          {companyOptions.map((item) => (
            <button className={company === item.name ? 'active' : ''} key={item.name} onClick={() => setCompany(item.name)} type="button">
              <i className={`company-brand-mark ${item.tone}`}>{item.mark}</i>
              <span>{item.name}</span>
            </button>
          ))}
        </div>

        <section className="mock-company-description">
          <i className={`company-brand-mark large ${selectedCompany.tone}`}>{selectedCompany.mark}</i>
          <div><h2>{selectedCompany.name}</h2><p>{selectedCompany.description}</p></div>
        </section>

        <div className="mock-test-info">
          <article><strong>10</strong><span>Questions</span></article>
          <article><strong>15 min</strong><span>Duration</span></article>
          <article><strong>4</strong><span>Subjects</span></article>
          <article><strong>{difficulty[0].toUpperCase() + difficulty.slice(1)}</strong><span>Difficulty</span></article>
        </div>

        <label className="mock-difficulty-select">Difficulty<select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>

        <div className="mock-setup-columns">
          <section className="mock-subjects"><h2>Subjects Included</h2>{subjects.map((subject) => <p key={subject}><span>✓</span>{subject}</p>)}</section>
          <section className="mock-instructions"><h2>Instructions</h2><p>Total Questions: 10</p><p>No negative marking</p><p>Timer cannot be paused</p><p>Submit before time ends</p></section>
        </div>

        <section className="mock-history-section">
          <h2>Previous Attempts</h2>
          <div className="mock-history-grid">
            <article><span>Last Attempt</span><strong>{history.lastAttempt === null ? '--' : `${history.lastAttempt}%`}</strong></article>
            <article><span>Best Score</span><strong>{history.bestScore === null ? '--' : `${history.bestScore}%`}</strong></article>
            <article><span>Attempts</span><strong>{history.attempts}</strong></article>
          </div>
        </section>

        {message && <p className="mock-message error">{message}</p>}
        <button className="start-mock-button" disabled={isLoading} onClick={() => setShowConfirmation(true)} type="button">{isLoading ? 'Preparing Test...' : 'Start Mock Test'}</button>
      </section>

      {showConfirmation && (
        <div className="mock-modal-backdrop" role="presentation" onMouseDown={() => setShowConfirmation(false)}>
          <section aria-labelledby="mock-confirm-title" aria-modal="true" className="mock-confirm-modal" onMouseDown={(event) => event.stopPropagation()} role="dialog">
            <i className={`company-brand-mark large ${selectedCompany.tone}`}>{selectedCompany.mark}</i>
            <h2 id="mock-confirm-title">Start {company} Mock Test?</h2>
            <p>Questions: 10</p><p>Duration: 15 minutes</p><p>Difficulty: {difficulty[0].toUpperCase() + difficulty.slice(1)}</p>
            <div><button className="secondary" onClick={() => setShowConfirmation(false)} type="button">Cancel</button><button onClick={startTest} type="button">Start Test</button></div>
          </section>
        </div>
      )}
    </main>
  );
}

export default MockTest;
