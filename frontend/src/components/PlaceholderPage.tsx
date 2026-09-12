import React from 'react';
import { Link } from 'react-router-dom';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon?: string;
  stepName?: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  description,
  icon = '📦',
  stepName = 'Coming in Later Steps',
}) => {
  return (
    <div className="placeholder-container">
      <div className="placeholder-card">
        <div className="placeholder-icon" aria-hidden="true">{icon}</div>
        <div className="badge">{stepName}</div>
        <h2 className="placeholder-title">{title}</h2>
        <p className="placeholder-desc">{description}</p>
        <div className="placeholder-actions">
          <Link to="/" className="btn btn-primary">Return to Home</Link>
        </div>
      </div>
    </div>
  );
};
