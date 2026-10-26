import React from 'react';
import { FieldItem } from '../../types';
import { Link } from 'react-router-dom';
import { Trees, ArrowRight, Plus } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { getCanonicalCropName, localizeAreaUnit, localizeCropName, localizeGrowthStage } from '../../utils/localizeAgriculture';

export const FieldsOverview: React.FC<{ fields: FieldItem[] }> = ({ fields }) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trees size={19} className="text-forest-800" />
          <h3 className="font-bold text-gray-900 text-base">{t.dashboard.myFieldsSummary}</h3>
          <span className="text-xs bg-cream-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">
            {fields.length}
          </span>
        </div>
        <Link
          to="/fields"
          className="text-xs font-semibold text-forest-800 hover:text-forest-950 flex items-center gap-1"
        >
          {t.dashboard.viewAllFields} <ArrowRight size={13} />
        </Link>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-6 text-gray-500 text-xs">
          {t.ui.noFields}
          <Link to="/fields" className="text-forest-800 font-bold block mt-1">
            + {t.ui.addFirstField}
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {fields.slice(0, 3).map((f) => (
            <div
              key={f.id}
              className="p-3 rounded-xl bg-cream-50/70 border border-cream-200/80 flex items-center justify-between text-xs"
            >
              <div>
                <h4 className="font-bold text-gray-900">{f.name}</h4>
                <p className="text-gray-500 text-[11px]">
                  {localizeCropName(f.crop, t.ui)} • {f.area} {localizeAreaUnit(f.area_unit, t.ui)}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-medium text-[11px]">
                  {localizeGrowthStage(f.growth_stage, t.ui)}
                </span>
                <span className="block text-[10px] text-gray-400 mt-0.5">
                  {f.observations?.length || 0} {t.ui.observations}
                </span>
                <Link
                  to={`/assistant?fieldId=${f.id}&crop=${encodeURIComponent(getCanonicalCropName(f.crop))}&stage=${encodeURIComponent(f.growth_stage)}`}
                  className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-forest-800 hover:text-forest-950"
                >
                  {t.dashboard.askAboutField} <ArrowRight size={11} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
