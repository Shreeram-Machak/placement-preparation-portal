import { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';

const STORAGE_KEY = 'placementPrepResumeDraft';
const MAX_PDF_BYTES = 1024 * 1024;
const emptyEducation = { institution: '', city: '', degree: '', period: '', score: '', coursework: '' };
const emptyProject = { name: '', period: '', technologies: '', description: '', link: '' };
const emptyExperience = { company: '', role: '', location: '', period: '', description: '' };
const emptyActivity = { role: '', organization: '', year: '', achievement: '' };
const emptyResume = {
  personal: { name: '', email: '', phone: '', location: '', summary: '', linkedin: '', github: '' },
  education: [emptyEducation],
  skills: { languages: '', tools: '', protocols: '' },
  projects: [emptyProject],
  experience: [emptyExperience],
  activities: [emptyActivity],
};
const sampleResume = {
  personal: {
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    phone: '+91 98765 43210',
    location: 'Pune, Maharashtra',
    summary: 'Computer Science graduate focused on full-stack development, data structures, and scalable web applications. Seeking an entry-level software engineering role where I can build reliable user-facing products.',
    linkedin: 'linkedin.com/in/aarav-sharma',
    github: 'github.com/aarav-sharma',
  },
  education: [{
    institution: 'ABC Institute of Technology',
    city: 'Pune, Maharashtra',
    degree: 'B.Tech in Computer Science',
    period: '2022 - 2026',
    score: '8.4 CGPA',
    coursework: 'Data Structures, DBMS, Operating Systems, Computer Networks, Web Development',
  }],
  skills: {
    languages: 'JavaScript, Java, Python, SQL',
    tools: 'React, Node.js, Express, MongoDB, Git, Postman',
    protocols: 'REST APIs, OOP, DBMS, OS fundamentals, DSA',
  },
  projects: [{
    name: 'Placement Preparation Portal',
    period: 'May 2026',
    technologies: 'React, Node.js, Express, MongoDB',
    description: 'Built a role-based practice portal with aptitude tests, coding submissions, mock tests, and progress analytics.\nImplemented JWT authentication and MongoDB result tracking for student dashboards.',
    link: 'github.com/aarav-sharma/placement-portal',
  }],
  experience: [{
    company: 'TechSpark Solutions',
    role: 'Web Development Intern',
    location: 'Remote',
    period: 'Jan 2026 - Apr 2026',
    description: 'Developed reusable React components and integrated REST APIs for internal dashboards.\nImproved page loading behavior by adding loading states and error handling.',
  }],
  activities: [{
    role: 'Coordinator',
    organization: 'Coding Club',
    year: '2025',
    achievement: 'Organized weekly DSA practice sessions for 80+ students.',
  }],
};

const normalizeResume = (saved = {}) => ({
  personal: { ...emptyResume.personal, ...saved.personal },
  education: (saved.education?.length ? saved.education : [emptyEducation]).map((item) => ({ ...emptyEducation, ...item })),
  skills: typeof saved.skills === 'string'
    ? { ...emptyResume.skills, languages: saved.skills }
    : { ...emptyResume.skills, ...saved.skills },
  projects: (saved.projects?.length ? saved.projects : [emptyProject]).map((item) => ({ ...emptyProject, ...item })),
  experience: (saved.experience?.length ? saved.experience : [emptyExperience]).map((item) => ({ ...emptyExperience, ...item })),
  activities: (saved.activities?.length ? saved.activities : [emptyActivity]).map((item) => ({ ...emptyActivity, ...item })),
});

const getInitialResume = () => {
  try { return normalizeResume(JSON.parse(localStorage.getItem(STORAGE_KEY)) || emptyResume); }
  catch { return emptyResume; }
};

const splitItems = (value) => String(value || '').split(/,|\n/).map((item) => item.trim()).filter(Boolean);
const lines = (value) => String(value || '').split('\n').map((item) => item.trim()).filter(Boolean);

const calculateAtsScore = (resume) => {
  const checks = [
    { label: 'Name, email, phone, and location are complete', points: resume.personal.name && resume.personal.email && resume.personal.phone && resume.personal.location ? 15 : 0 },
    { label: 'Profile summary is specific and role-focused', points: resume.personal.summary.length >= 90 ? 10 : 0 },
    { label: 'Education has degree, institution, period, and score', points: resume.education.some((item) => item.degree && item.institution && item.period && item.score) ? 15 : 0 },
    { label: 'Skills include at least six searchable keywords', points: splitItems(`${resume.skills.languages},${resume.skills.tools},${resume.skills.protocols}`).length >= 6 ? 15 : 0 },
    { label: 'Projects include technologies and achievement bullets', points: resume.projects.some((item) => item.name && item.technologies && lines(item.description).length >= 2) ? 15 : 0 },
    { label: 'Experience or leadership includes achievement details', points: resume.experience.some((item) => item.role && lines(item.description).length) || resume.activities.some((item) => item.achievement) ? 10 : 0 },
    { label: 'Resume contains placement-friendly technical keywords', points: /react|node|java|python|sql|mongodb|dsa|dbms|api|git|javascript/i.test(JSON.stringify(resume)) ? 10 : 0 },
    { label: 'Links are included for LinkedIn, GitHub, or portfolio', points: resume.personal.linkedin || resume.personal.github || resume.projects.some((item) => item.link) ? 10 : 0 },
  ];

  return {
    checks,
    score: checks.reduce((sum, item) => sum + item.points, 0),
  };
};

const addWrappedText = (pdf, text, x, y, width, options = {}) => {
  const lineHeight = options.lineHeight || 12;
  const linesToWrite = pdf.splitTextToSize(String(text || ''), width);
  linesToWrite.forEach((line) => {
    if (y > 780) {
      pdf.addPage();
      y = 48;
    }
    pdf.text(line, x, y);
    y += lineHeight;
  });
  return y;
};

const sectionTitle = (pdf, title, y) => {
  if (y > 750) {
    pdf.addPage();
    y = 48;
  }
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text(title.toUpperCase(), 44, y);
  pdf.line(44, y + 4, 552, y + 4);
  return y + 18;
};

function ResumeBuilder() {
  const [resume, setResume] = useState(getInitialResume);
  const [isDownloading, setIsDownloading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const ats = useMemo(() => calculateAtsScore(resume), [resume]);

  useEffect(() => {
    const saveTimer = window.setTimeout(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(resume)), 250);
    return () => window.clearTimeout(saveTimer);
  }, [resume]);

  const updatePersonal = (field, value) => setResume((current) => ({ ...current, personal: { ...current.personal, [field]: value } }));
  const updateSkills = (field, value) => setResume((current) => ({ ...current, skills: { ...current.skills, [field]: value } }));
  const updateList = (section, index, field, value) => setResume((current) => ({ ...current, [section]: current[section].map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) }));
  const addItem = (section, item) => setResume((current) => ({ ...current, [section]: [...current[section], { ...item }] }));
  const removeItem = (section, index) => setResume((current) => ({ ...current, [section]: current[section].filter((_, itemIndex) => itemIndex !== index) }));

  const downloadPdf = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setStatusMessage('');
    try {
      const fileName = `${resume.personal.name.trim().replace(/\s+/g, '-') || 'student'}-resume.pdf`;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true });
      const width = 508;
      let y = 48;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.text(resume.personal.name || 'Student Resume', 297, y, { align: 'center' });
      y += 18;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text([resume.personal.location, resume.personal.phone, resume.personal.email].filter(Boolean).join(' | '), 297, y, { align: 'center' });
      y += 13;
      pdf.text([resume.personal.linkedin, resume.personal.github].filter(Boolean).join(' | '), 297, y, { align: 'center' });
      y += 24;

      y = sectionTitle(pdf, 'Objective / Profile', y);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      y = addWrappedText(pdf, resume.personal.summary || 'Role-focused summary with technical skills, education, and career target.', 44, y, width);

      y = sectionTitle(pdf, 'Education', y + 8);
      resume.education.forEach((item) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${item.degree || 'Degree'} | ${item.institution || 'Institution'}`, 44, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text([item.city, item.period].filter(Boolean).join(' | '), 552, y, { align: 'right' });
        y += 12;
        y = addWrappedText(pdf, `GPA / Score: ${item.score || 'N/A'} | Relevant Coursework: ${item.coursework || 'N/A'}`, 44, y, width);
      });

      y = sectionTitle(pdf, 'Technical Skills', y + 8);
      y = addWrappedText(pdf, `Programming Languages: ${resume.skills.languages || 'N/A'}`, 44, y, width);
      y = addWrappedText(pdf, `Software & Tools: ${resume.skills.tools || 'N/A'}`, 44, y, width);
      y = addWrappedText(pdf, `Core Concepts: ${resume.skills.protocols || 'N/A'}`, 44, y, width);

      y = sectionTitle(pdf, 'Academic & Independent Projects', y + 8);
      resume.projects.forEach((item) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(item.name || 'Project', 44, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(item.period || '', 552, y, { align: 'right' });
        y += 12;
        y = addWrappedText(pdf, `Technologies: ${item.technologies || 'N/A'}`, 44, y, width);
        lines(item.description).forEach((line) => { y = addWrappedText(pdf, `- ${line}`, 52, y, width - 8); });
        if (item.link) y = addWrappedText(pdf, `Link: ${item.link}`, 44, y, width);
        y += 4;
      });

      y = sectionTitle(pdf, 'Internships & Experience', y + 8);
      resume.experience.forEach((item) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${item.role || 'Role'} | ${item.company || 'Company'}`, 44, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text([item.location, item.period].filter(Boolean).join(' | '), 552, y, { align: 'right' });
        y += 12;
        lines(item.description).forEach((line) => { y = addWrappedText(pdf, `- ${line}`, 52, y, width - 8); });
      });

      y = sectionTitle(pdf, 'Extracurricular & Leadership', y + 8);
      resume.activities.forEach((item) => {
        y = addWrappedText(pdf, `- ${item.role || 'Role'} at ${item.organization || 'Organization'}, ${item.year || 'Year'}${item.achievement ? `: ${item.achievement}` : ''}`, 52, y, width - 8);
      });

      const blob = pdf.output('blob');
      if (blob.size > MAX_PDF_BYTES) {
        setStatusMessage('PDF created, but it is above 1 MB. Shorten long sections and try again.');
        return;
      }

      pdf.save(fileName);
      setStatusMessage(`ATS-friendly PDF downloaded. Current ATS score: ${ats.score}/100.`);
    } catch {
      setStatusMessage('Unable to create PDF. Please try again.');
    } finally { setIsDownloading(false); }
  };

  const loadSampleResume = () => {
    setResume(normalizeResume(sampleResume));
    setStatusMessage('Sample resume loaded. You can edit every field.');
  };

  const resetResume = () => {
    if (!window.confirm('Clear the current resume draft?')) return;
    setResume(normalizeResume(emptyResume));
    localStorage.removeItem(STORAGE_KEY);
    setStatusMessage('Resume draft cleared.');
  };

  return (
    <main className="resume-builder-page">
      <header className="resume-builder-header"><div><span>ATS Optimized Template</span><h1>Resume Builder</h1><p>Fill the form, keep the ATS score above 80, and download a searchable PDF under 1 MB.</p></div><div className="resume-header-actions"><button onClick={loadSampleResume} type="button">Load Sample</button><button className="secondary" onClick={resetResume} type="button">Clear Draft</button><button disabled={isDownloading} onClick={downloadPdf} type="button">{isDownloading ? 'Creating PDF...' : 'Download PDF'}</button></div></header>
      {statusMessage && <p className={`resume-status ${statusMessage.includes('Unable') ? 'error' : ''}`}>{statusMessage}</p>}
      <div className="resume-builder-layout">
        <section className="resume-editor">
          <section className={`ats-score-card ${ats.score >= 80 ? 'good' : ''}`}>
            <div><span>ATS Score</span><strong>{ats.score}/100</strong><small>{ats.score >= 80 ? 'Ready for ATS screening' : 'Complete the missing items to cross 80'}</small></div>
            <ul>{ats.checks.map((check) => <li className={check.points ? 'done' : ''} key={check.label}>{check.label}</li>)}</ul>
          </section>
          <ResumeSection title="Personal Details"><div className="resume-fields two-column"><Field label="Full Name" value={resume.personal.name} onChange={(value) => updatePersonal('name', value)} /><Field label="City, State" value={resume.personal.location} onChange={(value) => updatePersonal('location', value)} /><Field label="Phone" value={resume.personal.phone} onChange={(value) => updatePersonal('phone', value)} /><Field label="Professional Email" type="email" value={resume.personal.email} onChange={(value) => updatePersonal('email', value)} /><Field label="LinkedIn Profile URL" value={resume.personal.linkedin} onChange={(value) => updatePersonal('linkedin', value)} /><Field label="Portfolio / GitHub URL" value={resume.personal.github} onChange={(value) => updatePersonal('github', value)} /><Field label="Objective / Profile" textarea value={resume.personal.summary} onChange={(value) => updatePersonal('summary', value)} /></div></ResumeSection>

          <ResumeSection action={() => addItem('education', emptyEducation)} title="Education">{resume.education.map((item, index) => <RepeatableCard index={index} key={index} onRemove={() => removeItem('education', index)} showRemove={resume.education.length > 1}><div className="resume-fields two-column"><Field label="Degree Earned or In Progress" value={item.degree} onChange={(value) => updateList('education', index, 'degree', value)} /><Field label="Expected Graduation" value={item.period} onChange={(value) => updateList('education', index, 'period', value)} /><Field label="University / Institution" value={item.institution} onChange={(value) => updateList('education', index, 'institution', value)} /><Field label="City, State" value={item.city} onChange={(value) => updateList('education', index, 'city', value)} /><Field label="GPA / Score" value={item.score} onChange={(value) => updateList('education', index, 'score', value)} /><Field label="Relevant Coursework" value={item.coursework} onChange={(value) => updateList('education', index, 'coursework', value)} /></div></RepeatableCard>)}</ResumeSection>

          <ResumeSection title="Technical Skills"><div className="resume-fields"><Field label="Programming Languages" value={resume.skills.languages} onChange={(value) => updateSkills('languages', value)} /><Field label="Software & Tools" value={resume.skills.tools} onChange={(value) => updateSkills('tools', value)} /><Field label="Protocols & Standards / Core Concepts" value={resume.skills.protocols} onChange={(value) => updateSkills('protocols', value)} /></div></ResumeSection>

          <ResumeSection action={() => addItem('projects', emptyProject)} title="Academic & Independent Projects">{resume.projects.map((item, index) => <RepeatableCard index={index} key={index} onRemove={() => removeItem('projects', index)} showRemove={resume.projects.length > 1}><div className="resume-fields two-column"><Field label="Project Title" value={item.name} onChange={(value) => updateList('projects', index, 'name', value)} /><Field label="Month, Year" value={item.period} onChange={(value) => updateList('projects', index, 'period', value)} /><Field label="Technologies / Tools" value={item.technologies} onChange={(value) => updateList('projects', index, 'technologies', value)} /><Field label="Project Link" value={item.link} onChange={(value) => updateList('projects', index, 'link', value)} /><Field label="Achievement bullets (one per line)" textarea value={item.description} onChange={(value) => updateList('projects', index, 'description', value)} /></div></RepeatableCard>)}</ResumeSection>

          <ResumeSection action={() => addItem('experience', emptyExperience)} title="Internships & Experience">{resume.experience.map((item, index) => <RepeatableCard index={index} key={index} onRemove={() => removeItem('experience', index)} showRemove={resume.experience.length > 1}><div className="resume-fields two-column"><Field label="Intern / Role Title" value={item.role} onChange={(value) => updateList('experience', index, 'role', value)} /><Field label="Company Name" value={item.company} onChange={(value) => updateList('experience', index, 'company', value)} /><Field label="City, State" value={item.location} onChange={(value) => updateList('experience', index, 'location', value)} /><Field label="Month, Year - Month, Year" value={item.period} onChange={(value) => updateList('experience', index, 'period', value)} /><Field label="Achievement bullets (one per line)" textarea value={item.description} onChange={(value) => updateList('experience', index, 'description', value)} /></div></RepeatableCard>)}</ResumeSection>

          <ResumeSection action={() => addItem('activities', emptyActivity)} title="Extracurricular & Leadership">{resume.activities.map((item, index) => <RepeatableCard index={index} key={index} onRemove={() => removeItem('activities', index)} showRemove={resume.activities.length > 1}><div className="resume-fields two-column"><Field label="Leadership Role" value={item.role} onChange={(value) => updateList('activities', index, 'role', value)} /><Field label="Organization / Club" value={item.organization} onChange={(value) => updateList('activities', index, 'organization', value)} /><Field label="Year" value={item.year} onChange={(value) => updateList('activities', index, 'year', value)} /><Field label="Achievement / Competition Placement" value={item.achievement} onChange={(value) => updateList('activities', index, 'achievement', value)} /></div></RepeatableCard>)}</ResumeSection>
        </section>

        <aside className="resume-preview-wrap"><span>Live Preview</span><ResumePreview resume={resume} /></aside>
      </div>
    </main>
  );
}

