import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message, size = 28 }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-forest-800">
      <Loader2 size={size} className="animate-spin mb-2" />
      {message && <p className="text-sm font-medium text-gray-600">{message}</p>}
    </div>
  );
};
