import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../utils/api';
import { clearAuthSession, getAuthToken } from '../utils/auth';

const API_URL = `${API_BASE_URL}/api/admin`;
const adminSections = [
  ['dashboard', 'Dashboard', 'D', '/admin/dashboard'],
  ['users', 'Users', 'U', '/admin/users'],
  ['questions', 'Questions', 'Q', '/admin/questions'],
  ['companies', 'Companies', 'CO', '/admin/companies'],
  ['results', 'Results', 'R', '/admin/results'],
];
const tabs = adminSections.map(([id]) => id);
const emptyQuestion = { question: '', options: ['', '', '', ''], correctAnswer: '', category: 'quantitative', difficulty: 'easy', explanation: '' };
const emptyCoding = { title: '', difficulty: 'easy', description: '', constraints: '', sampleInput: '', sampleOutput: '', tags: '' };
const emptyCompany = {
  name: '',
  role: '',
  package: '',
  description: '',
  website: '',
  eligibility: '',
  deadline: '',
  applicationLink: '',
  location: '',
  assessmentPattern: '',
};
const emptyMock = { title: '', company: '', durationMinutes: 15, questionCount: 10, difficulty: 'medium', subjects: 'Quantitative Aptitude, Logical Reasoning, Verbal Ability, Technical MCQs', active: true };
const questionCategories = ['quantitative', 'logical', 'verbal', 'technical'];
const difficulties = ['easy', 'medium', 'hard'];

const getRouteTab = (pathname) => {
  const routeTab = pathname.split('/')[2] || 'dashboard';
  return tabs.includes(routeTab) ? routeTab : 'dashboard';
};

const chartColors = ['#3157f2', '#21ad86', '#f39a20', '#754ce8'];

function AdminPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = getRouteTab(location.pathname);
  const [data, setData] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [editingResource, setEditingResource] = useState('');
  const [questionForm, setQuestionForm] = useState(emptyQuestion);
  const [codingForm, setCodingForm] = useState(emptyCoding);
  const [companyForm, setCompanyForm] = useState(emptyCompany);
  const [mockForm, setMockForm] = useState(emptyMock);
  const [questionFilters, setQuestionFilters] = useState({ category: 'all', difficulty: 'all', search: '' });
  const authConfig = useMemo(() => ({ headers: { Authorization: `Bearer ${getAuthToken()}` } }), []);

  const loadTab = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      if (activeTab === 'dashboard') {
        const { data: response } = await axios.get(`${API_URL}/overview`, authConfig);
        setData((current) => ({ ...current, dashboard: response }));
      } else if (activeTab === 'questions') {
        const [questionResponse, codingResponse, mockResponse, companyResponse] = await Promise.all([
          axios.get(`${API_URL}/questions`, authConfig),
          axios.get(`${API_URL}/coding`, authConfig),
          axios.get(`${API_URL}/mock-tests`, authConfig),
          axios.get(`${API_URL}/companies`, authConfig),
        ]);
        setData((current) => ({
          ...current,
          questions: questionResponse.data,
          coding: codingResponse.data,
          mockTests: mockResponse.data,
          companies: companyResponse.data,
        }));
      } else {
        const { data: response } = await axios.get(`${API_URL}/${activeTab}`, authConfig);
        setData((current) => ({ ...current, [activeTab]: response }));
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to load admin data.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, authConfig]);

  useEffect(() => {
    const loadTimer = window.setTimeout(loadTab, 0);
    return () => window.clearTimeout(loadTimer);
  }, [loadTab]);

  const saveItem = async (resource, payload, reset) => {
    setMessage('');
    const isEditingResource = editingId && editingResource === resource;
    try {
      if (isEditingResource) await axios.put(`${API_URL}/${resource}/${editingId}`, payload, authConfig);
      else await axios.post(`${API_URL}/${resource}`, payload, authConfig);
      setMessage(isEditingResource ? 'Changes saved.' : 'Item created.');
      setEditingId('');
      setEditingResource('');
      reset();
      await loadTab();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to save item.');
    }
  };

  const deleteItem = async (resource, id) => {
    if (!window.confirm('Delete this item permanently?')) return;
    try {
      await axios.delete(`${API_URL}/${resource}/${id}`, authConfig);
      setMessage('Item deleted.');
      await loadTab();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to delete item.');
    }
  };

  const submitQuestion = (event) => {
    event.preventDefault();
    saveItem('questions', questionForm, () => setQuestionForm(emptyQuestion));
  };

  const submitCoding = (event) => {
    event.preventDefault();
    saveItem('coding', {
      ...codingForm,
      tags: codingForm.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      testCases: [{ input: codingForm.sampleInput, output: codingForm.sampleOutput }],
    }, () => setCodingForm(emptyCoding));
  };

  const submitCompany = (event) => {
    event.preventDefault();
    saveItem('companies', {
      ...companyForm,
      deadline: companyForm.deadline || null,
    }, () => setCompanyForm(emptyCompany));
  };

  const submitMock = (event) => {
    event.preventDefault();
    saveItem('mock-tests', {
      ...mockForm,
      company: mockForm.company || null,
      durationMinutes: Number(mockForm.durationMinutes),
      questionCount: Number(mockForm.questionCount),
      subjects: mockForm.subjects.split(',').map((subject) => subject.trim()).filter(Boolean),
    }, () => setMockForm(emptyMock));
  };

  const editQuestion = (item) => {
    setEditingId(item._id);
    setEditingResource('questions');
    setQuestionForm({ ...emptyQuestion, ...item, question: item.question || item.questionText || '', options: [...item.options] });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const editCoding = (item) => {
    setEditingId(item._id);
    setEditingResource('coding');
    setCodingForm({ ...emptyCoding, ...item, tags: item.tags?.join(', ') || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const editCompany = (item) => {
    setEditingId(item._id);
    setEditingResource('companies');
    setCompanyForm({ ...emptyCompany, ...item, deadline: item.deadline ? item.deadline.slice(0, 10) : '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const editMock = (item) => {
    setEditingId(item._id);
    setEditingResource('mock-tests');
    setMockForm({ ...emptyMock, ...item, company: item.company?._id || '', subjects: item.subjects?.join(', ') || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const importQuestions = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const rows = text.split(/\r?\n/).map((row) => row.trim()).filter(Boolean);
    const [headerRow, ...dataRows] = rows;
    const headers = headerRow.split(',').map((header) => header.trim());
    const imported = dataRows.map((row) => {
      const values = row.split(',').map((value) => value.trim());
      const item = Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
      return {
        question: item.question,
        category: item.category || 'quantitative',
        difficulty: item.difficulty || 'easy',
        options: [item.option1, item.option2, item.option3, item.option4].filter(Boolean),
        correctAnswer: item.correctAnswer,
        explanation: item.explanation || '',
      };
    }).filter((item) => item.question && item.options.length >= 2 && item.correctAnswer);

    try {
      await Promise.all(imported.map((item) => axios.post(`${API_URL}/questions`, item, authConfig)));
      setMessage(`${imported.length} questions imported.`);
      await loadTab();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to import questions.');
    } finally {
      event.target.value = '';
    }
  };

  const downloadReport = () => {
    const report = data.analytics?.report;
    if (!report) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `placement-report-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to log out?')) return;
    clearAuthSession();
    navigate('/login', { replace: true });
  };

  const list = Array.isArray(data[activeTab]) ? data[activeTab] : [];
  const questionList = Array.isArray(data.questions) ? data.questions : [];
  const codingList = Array.isArray(data.coding) ? data.coding : [];
  const mockList = Array.isArray(data.mockTests) ? data.mockTests : [];
  const filteredQuestions = useMemo(() => {
    const query = questionFilters.search.trim().toLowerCase();
    return questionList.filter((item) => {
      const matchesCategory = questionFilters.category === 'all' || item.category === questionFilters.category;
      const matchesDifficulty = questionFilters.difficulty === 'all' || item.difficulty === questionFilters.difficulty;
      const text = `${item.question || item.questionText || ''} ${item.category || ''} ${item.difficulty || ''}`.toLowerCase();
      return matchesCategory && matchesDifficulty && (!query || text.includes(query));
    });
  }, [questionList, questionFilters]);
  const companies = data.companies || [];

  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <Link className="admin-brand" to="/admin/dashboard"><span>PP</span><strong>Placement Prep</strong><small>Admin Panel</small></Link>
        <nav aria-label="Admin navigation">
          {adminSections.map(([tab, label, icon, path]) => (
            <Link
              className={activeTab === tab ? 'active' : ''}
              key={tab}
              onClick={() => {
                setEditingId('');
                setEditingResource('');
              }}
              to={path}
            >
              <i>{icon}</i><span>{label}</span>
            </Link>
          ))}
          <Link className="admin-mobile-only admin-mobile-student" to="/dashboard">
            <i>ST</i><span>Student</span>
          </Link>
          <button className="admin-mobile-only admin-mobile-logout" onClick={handleLogout} type="button">
            <i>LO</i><span>Logout</span>
          </button>
        </nav>
        <Link className="admin-student-view" to="/dashboard">Student Dashboard</Link>
        <button className="admin-logout" onClick={handleLogout} type="button">Log out</button>
      </aside>

      <section className="admin-main">
        <header className="admin-header">
          <div><span>Administrator</span><h1>{adminSections.find(([id]) => id === activeTab)?.[1]}</h1><p>Manage assessment content, companies, students, results, and reports.</p></div>
          <div className="admin-profile"><strong>Admin</strong><small>Platform manager</small></div>
        </header>

        {message && <p className="admin-message">{message}</p>}
        {loading && <p className="admin-loading">Loading...</p>}

        {activeTab === 'dashboard' && data.dashboard && <OverviewPanel overview={data.dashboard} />}
        {activeTab === 'questions' && (
          <>
          <QuestionsPanel
            filters={questionFilters}
            importQuestions={importQuestions}
            items={filteredQuestions}
            onDelete={(id) => deleteItem('questions', id)}
            onEdit={editQuestion}
            onSubmit={submitQuestion}
            questionForm={questionForm}
            setFilters={setQuestionFilters}
            setQuestionForm={setQuestionForm}
            editingId={editingResource === 'questions' ? editingId : ''}
          />
          <div className="admin-section-heading"><h2>Coding Problems</h2><p>Create and maintain coding practice problems.</p></div>
          <CodingForm codingForm={codingForm} editingId={editingResource === 'coding' ? editingId : ''} setCodingForm={setCodingForm} submitCoding={submitCoding} />
          <AdminTable items={codingList} fields={['title', 'difficulty', 'description']} onDelete={(id) => deleteItem('coding', id)} onEdit={editCoding} />
          <div className="admin-section-heading"><h2>Mock Tests</h2><p>Create company-specific and general mock tests.</p></div>
          <MockForm companies={companies} editingId={editingResource === 'mock-tests' ? editingId : ''} mockForm={mockForm} setMockForm={setMockForm} submitMock={submitMock} />
          <AdminTable items={mockList} fields={['title', 'company', 'difficulty', 'questionCount', 'durationMinutes']} onDelete={(id) => deleteItem('mock-tests', id)} onEdit={editMock} />
          </>
        )}
        {activeTab === 'companies' && (
          <>
            <CompanyForm companyForm={companyForm} editingId={editingResource === 'companies' ? editingId : ''} setCompanyForm={setCompanyForm} submitCompany={submitCompany} />
            <AdminTable
              items={list}
              fields={['name', 'role', 'package', 'eligibility', 'deadline', 'applicationLink', 'location']}
              onDelete={(id) => deleteItem('companies', id)}
              onEdit={editCompany}
              extraActions={[{ label: 'View Applicants', onClick: (item) => setMessage(`Applicants tracking for ${item.name} is ready for the next backend module.`) }]}
            />
          </>
        )}
        {activeTab === 'users' && (
          <>
            <div className="admin-section-heading"><h2>Student Management</h2><p>Track student activity, scores, streaks, and account status.</p></div>
            <AdminTable fields={['name', 'email', 'testsTaken', 'averageScore', 'streak', 'status']} items={list} />
          </>
        )}
        {activeTab === 'results' && (
          <>
            <div className="admin-section-heading"><h2>Results</h2><p>Review aptitude, coding, and mock-test submissions from students.</p></div>
            <AdminTable fields={['user', 'testType', 'score', 'totalQuestions', 'timeTaken', 'createdAt']} items={list} />
          </>
        )}
      </section>
    </main>
  );
}

function OverviewPanel({ overview }) {
  const cards = [
    ['Total Students', overview.totalStudents],
    ['Total Questions', overview.totalQuestions],
    ['Total Mock Tests', overview.totalMockTests],
    ['Active Companies', overview.activeCompanies],
  ];

  return (
    <section className="admin-report">
      <div className="admin-overview">
        {cards.map(([label, value]) => <article key={label}><strong>{value}</strong><span>{label}</span></article>)}
      </div>
      <div className="admin-chart-grid">
        <ChartCard title="Weekly User Growth"><LineChartView data={overview.weeklyUserGrowth || []} dataKey="count" /></ChartCard>
        <ChartCard title="Test Attempts Per Day"><BarChartView data={overview.testAttemptsPerDay || []} dataKey="count" /></ChartCard>
        <ChartCard title="Aptitude vs Coding Performance"><BarChartView data={overview.performanceComparison || []} dataKey="score" xKey="module" /></ChartCard>
      </div>
      <section className="admin-table-wrap">
        <h2 className="admin-table-title">Recent Registrations</h2>
        <AdminTable bare fields={['name', 'email', 'createdAt']} items={overview.recentRegistrations || []} />
      </section>
    </section>
  );
}

function QuestionsPanel({ editingId, filters, importQuestions, items, onDelete, onEdit, onSubmit, questionForm, setFilters, setQuestionForm }) {
  return (
    <>
      <form className="admin-form" onSubmit={onSubmit}>
        <h2>{editingId ? 'Edit' : 'Add'} Aptitude Question</h2>
        <label>Question<textarea required value={questionForm.question} onChange={(event) => setQuestionForm({ ...questionForm, question: event.target.value })} /></label>
        <div className="admin-form-grid">
          {questionForm.options.map((option, index) => (
            <label key={index}>Option {index + 1}<input required value={option} onChange={(event) => {
              const options = [...questionForm.options];
              options[index] = event.target.value;
              setQuestionForm({ ...questionForm, options });
            }} /></label>
          ))}
        </div>
        <div className="admin-form-grid">
          <label>Correct Answer<select value={questionForm.correctAnswer} onChange={(event) => setQuestionForm({ ...questionForm, correctAnswer: event.target.value })} required><option value="">Select answer</option>{questionForm.options.filter(Boolean).map((option) => <option key={option}>{option}</option>)}</select></label>
          <label>Category<select value={questionForm.category} onChange={(event) => setQuestionForm({ ...questionForm, category: event.target.value })}>{questionCategories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label>Difficulty<select value={questionForm.difficulty} onChange={(event) => setQuestionForm({ ...questionForm, difficulty: event.target.value })}>{difficulties.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        </div>
        <label>Explanation<textarea value={questionForm.explanation} onChange={(event) => setQuestionForm({ ...questionForm, explanation: event.target.value })} /></label>
        <button type="submit">{editingId ? 'Save Question' : 'Add Question'}</button>
      </form>

      <section className="admin-filters">
        <label>Category<select value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}><option value="all">All Categories</option>{questionCategories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label>Difficulty<select value={filters.difficulty} onChange={(event) => setFilters((current) => ({ ...current, difficulty: event.target.value }))}><option value="all">All Difficulties</option>{difficulties.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label>Search Question<input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Search question text..." /></label>
        <label className="admin-import-button">Bulk Upload CSV<input accept=".csv" onChange={importQuestions} type="file" /></label>
      </section>

      <AdminTable items={items} fields={['question', 'category', 'difficulty']} onDelete={onDelete} onEdit={onEdit} />
    </>
  );
}

function CodingForm({ codingForm, editingId, setCodingForm, submitCoding }) {
  return (
    <form className="admin-form" onSubmit={submitCoding}>
      <h2>{editingId ? 'Edit' : 'Add'} Coding Problem</h2>
      <div className="admin-form-grid">
        <label>Title<input required value={codingForm.title} onChange={(event) => setCodingForm({ ...codingForm, title: event.target.value })} /></label>
        <label>Difficulty<select value={codingForm.difficulty} onChange={(event) => setCodingForm({ ...codingForm, difficulty: event.target.value })}>{difficulties.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label>Tags<input value={codingForm.tags} onChange={(event) => setCodingForm({ ...codingForm, tags: event.target.value })} placeholder="arrays, strings" /></label>
      </div>
      <label>Description<textarea required value={codingForm.description} onChange={(event) => setCodingForm({ ...codingForm, description: event.target.value })} /></label>
      <label>Constraints<textarea value={codingForm.constraints} onChange={(event) => setCodingForm({ ...codingForm, constraints: event.target.value })} /></label>
      <div className="admin-form-grid">
        <label>Sample Input<textarea required value={codingForm.sampleInput} onChange={(event) => setCodingForm({ ...codingForm, sampleInput: event.target.value })} /></label>
        <label>Sample Output<textarea required value={codingForm.sampleOutput} onChange={(event) => setCodingForm({ ...codingForm, sampleOutput: event.target.value })} /></label>
      </div>
      <button type="submit">{editingId ? 'Save Problem' : 'Add Problem'}</button>
    </form>
  );
}

function CompanyForm({ companyForm, editingId, setCompanyForm, submitCompany }) {
  return (
    <form className="admin-form" onSubmit={submitCompany}>
      <h2>{editingId ? 'Edit' : 'Add'} Company</h2>
      <div className="admin-form-grid">
        <label>Company Name<input required value={companyForm.name} onChange={(event) => setCompanyForm({ ...companyForm, name: event.target.value })} /></label>
        <label>Role<input value={companyForm.role} onChange={(event) => setCompanyForm({ ...companyForm, role: event.target.value })} /></label>
        <label>Package<input value={companyForm.package} onChange={(event) => setCompanyForm({ ...companyForm, package: event.target.value })} /></label>
        <label>Deadline<input type="date" value={companyForm.deadline} onChange={(event) => setCompanyForm({ ...companyForm, deadline: event.target.value })} /></label>
        <label>Application Link<input value={companyForm.applicationLink} onChange={(event) => setCompanyForm({ ...companyForm, applicationLink: event.target.value })} /></label>
        <label>Location<input value={companyForm.location} onChange={(event) => setCompanyForm({ ...companyForm, location: event.target.value })} /></label>
      </div>
      <label>Description<textarea value={companyForm.description} onChange={(event) => setCompanyForm({ ...companyForm, description: event.target.value })} /></label>
      <label>Eligibility<textarea value={companyForm.eligibility} onChange={(event) => setCompanyForm({ ...companyForm, eligibility: event.target.value })} /></label>
      <label>Assessment Pattern<textarea value={companyForm.assessmentPattern} onChange={(event) => setCompanyForm({ ...companyForm, assessmentPattern: event.target.value })} /></label>
      <button type="submit">{editingId ? 'Save Company' : 'Add Company'}</button>
    </form>
  );
}

function MockForm({ companies, editingId, mockForm, setMockForm, submitMock }) {
  return (
    <form className="admin-form" onSubmit={submitMock}>
      <h2>{editingId ? 'Edit' : 'Create'} Mock Test</h2>
      <div className="admin-form-grid">
        <label>Title<input required value={mockForm.title} onChange={(event) => setMockForm({ ...mockForm, title: event.target.value })} /></label>
        <label>Company<select value={mockForm.company} onChange={(event) => setMockForm({ ...mockForm, company: event.target.value })}><option value="">General Placement</option>{companies.map((company) => <option key={company._id} value={company._id}>{company.name}</option>)}</select></label>
        <label>Difficulty<select value={mockForm.difficulty} onChange={(event) => setMockForm({ ...mockForm, difficulty: event.target.value })}>{difficulties.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label>Questions<input min="1" type="number" value={mockForm.questionCount} onChange={(event) => setMockForm({ ...mockForm, questionCount: event.target.value })} /></label>
        <label>Duration (minutes)<input min="1" type="number" value={mockForm.durationMinutes} onChange={(event) => setMockForm({ ...mockForm, durationMinutes: event.target.value })} /></label>
      </div>
      <label>Subjects<input value={mockForm.subjects} onChange={(event) => setMockForm({ ...mockForm, subjects: event.target.value })} /></label>
      <button type="submit">{editingId ? 'Save Mock Test' : 'Create Mock Test'}</button>
    </form>
  );
}

function AnalyticsPanel({ analytics, downloadReport }) {
  const report = analytics.report;
  const summaryCards = [
    ['Average Aptitude Score', `${report.summary?.averageAptitudeScore || 0}%`],
    ['Coding Completion Rate', `${report.summary?.codingCompletionRate || 0}%`],
    ['Mock Test Performance', `${report.summary?.mockTestPerformance || 0}%`],
  ];

  return (
    <section className="admin-report">
      <div>
        <h2>Performance Analytics</h2>
        <p>Generated {new Date(report.generatedAt).toLocaleString()}</p>
        <button onClick={downloadReport} type="button">Download JSON Report</button>
      </div>
      <div className="admin-overview">
        {summaryCards.map(([label, value]) => <article key={label}><strong>{value}</strong><span>{label}</span></article>)}
      </div>
      <div className="admin-chart-grid">
        <ChartCard title="Most Attempted Topics"><BarChartView data={report.mostAttemptedTopics || []} dataKey="attempts" xKey="topic" /></ChartCard>
        <ChartCard title="Daily Test Attempts"><LineChartView data={report.dailyAttempts || []} dataKey="count" /></ChartCard>
        <ChartCard title="Mock Test Performance"><PieChartView data={report.byType || []} /></ChartCard>
      </div>
      <div className="admin-section-heading"><h2>Recent Test Results</h2><p>Latest aptitude, coding, and mock-test attempts.</p></div>
      <AdminTable fields={['user', 'testType', 'score', 'totalQuestions', 'timeTaken', 'createdAt']} items={analytics.results} />
    </section>
  );
}

function SettingsPanel({ setMessage }) {
  return (
    <section className="admin-settings">
      <h2>Platform Settings</h2>
      <div className="admin-settings-grid">
        <label>Platform Name<input defaultValue="Placement Preparation Portal" /></label>
        <label>Default Mock Duration<input defaultValue="15" min="1" type="number" /></label>
        <label>Default Question Count<input defaultValue="10" min="1" type="number" /></label>
        <label className="admin-setting-toggle"><input defaultChecked type="checkbox" /> Allow AI question generation</label>
      </div>
      <button onClick={() => setMessage('Settings saved for this session.')} type="button">Save Settings</button>
    </section>
  );
}

function ChartCard({ children, title }) {
  return <article className="admin-chart-card"><h2>{title}</h2>{children}</article>;
}

function BarChartView({ data, dataKey, xKey = 'date' }) {
  return (
    <ResponsiveContainer height={240} width="100%">
      <BarChart data={data}>
        <CartesianGrid stroke="#e7ecf5" vertical={false} />
        <XAxis dataKey={xKey} />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey={dataKey} fill="#3157f2" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function LineChartView({ data, dataKey }) {
  return (
    <ResponsiveContainer height={240} width="100%">
      <LineChart data={data}>
        <CartesianGrid stroke="#e7ecf5" vertical={false} />
        <XAxis dataKey="date" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Line dataKey={dataKey} dot stroke="#21ad86" strokeWidth={3} type="monotone" />
      </LineChart>
    </ResponsiveContainer>
  );
}

function PieChartView({ data }) {
  const pieData = data.map((item, index) => ({ name: item._id, value: Math.round(item.averageScore || 0), fill: chartColors[index % chartColors.length] }));
  return (
    <ResponsiveContainer height={240} width="100%">
      <PieChart>
        <Tooltip />
        <Pie data={pieData} dataKey="value" innerRadius={58} nameKey="name" outerRadius={92} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function AdminTable({ bare = false, extraActions = [], fields, items, onDelete, onEdit }) {
  const display = (item, field) => {
    const value = item[field];
    if (field === 'question') return value || item.questionText;
    if (field === 'company') return value?.name || 'General Placement';
    if (field === 'user') return value ? `${value.name} (${value.email})` : 'Deleted user';
    if (field === 'deadline') return value ? new Date(value).toLocaleDateString() : 'Not set';
    if (field === 'createdAt') return value ? new Date(value).toLocaleDateString() : '';
    if (field === 'averageScore') return `${value || 0}%`;
    if (field === 'applicationLink') return value ? <a href={value} rel="noreferrer" target="_blank">Apply</a> : '';
    return typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
  };

  const content = (
    <>
      <table>
        <thead><tr>{fields.map((field) => <th key={field}>{field}</th>)}{(onEdit || onDelete || extraActions.length > 0) && <th>Actions</th>}</tr></thead>
        <tbody>{items.map((item) => (
          <tr key={item._id}>
            {fields.map((field) => <td key={field}>{display(item, field)}</td>)}
            {(onEdit || onDelete || extraActions.length > 0) && (
              <td className="admin-actions">
                {onEdit && <button onClick={() => onEdit(item)} type="button">Edit</button>}
                {onDelete && <button className="danger" onClick={() => onDelete(item._id)} type="button">Delete</button>}
                {extraActions.map((action) => <button key={action.label} onClick={() => action.onClick(item)} type="button">{action.label}</button>)}
              </td>
            )}
          </tr>
        ))}</tbody>
      </table>
      {!items.length && <p>No records found.</p>}
    </>
  );

  return bare ? content : <section className="admin-table-wrap">{content}</section>;
}

export default AdminPanel;