function ResumeSection({ action, children, title }) { return <article className="resume-form-section"><header><h2>{title}</h2>{action && <button onClick={action} type="button">Add Another</button>}</header>{children}</article>; }
function RepeatableCard({ children, index, onRemove, showRemove }) { return <section className="resume-repeatable"><header><strong>Entry {index + 1}</strong>{showRemove && <button onClick={onRemove} type="button">Remove</button>}</header>{children}</section>; }
function Field({ label, onChange, textarea = false, type = 'text', value }) { return <label>{label}{textarea ? <textarea onChange={(event) => onChange(event.target.value)} rows="3" value={value} /> : <input onChange={(event) => onChange(event.target.value)} type={type} value={value} />}</label>; }

const ResumePreview = ({ resume }) => (
  <article className="resume-preview fresher-template">
    <header><h1>{resume.personal.name || '[FIRST NAME] [LAST NAME]'}</h1><p>{[resume.personal.location || '[City, State]', resume.personal.phone || '[Phone Number]', resume.personal.email || '[Professional Email]'].join(' | ')}</p><p>{[resume.personal.linkedin || '[LinkedIn Profile URL]', resume.personal.github || '[Portfolio/GitHub URL]'].join(' | ')}</p></header>
    <PreviewSection title="Objective / Profile"><p>{resume.personal.summary || '[A concise 2-sentence statement outlining your current academic standing or career focus, the specific skills you bring, and the type of role you are targeting.]'}</p></PreviewSection>
    <PreviewSection title="Education">{resume.education.map((item, index) => <div className="fresher-entry" key={index}><div><strong>{item.degree || '[Degree Earned or In Progress]'}</strong><span>{item.period || '[Expected Graduation Month, Year]'}</span></div><p>{item.institution || '[University/Institution Name]'}{item.city ? `, ${item.city}` : ', [City, State]'} | <b>GPA: {item.score || '[Current GPA]'}</b></p><Bullet text={`Relevant Coursework: ${item.coursework || '[Course 1], [Course 2], [Course 3]'}`} /></div>)}</PreviewSection>
    <PreviewSection title="Technical Skills"><Bullet bold="Programming Languages:" text={resume.skills.languages || '[Language 1], [Language 2]'} /><Bullet bold="Software & Tools:" text={resume.skills.tools || '[Tool 1], [Tool 2]'} /><Bullet bold="Protocols & Standards:" text={resume.skills.protocols || '[Standard 1], [Standard 2]'} /></PreviewSection>
    <PreviewSection title="Academic & Independent Projects">{resume.projects.map((item, index) => <div className="fresher-entry" key={index}><div><strong>{item.name || '[Project Title]'}</strong><span>{item.period || '[Month, Year]'}</span></div>{lines(item.description).length ? lines(item.description).map((line) => <Bullet key={line} text={line} />) : <><Bullet text="[Action Word] + [Task/Project] + [Measurable Result]." /><Bullet text="[Add technical details: What tools did you use? What problem did you solve?]" /></>}{item.technologies && <p><b>Tools:</b> {item.technologies}</p>}{item.link && <small>{item.link}</small>}</div>)}</PreviewSection>
    <PreviewSection title="Internships & Experience">{resume.experience.map((item, index) => <div className="fresher-entry" key={index}><div><strong>{item.role || '[Intern/Role Title]'} | {item.company || '[Company Name]'}</strong><span>{item.location || '[City, State]'} | {item.period || '[Month, Year] - [Month, Year]'}</span></div>{lines(item.description).length ? lines(item.description).map((line) => <Bullet key={line} text={line} />) : <Bullet text="[Action Word] + [Task/Project] + [Measurable Result]." />}</div>)}</PreviewSection>
    <PreviewSection title="Extracurricular & Leadership">{resume.activities.map((item, index) => <div key={index}><Bullet text={`${item.role || '[Leadership Role]'} at ${item.organization || '[Organization/Club]'}, ${item.year || '[Year]'}`} />{item.achievement && <Bullet text={item.achievement} />}</div>)}</PreviewSection>
  </article>
);

function Bullet({ bold, text }) { return <p className="resume-bullet">{bold && <b>{bold} </b>}{text}</p>; }
function PreviewSection({ children, title }) { return <section><h3>{title}</h3>{children}</section>; }

export default ResumeBuilder;
