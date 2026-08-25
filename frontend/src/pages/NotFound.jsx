import { Link, useLocation } from "react-router-dom";
import "./NotFound.css";

function NotFound() {
  const location = useLocation();

  return (
    <main className="not-found-page">
      <div className="not-found-content">
        <div className="not-found-logo">EVoTE ⬢</div>

        <div className="not-found-code" aria-label="404">
          <span className="not-found-digit first-four">4</span>
          <span className="not-found-digit middle-zero">0</span>
          <span className="not-found-digit last-four">4</span>
        </div>

        <h1>Page Not Found</h1>

        <p className="not-found-message">
          Sorry, the page you are looking for does not exist or may have been
          moved.
        </p>

        <div className="not-found-path">
          Requested URL: <span>{location.pathname}</span>
        </div>

        <Link to="/" className="not-found-button">
          Return to Home
        </Link>
      </div>
    </main>
  );
}

export default NotFound;