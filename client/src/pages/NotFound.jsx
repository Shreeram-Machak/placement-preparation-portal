import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <main className="not-found-page">
      <section>
        <span>404</span>
        <h1>Page not found</h1>
        <p>The page you are looking for does not exist or has been moved.</p>
        <Link to="/dashboard">Back to dashboard</Link>
      </section>
    </main>
  );
}

export default NotFound;
