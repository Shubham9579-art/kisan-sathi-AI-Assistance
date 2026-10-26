import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { ArrowUpRight, Sparkles } from 'lucide-react';

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
  customQuestions?: string[];
}

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
  onSelect,
  customQuestions,
}) => {
  const { language, t } = useLanguage();

  const defaultQuestionsByLang = {
    mr: [
      'सोयाबीन पानांवर पिवळे डाग पडले आहेत, काय उपाय करावे?',
      'कापसातील गुलाबी बोंडअळी नियंत्रणासाठी फेरोमोन ट्रॅप कसे लावावे?',
      'कांद्यावरील जांभळा करपा रोग रोखण्यासाठी फवारणी नियोजन काय आहे?',
      'उसातील तांबेरा किंवा लाल कूज रोगावर उपाय सांगा.',
    ],
    hi: [
      'सोयाबीन में पीला मोज़ेक और सफेद मक्खी का नियंत्रण कैसे करें?',
      'कपास में गुलाबी सुंडी (Pink Bollworm) की पहचान और रोकथाम बताएं।',
      'प्याज में बैंगनी धब्बा (पर्पल ब्लॉच) से बचाव के क्या उपाय हैं?',
      'गन्ने में लाल सड़न रोग के लक्षण और प्रबंधन बताएं।',
    ],
    en: [
      'My soybean leaves are turning yellow with bright patches, what to do?',
      'How to monitor and trap Pink Bollworm in Bt Cotton?',
      'What are preventive measures for Purple Blotch in onions?',
      'How to manage Red Rot disease in sugarcane crops?',
    ],
  };

  const questions =
    customQuestions && customQuestions.length > 0
      ? customQuestions
      : defaultQuestionsByLang[language] || defaultQuestionsByLang['mr'];

  return (
    <div className="suggested-questions space-y-2.5 my-3 text-left">
      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold uppercase tracking-[0.15em] px-1">
        <Sparkles size={13} className="text-leaf-600" />
        <span>{t.assistant.suggestedQuestions}</span>
      </div>
      <div className="suggested-question-grid grid grid-cols-1 gap-2 sm:grid-cols-2">
        {questions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(q)}
            type="button"
            className="suggested-question-card group flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-cream-200 bg-white px-3.5 py-3 text-left text-xs font-semibold leading-relaxed text-gray-700 shadow-sm transition-all hover:border-forest-200 hover:bg-forest-50/70 hover:text-forest-950"
          >
            <span className="flex min-w-0 items-start gap-2.5">
              <span className="suggested-question-number flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-forest-50 text-[10px] font-extrabold text-forest-800">
                0{idx + 1}
              </span>
              <span>{q}</span>
            </span>
            <ArrowUpRight size={14} className="shrink-0 text-forest-600 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>
    </div>
  );
};
