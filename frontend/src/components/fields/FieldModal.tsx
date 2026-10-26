import React, { useState, useEffect } from 'react';
import { FieldItem } from '../../types';
import { useLanguage } from '../../hooks/useLanguage';
import { X, Trees } from 'lucide-react';

interface FieldModalProps {
  field?: FieldItem | null;
  onClose: () => void;
  onSave: (data: {
    name: string;
    location: string;
    crop: string;
    planting_date?: string;
    area: number;
    area_unit: string;
    growth_stage: string;
    notes?: string;
  }) => Promise<void>;
}

export const FieldModal: React.FC<FieldModalProps> = ({ field, onClose, onSave }) => {
  const { t } = useLanguage();

  const [name, setName] = useState(field?.name || '');
  const [location, setLocation] = useState(field?.location || 'Baramati, Pune');
  const [crop, setCrop] = useState(field?.crop || 'Soybean');
  const [plantingDate, setPlantingDate] = useState(field?.planting_date || new Date().toISOString().slice(0, 10));
  const [area, setArea] = useState<number>(field?.area || 2.0);
  const [areaUnit, setAreaUnit] = useState(field?.area_unit || 'Acres');
  const [growthStage, setGrowthStage] = useState(field?.growth_stage || 'Vegetative');
  const [notes, setNotes] = useState(field?.notes || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSave({
        name,
        location,
        crop,
        planting_date: plantingDate,
        area: Number(area),
        area_unit: areaUnit,
        growth_stage: growthStage,
        notes: notes || undefined,
      });
      onClose();
    } catch (err) {
      console.error('Error saving field:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-cream-200">
        <div className="flex items-center justify-between pb-3 border-b border-cream-200 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-forest-900 text-leaf-300">
              <Trees size={18} />
            </div>
            <h3 className="font-bold text-base text-gray-900">
              {field ? t.ui.editField : t.fields.addField}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t.fields.name}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.ui.exampleFieldName}
              className="w-full px-3 py-2 bg-cream-50 border border-cream-300 rounded-xl text-xs font-medium focus:ring-1 focus:ring-forest-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t.fields.crop}</label>
              <input
                type="text"
                required
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                placeholder={t.ui.exampleCrops}
                className="w-full px-3 py-2 bg-cream-50 border border-cream-300 rounded-xl text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t.fields.location}</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t.ui.villageTaluka}
                className="w-full px-3 py-2 bg-cream-50 border border-cream-300 rounded-xl text-xs font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t.fields.area}</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={area}
                onChange={(e) => setArea(parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-cream-50 border border-cream-300 rounded-xl text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t.ui.unit}</label>
              <select
                value={areaUnit}
                onChange={(e) => setAreaUnit(e.target.value)}
                className="w-full px-3 py-2 bg-cream-50 border border-cream-300 rounded-xl text-xs font-medium"
              >
                <option value="Acres">{t.ui.acres}</option>
                <option value="Gunthas">{t.ui.gunthas}</option>
                <option value="Hectares">{t.ui.hectares}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t.fields.plantingDate}</label>
              <input
                type="date"
                value={plantingDate}
                onChange={(e) => setPlantingDate(e.target.value)}
                className="w-full px-3 py-2 bg-cream-50 border border-cream-300 rounded-xl text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t.fields.growthStage}</label>
              <select
                value={growthStage}
                onChange={(e) => setGrowthStage(e.target.value)}
                className="w-full px-3 py-2 bg-cream-50 border border-cream-300 rounded-xl text-xs font-medium"
              >
                <option value="Vegetative">{t.ui.vegetative}</option>
                <option value="Flowering">{t.ui.flowering}</option>
                <option value="Pod/Boll Formation">{t.ui.fruiting}</option>
                <option value="Grand Growth">{t.ui.tillering}</option>
                <option value="Harvesting">{t.ui.maturity}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t.fields.notes}</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.ui.notesPlaceholder}
              className="w-full px-3 py-2 bg-cream-50 border border-cream-300 rounded-xl text-xs font-medium"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-cream-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-cream-100"
            >
              {t.fields.cancel}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-forest-900 hover:bg-forest-950 text-white shadow-sm"
            >
              {loading ? t.ui.saving : t.fields.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
