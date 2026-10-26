import React, { useEffect, useState, useRef } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { api } from '../../services/api';
import { CropAssessmentResult } from '../../types';
import { AssessmentResultCard } from './AssessmentResultCard';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import {
  UploadCloud,
  X,
  Sparkles,
  Camera,
  AlertCircle,
  FileCheck
} from 'lucide-react';

export const CropHealthChecker: React.FC = () => {
  const { t, language } = useLanguage();

  const [cropType, setCropType] = useState('Soybean');
  const [growthStage, setGrowthStage] = useState('Flowering');
  const [symptoms, setSymptoms] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CropAssessmentResult | null>(null);
  const lastAssessmentRef = useRef<{
    cropType: string;
    growthStage: string;
    symptoms: string;
    selectedFile: File | null;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File) => {
    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(t.ui.photoTooLarge);
      return;
    }
    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError(t.ui.invalidPhotoType);
      return;
    }

    setError(null);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim() || symptoms.length < 3) {
      setError(t.ui.symptomsRequired);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('crop_type', cropType);
      formData.append('symptoms', symptoms);
      formData.append('growth_stage', growthStage);
      formData.append('language', language);
      lastAssessmentRef.current = { cropType, growthStage, symptoms, selectedFile };
      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      const res = await api.submitCropAssessment(formData);
      setResult(res);
    } catch (err: any) {
      setError(err.message || t.common.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const previous = lastAssessmentRef.current;
    if (!previous || !result) return;

    let active = true;
    const refreshResultLanguage = async () => {
      setLoading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append('crop_type', previous.cropType);
        formData.append('symptoms', previous.symptoms);
        formData.append('growth_stage', previous.growthStage);
        formData.append('language', language);
        if (previous.selectedFile) {
          formData.append('image', previous.selectedFile);
        }
        const localizedResult = await api.submitCropAssessment(formData);
        if (active) setResult(localizedResult);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : t.common.error);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void refreshResultLanguage();
    return () => {
      active = false;
    };
  }, [language]);

  // Sample quick symptoms fillers for fast judging demo
  const sampleScenarios = [
    {
      label: t.ui.sampleSoybean,
      crop: 'Soybean',
      stage: 'Flowering',
      text: t.ui.sampleSoybeanSymptoms,
    },
    {
      label: t.ui.sampleCotton,
      crop: 'Cotton',
      stage: 'Boll Formation',
      text: t.ui.sampleCottonSymptoms,
    },
    {
      label: t.ui.sampleOnion,
      crop: 'Onion',
      stage: 'Vegetative',
      text: t.ui.sampleOnionSymptoms,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Form Card */}
      <div className="bg-white border border-cream-200 rounded-2xl p-6 shadow-xs">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">{t.cropHealth.title}</h2>
          <p className="text-sm text-gray-500 mt-1">{t.cropHealth.subtitle}</p>
        </div>

        {/* Quick Demo Scenario Fillers */}
        <div className="mb-6 p-3 bg-cream-50 border border-cream-200 rounded-xl space-y-2">
          <span className="text-xs font-semibold text-gray-600 block">
            {t.ui.sampleSymptoms}:
          </span>
          <div className="flex flex-wrap gap-2">
            {sampleScenarios.map((sc, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setCropType(sc.crop);
                  setGrowthStage(sc.stage);
                  setSymptoms(sc.text);
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-white border border-cream-300 hover:border-forest-600 text-forest-900 font-medium hover:bg-forest-50 transition-all shadow-2xs"
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Crop & Stage Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                {t.cropHealth.cropType}
              </label>
              <select
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-300 rounded-xl text-sm font-medium focus:ring-1 focus:ring-forest-800 focus:outline-none"
              >
                <option value="Soybean">{t.ui.soybean}</option>
                <option value="Cotton">{t.ui.cotton}</option>
                <option value="Sugarcane">{t.ui.sugarcane}</option>
                <option value="Onion">{t.ui.onion}</option>
                <option value="Pomegranate">{t.ui.pomegranate}</option>
                <option value="Tomato">{t.ui.tomato}</option>
                <option value="Wheat">{t.ui.wheat}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                {t.cropHealth.growthStage}
              </label>
              <select
                value={growthStage}
                onChange={(e) => setGrowthStage(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-300 rounded-xl text-sm font-medium focus:ring-1 focus:ring-forest-800 focus:outline-none"
              >
                <option value="Seedling">{t.ui.seedling}</option>
                <option value="Vegetative">{t.ui.vegetative}</option>
                <option value="Flowering">{t.ui.flowering}</option>
                <option value="Fruit/Pod Development">{t.ui.podDevelopment}</option>
                <option value="Maturity/Harvest">{t.ui.maturity}</option>
              </select>
            </div>
          </div>

          {/* Symptoms Textarea */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              {t.cropHealth.symptoms}
            </label>
            <textarea
              rows={3}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder={t.cropHealth.symptomsPlaceholder}
              className="w-full p-3.5 bg-cream-50 border border-cream-300 rounded-xl text-sm focus:ring-1 focus:ring-forest-800 focus:outline-none placeholder:text-gray-400"
              required
            />
          </div>

          {/* Image Upload Area */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              {t.cropHealth.uploadPhoto}
            </label>

            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileChange(e.dataTransfer.files[0]);
                  }
                }}
                className="border-2 border-dashed border-cream-300 hover:border-forest-600 rounded-2xl p-6 text-center cursor-pointer bg-cream-50/50 hover:bg-forest-50/30 transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-12 h-12 mx-auto rounded-full bg-cream-100 text-forest-800 flex items-center justify-center mb-2">
                  <UploadCloud size={24} />
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-1">
                  {t.cropHealth.uploadPhoto}
                </p>
                <p className="text-xs text-gray-500">
                  {t.cropHealth.dragDropText}
                </p>
              </div>
            ) : (
              <div className="relative w-fit rounded-xl overflow-hidden border border-cream-300 shadow-sm">
                <img
                  src={previewUrl}
                  alt={t.cropHealth.uploadPhoto}
                  className="h-44 w-auto object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
                >
                  <X size={16} />
                </button>
                <div className="p-2 bg-white text-xs font-medium text-gray-700 flex items-center gap-1.5">
                  <FileCheck size={14} className="text-leaf-600" />
                  <span className="truncate max-w-[200px]">{selectedFile?.name}</span>
                </div>
              </div>
            )}
          </div>

          {/* Error notice */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !symptoms.trim()}
            className="w-full sm:w-auto px-6 py-3.5 bg-forest-900 hover:bg-forest-950 disabled:bg-gray-300 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            {loading ? (
              <>
                <LoadingSpinner size={16} />
                <span>{t.cropHealth.analyzing}</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>{t.cropHealth.analyzeButton}</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Result Presentation */}
      {result && <AssessmentResultCard result={result} />}
    </div>
  );
};
