import React from 'react';
import { Sprout } from 'lucide-react';

interface AssistantBrandProps {
  showName?: boolean;
  size?: 'sm' | 'md';
}

export const AssistantBrand: React.FC<AssistantBrandProps> = ({
  showName = true,
  size = 'sm',
}) => {
  const iconSize = size === 'md' ? 22 : 17;

  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className={`assistant-brand-mark inline-flex shrink-0 items-center justify-center rounded-full bg-forest-900 text-leaf-300 ring-2 ring-leaf-200/70 ${
          size === 'md' ? 'h-11 w-11' : 'h-8 w-8'
        }`}
      >
        <Sprout size={iconSize} />
      </span>
      {showName && (
        <span className={`font-bold text-forest-950 ${size === 'md' ? 'text-base' : 'text-xs'}`}>
          KisanSathi
        </span>
      )}
    </span>
  );
};
