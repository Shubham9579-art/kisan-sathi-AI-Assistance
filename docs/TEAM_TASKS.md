# KisanSathi AI — Hackathon Team Roles & Task Division

Designed for our team of **2–3 first-year B.Tech students** with basic Python knowledge.

---

## Member 1: Frontend Specialist & Demo Lead
**Focus Area**: UI Presentation, Multilingual Experience, and Judging Pitch.

- **Primary Tasks**:
  1. **Judging Demo Execution**: Practice the 4-minute demo sequence from `docs/DEMO_GUIDE.md`. Ensure voice synthesis (TTS) volume is audible.
  2. **Multilingual QA**: Review Marathi and Hindi translations in `frontend/src/i18n/translations.ts` to ensure natural colloquial terminology for farmers.
  3. **UI Polish**: Verify touch targets, contrast ratios, and responsive viewports on desktop and simulated mobile screens.
- **Key Files**:
  - `frontend/src/i18n/translations.ts`
  - `frontend/src/components/layout/`
  - `docs/DEMO_GUIDE.md`

---

## Member 2: Backend & Agricultural Knowledge Specialist
**Focus Area**: API Services, Diagnostic Grounding, and Knowledge Retrieval.

- **Primary Tasks**:
  1. **Knowledge Expansion**: Add 2-3 additional regional crops (e.g. Tomato Early Blight, Tur/Pigeon Pea Wilt) into `backend/app/data/knowledge/crops.json` using ICAR/MPKV package of practices.
  2. **API Verification**: Ensure FastAPI swagger docs at `http://127.0.0.1:8000/docs` are fully documented and tested.
  3. **Unit Tests**: Run `python -m pytest` in `backend/` and write additional test cases for custom symptom keywords.
- **Key Files**:
  - `backend/app/data/knowledge/crops.json`
  - `backend/app/services/agriculture/knowledge_service.py`
  - `backend/tests/`

---

## Member 3: Schemes, Data Persistence & Integrations Specialist
**Focus Area**: Government Schemes, SQLite Database, and Optional Live APIs.

- **Primary Tasks**:
  1. **Government Schemes Curation**: Verify official URLs and updated eligibility rules for additional Maharashtra DBT subsidies in `backend/app/data/schemes/schemes.json`.
  2. **Field Diary Features**: Test creating fields and adding observations to verify persistent SQLite storage.
  3. **Optional External Integrations**: If free API keys are obtained for Gemini (`GEMINI_API_KEY`) or OpenWeather (`OPENWEATHER_API_KEY`), test configuring them in `backend/.env`.
- **Key Files**:
  - `backend/app/data/schemes/schemes.json`
  - `backend/app/services/schemes/schemes_service.py`
  - `backend/app/models/field.py`
  - `backend/.env`
