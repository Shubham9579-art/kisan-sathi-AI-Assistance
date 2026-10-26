import React from 'react';
import { AlertCircle, ArrowRight, CalendarDays, Clock3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import { FieldItem, Language } from '../../types';
import { localizeCropName, localizeGrowthStage } from '../../utils/localizeAgriculture';
import { getCropCheckReminder } from '../../utils/cropCalendar';

interface CropCalendarCardProps {
  fields: FieldItem[];
}

const getLocale = (language: Language): string => {
  if (language === 'mr') return 'mr-IN';
  if (language === 'hi') return 'hi-IN';
  return 'en-IN';
};

export const CropCalendarCard: React.FC<CropCalendarCardProps> = ({ fields }) => {
  const { t, language } = useLanguage();
  const reminders = fields.map((field) => ({
    field,
    reminder: getCropCheckReminder(field),
  }));

  return (
    <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-xs">
      <div className="flex flex-col gap-3 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-white p-2.5 text-forest-800 shadow-xs">
            <CalendarDays size={20} />
          </span>
          <div>
            <h2 className="font-bold text-gray-900">{t.ui.cropCalendarTitle}</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-gray-600">
              {t.ui.cropCalendarSubtitle}
            </p>
          </div>
        </div>
        <Link
          to="/fields"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-forest-900 hover:bg-emerald-50"
        >
          {t.dashboard.viewAllFields} <ArrowRight size={13} />
        </Link>
      </div>

      {reminders.length === 0 ? (
        <div className="p-5 text-center text-sm text-gray-600">
          <p>{t.ui.cropCalendarEmpty}</p>
          <Link to="/fields" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-forest-800">
            {t.ui.addFirstField} <ArrowRight size={13} />
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-cream-200">
          {reminders.map(({ field, reminder }) => (
            <article key={field.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="break-words text-sm font-bold text-gray-900">{field.name}</h3>
                  <span className="rounded-full bg-cream-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700">
                    {localizeCropName(field.crop, t.ui)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {localizeGrowthStage(field.growth_stage, t.ui)}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-gray-700">
                  <span className="font-semibold text-gray-900">{t.ui.cropCalendarFocus}: </span>
                  {t.ui[`cropCalendarFocus_${reminder.focus}`]}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2 rounded-xl bg-cream-50 px-3 py-2 text-xs">
                {reminder.daysUntilDue <= 0 ? (
                  <AlertCircle size={15} className="text-amber-700" />
                ) : (
                  <Clock3 size={15} className="text-forest-700" />
                )}
                <span className="font-semibold text-gray-800">
                  {reminder.daysUntilDue <= 0
                    ? t.ui.cropCalendarDue
                    : t.ui.cropCalendarDueIn.replace('{days}', String(reminder.daysUntilDue))}
                </span>
                <span className="text-gray-500">
                  {reminder.dueDate.toLocaleDateString(getLocale(language), {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="border-t border-cream-200 bg-cream-50/70 px-4 py-3 text-[11px] leading-relaxed text-gray-600 sm:px-5">
        {t.ui.cropCalendarDisclaimer}
      </p>
    </section>
  );
};
