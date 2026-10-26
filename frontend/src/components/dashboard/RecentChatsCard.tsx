import React from 'react';
import { ChatMessage } from '../../types';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import { formatDate } from '../../utils/dateFormatter';

export const RecentChatsCard: React.FC<{ messages: ChatMessage[] }> = ({ messages }) => {
  const { t, language } = useLanguage();

  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-forest-800" />
          <h3 className="font-bold text-gray-900 text-base">{t.dashboard.recentAdvice}</h3>
        </div>
        <Link
          to="/assistant"
          className="text-xs font-semibold text-forest-800 hover:text-forest-950 flex items-center gap-1"
        >
          {t.assistant.title} <ArrowRight size={13} />
        </Link>
      </div>

      {messages.length === 0 ? (
        <p className="text-gray-400 text-xs py-4 text-center">{t.ui.noData}</p>
      ) : (
        <div className="space-y-3">
          {messages.slice(0, 2).map((m) => (
            <div
              key={m.id}
              className="p-3 rounded-xl bg-forest-50/50 border border-forest-100 text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-forest-900 text-[11px]">
                  {m.structured_advice ? m.structured_advice.what_might_be_happening.slice(0, 40) + '...' : t.assistant.title}
                </span>
                <span className="text-[10px] text-gray-400">{formatDate(m.created_at, language)}</span>
              </div>
              <p className="text-gray-700 text-[11px] leading-relaxed line-clamp-2">
                {m.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
