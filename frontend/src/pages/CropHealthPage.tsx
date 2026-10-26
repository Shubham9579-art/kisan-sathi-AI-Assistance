import React from 'react';
import { CropHealthChecker } from '../components/crops/CropHealthChecker';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';

export const CropHealthPage: React.FC = () => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {!loading && !user && (
        <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between">
          <span>{t.ui.privateDataDescription}</span>
          <Link to="/account" className="shrink-0 font-bold underline">{t.ui.signUp}</Link>
        </div>
      )}
      <CropHealthChecker key={user?.id ?? 'guest'} />
    </div>
  );
};
