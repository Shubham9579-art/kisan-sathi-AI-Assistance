import React from 'react';
import { CropAssessmentResult } from '../../types';
import { useLanguage } from '../../hooks/useLanguage';
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Info,
  ExternalLink
} from 'lucide-react';
import { Badge } from '../shared/Badge';
import { SafetyNotice } from '../shared/SafetyNotice';
import { localizeCropName, localizeGrowthStage } from '../../utils/localizeAgriculture';

export const AssessmentResultCard: React.FC<{ result: CropAssessmentResult }> = ({ result }) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Header and Honest Disclosure Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-cream-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg text-gray-900">{t.cropHealth.resultTitle}</h3>
          </div>
          <p className="text-xs text-gray-500">
            {t.ui.cropResultCrop}: <strong className="text-gray-800">{localizeCropName(result.crop_type, t.ui)}</strong> •
            {t.ui.cropResultStage}: <span className="text-gray-700">
              {result.growth_stage ? localizeGrowthStage(result.growth_stage, t.ui) : t.ui.generalStage}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant={result.is_demo ? "amber" : "green"}>
            {result.is_demo ? t.cropHealth.demoBadge : t.ui.liveAssessment}
          </Badge>
          {!result.vision_processed && (
            <Badge variant="gray">
              {t.ui.textBasedAnalysis}
            </Badge>
          )}
        </div>
      </div>

      {/* Possible Causes List */}
      <div className="space-y-3">
        <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
          <Info size={16} className="text-forest-800" />
          <span>{t.cropHealth.possibleCauses}</span>
        </h4>
        <div className="grid gap-3 sm:grid-cols-2">
          {result.possible_causes.map((cause, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-cream-200 bg-cream-50/60 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h5 className="font-bold text-sm text-forest-950">{cause.name}</h5>
                  <Badge variant="blue" className="text-[10px]">
                    {cause.confidence_level}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed mt-1">
                  {cause.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Immediate Actions */}
      <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
        <h4 className="font-bold text-xs text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
          <CheckCircle2 size={15} className="text-emerald-700" />
          <span>{t.cropHealth.immediateActions}</span>
        </h4>
        <ul className="text-xs text-emerald-900 space-y-1.5 pl-4 list-disc">
          {result.immediate_actions.map((act, i) => (
            <li key={i} className="leading-relaxed">{act}</li>
          ))}
        </ul>
      </div>

      {/* Monitoring Points */}
      <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
        <h4 className="font-bold text-xs text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
          <Clock size={15} className="text-blue-700" />
          <span>{t.cropHealth.monitoringPoints}</span>
        </h4>
        <ul className="text-xs text-blue-900 space-y-1 pl-4 list-disc">
          {result.monitoring_points.map((pt, i) => (
            <li key={i} className="leading-relaxed">{pt}</li>
          ))}
        </ul>
      </div>

      {/* Escalation Advice */}
      <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-1.5">
        <h4 className="font-bold text-xs text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
          <AlertTriangle size={15} className="text-amber-700" />
          <span>{t.cropHealth.escalationAdvice}</span>
        </h4>
        <p className="text-xs text-amber-900 leading-relaxed">
          {result.escalation_advice}
        </p>
      </div>

      {/* Safety Notice Component */}
      <SafetyNotice
        title={t.cropHealth.safetyDisclaimer}
        message={result.safety_disclaimer}
        isWarning
      />

      {/* Verified Reference Sources */}
      {result.sources && result.sources.length > 0 && (
        <div className="pt-2 text-xs text-gray-500 space-y-1">
          <span className="font-semibold text-gray-700 block">{t.ui.verifiedReferences}</span>
          {result.sources.map((s, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-forest-800 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-forest-700 shrink-0" />
              <span>{s.title} ({s.organization})</span>
              {s.url && (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline text-leaf-700 ml-1 inline-flex items-center gap-0.5"
                >
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
