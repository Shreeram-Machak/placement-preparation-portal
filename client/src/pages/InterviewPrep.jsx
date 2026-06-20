import { useMemo, useState } from 'react';
import axios from 'axios';
import { getAuthToken } from '../utils/auth';

const API_URL = 'http://localhost:5000/api/interview';
const questionBank = {
  HR: [
    ['Tell me about yourself.', 'Connect your education, relevant skills, projects, and career goal in about 60-90 seconds.'],
    ['Why should we hire you?', 'Match your strongest skills and evidence to the role instead of giving a generic answer.'],
    ['What are your strengths and weaknesses?', 'Support strengths with examples and explain how you are actively improving a genuine weakness.'],
    ['Where do you see yourself in five years?', 'Show ambition, learning intent, and alignment with the organization without sounding rigid.'],
    ['Describe a challenge you overcame.', 'Use the STAR structure: Situation, Task, Action, and Result.'],
  ],
  DBMS: [
    ['What is normalization in DBMS?', 'Explain 1NF, 2NF, and 3NF and how normalization reduces redundancy.'],
    ['What is the difference between a primary key and a foreign key?', 'Discuss uniqueness, identity, and relationships between tables.'],
    ['Explain ACID properties.', 'Define atomicity, consistency, isolation, and durability with a transaction example.'],
    ['What is an index?', 'Explain faster reads, storage cost, and slower writes.'],
  ],
  OS: [
    ['What is the difference between a process and a thread?', 'Compare memory, isolation, context switching, and communication.'],
    ['What is deadlock?', 'Describe the four necessary conditions and prevention strategies.'],
    ['Explain virtual memory.', 'Discuss pages, frames, page faults, and using disk as an extension of memory.'],
    ['What is CPU scheduling?', 'Mention algorithms such as FCFS, SJF, priority, and round robin.'],
  ],
  CN: [
    ['Explain the OSI model.', 'Describe the seven layers and the responsibility of each layer.'],
    ['What is the difference between TCP and UDP?', 'Compare connection, reliability, ordering, overhead, and use cases.'],
    ['What happens when you enter a URL in a browser?', 'Cover DNS, connection setup, HTTP request, server response, and rendering.'],
    ['What is a subnet mask?', 'Explain network and host portions of an IP address.'],
  ],
  OOPs: [
    ['What are the four pillars of OOP?', 'Explain encapsulation, abstraction, inheritance, and polymorphism.'],
    ['What is method overloading versus overriding?', 'Compare compile-time and runtime polymorphism.'],
    ['What is an interface?', 'Explain contracts, abstraction, and multiple implementations.'],
    ['What is a constructor?', 'Describe object initialization and constructor overloading.'],
  ],
  DSA: [
    ['What is the time complexity of binary search?', 'State O(log n), the sorted-data requirement, and why the search space halves.'],
    ['When would you use a stack?', 'Mention LIFO use cases such as parsing, undo, recursion, and DFS.'],
    ['Compare arrays and linked lists.', 'Discuss memory layout, access, insertion, deletion, and cache behavior.'],
    ['What is dynamic programming?', 'Explain overlapping subproblems, optimal substructure, memoization, and tabulation.'],
  ],
};

const sampleAnswerGuides = {
  HR: 'Start with your background, connect two relevant skills to proof from projects or internships, then close with the role you are targeting.',
  DBMS: 'Define the concept, explain why it matters, give a small schema or transaction example, and mention one trade-off.',
  OS: 'State the definition first, compare related concepts when useful, then anchor the answer with a process, memory, or scheduling example.',
  CN: 'Walk through the layers or protocol steps in order, then add reliability, latency, or security considerations where relevant.',
  OOPs: 'Name the principle, describe how it appears in code, and give a short class or interface example.',
  DSA: 'Mention the data structure or algorithm, explain time and space complexity, and give the scenario where you would choose it.',
};

