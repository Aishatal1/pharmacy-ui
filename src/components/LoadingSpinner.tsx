// src/components/LoadingSpinner.tsx

import React from 'react';
import { ClipLoader } from 'react-spinners';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  loading?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 50,
  color = '#4CAF50',
  loading = true,
}) => {
  if (!loading) return null;

  return (
    <div className="spinner-container">
      <ClipLoader color={color} size={size} />
      <p className="spinner-text">Loading...</p>
    </div>
  );
};

export default LoadingSpinner;