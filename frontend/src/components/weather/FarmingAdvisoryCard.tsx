
import React from "react";
import { FarmingGuidance } from "../../types";
import { useLanguage } from "../../hooks/useLanguage";
import { Droplet, SprayCan, Wheat, Shovel } from "lucide-react";

export const FarmingAdvisoryCard: React.FC<{
  guidance: FarmingGuidance;
}> = ({ guidance }) => {
  const { t } = useLanguage();

  const advisories = [
    {
      title: t.weather.irrigation,
      desc: guidance.irrigation_advice,
      icon: Droplet,
      color: "text-blue-700 bg-blue-50 border-blue-200",
    },
    {
      title: t.weather.spraying,
      desc: guidance.spraying_advice,
      icon: SprayCan,
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      title: t.weather.harvesting,
      desc: guidance.harvesting_advice,
      icon: Wheat,
      color: "text-amber-700 bg-amber-50 border-amber-200",
    },
    {
      title: t.weather.soilWork,
      desc: guidance.soil_work_advice,
      icon: Shovel,
      color: "text-stone-700 bg-stone-50 border-stone-200",
    },
  ];

  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-6 shadow-xs space-y-4">
      <h3 className="font-bold text-base text-gray-900 tracking-tight">
        {t.weather.advisoryTitle}
      </h3>

      <div className="grid gap-3 sm:grid-cols-2">
        {advisories.map((adv) => {
          const Icon = adv.icon;

          return (
            <div
              key={adv.title}
              className={`p-4 rounded-xl border flex flex-col justify-between ${adv.color}`}
            >
              <div className="flex items-center gap-2 mb-2 font-bold text-xs uppercase tracking-wide">
                <Icon size={16} />
                <span>{adv.title}</span>
              </div>

              <p className="text-xs text-gray-800 leading-relaxed font-normal">
                {adv.desc || "Advice is not available yet."}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
