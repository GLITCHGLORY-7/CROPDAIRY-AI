# CropDiary AI — Hackathon Judge Demo Guide & Walkthrough
*3–5 Minute Concise, Repeatable Demonstration Plan Across All 10 Integrated Agricultural Modules*

---

## 1. Quick Verification & Test Reproduction

CropDiary AI comes equipped with a comprehensive automated test suite and production build that can be verified immediately:

```bash
# 1. Run Complete Automated Test Suite (130 Vitest Tests across 13 Files + 10 Zero-Dependency Node Suites)
npm test

# 2. Verify TypeScript Types & Production Build
npm run lint
npm run build

# 3. Test Agentic AI CLI Evaluator (HackerRank Evaluator Entry Point)
python main.py --requests data/sample_requests.json --output evaluation/predictions.json --data-dir data
```

---

## 2. 3–5 Minute Structured Demonstration Script

### Act 1: The Core Problem & The Connected Solution (0:00 – 0:45)
- **Problem Statement**:
  > *"Across Indian agriculture, smallholder farmers manage their operations in disconnected silos: sowing advice is based on guesswork, daily activities are unrecorded, disease treatments rely on expensive trial-and-error chemical sprays, and harvest revenue is tracked on paper slips. When network drops in rural fields, modern cloud apps stop working entirely."*
- **Solution Overview**:
  > *"CropDiary AI connects these separate activities into one unified, offline-first digital ledger. Every operational step—from selecting a crop to recording harvest sales—flows directly into automated financial, agronomic, and historical intelligence."*

### Act 2: Farm Setup & Farm-Specific Crop Planning (0:45 – 1:30)
- **Navigation**: Open `/app/farms` and `/app/crop-planner/new`.
- **Demonstration**:
  - Show the farmer's land holding divided into plots (e.g., Plot 1: 2.5 Acres, Clay Loam, Borewell Irrigation).
  - Select Season (**Kharif 2026**) and submit the planning wizard.
  - The **Crop Suitability Engine** scores candidate crops (Paddy: 92/100, Blackgram: 84/100, Cotton: 76/100), explaining exactly why based on soil pH, water budget, and estimated cultivation cost per acre.
  - Save the plan to link all subsequent field activities.

### Act 3: Offline Farm Diary & Real-Time Expense Tracking (1:30 – 2:30)
- **Navigation**: Open `/app/diary`.
- **Demonstration**:
  - **Simulate Rural Disconnection**: Open Chrome DevTools > Network tab > Toggle to **Offline** (or inspect the top banner).
  - Notice the amber notification bar: *"Offline Mode — Edits will sync automatically when back online"*.
  - Log a new field entry: *"Paddy Seedling Transplantation"* with 6 laborers and Rs 3,600 labor wage.
  - The entry saves instantly to native **IndexedDB**, displaying an amber **"Saved Locally (Pending Sync)"** status badge.
  - **Restore Connectivity**: Toggle network back to **Online**.
  - The background sync engine fires immediately, updates the status badge to **"Cloud Synced"** (green), and idempotently reconciles with the master ledger.
  - Show how this single diary entry automatically generated an expense record in the Financial Transactions ledger without double-entry.

### Act 4: Crop Doctor & Multilingual AI Assistant (2:30 – 3:30)
- **Navigation**: Open `/app/crop-doctor` and `/app/assistant`.
- **Demonstration**:
  - In **Crop Doctor**, upload an image of infected leaves or select symptoms (*spindle lesions with grey centres*).
  - The engine cross-references the ICAR ground-truth database to diagnose **Rice Blast (*Pyricularia oryzae*)** with 94% confidence.
  - Highlight the safety policy: Cultural and biological measures (*Pseudomonas fluorescens*) are prioritized; acutely toxic WHO Class Ia/Ib chemicals are strictly blocked.
  - In **AI Farm Assistant**, demonstrate natural voice or text query in **Tamil** (*"என் நெல் பயிரில் இலைக்கருகல் நோய் உள்ளது, என்ன மருந்து தெளிக்க வேண்டும்?"*) or English. The assistant responds with grounded, verified agricultural guidance linked to the farmer's active plot.

### Act 5: Harvest Sales, P&L & Multi-Season Retrospective (3:30 – 4:30)
- **Navigation**: Open `/app/finance` and `/app/history`.
- **Demonstration**:
  - Record a harvest of 60 Quintals and a sale of 55 Quintals @ Rs 2,400/Qtl (Rs 132,000).
  - Show the **Finance Dashboard**: Exact minor-unit paise calculations show Gross Revenue (Rs 132,000), Cultivation Expenses (Rs 6,000), and Net Profit (Rs 126,000).
  - Navigate to **Farm History (`/app/history`)**: Show how historical cycles aggregate into longitudinal metrics—cost of cultivation per quintal (Rs 100/Qtl) and profit per acre (Rs 50,400/Acre)—giving farmers clear data to choose next season's optimal crops.
  - Demonstrate the 1-click **Export CSV** download and print report.

---

## 3. Demo Credentials & Sample Accounts

| Role | Email | Password | Dataset |
|---|---|---|---|
| **Primary Demo Farmer** | `farmer@cropdiary.ai` | `farmer123` | Pre-populated with 2 farms, 4 plots, active crop plans, diary records, and financial transactions. |
| **Clean Test Account** | Register any new email (e.g. `test@deltafarm.in`) | Any 8+ char password | Starts with clean state to demonstrate initial onboarding and first farm creation. |

---

## 4. Transparent Fallback Disclosures

To ensure strict hackathon judging honesty:
- **Sample Data**: Demo records in local storage are clearly marked with `demo-` prefixes and can be reset at any time via Settings > "Reset Local Demo Records".
- **AI Integrations**: If `VITE_GEMINI_API_KEY` is not provided in `.env`, the system automatically falls back to deterministic ICAR rulebases and Agmarknet DMI benchmarks, displaying a transparent informative badge.
- **Offline Storage**: Uses browser-native IndexedDB (`cropdiary_offline_db`) which operates completely locally on the device.
