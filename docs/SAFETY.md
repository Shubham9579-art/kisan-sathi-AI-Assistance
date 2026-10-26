# KisanSathi AI — Agricultural Safety, Trust & Disclaimer Policy

## 1. Agricultural Safety Principles
Agriculture in India directly impacts rural livelihood, food security, and human health. Incorrect recommendations—such as applying the wrong pesticide, over-dosing chemical fungicides, or assuming false government scheme approvals—can cause severe financial and environmental damage.

KisanSathi AI adheres to strict safety principles:

### 1.1 Caution With Chemical Guidance
- The assistant is designed to avoid synthetic pesticide dosages, concentrated chemical mixing ratios, or unverified pesticide tank mixes, but AI output is not guaranteed to be error-free.
- First-line advice prioritizes non-chemical Integrated Pest Management (IPM):
  - Cultural practices (crop rotation, clean drainage, roguing infected plants)
  - Mechanical traps (yellow sticky traps for whitefly, pheromone traps with specific lures for bollworm)
  - Low-risk monitoring and field inspection, following current local agriculture guidance
- Do not treat a generic formulation, product, or concentration as universally safe. Confirm permitted use and directions from the current registered product label and qualified local guidance.

### 1.2 Honest AI & Diagnostic Disclosure
- The application reports image-based analysis only when a configured vision service successfully processes the supplied photo. Without it, it explicitly labels local text/rule-based guidance.
- The system never claims to have executed neural visual disease detection unless a real vision AI model actually processed the photograph.
- Diagnostic uncertainty is communicated using transparent confidence tiers (*Indicative, Moderate, High*).
- A crop photo cannot establish root-zone soil moisture. Dashboard weather-risk indicators are heuristics, not field measurements, diagnoses, or proof of pest pressure.
- Demo weather, forecasts, alerts, and derived recommendations are illustrative only. They must not be used to schedule irrigation, spraying, or harvest.

### 1.3 Agricultural References
- The curated knowledge collection may include references from Indian agricultural research institutions:
  - **ICAR-IISR** (Indian Institute of Soybean Research, Indore)
  - **ICAR-CICR** (Central Institute for Cotton Research, Nagpur)
  - **MPKV** (Mahatma Phule Krishi Vidyapeeth, Rahuri)
  - **VNMKV** (Vasantrao Naik Marathwada Krishi Vidyapeeth, Parbhani)
  - **Dr. PDKV** (Dr. Panjabrao Deshmukh Krishi Vidyapeeth, Akola)
  - **VSI** (Vasantdada Sugar Institute, Pune)
- Citations are derived from records available to the application, but may not be attached to every recommendation, independently verified, or current. Check the linked organization and current local guidance before acting.

### 1.4 Clear Escalation Protocols
- Thresholds vary by crop, pest, growth stage, and local guidance. Do not apply a generic percentage threshold from this application. Seek field inspection from an authorized local officer when symptoms spread, crop damage worsens, or the cause is uncertain:
  - Gram Sevak / Krishi Sahayak
  - Taluka Agriculture Officer (TAO)
  - Krishi Vigyan Kendra (KVK) subject matter specialists

### 1.5 Preliminary Scheme Eligibility Notice
- Automated scheme assessments compare user inputs against published eligibility criteria.
- The platform explicitly states: *"This questionnaire offers preliminary guidance. The competent government authority (Revenue / Agriculture Department) verifies physical documents and makes the final decision."*

---

## 2. Privacy & Data Handling
- In local development, records are stored in the configured database on the host. A hosted deployment stores records on its configured hosting/database provider instead.
- When Gemini is configured, chat prompts and submitted crop photos may be sent to Google's Gemini API for processing. Avoid submitting Aadhaar, financial details, faces, or other sensitive information.
- Browser-native speech recognition may use a browser-provided service to process audio; avoid speaking sensitive information.
- Do not upload identity documents or bank details. Review the selected hosting and AI provider's current privacy terms before public use.
