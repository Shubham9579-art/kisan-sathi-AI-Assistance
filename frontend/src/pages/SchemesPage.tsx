import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { api } from '../services/api';
import { SchemeItem } from '../types';
import { SchemeCard } from '../components/schemes/SchemeCard';
import { EligibilityModal } from '../components/schemes/EligibilityModal';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { Search, Filter, Calculator, Award } from 'lucide-react';

export const SchemesPage: React.FC = () => {
  const { t } = useLanguage();
  const [schemes, setSchemes] = useState<SchemeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [activeEligibilityId, setActiveEligibilityId] = useState<string | null>(null);
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);

  const fetchSchemes = () => {
    setLoading(true);
    setLoadError(null);
    api.getSchemes(category !== 'All' ? category : undefined, search || undefined)
      .then((items) => {
        setSchemes(items);
      })
      .catch((err) => {
        console.error('Failed to load schemes:', err);
        setLoadError(t.schemes.loadError);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSchemes();
    }, 250);
    return () => clearTimeout(timer);
  }, [category, search]);

  const categories = [
    { key: 'All', label: t.schemes.allCategories },
    { key: 'Income', label: t.schemes.directIncome },
    { key: 'Insurance', label: t.schemes.insurance },
    { key: 'Irrigation', label: t.schemes.irrigationCategory },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header and top banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-forest-950 tracking-tight">{t.schemes.title}</h1>
          <p className="text-xs text-gray-500 mt-0.5">{t.schemes.subtitle}</p>
        </div>

        <button
          onClick={() => {
            setActiveEligibilityId(schemes[0]?.id || null);
            setShowEligibilityModal(true);
          }}
          className="px-4 py-2.5 bg-forest-900 hover:bg-forest-950 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors w-fit"
        >
          <Calculator size={15} />
          <span>{t.schemes.checkEligibility}</span>
        </button>
      </div>

      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3.5 rounded-2xl border border-cream-200 shadow-2xs">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.schemes.searchPlaceholder}
            className="w-full pl-9 pr-3.5 py-2 bg-cream-50 border border-cream-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-forest-800"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                category === c.key
                  ? 'bg-forest-900 text-white shadow-2xs'
                  : 'bg-cream-100 text-gray-700 hover:bg-cream-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Schemes Grid */}
      {loading ? (
        <LoadingSpinner message={t.ui.schemesLoading} />
      ) : loadError ? (
        <div role="alert" className="p-8 text-center bg-white rounded-2xl border border-amber-200 text-amber-900 text-xs">
          <p>{loadError}</p>
          <button
            type="button"
            onClick={fetchSchemes}
            className="mt-3 rounded-lg bg-forest-900 px-3 py-2 text-white font-semibold"
          >
            {t.common.retry}
          </button>
        </div>
      ) : schemes.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-cream-200 text-gray-500 text-xs">
          {t.ui.noSchemes}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {schemes.map((scheme) => (
            <SchemeCard
              key={scheme.id}
              scheme={scheme}
              onOpenEligibility={(id) => {
                setActiveEligibilityId(id);
                setShowEligibilityModal(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Eligibility Modal */}
      {showEligibilityModal && (
        <EligibilityModal
          schemeId={activeEligibilityId || undefined}
          schemes={schemes}
          onClose={() => setShowEligibilityModal(false)}
        />
      )}
    </div>
  );
};
