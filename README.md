# 🏗️ Multimodal Construction Intelligence Platform

An AI-powered construction management platform that uses Groq's high-speed multimodal capabilities to analyze construction site images, detect structural issues, estimate property values, plan projects, and provide daily site assistance.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend (Vite)                     │
│  Dashboard │ Safety │ Cracks │ Valuation │ Planning │ Assistant  │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP (axios)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FastAPI Backend (Uvicorn)                     │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Routers  │  │ Services  │  │ Schemas  │  │   Database    │  │
│  │ safety   │  │ llm.py    │  │ Pydantic │  │   SQLite      │  │
│  │ crack    │  │ weather.py│  │ models   │  │   results     │  │
│  │ valuation│  │           │  │          │  │   table       │  │
│  │ planning │  └─────┬─────┘  └──────────┘  └───────────────┘  │
│  │ assistant│        │                                           │
│  │ knowledge│        ▼                                           │
│  └──────────┘  ┌───────────┐  ┌───────────────┐                 │
│                │ Groq API  │  │  Open-Meteo    │                 │
│                │ (Qwen/LLM)│  │  Weather API   │                 │
│                └───────────┘  └───────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

## Features

| Feature | Description |
|---------|-------------|
| 🛡️ **Safety Monitoring** | Upload site photos → AI detects PPE violations, hazards, and risk levels |
| 🔍 **Crack Detection** | Upload structural images → AI classifies crack type, severity, and urgency |
| 💰 **Real Estate Valuation** | Enter property details → AI estimates market value with price range |
| 📐 **Project Planning** | Input project specs → AI generates phases, materials, manpower, and costs |
| 🌤️ **Daily Assistant** | Enter city + planned work → weather-aware daily briefing and safety tips |
| 💬 **Knowledge Chat** | Ask construction questions → AI expert answers with related topics |
| 📚 **History** | Browse all past analysis results saved in SQLite |

## Setup & Run

### Prerequisites
- Python 3.10+
- Node.js 18+
- A Groq API key (get one at https://console.groq.com/keys)

### 1. Backend

```bash
cd construction-ai/backend

# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure API key
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# Run the server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.  
Health check: `GET http://localhost:8000/api/health`

### 2. Frontend

```bash
cd construction-ai/frontend

# Install dependencies
npm install

# Run the dev server
npm run dev
```

The app will open at `http://localhost:5173`.

## API Endpoints

| Method | Endpoint | Input | Description |
|--------|----------|-------|-------------|
| POST | `/api/safety` | image + notes (form-data) | Analyze site safety |
| POST | `/api/crack` | image + location + notes (form-data) | Detect and classify cracks |
| POST | `/api/valuation` | property details (form-data) | Estimate property value |
| POST | `/api/planning` | project specs (JSON) | Generate project plan |
| POST | `/api/assistant/daily` | city + work description (JSON) | Daily site briefing |
| POST | `/api/knowledge` | question + history (JSON) | Construction Q&A |
| GET | `/api/history?type=X` | type: safety\|crack\|valuation\|planning\|assistant | Get saved results |
| GET | `/api/health` | — | Health check |

## Sample API Requests

### Safety Analysis
```bash
curl -X POST http://localhost:8000/api/safety \
  -F "image=@site_photo.jpg" \
  -F "notes=Check for PPE compliance"
```

### Project Planning
```bash
curl -X POST http://localhost:8000/api/planning \
  -H "Content-Type: application/json" \
  -d '{
    "project_type": "Residential",
    "area_sqft": 2000,
    "budget": 5000000,
    "duration_months": 12,
    "location": "Mumbai"
  }'
```

### Knowledge Chat
```bash
curl -X POST http://localhost:8000/api/knowledge \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the minimum curing time for M25 concrete?"}'
```

## Response Format

All endpoints return a consistent JSON wrapper:

```json
{
  "success": true,
  "data": {
    // Feature-specific fields (see schemas.py for full definitions)
  }
}
```

On error:
```json
{
  "success": false,
  "error": "Description of what went wrong"
}
```

## Tech Stack

- **Frontend**: React 19 (Vite) + plain CSS + Axios
- **Backend**: Python FastAPI + Uvicorn
- **AI**: Groq API (Qwen 3.8 27B multimodal: text + image)
- **Database**: SQLite (built-in sqlite3)
- **Weather**: Open-Meteo API (free, no key needed)

## Project Structure

```
construction-ai/
├── backend/
│   ├── main.py              # FastAPI app, CORS, routes
│   ├── database.py          # SQLite setup + helpers
│   ├── schemas.py           # Pydantic response models
│   ├── services/
│   │   ├── llm.py           # Groq AI multimodal integration
│   │   └── weather.py       # Open-Meteo weather service
│   ├── routers/
│   │   ├── safety.py        # Safety analysis endpoint
│   │   ├── crack.py         # Crack detection endpoint
│   │   ├── valuation.py     # Property valuation endpoint
│   │   ├── planning.py      # Project planning endpoint
│   │   ├── assistant.py     # Daily assistant endpoint
│   │   └── knowledge.py     # Knowledge Q&A endpoint
│   ├── uploads/             # Uploaded images
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main layout + navigation
│   │   ├── App.css          # All styles
│   │   ├── api.js           # API call functions
│   │   ├── components/      # Shared UI components
│   │   └── pages/           # Feature pages
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## License

MIT
