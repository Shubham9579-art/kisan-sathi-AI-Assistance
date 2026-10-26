import React, { useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { api } from '../../services/api';
import { SchemeEligibilityResponse, SchemeItem } from '../../types';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import {
  X,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { SafetyNotice } from '../shared/SafetyNotice';

interface EligibilityModalProps {
  schemeId?: string;
  schemes: SchemeItem[];
  onClose: () => void;
}

export const EligibilityModal: React.FC<EligibilityModalProps> = ({
  schemeId,
  schemes,
  onClose,
}) => {
  const { t } = useLanguage();

  const [selectedSchemeId, setSelectedSchemeId] = useState<string>(schemeId || (schemes[0]?.id ?? ''));
  const [landAcres, setLandAcres] = useState<number>(0);
  const [category, setCategory] = useState<string>('General');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [hasAadhaar, setHasAadhaar] = useState<boolean | null>(null);
  const [has712, setHas712] = useState<boolean | null>(null);
  const [hasIrrigation, setHasIrrigation] = useState<boolean | null>(null);
  const [hasActivePmKisan, setHasActivePmKisan] = useState<boolean | null>(null);
  const [pmKisanExclusionApplies, setPmKisanExclusionApplies] = useState<boolean | null>(null);
  const [cultivatesNotifiedCrop, setCultivatesNotifiedCrop] = useState<boolean | null>(null);
  const [receivedMicroIrrigationSubsidy, setReceivedMicroIrrigationSubsidy] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<SchemeEligibilityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const answerOptions = [
    { value: '', label: t.schemes.answerUnknown },
    { value: 'true', label: t.schemes.answerYes },
    { value: 'false', label: t.schemes.answerNo },
  ];

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const resp = await api.evaluateSchemeEligibility({
        scheme_id: selectedSchemeId || undefined,
        land_holding_acres: Number(landAcres),
        category: category,
        state: state.trim(),
        district: district.trim() || undefined,
        has_aadhaar_linked_bank: hasAadhaar,
        has_7_12_extract: has712,
        has_irrigation: hasIrrigation,
        has_active_pm_kisan: hasActivePmKisan,
        pm_kisan_exclusion_applies: pmKisanExclusionApplies,
        cultivates_notified_crop: cultivatesNotifiedCrop,
        received_same_survey_micro_irrigation_subsidy: receivedMicroIrrigationSubsidy,
      });
      setResult(resp);
    } catch (err) {
      console.error('Eligibility evaluation error:', err);
      setError(err instanceof Error ? err.message : t.schemes.eligibilityCheckError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-cream-200 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cream-200 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-forest-900 text-leaf-300">
              <Calculator size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900">
                {t.schemes.eligibilityModalTitle}
              </h3>
              <p className="text-xs text-gray-500">
                {t.ui.ruleBasedCheck}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-cream-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Evaluation Form */}
        <form onSubmit={handleEvaluate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              {t.ui.selectScheme}
            </label>
            <select
              value={selectedSchemeId}
              onChange={(e) => setSelectedSchemeId(e.target.value)}
              className="w-full px-3 py-2 bg-cream-50 border border-cream-300 rounded-xl text-xs font-medium focus:ring-1 focus:ring-forest-800"
            >
              {schemes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t.schemes.landAcres}
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={landAcres}
                onChange={(e) => setLandAcres(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-cream-50 border border-cream-300 rounded-xl text-xs font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t.schemes.category}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-cream-50 border border-cream-300 rounded-xl text-xs font-medium"
              >
                <option value="General">{t.ui.generalCategory}</option>
                <option value="Small/Marginal">{t.ui.smallMarginal}</option>
                <option value="SC/ST">{t.ui.scheduledCastes}</option>
                <option value="Women">{t.ui.womenFarmer}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t.schemes.state}</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 bg-cream-50 border border-cream-300 rounded-xl text-xs font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t.schemes.district}</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2 bg-cream-50 border border-cream-300 rounded-xl text-xs font-medium"
              />
            </div>
          </div>

          {/* Ask rather than assuming documents or beneficiary status are in place. */}
          <div className="space-y-2 p-3 bg-cream-50 rounded-xl border border-cream-200 text-xs">
            {[
              { label: t.schemes.has712, value: has712, setter: setHas712 },
              { label: t.schemes.hasAadhaar, value: hasAadhaar, setter: setHasAadhaar },
              { label: t.schemes.hasIrrigation, value: hasIrrigation, setter: setHasIrrigation },
              ...(selectedSchemeId === 'namo-shetkari'
                ? [{ label: t.schemes.hasActivePmKisan, value: hasActivePmKisan, setter: setHasActivePmKisan }]
                : []),
              ...(selectedSchemeId === 'pm-kisan'
                ? [{ label: t.schemes.pmKisanExclusion, value: pmKisanExclusionApplies, setter: setPmKisanExclusionApplies }]
                : []),
              ...(selectedSchemeId === 'pmfby-crop-insurance'
                ? [{ label: t.schemes.notifiedCrop, value: cultivatesNotifiedCrop, setter: setCultivatesNotifiedCrop }]
                : []),
              ...(selectedSchemeId === 'mahadbt-micro-irrigation'
                ? [{ label: t.schemes.previousMicroIrrigation, value: receivedMicroIrrigationSubsidy, setter: setReceivedMicroIrrigationSubsidy }]
                : []),
            ].map(({ label, value, setter }) => (
              <label key={label} className="flex flex-col gap-1 font-medium text-gray-800">
                <span>{label}</span>
                <select
                  value={value === null ? '' : String(value)}
                  onChange={(event) => setter(event.target.value === '' ? null : event.target.value === 'true')}
                  className="w-full px-3 py-2 bg-white border border-cream-300 rounded-xl text-xs"
                >
                  {answerOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          {error && <p role="alert" className="text-xs text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-forest-900 hover:bg-forest-950 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            {loading ? <LoadingSpinner size={15} /> : <Calculator size={15} />}
            <span>{t.schemes.evaluateButton}</span>
          </button>
        </form>

        {/* Result Evaluation Output */}
        {result && result.evaluations.length > 0 && (
          <div className="mt-5 pt-4 border-t border-cream-200 space-y-4">
            {result.evaluations.map((ev, i) => (
              <div key={i} className="space-y-3">
                <div className="p-4 rounded-xl border bg-amber-50/80 border-amber-200 text-amber-950">
                  <div className="flex items-center gap-2 mb-1.5 font-bold text-sm">
                    {ev.assessment_status === 'possible_match' ? (
                      <AlertTriangle size={18} className="text-amber-700" />
                    ) : (
                      <X size={18} className="text-rose-700" />
                    )}
                    <span>
                      {ev.assessment_status === 'possible_match'
                        ? t.schemes.possibleMatchResult
                        : t.schemes.gapsFoundResult}
                    </span>
                  </div>
                  <div className="mb-1.5">
                  </div>
                  <p className="text-xs leading-relaxed font-normal">
                    {ev.assessment_status === 'possible_match'
                      ? t.schemes.possibleMatchSummary
                      : t.schemes.gapsFoundSummary}
                  </p>
                </div>

                {/* Criteria results breakdown */}
                <div className="space-y-1.5 text-xs">
                  <span className="font-bold text-gray-800 block">{t.ui.checkedCriteria}</span>
                  {ev.criteria_results.map((cr, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-cream-50 border border-cream-200 flex items-start gap-2"
                    >
                      <div className="mt-0.5">
                        {cr.met === true ? (
                          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                        ) : cr.met === false ? (
                          <X size={14} className="text-rose-600 shrink-0" />
                        ) : (
                          <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900 block">{cr.criterion}</span>
                        <span className="text-gray-600 text-[11px]">{cr.explanation}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Next Steps */}
                <div className="p-3 bg-forest-50/60 rounded-xl border border-forest-100 text-xs">
                  <span className="font-bold text-forest-950 block mb-1">{t.ui.applicationHowTo}</span>
                  <ol className="list-decimal pl-4 space-y-1 text-forest-900 text-[11px]">
                    {ev.next_steps.slice(0, 3).map((st, idx) => (
                      <li key={idx}>{st}</li>
                    ))}
                  </ol>
                  <a
                    href={ev.official_portal_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 text-forest-800 font-bold hover:underline inline-flex items-center gap-1 text-[11px]"
                  >
                    {t.schemes.portalLink} <ExternalLink size={11} />
                  </a>
                </div>

                <SafetyNotice
                  title={t.ui.legalNotice}
                  message={t.schemes.disclaimer}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
