import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { API_BASE_URL } from '../utils/api';
import { getAuthToken } from '../utils/auth';

const API_URL = `${API_BASE_URL}/api/aptitude`;
const SECONDS_PER_QUESTION = 60;
const resultColors = ['#20a77c', '#e34a66', '#f0a126'];

const topics = [
  { value: 'quantitative', label: 'Quantitative' },
  { value: 'logical', label: 'Logical Reasoning' },
  { value: 'verbal', label: 'Verbal Ability' },
  { value: 'technical', label: 'Technical' },
];

function Aptitude() {
  const [view, setView] = useState('setup');
  const [category, setCategory] = useState('quantitative');
  const [difficulty, setDifficulty] = useState('medium');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.values(answers).filter(Boolean).length;
  const progress = questions.length ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const formattedTime = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`;

  const authConfig = useMemo(() => ({
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  }), []);

  const submitQuiz = useCallback(async () => {
    if (isSubmitting || !questions.length) return;

    setIsSubmitting(true);
    setError('');

    try {
      const totalTime = questions.length * SECONDS_PER_QUESTION;
      const { data } = await axios.post(
        `${API_URL}/submit`,
        {
          answers,
          questionIds: questions.map((item) => item._id),
          timeTaken: totalTime - secondsLeft,
        },
        authConfig,
      );
      setResult(data);
      setView('result');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to submit the quiz.');
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, authConfig, isSubmitting, questions, secondsLeft]);

  useEffect(() => {
    if (view !== 'quiz') return undefined;
    if (secondsLeft <= 0) {
      const autoSubmit = window.setTimeout(() => submitQuiz(), 0);
      return () => window.clearTimeout(autoSubmit);
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [secondsLeft, submitQuiz, view]);

  const generateQuestions = async () => {
    const token = getAuthToken();
    if (!token) {
      setError('Please log in before starting an aptitude test.');
      return;
    }

    setIsLoading(true);
    setError('');
    setNotice('');

    try {
      const { data } = await axios.post(
        `${API_URL}/generate`,
        { category, difficulty },
        authConfig,
      );

      if (!data.questions.length) {
        setError('No questions could be prepared for this test.');
        return;
      }

      setQuestions(data.questions);
      setNotice(data.fallback ? data.message : 'Questions generated and saved successfully.');
      setAnswers({});
      setCurrentIndex(0);
      setSecondsLeft(data.questions.length * SECONDS_PER_QUESTION);
      setResult(null);
      setView('quiz');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to generate aptitude questions.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetQuiz = () => {
    setView('setup');
    setQuestions([]);
    setAnswers({});
    setResult(null);
    setError('');
    setNotice('');
  };

  if (view === 'result' && result) {
    const wrongAnswers = result.wrongAnswers ?? result.attemptedQuestions - result.score;
    const skippedQuestions = result.skippedQuestions ?? result.totalQuestions - result.attemptedQuestions;
    const chartData = [
      { name: 'Correct', value: result.score },
      { name: 'Wrong', value: wrongAnswers },
      { name: 'Skipped', value: skippedQuestions },
    ];

    return (
      <main className="aptitude-page">
        <section className="aptitude-result">
          <span className="aptitude-eyebrow">Test complete</span>
          <h1>Your Aptitude Result</h1>
          <div className="result-score-ring" style={{ '--score': `${result.percentage}%` }}>
            <div><strong>{result.percentage}%</strong><span>{result.score}/{result.totalQuestions} correct</span></div>
          </div>
          <div className="result-breakdown">
            <div className="result-chart" aria-label="Answer breakdown chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    innerRadius={62}
                    nameKey="name"
                    outerRadius={94}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {chartData.map((item, index) => (
                      <Cell fill={resultColors[index]} key={item.name} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} questions`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="result-chart-center"><strong>{result.totalQuestions}</strong><span>Total</span></div>
            </div>
            <div className="result-summary">
              {chartData.map((item, index) => (
                <article key={item.name}>
                  <i style={{ background: resultColors[index] }} />
                  <strong>{item.value}</strong>
                  <span>{item.name}</span>
                </article>
              ))}
            </div>
          </div>
          <div className="result-actions">
            <button type="button" onClick={resetQuiz}>Try Another Topic</button>
            <Link to="/dashboard">Dashboard Overview</Link>
          </div>
          <section className="answer-review">
            <h2>Answer Review</h2>
            {result.review.map((item, index) => (
              <article className={item.isCorrect ? 'correct' : 'incorrect'} key={item.questionId}>
                <h3>{index + 1}. {item.question}</h3>
                <p>Your answer: <strong>{item.selectedAnswer || 'Not answered'}</strong></p>
                {!item.isCorrect && <p>Correct answer: <strong>{item.correctAnswer}</strong></p>}
                <p>Explanation: {item.explanation}</p>
              </article>
            ))}
          </section>
        </section>
      </main>
    );
  }

  if (view === 'quiz' && currentQuestion) {
    return (
      <main className="aptitude-page">
        <section className="aptitude-quiz">
          <header className="quiz-header">
            <div>
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <strong>{answeredCount} answered</strong>
            </div>
            <time className={secondsLeft <= 60 ? 'ending' : ''}>{formattedTime}</time>
          </header>
          <div className="quiz-progress"><i style={{ width: `${progress}%` }} /></div>
          <div className="question-meta">
            <span>{currentQuestion.category}</span>
            <span>{currentQuestion.difficulty}</span>
          </div>
          <h1>{currentQuestion.question}</h1>
          <div className="answer-options">
            {currentQuestion.options.map((option, index) => (
              <button
                className={answers[currentQuestion._id] === option ? 'selected' : ''}
                key={option}
                onClick={() => setAnswers((current) => ({ ...current, [currentQuestion._id]: option }))}
                type="button"
              >
                <span>{String.fromCharCode(65 + index)}</span>{option}
              </button>
            ))}
          </div>
          {error && <p className="aptitude-error">{error}</p>}
          {notice && <p className="aptitude-notice">{notice}</p>}
          <footer className="quiz-footer">
            <button disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => index - 1)} type="button">Previous</button>
            <div className="question-palette">
              {questions.map((question, index) => (
                <button
                  className={`${index === currentIndex ? 'active' : ''} ${answers[question._id] ? 'answered' : ''}`}
                  key={question._id}
                  onClick={() => setCurrentIndex(index)}
                  type="button"
                >{index + 1}</button>
              ))}
            </div>
            {currentIndex < questions.length - 1 ? (
              <button onClick={() => setCurrentIndex((index) => index + 1)} type="button">Next</button>
            ) : (
              <button disabled={isSubmitting} onClick={submitQuiz} type="button">{isSubmitting ? 'Submitting...' : 'Submit Test'}</button>
            )}
          </footer>
        </section>
      </main>
    );
  }

  return (
    <main className="aptitude-page">
      <section className="aptitude-hero">
        <div>
          <span className="aptitude-eyebrow">Phase 4</span>
          <h1>Aptitude Practice</h1>
          <p>Choose a topic and difficulty. Each question adds one minute to your test timer.</p>
        </div>
        <div className="aptitude-hero-stat"><strong>4</strong><span>Topic areas</span></div>
      </section>
      <section className="quiz-setup-card">
        <h2>Configure your test</h2>
        <div className="topic-grid">
          {topics.map((topic) => (
            <button className={category === topic.value ? 'active' : ''} key={topic.value} onClick={() => setCategory(topic.value)} type="button">
              {topic.label}
            </button>
          ))}
        </div>
        <label>
          Difficulty
          <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
        {error && <p className="aptitude-error">{error}</p>}
        {notice && <p className="aptitude-notice">{notice}</p>}
        <button className="start-quiz-button" disabled={isLoading} onClick={generateQuestions} type="button">
          {isLoading ? 'Generating Questions...' : 'Generate Questions'}
        </button>
      </section>
    </main>
  );
}

export default Aptitude;
