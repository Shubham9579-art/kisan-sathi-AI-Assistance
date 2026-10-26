# KisanSathi AI (किसानसाथी AI)
> **Smart Farming. Simple Guidance. Better Decisions.**  
> *स्मार्ट शेती. सोपा सल्ला. अचूक निर्णय.*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![SQLite](https://img.shields.io/badge/SQLite-Persistent-003B57.svg?logo=sqlite&logoColor=white)](https://sqlite.org)
[![Tests](https://img.shields.io/badge/Pytest-31%20Passed-brightgreen.svg)](https://docs.pytest.org)

---

## 1. What is KisanSathi AI?

**KisanSathi AI** is a context-aware agricultural AI companion built for Indian farmers, initially focused on Maharashtra's major agro-climatic zones and crops (Soybean, Cotton, Sugarcane, Onion, and Pomegranate).

### Our Hackathon Differentiation
Most agricultural projects in hackathons are generic chatbot wrappers that hallucinate chemical pesticide dosages or require expensive cloud APIs. 

**KisanSathi is a context-aware farming companion, not just a chatbot.** It correlates:
1. **The farmer's specific crop and registered plot history** (e.g. Gat No. 42, Soybean at Flowering stage).
2. **Recent on-field observations** (e.g. recent yellow sticky trap counts, weeding dates).
3. **Local agro-climatic weather patterns** (e.g. 5-day rainfall probability and spraying windows).
4. **Curated agricultural knowledge and links** to organizations including ICAR, MPKV Rahuri, VNMKV Parbhani, Dr. PDKV Akola, and VSI Pune; the app does not independently verify every record or current advisory.
5. **Government subsidy eligibility rules** (PM-KISAN, Namo Shetkari Mahasanman Nidhi, PM Fasal Bima Yojana, MahaDBT Micro-Irrigation).

---

## 2. Key Features

- **Personalized Farm Dashboard**: Real-time overview of the farmer's profile, local weather, registered plots, prioritized farming tasks, and recent consultations.
- **Crop Scouting Calendar**: Free weekly field-check reminders based on planting dates and the latest diary entry, with growth-stage-aware observation prompts in Marathi, Hindi, and English. These are scouting reminders, not diagnoses or treatment instructions.
- **Photo-Based Daily Field Plan**: Select a registered field, upload a crop photo, and get a preliminary assessment with actionable daily tasks. When Gemini vision is configured, the image is analyzed visually; otherwise, the interface clearly labels its text/rule-based fallback. The six-hour irrigation task is a soil-moisture check, not an unconditional watering instruction, and completed tasks can be saved in the field diary.
- **Transparent dashboard indicators**: Summary indicators are derived from weather-risk heuristics, not direct field measurements or confirmed crop/pest diagnoses. Demo weather and its alerts are illustrative; use current local weather and inspect the field before acting.
- **AI Farming Assistant (Multilingual & Speech-Enabled)**:
  - Interactive chat in **Marathi (मराठी)**, **Hindi (हिन्दी)**, and **English**.
  - Browser-native Speech-to-Text (STT) and Text-to-Speech (TTS) voice reading.
  - Answers organized into 4 clear sections: *What might be happening*, *What to do now*, *What to monitor*, and *When to consult an expert*.
  - Displays reference organization portals when available; current linked guidance is not claimed to have been checked.
  - When Gemini is configured, answers can use matching crop records from the curated knowledge base; without a key, the app returns clearly labelled, rule-based guidance from that knowledge base. This is retrieval-augmented guidance, not custom model training.
- **Crop Health Checker**:
  - Image upload and preview with 5MB validation.
  - Uses configured Gemini vision for image analysis; if unavailable, clearly identifies text/rule-based guidance instead.
  - Symptom analysis with confidence tiers.
  - Transparent rule-based indicators and strict warnings against unverified chemical usage.
- **Weather & Operational Advisory**:
  - Five-day provider forecast when configured; otherwise clearly labelled illustrative weather data.
  - Practical advisories organized by farm operations (Irrigation, Foliar Spraying, Harvesting, and Soil Prep).
- **Government Schemes & Eligibility Calculator**:
  - Searchable and category-filtered catalog of Maharashtra & Central farmer schemes.
  - Preliminary checklist for acreage, location, document status, scheme-specific details, and unknown answers.
  - Never presents a percentage or a questionnaire result as an official eligibility decision.
  - Scheme records must be confirmed on the linked official portal; records last checked in 2024 are marked as needing verification.
  - Shows known checklist gaps and leaves unknown scheme conditions unresolved for verification on the official portal.
- **My Fields & Farmer Diary**:
  - Create, view, edit, and delete fields with persistent SQLite storage.
  - Chronological timeline of dated field observations.
- **Private farmer accounts**:
  - Anyone can explore the sample demo without an account; demo fields are read-only and demo chat is not saved.
  - Signed-in farmers have private fields, observations, assessments, and chat history.
  - Passwords are stored as salted PBKDF2 hashes; login sessions use expiring, HTTP-only cookies.
  - This prototype does not yet include email verification, password recovery, or distributed rate limiting; complete those before broad public account rollout.
- **Agricultural Safety & Honesty**:
  - Prominently labels demo mode vs. live AI.
  - Designed to avoid unverified pesticide doses; all AI-generated guidance remains preliminary and must be checked against current product labels and local advice.

---

## 3. Architecture & Workspace Structure

```
kisansathi-ai/
  frontend/                  # React 18 + Vite + TypeScript + Tailwind CSS
    public/                  # Static assets & brand icons
    src/
      components/
        layout/              # Header, Sidebar, Footer
        dashboard/           # ProfileCard, WeatherCard, QuickActions, FieldsOverview, TasksCard
        chat/                # ChatBox, ChatMessageItem, SuggestedQuestions
        crops/               # CropHealthChecker, AssessmentResultCard
        weather/             # ForecastCard, FarmingAdvisoryCard
        schemes/             # SchemeCard, EligibilityModal
        fields/              # FieldCard, FieldModal, ObservationModal
        shared/              # Badge, EmptyState, LoadingSpinner, SafetyNotice, LanguageSelector
      pages/                 # DashboardPage, AssistantPage, CropHealthPage, WeatherPage, etc.
      services/api.ts        # Typed centralized REST API client
      hooks/                 # useAuth, useLanguage (i18n state), useSpeech (STT / TTS)
      i18n/translations.ts   # Centralized Marathi, Hindi, English translations
      types/index.ts         # TypeScript data contracts
      utils/                 # Date and string formatters
      App.tsx
      main.tsx
      index.css
    package.json
    vite.config.ts
    tsconfig.json
  backend/                   # FastAPI + SQLAlchemy 2.0 + SQLite
    app/
      api/routes/            # auth, health, dashboard, chat, crops, weather, schemes, fields
      core/config.py         # App configuration & environment parsing
      db/session.py          # SQLAlchemy SQLite connection and session management
      models/                # User, AuthSession, Field, Observation, ChatSession, ChatMessage, CropAssessment
      schemas/               # Pydantic v2 schemas for request/response validation
      repositories/          # Clean database abstraction layer
      services/              # Knowledge retrieval, Assistant, Weather, Schemes, Assessment
      data/
        knowledge/crops.json # Curated crop guidance and reference links
        schemes/schemes.json # Scheme records pending official verification
        demo/seed_data.py    # Auto-seeding demonstration fields and dialogue
      main.py                # FastAPI entry point, CORS, startup seeding
    tests/                   # Pytest automated test suite
    requirements.txt
    pytest.ini
    .env.example
  docs/
    ARCHITECTURE.md          # Technical blueprint & module flow
    API.md                   # Full REST API specifications
    DEMO_GUIDE.md            # 4-minute judging presentation script
    SAFETY.md                # Agricultural safety, CIBRC policy & disclaimers
    TEAM_TASKS.md            # Role division for 2-3 B.Tech student team members
  run_backend.bat            # One-click Windows backend launcher
  run_frontend.bat           # One-click Windows frontend launcher
  start_kisansathi.bat       # Starts both services and opens the frontend
  wait_for_kisansathi.ps1    # Opens the frontend after both services respond
  .gitignore
  README.md
```

---

## 4. Prerequisites (Windows)

- **Python**: Version 3.10+ (tested on Python 3.14)
- **Node.js**: Version 18+ (workspace includes portable Node.js v20.18.0)
- **Web Browser**: Chrome, Edge, or Brave (supporting Web Speech API for voice features)

---

## 5. Quick Start (Windows)

You can launch the entire system with one batch file, or start each service manually.

### Method A: Start Everything with One Click

Double-click `start_kisansathi.bat`. It opens the backend and frontend in separate windows, waits until both are responding, and then opens **`http://localhost:5173`** in your browser. Keep both windows open while using the app. Close them (or press `Ctrl+C` in each) when finished.

The frontend uses the same-origin `/api/v1` path and Vite proxies it to the local backend. Keep this default for local development so HTTP-only account cookies work correctly.

---

### Method B: Start Services Manually

#### 1. Start the Backend
Open a command prompt or PowerShell in the root workspace:

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (if not already created)
python -m venv venv

# Activate virtual environment
# In Command Prompt:
venv\Scripts\activate
# Or in PowerShell:
.\venv\Scripts\Activate.ps1

# Install dependencies
python -m pip install -r requirements.txt

# Start FastAPI server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Backend API**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **Health Check**: `http://127.0.0.1:8000/api/v1/health`

#### 2. Start the Frontend
Open a **second terminal window** in the root workspace:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

- **Frontend Application**: `http://localhost:5173`

---

## 6. Use KisanSathi Online

The local launch scripts require your computer to keep the frontend and backend running. To use the app after closing them, deploy it to an online host. The included `Dockerfile` packages the frontend and API together, and `render.yaml` configures a Render web service with a persistent database disk.

### Deploy with Render

1. Push this project to a GitHub repository. Keep `.env` files and API keys out of Git.
2. In Render, create a **Blueprint** and connect that repository.
3. Review the free web service settings from `render.yaml`, then deploy. This free setup has no persistent disk: SQLite data such as accounts, fields, and chat history can be erased when the service restarts, sleeps, or is redeployed. Do not use it for important or long-term farmer records.
4. Wait for the service health check to pass, then open the `onrender.com` URL Render provides. The same hosted URL serves the website and API, so no local frontend or backend needs to stay open. Live weather uses Open-Meteo; sample weather and farmer records are only enabled outside production.
5. Optional: add `GEMINI_API_KEY` through the Render dashboard's environment settings to enable generated AI responses. Without it, the assistant uses the curated rule-based knowledge base. Never place keys in frontend files or commit them to the repository.

### Connect `kisansathiai.com`

The project is configured to serve the website and API from one Render web service. A custom domain must be registered and linked to that deployed service; this cannot be completed from the source code alone.

1. Check out and register `kisansathiai.com` with a domain registrar. Keep the domain in your own account and use your own payment and contact details.
2. In the Render dashboard, open the deployed `kisansathi-ai` web service, go to **Settings → Custom Domains**, and add `kisansathiai.com`. Render also adds the matching `www` name and redirects it according to its custom-domain setup.
3. At your registrar's DNS settings, enter the records Render displays for the service. For a root domain, Render supports an `ALIAS`/`ANAME` record or (where needed) the A record value currently documented by Render. Use a `CNAME` for `www` if Render requests it. Remove conflicting `AAAA` records.
4. Return to Render and verify the domain. Render provisions HTTPS after DNS verification; DNS changes can take time to propagate.
5. Test both `https://kisansathiai.com` and `https://www.kisansathiai.com` after verification.

Do not guess DNS values from this repository: use the current values shown in the Render service dashboard and registrar. See [Render's custom-domain guide](https://render.com/docs/custom-domains) for current instructions. Registration, renewal, and the Render hosting plan may involve charges; confirm current pricing before purchase.

The sample demo is public and read-only. Visitors can use the assistant and crop checker, but guest conversations and assessments are not saved. Creating an account enables private saved farm data; each account can only access its own fields, observations, crop assessments, and chat history.

### Hackathon Demo Sign-In

Visitors can explore the sample demo without signing in; guest farm records are read-only. Create a private account with your own email and password to save fields and diary records. Do not enter real personal or sensitive information into a shared device or public demonstration.

The legacy demo-login API option is disabled in production and in the Render blueprint. The current interface does not offer demo-code sign-in.

The startup migration adds account-ownership columns without assigning old, unowned records to the public demo or to a new account. Those legacy records remain in the database but are not shown to guests or new accounts. Back up the database before deployment and do not delete the old database until you have confirmed what should happen to any legacy records.

This is an initial account implementation, not a fully hardened commercial identity service. It does not yet provide email verification, password reset, or distributed login rate limiting. Add those protections and review current hosting/security requirements before inviting large numbers of users or storing sensitive information.

## 7. Optional External Integrations

KisanSathi AI is built to run 100% offline in deterministic demo mode. However, if you have API keys, you can activate live integrations by copying `backend/.env.example` to `backend/.env`:

```ini
# Optional Gemini AI Integration
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here

# Optional OpenWeather Integration
OPENWEATHER_API_KEY=your_openweather_key_here
```

When keys are not provided, the system gracefully uses the local agricultural knowledge base and simulations, visibly displaying the honest `DEMO DATA` badge.
When Gemini is configured, chat prompts and crop photos may be sent to Google for processing. Browser-native speech recognition may also use a browser-provided service; avoid speaking or submitting personal or sensitive information.

---

## 8. Running Backend Automated Tests

To run the automated test suite:

```bash
cd backend
python -m pytest
```

### Verified Test Results
```
32 tests passed across authentication, chat, crop assessment, fields, health, schemes, and weather.
```

### Verified Frontend Build Check
```bash
cd frontend
npm run build
```
Result:
```
✓ Vite production build completed successfully.
dist/index.html                   0.63 kB
✓ Production build completed successfully.
```

---

## 9. Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `'node' is not recognized` | Node.js not found in system PATH | `run_frontend.bat` automatically links the bundled workspace Node runtime (`.tools\node-v20.18.0-win-x64`). |
| Backend dependencies fail to install | First run needs access to the Python package index | Check internet access, then retry `run_backend.bat`; an already prepared virtual environment can start without reinstalling packages. |
| `Port 8000 or 5173 already in use` | Another service is using the demo port | Stop the existing service, then run `start_kisansathi.bat` again. |
| `SpeechRecognition not supported` | Browser lacks Web Speech API | Use Google Chrome or Microsoft Edge. Text chat remains 100% functional without voice. |

---

## 10. Known Limitations & Future Roadmap

- **Account hardening**: Add email verification, password recovery, and distributed abuse/rate-limit controls before broad public use.
- **On-Device Computer Vision**: Photo analysis can use the optional Gemini vision API when configured; without it, the app labels the local text/rule-based fallback. No custom or on-device crop disease model is included.
- **WhatsApp Bot Interface**: Integrating a Twilio or WhatsApp Business webhook so farmers can send voice notes and photos directly through WhatsApp.

---

## 11. Hackathon Team & Acknowledgements

Built with dedication by 1st-Year B.Tech Students:
- **Member 1**: UI/UX Design, Multilingual Localization & Judging Pitch Lead
- **Member 2**: FastAPI Backend, Knowledge Retrieval & Pytest QA
- **Member 3**: Database Persistence, Government Schemes & Advisory Logic

*Special thanks to ICAR, MPKV Rahuri, and Government of Maharashtra Agriculture Department for publicly documented agricultural package of practices.*
