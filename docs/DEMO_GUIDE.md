# KisanSathi AI — Hackathon Judging & Live Demonstration Guide

Follow this guided demonstration script for a 3 to 5-minute presentation to judges.

---

## 1. Quick Launch Check
Before presenting, ensure both terminals are running:
- **Terminal 1 (Backend)**: `run_backend.bat` (running on `http://127.0.0.1:8000`)
- **Terminal 2 (Frontend)**: `run_frontend.bat` (running on `http://localhost:5173`)

Open Chrome/Edge at `http://localhost:5173`.

### Account Access
- Guests can browse the sample demo and its fields in read-only mode.
- To save private fields and diary entries, create an account from **Sign in**. Do not enter real personal information on shared demonstration devices.

---

## 2. Walkthrough Steps

### Step 1: Dashboard & Multilingual Localization (30 seconds)
1. **Show the Dashboard**: Point out the clean rural agricultural palette (forest green, warm cream), the demo farmer profile (*Raju Patil, Baramati, Pune*), and the weather forecast card.
2. **Switch Language**: Click the language selector in the top-right header:
   - Switch to **मराठी (Marathi)**: Notice every card, button, and navigation item translates instantly.
   - Switch to **हिन्दी (Hindi)**: Show seamless multilingual support.
   - Switch to **English** if judges prefer English, or keep Marathi for local Maharashtra impact.
3. **Show Photo-Based Daily Field Tasks**: Select a registered field, upload a clear crop photo, and choose **Analyze photo and create today's tasks**. Point out the photo-analysis status: Gemini vision runs only when a Gemini API key is configured; otherwise, the app labels its local text-based fallback. The irrigation task is to check root-zone moisture within six hours; irrigate only if the soil is dry and rain is not expected. Signed-in farmers can save completed tasks to the field diary.

### Step 2: Context-Aware AI Farming Assistant (60 seconds)
1. Navigate to **AI Assistant** in the sidebar.
2. Explain that signed-in chat history is stored in the configured application database; guest chats are not saved.
3. Click one of the suggested sample questions or type:
   > *"माझ्या सोयाबीनच्या पानांवर पिवळे डाग पडले आहेत, काय उपाय करावे?"*
4. Show the structured response and explain that possible causes are preliminary indicators, not a confirmed diagnosis. Do not present a generic pesticide dose or threshold as authoritative.
5. Point out the agricultural reference links when shown; explain that links and guidance should be checked for current applicability.
6. Click the **Audio Speaker icon** to demonstrate browser-native text-to-speech; the available voice and accent depend on the browser and device.
7. Click the **Copy Answer** button to show clipboard copying.

### Step 3: Crop Health Checker & Symptom Scanner (45 seconds)
1. Navigate to **Crop Health** in the sidebar.
2. Click the quick demo button: **"कापूस गुलाबी बोंडअळी (Sample 2)"**.
3. Note how the crop (*Cotton*), growth stage (*Boll Formation*), and symptoms (*Rosette flowers, exit holes on bolls*) auto-populate.
4. Click **"आरोग्य विश्लेषण सुरू करा" (Analyze Crop Health)**.
5. Highlight the honest disclosure:
   - Badge clearly indicates: *"नियम-आधारित डेमो विश्लेषण (Honest Indicator)"*.
   - Visual analysis is reported only when Gemini vision is configured; without it, the app labels the local text/rule-based fallback.
   - Shows possible causes and monitoring advice as preliminary indicators rather than a confirmed diagnosis.

### Step 4: Government Schemes & Eligibility Calculator (45 seconds)
1. Navigate to **Govt Schemes** in the sidebar.
2. Show curated Maharashtra & Central schemes (*PM-KISAN, Namo Shetkari Mahasanman Nidhi, MahaDBT Micro-Irrigation*).
3. Click **"पात्रता तपासा" (Check Eligibility)** on *Namo Shetkari Yojana*.
4. Adjust acreage to `3.0` acres, keep 7/12 extract checked, and click **"पात्रता तपासा"**.
5. Show the preliminary checklist, any unknown requirements, the official portal link, and the legal disclaimer. Do not describe the result as official approval or guaranteed eligibility.

### Step 5: My Fields & Farmer Diary Persistence (60 seconds)
1. Navigate to **My Fields & Diary**.
2. Guests can inspect the read-only sample fields (*Gat No. 42 Soybean, Riverbank Sugarcane*). A newly created private account starts with its own account data.
3. Click **"+ नवीन शेत जोडा" (Add New Field)**:
   - Name: *गट क्र. ८८ (Gat No. 88 - New Wheat Plot)*
   - Crop: *Wheat (गहू)*
   - Area: *1.5 Acres*
   - Location: *Shirur, Pune*
4. Click **"जतन करा" (Save)** -> Field appears immediately on screen.
5. Click **"नोंद जोडा" (Add Observation)** on the newly created field:
   - Enter note: *खत व्यवस्थापन पूर्ण केले आणि पहिले पाणी दिले.*
   - Click Save -> Observation is added to the timeline.
6. **Hard Refresh the Browser (F5)**:
   - Notice that the newly created field and observation remain intact.
   - This proves persistent SQLite backend storage, not ephemeral browser memory.

### Step 6: Weather & Operational Guidance (30 seconds)
1. Navigate to **Weather**.
2. Select district: *Satara* or *Nashik*.
3. Show the **Farming Advisory by Operations**:
   - Irrigation advice: check soil moisture and the actual local forecast before watering.
   - Spraying advisory: check live wind/rain conditions, product label, and local agricultural guidance; do not use a demo forecast to choose a spray window.
   - Clear disclosure badge: *"DEMO DATA (Maharashtra Agro-Climatic Simulation)"*. Demo values and alerts are illustrative, not a real local forecast; do not use them to time farm operations.

---

## 3. Highlighting Hackathon Differentiation to Judges
When wrapping up, emphasize:
1. **Not Just a Generic Chatbot**: It can incorporate a farmer's registered field and crop stage as context.
2. **Honesty & Safety First**: Explicitly labels demo modes vs. configured integrations and warns against treating preliminary suggestions as field diagnoses or authoritative pesticide directions.
3. **Offline & Low-Cost Ready**: Runs locally on an ordinary Windows laptop with zero mandatory API costs.
