import React, { useState } from 'react';
import { FieldItem } from '../../types';
import { useLanguage } from '../../hooks/useLanguage';
import { formatDate } from '../../utils/dateFormatter';
import { localizeAreaUnit, localizeCropName, localizeGrowthStage } from '../../utils/localizeAgriculture';
import {
  Trees,
  MapPin,
  Calendar,
  Layers,
  Edit,
  Trash2,
  PlusCircle,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Badge } from '../shared/Badge';

interface FieldCardProps {
  field: FieldItem;
  readOnly?: boolean;
  onEdit: (field: FieldItem) => void;
  onDelete: (fieldId: number) => void;
  onAddObservation: (fieldId: number) => void;
}

export const FieldCard: React.FC<FieldCardProps> = ({
  field,
  readOnly = false,
  onEdit,
  onDelete,
  onAddObservation,
}) => {
  const { t, language } = useLanguage();
  const [showTimeline, setShowTimeline] = useState(false);

  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-5 shadow-xs hover:border-forest-300 transition-all flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-forest-900 text-leaf-400">
              <Trees size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900">{field.name}</h3>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <MapPin size={12} className="text-forest-700" />
                <span>{field.location}</span>
              </div>
            </div>
          </div>

          <Badge variant="green" className="text-xs">
            {localizeGrowthStage(field.growth_stage, t.ui)}
          </Badge>
        </div>

        {/* Crop and Area specs */}
        <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-cream-50/80 rounded-xl border border-cream-200/80 text-xs">
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold">{t.ui.cropVariety}</span>
            <span className="font-bold text-gray-900 text-xs">{localizeCropName(field.crop, t.ui)}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold">{t.ui.areaSize}</span>
            <span className="font-bold text-gray-900 text-xs">{field.area} {localizeAreaUnit(field.area_unit, t.ui)}</span>
          </div>
          {field.planting_date && (
            <div className="col-span-2 pt-1.5 border-t border-cream-200/60 flex items-center gap-1.5 text-gray-600 text-[11px]">
              <Calendar size={12} className="text-forest-700" />
              <span>{t.ui.planting}: {formatDate(field.planting_date, language)}</span>
            </div>
          )}
        </div>

        {/* Field Notes */}
        {field.notes && (
          <p className="text-xs text-gray-600 leading-relaxed italic mb-3">
            "{field.notes}"
          </p>
        )}

        {/* Observation Timeline Preview */}
        <div className="mt-3 pt-3 border-t border-cream-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
              <Clock size={13} className="text-forest-800" />
              <span>{t.fields.observationsHistory} ({field.observations?.length || 0})</span>
            </span>

            {field.observations && field.observations.length > 0 && (
              <button
                onClick={() => setShowTimeline(!showTimeline)}
                className="text-[11px] font-semibold text-forest-800 hover:text-forest-950 flex items-center gap-0.5"
              >
                <span>{showTimeline ? t.ui.hide : t.ui.view}</span>
                {showTimeline ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            )}
          </div>

          {showTimeline && field.observations && field.observations.length > 0 && (
            <div className="space-y-2 mt-2 max-h-48 overflow-y-auto pr-1">
              {field.observations.map((obs) => (
                <div
                  key={obs.id}
                  className="p-2.5 rounded-lg bg-cream-50 border border-cream-200 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-forest-900">{formatDate(obs.date, language)}</span>
                    <span className="text-gray-400 font-medium">
                      {obs.growth_stage ? localizeGrowthStage(obs.growth_stage, t.ui) : ''}
                    </span>
                  </div>
                  <p className="text-gray-700 leading-relaxed text-[11px]">{obs.notes}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!readOnly && (
        <div className="mt-4 pt-3 border-t border-cream-100 flex items-center justify-between gap-2">
          <button
            onClick={() => onAddObservation(field.id)}
            className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-1.5 border border-emerald-200 transition-colors"
          >
            <PlusCircle size={14} className="text-emerald-700" />
            <span>{t.ui.addObservationShort}</span>
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(field)}
              title={t.ui.editField}
              className="p-1.5 rounded-lg text-gray-500 hover:text-forest-900 hover:bg-cream-100 transition-colors"
            >
              <Edit size={15} />
            </button>
            <button
              onClick={() => onDelete(field.id)}
              title={t.fields.delete}
              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
        )}
    </div>
  );
};
