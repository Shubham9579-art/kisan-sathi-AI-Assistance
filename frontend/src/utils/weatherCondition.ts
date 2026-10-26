import { Language } from "../types";

export function getLocalizedWeatherCondition(code: number, language: Language): string {
  const conditions = {
    en: ["Clear sky", "Partly cloudy", "Overcast", "Fog", "Drizzle", "Rain", "Snow", "Rain showers", "Thunderstorm", "Unknown conditions"],
    hi: ["साफ़ आसमान", "आंशिक बादल", "बादल छाए हैं", "कोहरा", "बूंदाबांदी", "बारिश", "बर्फ़बारी", "बारिश की बौछारें", "आंधी-तूफ़ान", "अज्ञात मौसम"],
    mr: ["निरभ्र आकाश", "अंशतः ढगाळ", "ढगाळ", "धुके", "रिमझिम", "पाऊस", "हिमवर्षाव", "पावसाच्या सरी", "वादळी पाऊस", "अज्ञात हवामान"],
  }[language];

  if (code === 0) return conditions[0];
  if ([1, 2].includes(code)) return conditions[1];
  if (code === 3) return conditions[2];
  if ([45, 48].includes(code)) return conditions[3];
  if ([51, 53, 55, 56, 57].includes(code)) return conditions[4];
  if ([61, 63, 65, 66, 67].includes(code)) return conditions[5];
  if ([71, 73, 75, 77, 85, 86].includes(code)) return conditions[6];
  if ([80, 81, 82].includes(code)) return conditions[7];
  if ([95, 96, 99].includes(code)) return conditions[8];
  return conditions[9];
}

export function localizeWeatherDescription(condition: string, language: Language): string {
  const normalized = condition.toLowerCase();
  const descriptions = {
    en: {
      partlyCloudy: "Partly cloudy",
      clear: "Clear sky",
      rain: "Rain showers",
      cloudy: "Overcast",
    },
    hi: {
      partlyCloudy: "आंशिक बादल",
      clear: "साफ़ आसमान",
      rain: "बारिश की बौछारें",
      cloudy: "बादल छाए हैं",
    },
    mr: {
      partlyCloudy: "अंशतः ढगाळ",
      clear: "निरभ्र आकाश",
      rain: "पावसाच्या सरी",
      cloudy: "ढगाळ",
    },
  }[language];

  if (normalized.includes("partly cloudy") || normalized.includes("scattered cloud")) {
    return descriptions.partlyCloudy;
  }
  if (normalized.includes("rain") || normalized.includes("shower")) {
    return descriptions.rain;
  }
  if (normalized.includes("sunny") || normalized.includes("clear")) {
    return descriptions.clear;
  }
  if (normalized.includes("cloud") || normalized.includes("overcast")) {
    return descriptions.cloudy;
  }
  return condition;
}
