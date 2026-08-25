export default function SessionExpiredModal({
  open,
  onLoginAgain,
}) {
  if (!open) return null;

  return (
    <div className="session-modal-overlay">
      <div className="session-modal">
        <div className="session-modal-icon">
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 8V13"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />

    <path
      d="M12 16.5V16.51"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />

    <path
      d="M10.29 3.86L2.82 17C2.45 17.65 2.91 18.46 3.66 18.46H20.34C21.09 18.46 21.55 17.65 21.18 17L13.71 3.86C13.34 3.21 12.66 3.21 12.29 3.86Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
</div>

        <h2>Session Expired</h2>

        <p>
          Your session has expired. Please login again
          to continue using EVoTE.
        </p>

        <button
          type="button"
          className="session-modal-button"
          onClick={onLoginAgain}
        >
          Login Again
        </button>
      </div>
    </div>
  );
}