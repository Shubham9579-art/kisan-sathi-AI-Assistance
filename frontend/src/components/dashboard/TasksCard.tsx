import React from 'react';
import { DashboardTask } from '../../types';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';

export const TasksCard: React.FC<{ tasks: DashboardTask[] }> = ({ tasks }) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900 text-base">{t.dashboard.todaysTasks}</h3>
        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
          {t.ui.priority}
        </span>
      </div>

      <div className="space-y-2.5">
        {tasks.map((task) => {
          const localizedTask = task.id === 't1'
            ? { title: t.ui.taskPestTitle, description: t.ui.taskPestDescription }
            : task.id === 't2'
              ? { title: t.ui.taskWeatherTitle, description: t.ui.taskWeatherDescription }
              : task.id === 't3'
                ? { title: t.ui.taskSchemeTitle, description: t.ui.taskSchemeDescription }
                : { title: task.title, description: task.description };
          return <div
            key={task.id}
            className="p-3 rounded-xl border border-cream-200 hover:border-forest-300 transition-colors flex items-start justify-between gap-3 text-xs"
          >
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5">
                {task.urgency === 'High' ? (
                  <AlertCircle size={16} className="text-rose-500 shrink-0" />
                ) : (
                  <CheckCircle2 size={16} className="text-leaf-600 shrink-0" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-xs mb-0.5">{localizedTask.title}</h4>
                <p className="text-gray-500 text-[11px] leading-relaxed">{localizedTask.description}</p>
              </div>
            </div>

            <Link
              to={task.action_route}
              className="shrink-0 p-1.5 rounded-lg text-forest-800 hover:bg-forest-50"
            >
              <ArrowRight size={14} />
            </Link>
          </div>;
        })}
      </div>
    </div>
  );
};
