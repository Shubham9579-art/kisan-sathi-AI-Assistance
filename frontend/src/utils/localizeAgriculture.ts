import { translations } from '../i18n/translations';

type UiTranslations = typeof translations.mr.ui;

export function localizeCropName(value: string, ui: UiTranslations): string {
  const normalized = value.trim().toLowerCase();
  const crops: [string[], string][] = [
    [['soybean', 'सोयाबीन'], ui.soybean],
    [['cotton', 'कापूस', 'कपास'], ui.cotton],
    [['wheat', 'गहू', 'गेहूं'], ui.wheat],
    [['rice', 'धान', 'भात'], ui.rice],
    [['sugarcane', 'ऊस', 'गन्ना'], ui.sugarcane],
    [['maize', 'मक्का', 'मका'], ui.maize],
    [['onion', 'कांदा', 'प्याज'], ui.onion],
    [['pomegranate', 'डाळिंब', 'अनार'], ui.pomegranate],
    [['tomato', 'टोमॅटो', 'टमाटर'], ui.tomato],
  ];

  const match = crops.find(([aliases]) =>
    aliases.some((alias) => normalized.includes(alias.toLowerCase())),
  );
  return match?.[1] ?? value;
}

export function getCanonicalCropName(value: string): string {
  const normalized = value.trim().toLowerCase();
  const crops: [string[], string][] = [
    [['soybean', 'सोयाबीन'], 'Soybean'],
    [['cotton', 'कापूस', 'कपास'], 'Cotton'],
    [['wheat', 'गहू', 'गेहूं'], 'Wheat'],
    [['rice', 'धान', 'भात'], 'Rice'],
    [['sugarcane', 'ऊस', 'गन्ना'], 'Sugarcane'],
    [['maize', 'मक्का', 'मका'], 'Maize'],
    [['onion', 'कांदा', 'प्याज'], 'Onion'],
    [['pomegranate', 'डाळिंब', 'अनार'], 'Pomegranate'],
    [['tomato', 'टोमॅटो', 'टमाटर'], 'Tomato'],
  ];

  return crops.find(([aliases]) =>
    aliases.some((alias) => normalized.includes(alias.toLowerCase())),
  )?.[1] ?? value;
}

export function localizeGrowthStage(value: string, ui: UiTranslations): string {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes('flower')) return ui.flowering;
  if (normalized.includes('vegetative') || normalized.includes('शाकीय')) return ui.vegetative;
  if (normalized.includes('boll')) return ui.bollFormation;
  if (normalized.includes('pod') || normalized.includes('fruit')) return ui.podDevelopment;
  if (normalized.includes('grain')) return ui.grainFilling;
  if (normalized.includes('tiller') || normalized.includes('grand growth')) return ui.tillering;
  if (normalized.includes('harvest') || normalized.includes('maturity')) return ui.maturity;
  if (normalized.includes('seedling')) return ui.seedling;
  return value;
}

export function localizeAreaUnit(value: string, ui: UiTranslations): string {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'acre' || normalized === 'acres') return ui.acres;
  if (normalized === 'guntha' || normalized === 'gunthas') return ui.gunthas;
  if (normalized === 'hectare' || normalized === 'hectares') return ui.hectares;
  return value;
}
