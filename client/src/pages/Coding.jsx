import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';
import { getAuthToken } from '../utils/auth';

const API_URL = `${API_BASE_URL}/api/coding`;
const languages = {
  javascript: {
    label: 'JavaScript',
    template: `function solve(input) {
  // Parse input and return your answer.
  return input;
}`,
  },
  python: {
    label: 'Python',
    template: `def solve(input_value):
    # Parse input and return your answer.
    return input_value`,
  },
  java: {
    label: 'Java',
    template: `class Solution {
    static String solve(String input) {
        // Parse input and return your answer.
        return input;
    }
}`,
  },
  cpp: {
    label: 'C++',
    template: `#include <string>
using namespace std;

string solve(string input) {
    // Parse input and return your answer.
    return input;
}`,
  },
};

const formatTimer = (seconds) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

function Coding() {
  const [problems, setProblems] = useState([]);
  const [stats, setStats] = useState({ total: 0, solved: 0, streak: 0, difficulties: { easy: 0, medium: 0, hard: 0 } });
  const [selectedId, setSelectedId] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(languages.javascript.template);
  const [testResults, setTestResults] = useState([]);
  const [message, setMessage] = useState('Run your code to see test results.');
  const [customInput, setCustomInput] = useState('');
  const [customOutput, setCustomOutput] = useState('');
  const [runtimeMs, setRuntimeMs] = useState(0);
  const [submission, setSubmission] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isAttemptActive, setIsAttemptActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);

  const authConfig = useMemo(() => ({
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  }), []);
  const filteredProblems = difficulty === 'all'
    ? problems
    : problems.filter((problem) => problem.difficulty === difficulty);
  const selectedProblem = filteredProblems.find((problem) => problem._id === selectedId);
  const passedCount = testResults.filter((result) => result.passed).length;

  const loadProblems = async () => {
    const { data } = await axios.get(`${API_URL}/problems`, authConfig);
    setProblems(data.problems);
    setStats(data.stats);
  };

  useEffect(() => {
    axios.get(`${API_URL}/problems`, authConfig)
      .then(({ data }) => {
        setProblems(data.problems);
        setStats(data.stats);
      })
      .catch((error) => setMessage(error.response?.data?.message || 'Unable to load coding problems.'))
      .finally(() => setIsLoading(false));
  }, [authConfig]);

  useEffect(() => {
    if (!isAttemptActive) return undefined;
    const timer = window.setInterval(() => setElapsedSeconds((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, [isAttemptActive, selectedId]);

  const selectProblem = (problem) => {
    setSelectedId(problem._id);
    setCode(languages[language].template);
    setTestResults([]);
    setMessage('Run your code to see test results.');
    setCustomInput('');
    setCustomOutput('');
    setRuntimeMs(0);
    setSubmission(null);
    setElapsedSeconds(0);
    setIsAttemptActive(true);
  };

  const executeTests = async () => {
    if (!selectedProblem || isRunning) return null;
    setIsRunning(true);
    setMessage('Running test cases...');
    try {
      const { data } = await axios.post(`${API_URL}/run`, {
        problemId: selectedProblem._id,
        language,
        code,
      }, authConfig);
      setTestResults(data.results);
      setRuntimeMs(data.runtimeMs);
      setSubmission(null);
      setMessage(`Passed ${data.passedTests}/${data.totalTests} test cases.`);
      return data;
    } catch (error) {
      setTestResults([]);
      setMessage(error.response?.data?.message || 'Unable to execute code.');
      return null;
    } finally {
      setIsRunning(false);
    }
  };

  const submitSolution = async () => {
    const execution = await executeTests();
    if (!execution) return;
    const passedTests = execution.passedTests;

    try {
      const { data } = await axios.post(`${API_URL}/results`, {
        problemId: selectedProblem._id,
        status: passedTests === execution.totalTests ? 'Accepted' : 'Failed',
        passedTests,
        totalTests: execution.totalTests,
        language,
        timeTaken: elapsedSeconds,
      }, authConfig);
      setMessage(data.solved
        ? 'All tests passed. Problem marked as solved.'
        : `${data.passedTests}/${data.totalTests} passed. Problem marked as attempted.`);
      setSubmission({
        accepted: data.solved,
        passedTests: data.passedTests,
        totalTests: data.totalTests,
        runtimeMs: execution.runtimeMs,
      });
      await loadProblems();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Result could not be saved.');
    }
  };

  const runCustomInput = async () => {
    if (!selectedProblem || isRunning) return;
    setIsRunning(true);
    setCustomOutput('Running...');
    try {
      const { data } = await axios.post(`${API_URL}/run`, {
        problemId: selectedProblem._id,
        language,
        code,
        customInput,
      }, authConfig);
      setCustomOutput(data.customResult.output || '(no output)');
      setRuntimeMs(Math.round(data.customResult.runtimeMs));
    } catch (error) {
      setCustomOutput(error.response?.data?.message || 'Unable to execute custom input.');
    } finally {
      setIsRunning(false);
    }
  };

  if (isLoading) return <main className="coding-page"><p className="coding-status">Loading coding problems...</p></main>;

  return (
    <main className="coding-page">
      <header className="coding-header">
        <div><span>Placement Coding Lab</span><h1>Practice Coding Problems</h1><p>Run test cases, submit solutions, and track progress.</p></div>
      </header>

      <section className="coding-stats-bar">
        <article><span>Problems Solved</span><strong>{stats.solved}/{stats.total}</strong></article>
        <article><span>Current Streak</span><strong>{stats.streak} days</strong></article>
        <article><span>Difficulty</span><strong>Easy: {stats.difficulties.easy} | Medium: {stats.difficulties.medium} | Hard: {stats.difficulties.hard}</strong></article>
        <article><span>Timer</span><strong>{formatTimer(elapsedSeconds)}</strong></article>
      </section>

      <section className="coding-workspace">
        <aside className="problem-list">
          <div className="problem-count"><strong>{filteredProblems.length}</strong><span>of {problems.length} questions</span></div>
          <label>Difficulty
            <select value={difficulty} onChange={(event) => { setDifficulty(event.target.value); setSelectedId(''); setElapsedSeconds(0); setIsAttemptActive(false); }}>
              <option value="all">All</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
            </select>
          </label>
          {filteredProblems.map((problem, index) => (
            <button className={problem._id === selectedProblem?._id ? 'active' : ''} key={problem._id} onClick={() => selectProblem(problem)} type="button">
              <strong>{index + 1}. {problem.title}</strong><span className={problem.difficulty}>{problem.difficulty}</span>
              <small>{problem.status === 'solved' ? 'Solved' : problem.status === 'attempted' ? 'Attempted' : 'Not Started'}</small>
              <i className={`problem-status ${problem.status}`} />
            </button>
          ))}
        </aside>

        {selectedProblem ? (
          <>
            <article className="problem-description">
              <div><span className={selectedProblem.difficulty}>{selectedProblem.difficulty}</span><h2>{selectedProblem.title}</h2></div>
              <p>{selectedProblem.description}</p>
              <h3>Constraints</h3><pre>{selectedProblem.constraints}</pre>
              <div className="sample-grid"><div><h3>Sample Input</h3><pre>{selectedProblem.sampleInput}</pre></div><div><h3>Sample Output</h3><pre>{selectedProblem.sampleOutput}</pre></div></div>
            </article>

            <section className="coding-editor-column">
              <article className="code-panel">
                <div className="language-tabs">
                  {Object.entries(languages).map(([value, item]) => <button className={language === value ? 'active' : ''} key={value} onClick={() => { setLanguage(value); setCode(item.template); setTestResults([]); setSubmission(null); setCustomOutput(''); setMessage(`${item.label} selected.`); }} type="button">{item.label}</button>)}
                  <button className="editor-reset" onClick={() => setCode(languages[language].template)} type="button">Reset</button>
                </div>
                <textarea aria-label={`${languages[language].label} solution editor`} onChange={(event) => setCode(event.target.value)} spellCheck="false" value={code} />
                <div className="custom-input-panel"><label htmlFor="custom-code-input">Custom Input</label><textarea id="custom-code-input" onChange={(event) => setCustomInput(event.target.value)} placeholder="Enter custom input..." value={customInput} /><button disabled={isRunning} onClick={runCustomInput} type="button">Run with Custom Input</button>{customOutput && <pre>{customOutput}</pre>}</div>
                <div className="code-actions"><button disabled={isRunning} onClick={executeTests} type="button">{isRunning ? 'Running...' : 'Run Code'}</button><button disabled={isRunning} onClick={submitSolution} type="button">Submit</button></div>
              </article>

              <article className="coding-output-box">
                <div><h2>Output / Result</h2><strong>{testResults.length ? `Passed ${passedCount}/${testResults.length} test cases` : 'Not run yet'}</strong></div>
                <p>{message}</p>
                {runtimeMs > 0 && <small>Runtime: {runtimeMs}ms</small>}
              </article>

              {submission && <article className={`submission-verdict ${submission.accepted ? 'accepted' : 'wrong'}`}><h2>{submission.accepted ? 'Accepted' : 'Wrong Answer'}</h2><strong>Passed {submission.passedTests}/{submission.totalTests} test cases</strong><span>Runtime: {submission.runtimeMs}ms</span></article>}

              {testResults.length > 0 && <article className="coding-results"><h2>Test Cases</h2>{testResults.map((result, index) => <div className={result.passed ? 'passed' : 'failed'} key={`${result.input}-${index}`}><strong>Test Case {index + 1} {result.passed ? 'Passed' : 'Failed'}</strong><span>Input: {result.input}</span><span>Expected: {result.expected}</span><span>Your Output: {result.actual}</span></div>)}</article>}
            </section>
          </>
        ) : <p className="coding-status">Select a coding question to start the timer and begin your attempt.</p>}
      </section>
    </main>
  );
}

export default Coding;
