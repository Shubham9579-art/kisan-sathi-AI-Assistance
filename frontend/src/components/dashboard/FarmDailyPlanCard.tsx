import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Camera,
  Check,
  CheckCircle2,
  Clock3,
  Droplets,
  LoaderCircle,
  UploadCloud,
  X,
} from 'lucide-react';
import { AssessmentResultCard } from '../crops/AssessmentResultCard';
import { api } from '../../services/api';
import { CropAssessmentResult, FieldItem, Observation, WeatherData } from '../../types';
import { useLanguage } from '../../hooks/useLanguage';
import { localizeCropName } from '../../utils/localizeAgriculture';

interface FarmDailyPlanCardProps {
  fields: FieldItem[];
  weather: WeatherData;
  canSave: boolean;
  onObservationAdded: (fieldId: number, observation: Observation) => void;
}

const getLocalDate = (): string => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
};

export const FarmDailyPlanCard: React.FC<FarmDailyPlanCardProps> = ({
  fields,
  weather,
  canSave,
  onObservationAdded,
}) => {
  const { t, language } = useLanguage();
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(fields[0]?.id ?? null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState('');
  const [result, setResult] = useState<CropAssessmentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingTask, setSavingTask] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedField = fields.find((field) => field.id === selectedFieldId) ?? fields[0];
  const today = getLocalDate();

  useEffect(() => {
    if (!fields.some((field) => field.id === selectedFieldId)) {
      setSelectedFieldId(fields[0]?.id ?? null);
    }
  }, [fields, selectedFieldId]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const tasks = useMemo(() => {
    if (!result || !selectedField) return [];
    const irrigationReason = weather.rainfall_prob_pct >= 60
      ? t.ui.dailyPlanIrrigationRain.replace('{rain}', String(Math.round(weather.rainfall_prob_pct)))
      : t.ui.dailyPlanIrrigationDry;
    const planTasks = [
      {
        id: 'irrigation-check',
        title: t.ui.dailyPlanIrrigationTitle,
        description: irrigationReason,
        icon: Droplets,
      },
      ...result.immediate_actions.slice(0, 2).map((action, index) => ({
        id: `assessment-action-${index}`,
        title: action,
        description: result.possible_causes[0]?.description ?? '',
        icon: CheckCircle2,
      })),
      ...(result.monitoring_points[0] ? [{
        id: 'monitoring',
        title: result.monitoring_points[0],
        description: result.escalation_advice,
        icon: AlertCircle,
      }] : []),
    ];
    return planTasks.map((task) => {
      const marker = `[KisanSathi photo task: ${selectedField.id}:${today}:${task.id}]`;
      return {
        ...task,
        marker,
        completed: selectedField.observations?.some(
          (observation) => observation.date === today && observation.notes.includes(marker),
        ) ?? false,
      };
    });
  }, [result, selectedField, today, t.ui, weather.rainfall_prob_pct]);

  const handleFileChange = (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError(t.ui.photoTooLarge);
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      setError(t.ui.invalidPhotoType);
      return;
    }

    setError(null);
    setResult(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedField || !selectedFile) {
      setError(t.ui.dailyPlanPhotoRequired);
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('crop_type', selectedField.crop);
      formData.append('symptoms', symptoms.trim() || t.ui.dailyPlanPhotoDefault);
      formData.append('growth_stage', selectedField.growth_stage);
      formData.append('language', language);
      formData.append('image', selectedFile);
      setResult(await api.submitCropAssessment(formData));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const completeTask = async (task: (typeof tasks)[number]) => {
    if (!selectedField || !canSave || task.completed) return;
    setSavingTask(task.id);
    setSaveError(false);
    try {
      const observation = await api.addObservation(selectedField.id, {
        date: today,
        growth_stage: selectedField.growth_stage,
        notes: `${task.marker} ${task.title}`,
      });
      onObservationAdded(selectedField.id, observation);
    } catch (cause) {
      console.error('Failed to save daily field task:', cause);
      setSaveError(true);
    } finally {
      setSavingTask(null);
    }
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-lg shadow-forest-950/5">
      <div className="flex flex-col gap-3 bg-gradient-to-r from-emerald-950 via-forest-900 to-teal-800 p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
        <div className="flex items-start gap-3">
          <span className="rounded-2xl border border-white/15 bg-white/10 p-3 text-emerald-200">
            <Camera size={22} />
          </span>
          <div>
            <h2 className="text-lg font-extrabold">{t.ui.dailyPlanTitle}</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-emerald-100">{t.ui.dailyPlanSubtitle}</p>
          </div>
        </div>
        {result && (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-50">
            <Clock3 size={14} /> {t.ui.dailyPlanIrrigationTitle}
          </span>
        )}
      </div>

      <div className="space-y-5 bg-gradient-to-b from-emerald-50/60 to-white p-4 sm:p-6">
        {fields.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-emerald-300 bg-white p-6 text-center">
            <p className="text-sm font-semibold text-gray-800">{t.ui.dailyPlanNoFields}</p>
            <Link to="/fields" className="mt-3 inline-flex rounded-xl bg-forest-900 px-4 py-2 text-xs font-bold text-white">
              {t.ui.missionOpenFields}
            </Link>
          </div>
        ) : (
          <form onSubmit={(event) => void handleSubmit(event)} className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
            <div className="space-y-4">
              <div>
                <label htmlFor="daily-plan-field" className="mb-1.5 block text-[11px] font-bold text-gray-600">
                  {t.ui.missionChooseField}
                </label>
                <select
                  id="daily-plan-field"
                  value={selectedField?.id ?? ''}
                  onChange={(event) => {
                    setSelectedFieldId(Number(event.target.value));
                    setResult(null);
                  }}
                  className="w-full rounded-xl border border-cream-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-800 focus-visible:outline-2 focus-visible:outline-forest-700"
                >
                  {fields.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.name} · {localizeCropName(field.crop, t.ui)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="daily-plan-symptoms" className="mb-1.5 block text-[11px] font-bold text-gray-600">
                  {t.cropHealth.symptoms}
                </label>
                <textarea
                  id="daily-plan-symptoms"
                  value={symptoms}
                  onChange={(event) => setSymptoms(event.target.value)}
                  rows={3}
                  placeholder={t.cropHealth.symptomsPlaceholder}
                  className="w-full rounded-xl border border-cream-300 bg-white p-3 text-sm text-gray-800 focus-visible:outline-2 focus-visible:outline-forest-700"
                />
              </div>

              <div>
                <p className="mb-1.5 text-[11px] font-bold text-gray-600">{t.ui.dailyPlanPhotoLabel}</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => handleFileChange(event.target.files?.[0])}
                />
                {previewUrl && selectedFile ? (
                  <div className="relative flex items-center gap-3 rounded-2xl border border-cream-200 bg-white p-2">
                    <img src={previewUrl} alt={t.cropHealth.uploadPhoto} className="h-24 w-28 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-gray-800">{selectedFile.name}</p>
                      <p className="mt-1 text-[10px] text-gray-500">{t.ui.dailyPlanPhotoHint}</p>
                    </div>
                    <button
                      type="button"
                      aria-label={t.common.close}
                      onClick={() => {
                        setSelectedFile(null);
                        setResult(null);
                        setPreviewUrl(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute right-2 top-2 rounded-full bg-gray-900/75 p-1.5 text-white hover:bg-gray-900"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-emerald-300 bg-white p-4 text-left transition hover:border-forest-600 hover:bg-emerald-50/60"
                  >
                    <span className="rounded-xl bg-emerald-50 p-2.5 text-forest-800"><UploadCloud size={20} /></span>
                    <span className="text-xs leading-relaxed text-gray-600">{t.ui.dailyPlanPhotoHint}</span>
                  </button>
                )}
              </div>
              <p className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-[10px] leading-relaxed text-blue-900">
                {t.ui.dailyPlanPrivacyNote}
              </p>
            </div>

            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-emerald-100 bg-white p-4 sm:p-5">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900">{t.ui.dailyPlanTasksHeading}</h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">
                  {t.ui.dailyPlanIrrigationTitle}: {weather.rainfall_prob_pct >= 60
                    ? t.ui.dailyPlanIrrigationRain.replace('{rain}', String(Math.round(weather.rainfall_prob_pct)))
                    : t.ui.dailyPlanIrrigationDry}
                </p>
              </div>
              <p className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-950">
                {t.ui.missionDisclaimer}
              </p>
              <button
                type="submit"
                disabled={loading || !selectedField}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-forest-900 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-forest-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <><LoaderCircle size={16} className="animate-spin" /> {t.ui.dailyPlanAnalyzing}</> : <><Camera size={16} /> {t.ui.dailyPlanAnalyze}</>}
              </button>
            </div>
          </form>
        )}

        {error && (
          <p role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-800">
            <AlertCircle size={15} /> {error}
          </p>
        )}

        {result && (
          <div className="space-y-4">
            <p className={`rounded-xl border px-3 py-2.5 text-xs leading-relaxed ${result.vision_processed ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-950'}`}>
              {result.vision_processed ? t.ui.dailyPlanVisionYes : t.ui.dailyPlanVisionNo}
            </p>
            <AssessmentResultCard result={result} />
            <div className="rounded-2xl border border-emerald-200 bg-white p-4 sm:p-5">
              <h3 className="mb-3 text-sm font-extrabold text-gray-900">{t.ui.dailyPlanTasksHeading}</h3>
              <div className="space-y-2.5">
                {tasks.map((task) => {
                  const Icon = task.icon;
                  const isSaving = savingTask === task.id;
                  return (
                    <article key={task.id} className={`flex items-start gap-3 rounded-xl border p-3 ${task.completed ? 'border-emerald-200 bg-emerald-50' : 'border-cream-200 bg-cream-50/60'}`}>
                      <span className="mt-0.5 rounded-lg bg-white p-2 text-forest-800"><Icon size={16} /></span>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold leading-relaxed text-gray-900">{task.title}</h4>
                        {task.description && <p className="mt-1 text-[11px] leading-relaxed text-gray-600">{task.description}</p>}
                      </div>
                      {canSave ? (
                        <button
                          type="button"
                          disabled={task.completed || savingTask !== null}
                          onClick={() => void completeTask(task)}
                          aria-label={task.completed ? t.ui.missionCompleted : t.ui.missionMarkDone}
                          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-forest-900 px-2.5 py-2 text-[10px] font-bold text-white disabled:bg-emerald-100 disabled:text-emerald-800"
                        >
                          {isSaving ? <LoaderCircle size={13} className="animate-spin" /> : task.completed ? <Check size={13} /> : <Check size={13} />}
                          <span className="hidden sm:inline">{isSaving ? t.ui.missionSaving : task.completed ? t.ui.missionCompleted : t.ui.missionMarkDone}</span>
                        </button>
                      ) : (
                        <Link to="/account" className="shrink-0 text-[10px] font-bold text-forest-800 underline">
                          {t.ui.missionSignInToSave}
                        </Link>
                      )}
                    </article>
                  );
                })}
              </div>
              {saveError && <p role="alert" className="mt-3 text-xs font-medium text-rose-700">{t.ui.missionSaveError}</p>}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