function InterviewPrep() {
  const [studyTopic, setStudyTopic] = useState('HR');
  const [aiTopic, setAiTopic] = useState('HR');
  const [question, setQuestion] = useState('Tell me about yourself.');
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const authConfig = useMemo(() => ({ headers: { Authorization: `Bearer ${getAuthToken()}` } }), []);

  const getQuestion = async () => {
    setLoading(true); setMessage(''); setFeedback(null); setAnswer('');
    try {
      const { data } = await axios.post(`${API_URL}/question`, { topic: aiTopic, previousQuestions: history.map((item) => item.question) }, authConfig);
      setQuestion(data.question);
    } catch (error) { setMessage(error.response?.data?.message || 'Unable to generate a question.'); }
    finally { setLoading(false); }
  };

  const submitAnswer = async () => {
    setLoading(true); setMessage('');
    try {
      const { data } = await axios.post(`${API_URL}/feedback`, { topic: aiTopic, question, answer }, authConfig);
      setFeedback(data);
      setHistory((current) => [{ topic: aiTopic, question, answer, feedback: data }, ...current].slice(0, 10));
    } catch (error) { setMessage(error.response?.data?.message || 'Unable to evaluate your answer.'); }
    finally { setLoading(false); }
  };

  return (
    <main className="interview-page">
      <header className="interview-header"><span>Placement Interview Lab</span><h1>Interview Preparation</h1><p>Study common HR and technical questions, then practice with an AI interviewer.</p></header>

      <section className="interview-study-card">
        <div className="interview-section-title"><div><span>Question Bank</span><h2>HR and Technical Questions</h2></div><div className="interview-topic-tabs">{Object.keys(questionBank).map((topic) => <button className={studyTopic === topic ? 'active' : ''} key={topic} onClick={() => setStudyTopic(topic)} type="button">{topic}</button>)}</div></div>
        <div className="interview-question-grid">{questionBank[studyTopic].map(([item, tip], index) => <article key={item}><span>{String(index + 1).padStart(2, '0')}</span><h3>{item}</h3><p>{tip}</p></article>)}</div>
      </section>

      <section className="ai-interviewer-card">
        <header><div><span>Gemini Powered</span><h2>AI Interviewer</h2><p>Type your answer and receive structured placement feedback.</p></div><label>Interview Topic<select value={aiTopic} onChange={(event) => { setAiTopic(event.target.value); setFeedback(null); }}><option>HR</option><option>DBMS</option><option>OS</option><option>CN</option><option>OOPs</option><option>DSA</option></select></label></header>
        <div className="ai-interview-layout">
          <article className="ai-question-panel"><span>Interviewer asks</span><h3>{question}</h3><textarea onChange={(event) => setAnswer(event.target.value)} placeholder="Type your interview answer here..." rows="9" value={answer} /><div><button disabled={loading} onClick={getQuestion} type="button">New Question</button><button disabled={loading || !answer.trim()} onClick={submitAnswer} type="button">{loading ? 'Evaluating...' : 'Get AI Feedback'}</button></div>{message && <p className="interview-message">{message}</p>}</article>
          <aside className="ai-feedback-panel">{feedback ? <><h3>AI Feedback</h3><div className="interview-scores"><Score label="Communication" value={feedback.communication} /><Score label="Technical Knowledge" value={feedback.technicalKnowledge} /><Score label="Confidence" value={feedback.confidence} /></div><p>{feedback.feedback}</p><div className="feedback-columns"><section><h4>Strengths</h4>{feedback.strengths.map((item) => <p key={item}>{item}</p>)}</section><section><h4>Improve</h4>{feedback.improvements.map((item) => <p key={item}>{item}</p>)}</section></div></> : <div className="feedback-placeholder"><strong>AI feedback appears here</strong><p>Answer the current question to see communication, knowledge, and confidence scores.</p></div>}</aside>
        </div>
        <section className="sample-answer-card">
          <span>Sample Answer Framework</span>
          <h3>{aiTopic} answer structure</h3>
          <p>{sampleAnswerGuides[aiTopic]}</p>
        </section>
      </section>

      {history.length > 0 && <section className="interview-history"><h2>Recent Practice</h2>{history.map((item, index) => <article key={`${item.question}-${index}`}><span>{item.topic}</span><div><strong>{item.question}</strong><p>{item.feedback.feedback}</p></div><small>{Math.round((item.feedback.communication + item.feedback.technicalKnowledge + item.feedback.confidence) / 3)}/10</small></article>)}</section>}
    </main>
  );
}

function Score({ label, value }) { return <article><div><span>{label}</span><strong>{value}/10</strong></div><i><b style={{ width: `${value * 10}%` }} /></i></article>; }

export default InterviewPrep;
