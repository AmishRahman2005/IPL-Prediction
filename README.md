# IPL Dynasty AI Predictor 🚀

A premium, interactive web application that uses machine learning and Monte Carlo simulations to predict Indian Premier League (IPL) championships and playoff probabilities for the next five seasons (2027–2031).

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS v4.0 (for modern, glassmorphic UI design)
- **Charts & Visualization**: Recharts (radar charts, win-probability line graphs, confusion matrices)
- **Animations**: Framer Motion (smooth page transitions, micro-interactions, modal fly-ins)
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI (Python 3.11)
- **Machine Learning**: Scikit-Learn, XGBoost, LightGBM (classification models for predicting match outcomes)
- **Data & Databases**: Pandas, NumPy, SQLite (local historical matches repository)
- **Simulation**: Custom Monte Carlo simulation engine running up to 10,000 parallel tournament runs per retraining request.

---

## ⚡ Local Setup and Development

Follow these steps to run the application locally on your machine.

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **Python** (v3.11 recommended)

### 2. Backend Setup
Activate the virtual environment, install the dependencies, and run the FastAPI server:

```powershell
# Create a virtual environment (if not already done)
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (CMD):
.\venv\Scripts\activate.bat
# macOS/Linux:
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Start the backend server
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```
The API documentation will be available locally at `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup
Install dependencies and run the Vite development server:

```bash
# Install frontend dependencies
npm install

# Start Vite dev server
npm run dev
```
The React frontend will be hosted locally (typically at `http://localhost:5173` or `http://localhost:5174`). Open the provided link in your browser.

---

## 🌐 Production Deployment

The project is pre-configured to support two main hosting environments:

### Option A: Complete Deployment via Render Blueprints (Recommended)
This is the easiest way to deploy the entire stack together. The project contains a `render.yaml` file that coordinates the frontend static build and the backend Docker container.

1. **Commit and push all changes** to your GitHub repository:
   ```bash
   git add .
   git commit -m "Configure deployment and README"
   git push origin main
   ```
2. **Launch Blueprint on Render**:
   - Go to [Render Dashboard](https://dashboard.render.com).
   - Click **New +** in the top right, then select **Blueprint**.
   - Connect your GitHub repository `IPL-Prediction`.
   - Render will read the `render.yaml` configuration and set up:
     - `ipl-dynasty-backend` (as a Docker Web Service on the Free plan).
     - `ipl-dynasty-frontend` (as a Static Site, injecting the backend's URL automatically).
   - Click **Apply** to deploy.

---

### Option B: Frontend on Vercel + Backend on Render/Railway
This setup splits the build to leverage Vercel's fast global CDN for the static frontend.

1. **Deploy Backend (Render)**:
   - Create a new **Web Service** on Render.
   - Connect your GitHub repository.
   - Choose **Docker** as the runtime (it will automatically find the root `Dockerfile`).
   - Copy your service URL (e.g., `https://ipl-dynasty-backend.onrender.com`).

2. **Deploy Frontend (Vercel)**:
   - Import your repository on the [Vercel Dashboard](https://vercel.com).
   - Under **Environment Variables**, add:
     - **Key**: `VITE_API_BASE_URL`
     - **Value**: `https://<your-deployed-backend-url>` (replace with your Render backend URL)
   - Click **Deploy**.

---

## 📂 Project Structure

```
├── backend/
│   ├── main.py                # FastAPI endpoints, application state, startup logic
│   ├── database.py            # SQLite database initializer and data loaded
│   ├── data_pipeline.py       # Data cleaning, feature engineering, and stats compiler
│   ├── ml_system.py           # ML Model training, scoring, metrics calculations
│   └── simulation_engine.py   # Monte Carlo tournament predictor engine
├── src/
│   ├── assets/                # Images & global assets
│   ├── components/            # Reusable UI widgets
│   ├── App.tsx                # Main dashboard UI, charts, and state management
│   └── index.css              # Custom styling, dark mode layers, glassmorphism utilities
├── Dockerfile                 # Packages the Python FastAPI application
├── render.yaml                # Render Blueprint infrastructure-as-code
├── vercel.json                # Vercel routing rules
├── ipl_dynasty.db             # Packed SQLite database containing historical matches
└── package.json               # Frontend dependencies and scripts
```
