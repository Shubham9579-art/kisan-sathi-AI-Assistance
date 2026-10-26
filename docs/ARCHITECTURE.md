# KisanSathi AI — System Architecture & Design

## 1. Executive Summary
**KisanSathi AI** is a context-aware agricultural decision-support platform designed for Indian farmers, with an initial focus on Maharashtra's agro-climatic zones and crops (Soybean, Cotton, Sugarcane, Onion, and Pomegranate).

Unlike generic conversational chatbots, KisanSathi correlates a farmer's specific crop variety, current growth stage, field observation history, weather forecasts, and verified government agricultural datasets (ICAR, MPKV, VNMKV, PDKV, and Government of Maharashtra Agriculture Department).

---

## 2. Architectural Blueprint

```
+-----------------------------------------------------------------------+
|                           FARMER CLIENT                               |
|        React 18 + Vite + TypeScript + Tailwind CSS (Mobile-First)     |
|   Multilingual UI (मराठी | हिन्दी | English) + Web Speech API (STT/TTS) |
+-----------------------------------+-----------------------------------+
                                    | REST JSON (Port 5173 -> 8000)
                                    v
+-----------------------------------------------------------------------+
|                    FASTAPI APPLICATION BACKEND                        |
|                                                                       |
|  [API Routes]                                                         |
|   /api/v1/health       - Service health & config check                |
|   /api/v1/dashboard    - Integrated farm summary                      |
|   /api/v1/chat         - Context-aware farming assistant              |
|   /api/v1/crop-assessments - Image/symptom preliminary diagnosis       |
|   /api/v1/weather      - Agro-climatic weather & operation guidance   |
|   /api/v1/schemes      - Government subsidy catalog & eligibility     |
|   /api/v1/fields       - Field profiles & dated observation diary     |
|                                                                       |
|  [Services Layer]                                                     |
|   AssistantService     - Knowledge retrieval & structured guidance    |
|   KnowledgeService     - Keyword/semantic search on ICAR knowledge    |
|   AssessmentService    - Multipart upload validation & rule engine    |
|   WeatherService       - Agro simulation & optional OpenWeather API   |
|   SchemesService       - Eligibility calculator & document checklist  |
|                                                                       |
|  [Data Access Layer]                                                  |
|   FieldRepository, ChatRepository, AssessmentRepository               |
+-----------------------------------+-----------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
|                        PERSISTENCE & STORAGE                          |
|   - SQLite Database (kisansathi.db) via SQLAlchemy ORM                |
|   - Curated Agricultural Knowledge JSON (ICAR/VNMKV standards)        |
|   - Government Schemes Dataset (PM-KISAN, Namo Shetkari, MahaDBT)     |
+-----------------------------------------------------------------------+
```

---

## 3. Core Architectural Modules

### 3.1 Context Engine
When a farmer asks a question in `/api/v1/chat`:
1. The assistant extracts registered field context (Crop: Soybean, Stage: Flowering, District: Pune).
2. The `KnowledgeService` queries verified local agricultural records indexed by crop, regional names, and symptoms.
3. The response is generated in the farmer's selected language (Marathi, Hindi, or English) structured strictly into:
   - **What might be happening** (preliminary diagnosis)
   - **What to do now** (immediate, non-toxic IPM actions)
   - **What to monitor** (48-hour scouting thresholds)
   - **When to consult an expert** (escalation guidelines)
4. Citations from genuine ICAR/University bulletins are attached.

### 3.2 Crop Health Checker & Assessment Service
- Handles multipart/form-data image uploads with file size limit (5MB) and strict MIME validation (JPEG, PNG, WebP).
- Discloses honestly whether visual computer vision was run or if the assessment was derived from rule-based symptom indicators.
- Employs conservative safety warnings: never prescribes invented pesticide dosages or guaranteed chemical cures.

### 3.3 Government Scheme Eligibility Calculator
- Compares farmer parameters (cultivable acreage, category, Maharashtra residency, 7/12 extract status, Aadhaar bank seeding, water source) against documented scheme rules.
- Computes an eligibility score and outputs a criterion-by-criterion explanation of why the farmer qualifies or which documents are missing.

### 3.4 Data Persistence
- Built using SQLAlchemy 2.0 with SQLite.
- Automatic table creation and realistic initial demonstration seeding on startup.
- Full CRUD support for fields and chronological observation entries.

---

## 4. Hardware & Deployment Characteristics
- Runs 100% locally on standard consumer Windows laptops without requiring a GPU or paid cloud API keys.
- Completely functional in deterministic offline demo mode.
- Optional external API adapters for Gemini 1.5 Flash and OpenWeatherMap can be activated with single environment variables.
