import React, { useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { X, PlusCircle } from 'lucide-react';

interface ObservationModalProps {
  fieldId: number;
  onClose: () => void;
  onSave: (fieldId: number, data: {
    date: string;
    growth_stage?: string;
    notes: string;
    photo_url?: string;
  }) => Promise<void>;
}

export const ObservationModal: React.FC<ObservationModalProps> = ({
  fieldId,
  onClose,
  onSave,
}) => {
  const { t } = useLanguage();

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [growthStage, setGrowthStage] = useState('Flowering');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return;
    setLoading(true);
    try {
      await onSave(fieldId, {
        date,
        growth_stage: growthStage,
        notes,
      });
      onClose();
    } catch (err) {
      console.error('Error adding observation:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-cream-200">
        <div className="flex items-center justify-between pb-3 border-b border-cream-200 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-forest-900 text-leaf-300">
              <PlusCircle size={18} />
            </div>
            <h3 className="font-bold text-base text-gray-900">
              {t.fields.addObservation}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t.fields.obsDate}</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
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
                <option value="Pod/Fruit Formation">{t.ui.fruiting}</option>
                <option value="Grand Growth">{t.ui.tillering}</option>
                <option value="Harvesting">{t.ui.maturity}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t.fields.obsNotes}</label>
            <textarea
              rows={4}
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.ui.notesPlaceholder}
              className="w-full p-3 bg-cream-50 border border-cream-300 rounded-xl text-xs font-medium focus:ring-1 focus:ring-forest-800"
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
              disabled={loading || !notes.trim()}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-forest-900 hover:bg-forest-950 text-white shadow-sm"
            >
              {loading ? t.ui.addingObservation : t.fields.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
