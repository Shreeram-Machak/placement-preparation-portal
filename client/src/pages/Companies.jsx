import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { getAuthToken } from '../utils/auth';

const API_URL = 'http://localhost:5000/api/companies';
const getWebsiteUrl = (website) => (/^https?:\/\//i.test(website || '') ? website : '');
const fallbackCompanies = [
  {
    _id: 'sample-tcs',
    name: 'TCS',
    role: 'Graduate Trainee',
    package: '3.5 - 7 LPA',
    description: 'Entry-level hiring through aptitude, reasoning, coding fundamentals, and interview rounds.',
    eligibility: '60% or above in 10th, 12th, and graduation with no active backlogs.',
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Pan India',
    assessmentPattern: 'Aptitude, verbal ability, coding MCQs, and technical interview.',
    applicationLink: 'https://www.tcs.com/careers',
    website: 'https://www.tcs.com',
  },
  {
    _id: 'sample-infosys',
    name: 'Infosys',
    role: 'Systems Engineer',
    package: '3.6 - 9.5 LPA',
    description: 'Campus hiring focused on logical reasoning, quantitative aptitude, communication, and coding basics.',
    eligibility: 'No active backlogs. Consistent academic record preferred.',
    deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Hybrid / India offices',
    assessmentPattern: 'Online test, pseudocode/coding, technical interview, and HR discussion.',
    applicationLink: 'https://www.infosys.com/careers',
    website: 'https://www.infosys.com',
  },
];

const getDeadlineStatus = (deadline) => {
  if (!deadline) return 'Deadline not announced';
  const date = new Date(deadline);
  const daysLeft = Math.ceil((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (daysLeft < 0) return 'Deadline passed';
  if (daysLeft === 0) return 'Closes today';
  return `${daysLeft} days left`;
};

function Companies() {
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [toast, setToast] = useState('');
  const [applyingId, setApplyingId] = useState('');
  const [loading, setLoading] = useState(true);

  const authConfig = useMemo(() => ({
    headers: { Authorization: `Bearer ${getAuthToken()}` },
  }), []);

  useEffect(() => {
    let active = true;
    axios.get(API_URL, authConfig)
      .then(({ data }) => { if (active) setCompanies(data.companies || []); })
      .catch((error) => { if (active) setMessage(error.response?.data?.message || 'Unable to load companies.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authConfig]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredCompanies = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return companies;
    return companies.filter((company) => [
      company.name,
      company.role,
      company.package,
      company.description,
      company.eligibility,
      company.assessmentPattern,
      company.location,
    ]
      .some((value) => String(value || '').toLowerCase().includes(query)));
  }, [companies, search]);

  const applyToCompany = async (companyId) => {
    setApplyingId(companyId);
    try {
      const { data } = await axios.post(`${API_URL}/${companyId}/apply`, {}, authConfig);
      setCompanies((current) => current.map((company) => (
        company._id === companyId
          ? { ...company, application: data.application }
          : company
      )));
      setToast(data.message || 'Application submitted.');
    } catch (error) {
      setToast(error.response?.data?.message || 'Unable to apply right now.');
    } finally {
      setApplyingId('');
    }
  };

  return (
    <main className="companies-page">
      <header className="companies-header">
        <div><span>Placement Directory</span><h1>Explore Companies</h1><p>Review company profiles and understand their placement assessment patterns.</p></div>
        <label><span>Search companies</span><input onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or assessment..." value={search} /></label>
      </header>

      {toast && <div className="toast-message">{toast}</div>}
      {loading && <div className="loading-spinner"><i />Loading companies...</div>}
      {message && <p className="companies-message error">{message}</p>}

      <section className="companies-grid">
        {(filteredCompanies.length ? filteredCompanies : !loading && !message && !companies.length ? fallbackCompanies : []).map((company) => (
          <article key={company._id}>
            <div className="company-directory-logo">{company.name.slice(0, 2).toUpperCase()}</div>
            <div className="company-directory-title"><h2>{company.name}</h2><span>{getDeadlineStatus(company.deadline)}</span>{getWebsiteUrl(company.website) && <a href={getWebsiteUrl(company.website)} rel="noreferrer" target="_blank">Official website</a>}</div>
            <p>{company.description || 'Company information will be added soon.'}</p>
            <dl className="company-directory-meta">
              <div><dt>Role</dt><dd>{company.role || 'Not announced'}</dd></div>
              <div><dt>Package</dt><dd>{company.package || 'Not disclosed'}</dd></div>
              <div><dt>Deadline</dt><dd>{company.deadline ? new Date(company.deadline).toLocaleDateString() : 'Not set'}</dd></div>
              <div><dt>Location</dt><dd>{company.location || 'Not specified'}</dd></div>
            </dl>
            <section><h3>Eligibility</h3><p>{company.eligibility || 'Eligibility details will be added soon.'}</p></section>
            <section className={`company-eligibility-check ${company.eligibilityStatus?.eligible ? 'eligible' : 'not-eligible'}`}>
              <h3>Eligibility Check</h3>
              <strong>{company.eligibilityStatus?.eligible ? 'Eligible to apply' : 'Improve readiness first'}</strong>
              <p>{company.eligibilityStatus?.reason || 'Complete practice tests to calculate readiness.'}</p>
              <span>Readiness: {company.eligibilityStatus?.readiness ?? 0}%</span>
            </section>
            <section><h3>Assessment Pattern</h3><p>{company.assessmentPattern || 'Assessment details will be added soon.'}</p></section>
            <section className="company-application-status">
              <h3>Application Status</h3>
              <strong>{company.application?.status || 'Not Applied'}</strong>
              {company.application?.appliedAt && <span>Applied on {new Date(company.application.appliedAt).toLocaleDateString()}</span>}
            </section>
            <section className="company-prep-resources">
              <h3>Preparation Resources</h3>
              <div>
                <a href="/dashboard/aptitude">Aptitude practice</a>
                <a href="/dashboard/coding">Coding problems</a>
                <a href="/dashboard/mock-test">Company mock test</a>
                <a href="/dashboard/interview">Interview prep</a>
              </div>
            </section>
            {company.application ? (
              <button className="company-apply-link disabled" disabled type="button">Application {company.application.status}</button>
            ) : company.eligibilityStatus?.eligible ? (
              <button className="company-apply-link" disabled={applyingId === company._id} onClick={() => applyToCompany(company._id)} type="button">
                {applyingId === company._id ? 'Applying...' : 'Apply'}
              </button>
            ) : (
              <button className="company-apply-link disabled" disabled type="button">Check eligibility first</button>
            )}
          </article>
        ))}
      </section>

      {!loading && !message && !filteredCompanies.length && <p className="companies-empty">No companies match your search.</p>}
    </main>
  );
}

export default Companies;
