<div align="center">

# ♿ AccessMap – AI-Powered Accessibility Mapper

### _Discover, Verify & Report Wheelchair-Accessible Places with AI_

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/Gemini_AI-2.0_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-Object_Detection-FF6F00?style=for-the-badge&logo=pytorch&logoColor=white)](https://ultralytics.com)

---

**AccessMap** is a full-stack web application that leverages **Google Gemini AI**, a **custom-trained YOLOv8 model**, **SerpAPI Google Maps**, and **Supabase PostgreSQL** to help users discover, classify, and report wheelchair-accessible infrastructure in public places.

</div>

---

## 🌟 Key Features

| Feature | Description |
|---|---|
| 🤖 **AI Image Classification** | Upload photos → Gemini 2.0 Flash analyzes ramps, stairs, entrances with confidence scores |
| 🎯 **YOLOv8 Object Detection** | Custom-trained `best.pt` model detects ramps & stairs with bounding boxes in real-time |
| 🗺️ **Interactive Map** | SerpAPI-powered Google Maps search with Leaflet.js for live exploration |
| 🗄️ **Supabase Cloud Database** | All places, reports, searches, and activities are persisted to PostgreSQL |
| 👥 **Community Reporting** | Submit field reports with photos, AI verification, and community upvotes |
| 📊 **Admin Dashboard** | Search analytics, activity logs, database management, and system monitoring |
| 🔄 **Resilient Architecture** | Automatic local fallback when cloud services are unavailable |
| ♿ **Accessibility Standards** | Built-in reference guide for ADA, EN 17210, and ISO 21542 compliance |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                   │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────────┐  │
│  │ Discover │ │   Map    │ │AI Scanner │ │  Community   │  │
│  │  Cards   │ │ Leaflet  │ │  Upload   │ │    Feed      │  │
│  └────┬─────┘ └────┬─────┘ └─────┬─────┘ └──────┬───────┘  │
│       │             │             │              │           │
│  ┌────┴─────────────┴─────────────┴──────────────┴───────┐  │
│  │              Service Layer (API Clients)               │  │
│  │  classifierService • dbService • serpApiService        │  │
│  └────────────────────────┬──────────────────────────────┘  │
└───────────────────────────┼──────────────────────────────────┘
                            │ HTTP REST
┌───────────────────────────┼──────────────────────────────────┐
│                    Backend (Express.js)                       │
│  ┌────────────────────────┴──────────────────────────────┐  │
│  │                  REST API Router                       │  │
│  │  /api/places • /api/reports • /api/classify            │  │
│  │  /api/searches • /api/activities • /api/serp/*         │  │
│  └──┬──────────────┬───────────────┬─────────────────────┘  │
│     │              │               │                         │
│  ┌──┴───┐   ┌──────┴────┐   ┌─────┴──────┐                 │
│  │Supabase│  │Model Mgr │   │ SerpAPI    │                 │
│  │Service │  │Gemini+YOLO│   │ Service    │                 │
│  └──┬───┬┘  └──────┬────┘   └─────┬──────┘                 │
│     │   │          │               │                         │
│  ┌──┴┐ ┌┴───────┐ ┌┴────────────┐ ┌┴────────────┐          │
│  │DB │ │Local   │ │Gemini API  │ │SerpAPI     │          │
│  │   │ │Fallback│ │+ YOLO μsvc │ │Google Maps │          │
│  └───┘ └────────┘ └────────────┘ └────────────┘          │
└──────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **React 19** + **TypeScript 7** – Component-based UI
- **Vite 8** – Lightning-fast HMR dev server
- **Tailwind CSS 4** – Utility-first styling
- **Leaflet.js 1.9** – Interactive maps
- **Lucide React** – Beautiful icons
- **Framer Motion** – Smooth animations

### Backend
- **Express.js** – HTTP server
- **TSX** – TypeScript execution runtime
- **@google/genai** – Gemini AI SDK
- **@supabase/supabase-js** – Supabase client

### AI / ML
- **Google Gemini 2.0 Flash** – Multimodal image classification
- **YOLOv8 (Ultralytics)** – Custom object detection (`best.pt`)
- **FastAPI + Uvicorn** – Python inference microservice
- **PyTorch** – Deep learning backend

### Database & External APIs
- **Supabase (PostgreSQL)** – Cloud database with RLS
- **SerpAPI** – Google Maps search engine
- **Local JSON store** – Resilient fallback

---

## 📦 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org) v18+
- [Python](https://python.org) 3.9+ _(optional, for YOLOv8)_
- [Supabase](https://supabase.com) account _(free tier)_

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your API keys:

```env
# Required
GEMINI_API_KEY="your-gemini-api-key"

# Recommended (enables cloud persistence)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"

# Recommended (enables realistic map search)
SERPAPI_KEY="your-serpapi-key"
```

### 3. Setup Supabase Database

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in the dashboard
3. Copy and run the contents of [`supabase/schema.sql`](supabase/schema.sql)
4. Copy your Project URL and Anon Key from **Settings → API**

### 4. Run the Application

```bash
npm run dev
```

🚀 Open **http://localhost:3000**

### 5. (Optional) YOLOv8 Microservice

```bash
pip install ultralytics fastapi uvicorn pillow
python server/ml/yolo_service.py
```

> The YOLO service auto-starts with the Express server if Python is available.

---

## 📁 Project Structure

```
accessibility-mapper/
├── src/
│   ├── App.tsx                         # Main app (routing, state, filters)
│   ├── components/
│   │   ├── Header.tsx                  # Navigation tabs
│   │   ├── PlaceCard.tsx               # Place listing cards
│   │   ├── PlaceDetailModal.tsx        # Place detail view
│   │   ├── MapDiscoveryView.tsx        # Map exploration
│   │   ├── RealisticInteractiveMap.tsx # SerpAPI live map
│   │   ├── AiScannerView.tsx           # AI classification UI
│   │   ├── AiClassifierModal.tsx       # Classification modal
│   │   ├── CommunityFeed.tsx           # Reports feed
│   │   ├── MLModelStudio.tsx           # ML model dashboard
│   │   ├── AdminPortal.tsx             # Admin panel
│   │   ├── StandardsGuide.tsx          # Standards reference
│   │   ├── AddPlaceModal.tsx           # Add place form
│   │   └── MobileNav.tsx               # Mobile navigation
│   ├── services/
│   │   ├── classifierService.ts        # AI API client
│   │   ├── dbService.ts                # DB tracking client
│   │   └── serpApiService.ts           # Map search client
│   ├── types/
│   │   └── accessibility.ts            # TypeScript interfaces
│   └── data/
│       └── mockPlaces.ts               # Seed data
├── server/
│   ├── routes/api.ts                   # REST API (30+ endpoints)
│   ├── db/
│   │   ├── supabase.ts                 # Supabase provider
│   │   └── store.ts                    # Local fallback store
│   ├── services/
│   │   └── serpApiService.ts           # SerpAPI integration
│   └── ml/
│       ├── modelManager.ts             # AI model orchestrator
│       ├── yolo_service.py             # YOLO FastAPI service
│       ├── yolo_detector.py            # YOLO detection logic
│       └── best.pt                     # Trained weights
├── supabase/
│   └── schema.sql                      # Database schema
├── server.ts                           # Server entry point
├── vite.config.ts                      # Vite configuration
└── .env.example                        # Environment template
```

---

## 🗄️ Database Schema

The Supabase PostgreSQL database has **4 main tables**:

| Table | Purpose | Key Fields |
|---|---|---|
| `places` | Mapped accessible locations | name, category, accessibility_score, features (JSONB), lat/lng |
| `community_reports` | User-submitted audit reports | place_id, ai_classification (JSONB), upvotes, is_verified |
| `user_searches` | Search query tracking | query, category, results_count, source |
| `user_activities` | User interaction log | action, target_id, details (JSONB) |

All tables have:
- ✅ Row Level Security (RLS) enabled
- ✅ Public read/write policies
- ✅ Performance indexes
- ✅ Automatic timestamps

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health + AI/DB status |
| `GET/POST` | `/api/places` | List / create places |
| `GET/PUT/DELETE` | `/api/places/:id` | Get / update / delete place |
| `GET/POST` | `/api/reports` | List / create reports |
| `POST` | `/api/classify` | AI image classification |
| `GET/POST` | `/api/searches` | Search history log |
| `GET` | `/api/searches/analytics` | Search trend analytics |
| `GET/POST` | `/api/activities` | Activity audit log |
| `GET` | `/api/serp/search` | Google Maps search via SerpAPI |
| `GET` | `/api/db/status` | Database connectivity status |

---

## 🤖 AI Pipeline

AccessMap uses a **dual-engine hybrid AI** approach:

1. **Google Gemini 2.0 Flash** → Rich multimodal analysis with natural language explanations
2. **YOLOv8 Custom Model** → Fast bounding-box detection for ramps & stairs

The `modelManager.ts` orchestrates both engines, merging results for maximum accuracy:

```
Image → [Gemini Analysis] + [YOLO Detection] → Merged Classification Result
         ↓                    ↓
    Category, Score,     Bounding Boxes,
    Features, Summary    Confidence Scores
```

---

## 📊 Admin Portal

Access the admin dashboard at **`/admin`** or **`/#/admin`**:

- 📈 **Search Analytics** – Top queries, categories, daily trends
- 📋 **Activity Logs** – Full user interaction audit trail
- 🗄️ **Database Monitor** – Table health, record counts, connectivity
- 🔄 **Data Sync** – Seed local data to Supabase cloud
- ⚙️ **Model Config** – Switch AI engines, adjust thresholds

---

## 🎨 Color-Coded Accessibility Levels

| Level | Color | Score Range |
|---|---|---|
| ✅ Fully Accessible | Green | 80 – 100 |
| ⚠️ Partially Accessible | Amber | 40 – 79 |
| ❌ Barrier Reported | Red | 0 – 39 |

---

## 📜 Available Scripts

```bash
npm run dev          # Start dev server (Express + Vite HMR)
npm run start        # Start production server
npm run build        # Build frontend for production
npm run preview      # Preview production build
npm run lint         # Type-check with TypeScript
npm run ml:service   # Start YOLO microservice manually
```

---

## 🔮 Future Roadmap

- [ ] User authentication with Supabase Auth
- [ ] Real-time collaboration via Supabase Realtime
- [ ] Progressive Web App (PWA) with offline support
- [ ] Accessible route planning between places
- [ ] Crowdsourced YOLO model retraining
- [ ] Multi-language internationalization
- [ ] AR accessibility overlay
- [ ] Voice-guided navigation

---

## 📄 License

This project is developed for educational and accessibility advocacy purposes.

---

<div align="center">

**Built with ❤️ for accessibility**

_Making the world more navigable, one ramp at a time._

</div>
