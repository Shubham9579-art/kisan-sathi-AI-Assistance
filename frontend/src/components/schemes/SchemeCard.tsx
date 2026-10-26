import React, { useState } from 'react';
import { SchemeItem } from '../../types';
import { useLanguage } from '../../hooks/useLanguage';
import {
  Award,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle2,
  FileText,
  Calculator,
  ShieldCheck
} from 'lucide-react';
import { Badge } from '../shared/Badge';

export const SchemeCard: React.FC<{
  scheme: SchemeItem;
  onOpenEligibility: (schemeId: string) => void;
}> = ({ scheme, onOpenEligibility }) => {
  const { t, language } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  const displayName = language === 'mr' && scheme.name_mr ? scheme.name_mr :
                      language === 'hi' && scheme.name_hi ? scheme.name_hi : scheme.name;

  const displayDesc = language === 'mr' && scheme.description_mr
    ? scheme.description_mr
    : language === 'hi' && scheme.description_hi
      ? scheme.description_hi
      : scheme.description;
  const displayBenefits = language === 'mr' && scheme.benefits_mr
    ? scheme.benefits_mr
    : language === 'hi' && scheme.benefits_hi
      ? scheme.benefits_hi
      : scheme.benefits;
  const normalizedCategory = scheme.category.toLowerCase();
  const displayCategory = normalizedCategory.includes('income')
    ? t.schemes.directIncome
    : normalizedCategory.includes('insurance')
      ? t.schemes.insurance
      : normalizedCategory.includes('irrigation') ||
        normalizedCategory.includes('water') ||
        normalizedCategory.includes('infrastructure')
        ? t.schemes.irrigationCategory
        : scheme.category;

  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-5 shadow-xs hover:border-forest-300 transition-all flex flex-col justify-between">
      <div>
        {/* Header and status */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-forest-50 text-forest-800">
              <Award size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 bg-forest-50 px-2 py-0.5 rounded-full border border-forest-100">
                {displayCategory}
              </span>
              <h3 className="font-bold text-base text-gray-900 mt-1">{displayName}</h3>
            </div>
          </div>
          <Badge variant={scheme.status === 'Verified' ? 'green' : 'amber'}>
            {scheme.status === 'Verified' ? t.schemes.verifiedBadge : t.ui.pendingVerification}
          </Badge>
        </div>

        {/* Short Description */}
        <p className="text-xs text-gray-600 leading-relaxed mt-2 mb-3">
          {displayDesc}
        </p>

        {scheme.status !== 'Verified' && (
          <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
            <p>{t.schemes.dataNeedsCheck}</p>
            <p className="mt-1 font-semibold">
              {t.ui.lastVerified}: {scheme.last_verified}
            </p>
          </div>
        )}

        {/* Benefits highlight banner */}
        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-950 mb-3">
          <span className="font-bold text-[11px] uppercase tracking-wider block text-emerald-800 mb-0.5">
            {t.schemes.benefits}
          </span>
          <p className="leading-relaxed font-medium">{displayBenefits}</p>
        </div>

        {/* Collapsible Details */}
        {expanded && (
          <div className="space-y-3 pt-3 border-t border-cream-100 text-xs text-gray-700">
            <div>
              <span className="font-bold text-gray-900 block mb-1">{t.schemes.targetBeneficiaries}</span>
              <p className="text-gray-600 leading-relaxed">{scheme.target_beneficiaries}</p>
            </div>

            <div>
              <span className="font-bold text-gray-900 block mb-1">{t.ui.eligibilityCriteria}</span>
              <ul className="list-disc pl-4 space-y-1 text-gray-600">
                {scheme.eligibility_criteria.map((crit, idx) => (
                  <li key={idx} className="leading-relaxed">{crit}</li>
                ))}
              </ul>
            </div>

            <div>
              <span className="font-bold text-gray-900 block mb-1">{t.schemes.requiredDocs}</span>
              <ul className="list-disc pl-4 space-y-1 text-gray-600">
                {scheme.required_documents.map((doc, idx) => (
                  <li key={idx} className="leading-relaxed">{doc}</li>
                ))}
              </ul>
            </div>

            <div>
              <span className="font-bold text-gray-900 block mb-1">{t.schemes.applicationSteps}</span>
              <ol className="list-decimal pl-4 space-y-1 text-gray-600">
                {scheme.application_steps.map((st, idx) => (
                  <li key={idx} className="leading-relaxed">{st}</li>
                ))}
              </ol>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-gray-400">
              <span>{t.ui.lastVerified}: {scheme.last_verified}</span>
              <a
                href={scheme.official_portal_url}
                target="_blank"
                rel="noreferrer"
                className="text-forest-800 font-semibold hover:underline flex items-center gap-1"
              >
                {t.schemes.portalLink} <ExternalLink size={12} />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-cream-100 flex items-center justify-between gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-semibold text-gray-600 hover:text-forest-900 flex items-center gap-1 py-1"
        >
          {expanded ? (
            <>
              <span>{t.ui.showLess}</span>
              <ChevronUp size={14} />
            </>
          ) : (
            <>
              <span>{t.ui.showMore}</span>
              <ChevronDown size={14} />
            </>
          )}
        </button>

        <a
          href={scheme.official_portal_url}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-semibold text-forest-800 hover:underline inline-flex items-center gap-1"
        >
          {t.schemes.portalLink} <ExternalLink size={11} />
        </a>

        <button
          onClick={() => onOpenEligibility(scheme.id)}
          className="px-3 py-1.5 rounded-lg bg-forest-900 hover:bg-forest-950 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
        >
          <Calculator size={13} />
          <span>{t.schemes.checkEligibility}</span>
        </button>
      </div>
    </div>
  );
};
