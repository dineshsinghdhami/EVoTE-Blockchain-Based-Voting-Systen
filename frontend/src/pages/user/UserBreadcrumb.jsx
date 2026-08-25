import { Link } from "react-router-dom";

function UserBreadcrumb({ items = [] }) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="user-breadcrumb">
      {items.map((item, index) => (
        <div className="user-breadcrumb-part" key={`${item.label}-${index}`}>
          {item.to ? (
            <Link to={item.to}>{item.label}</Link>
          ) : (
            <span className="current">{item.label}</span>
          )}

          {index < items.length - 1 && (
            <span className="user-breadcrumb-separator">›</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default UserBreadcrumb;