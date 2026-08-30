import { useEffect } from "react";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiLoader,
  FiX,
} from "react-icons/fi";

function GlobalToast({
  message,
  onClose,
}) {
  const text = String(
    message || ""
  ).trim();

  const lowerText =
    text.toLowerCase();
  
  const isCentered =
  lowerText.includes("age restriction");

  const isLoading =
    lowerText.includes("creating") ||
    lowerText.includes("synchronizing") ||
    lowerText.includes("submitting") ||
    lowerText.includes("approving") ||
    lowerText.includes("rejecting") ||
    lowerText.includes("connecting") ||
    lowerText.includes("processing");

  const isError =
    lowerText.includes("failed") ||
    lowerText.includes("error") ||
    lowerText.includes("not found") ||
    lowerText.includes("invalid") ||
    lowerText.includes("already exists") ||
    lowerText.includes("please");

  const isSuccess =
    lowerText.includes("success") ||
    lowerText.includes("created") ||
    lowerText.includes("approved") ||
    lowerText.includes("submitted") ||
    lowerText.includes("connected") ||
    lowerText.includes("voted");

  useEffect(() => {
    if (!text) {
      return;
    }

    // Loading/blockchain progress messages
    // stay visible until the message changes.
    if (isLoading) {
      return;
    }

    // Normal success/error messages disappear
    // automatically.
    const timer =
      setTimeout(() => {
        onClose?.();
      }, 4500);

    return () =>
      clearTimeout(timer);
  }, [
    text,
    isLoading,
    onClose,
  ]);

  if (!text) {
    return null;
  }

  return (
    <div
      className={`
  global-toast

  ${
    isCentered
      ? "global-toast-centered"
      : ""
  }

  ${
    isError
      ? "global-toast-error"
      : isSuccess
        ? "global-toast-success"
        : ""
  }
`}
    >
      <div className="global-toast-icon">
        {isLoading ? (
          <FiLoader className="global-toast-spinner" />
        ) : isError ? (
          <FiAlertCircle />
        ) : (
          <FiCheckCircle />
        )}
      </div>

      <div className="global-toast-content">
        <strong>
          {isLoading
            ? "Blockchain Transaction"
            : isError
              ? "Transaction Failed"
              : "EVoTE Notification"}
        </strong>

        <span>
          {text}
        </span>
      </div>

      <button
        type="button"
        className="global-toast-close"
        onClick={onClose}
        aria-label="Close notification"
      >
        <FiX />
      </button>
    </div>
  );
}

export default GlobalToast;