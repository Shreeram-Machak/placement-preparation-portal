import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const resources = [
  { category: 'Aptitude', title: 'Quantitative Formula Sheet', description: 'Percentages, ratios, averages, profit and loss, time and work, and probability revision checklist.', type: 'Guide', path: '/dashboard/aptitude', action: 'Practice Aptitude' },
  { category: 'Aptitude', title: 'Logical Reasoning Roadmap', description: 'A structured sequence for series, syllogisms, arrangements, coding-decoding, and data interpretation.', type: 'Roadmap', path: '/dashboard/aptitude', action: 'Start Practice' },
  { category: 'Coding', title: 'DSA Interview Checklist', description: 'Arrays, strings, hashing, stacks, queues, linked lists, trees, graphs, sorting, and dynamic programming.', type: 'Checklist', path: '/dashboard/coding', action: 'Solve Problems' },
  { category: 'Coding', title: 'JavaScript MDN Reference', description: 'Official JavaScript language reference for syntax, standard objects, functions, and asynchronous programming.', type: 'Documentation', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript' },
  { category: 'Coding', title: 'Python Documentation', description: 'Official Python tutorials and language reference for interview coding preparation.', type: 'Documentation', url: 'https://docs.python.org/3/' },
  { category: 'Interview', title: 'HR Answer Framework', description: 'Use STAR for behavioral answers and present-focused structure for introductions, strengths, and career goals.', type: 'Guide', path: '/dashboard/interview', action: 'Practice Interview' },
  { category: 'Interview', title: 'Computer Science Fundamentals', description: 'Revise DBMS, operating systems, computer networks, OOPs, and DSA interview questions.', type: 'Question Bank', path: '/dashboard/interview', action: 'Open Questions' },
  { category: 'Resume', title: 'Fresher Resume Template', description: 'Create an ATS-friendly technical resume with education, skills, projects, internships, and leadership.', type: 'Template', path: '/dashboard/resume', action: 'Build Resume' },
  { category: 'Companies', title: 'Company Assessment Directory', description: 'Review placement patterns, official career pages, and assessment information for major recruiters.', type: 'Directory', path: '/dashboard/companies', action: 'Explore Companies' },
  { category: 'Mock Tests', title: 'Placement Test Strategy', description: 'Plan section order, time allocation, question selection, and final review for timed placement tests.', type: 'Strategy', path: '/dashboard/mock-test', action: 'Take Mock Test' },
  { category: 'Career', title: 'GitHub Student Developer Pack', description: 'Developer tools and learning resources available to eligible students.', type: 'External', url: 'https://education.github.com/pack' },
  { category: 'Career', title: 'NPTEL Courses', description: 'University-level technical courses for computer science and engineering fundamentals.', type: 'External', url: 'https://nptel.ac.in/' },
];

const categories = ['All', ...new Set(resources.map((resource) => resource.category))];

function Resources() {
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('placementPrepResourceBookmarks')) || []; }
    catch { return []; }
  });

  const filteredResources = useMemo(() => {
    const query = search.trim().toLowerCase();
    return resources.filter((resource) => (category === 'All' || resource.category === category)
      && (!query || [resource.title, resource.description, resource.category, resource.type].some((value) => value.toLowerCase().includes(query))));
  }, [category, search]);

  const toggleBookmark = (title) => {
    const next = bookmarks.includes(title) ? bookmarks.filter((item) => item !== title) : [...bookmarks, title];
    setBookmarks(next);
    localStorage.setItem('placementPrepResourceBookmarks', JSON.stringify(next));
  };

  return (
    <main className="resources-page">
      <header className="resources-header"><div><span>Placement Library</span><h1>Learning Resources</h1><p>Guides, documentation, templates, and practice paths for every stage of placement preparation.</p></div><label><span>Search resources</span><input onChange={(event) => setSearch(event.target.value)} placeholder="Search guides, topics, or tools..." value={search} /></label></header>

      <section className="resource-featured"><div><span>Recommended Path</span><h2>Placement Preparation Essentials</h2><p>Practice aptitude, strengthen coding fundamentals, refine your resume, and rehearse interview answers.</p></div><nav><Link to="/dashboard/aptitude">Aptitude</Link><Link to="/dashboard/coding">Coding</Link><Link to="/dashboard/resume">Resume</Link><Link to="/dashboard/interview">Interview</Link></nav></section>

      <nav className="resource-filters" aria-label="Resource categories">{categories.map((item) => <button className={category === item ? 'active' : ''} key={item} onClick={() => setCategory(item)} type="button">{item}</button>)}</nav>

      <section className="resource-grid">
        {filteredResources.map((resource) => (
          <article key={resource.title}>
            <header><span>{resource.category}</span><button aria-label={`Bookmark ${resource.title}`} className={bookmarks.includes(resource.title) ? 'saved' : ''} onClick={() => toggleBookmark(resource.title)} type="button">{bookmarks.includes(resource.title) ? 'Saved' : 'Save'}</button></header>
            <i>{resource.type}</i><h2>{resource.title}</h2><p>{resource.description}</p>
            {resource.path ? <Link to={resource.path}>{resource.action}</Link> : <a href={resource.url} rel="noreferrer" target="_blank">Open Resource</a>}
          </article>
        ))}
      </section>

      {!filteredResources.length && <p className="resources-empty">No resources match your search.</p>}
    </main>
  );
}

export default Resources;
