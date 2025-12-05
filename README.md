# My Asset - Personal Wealth Management

**My Asset** is a robust, cloud-native application designed to help you track, visualize, and manage your financial portfolio. Built with React and Supabase, it offers enterprise-grade data security, real-time synchronization, and AI-powered insights.

**Current Version:** Beta 1.0

## 🚀 Features

### 1. Asset Tracking
- **Comprehensive Support:** Track Stocks, Fixed Deposits, EPF, Property, REITs, and custom assets.
- **CRUD Operations:** Easily create, read, update, and delete records.
- **Batch Operations:** Select multiple records to delete in bulk.

### 2. Dashboard & Analytics
- **Visual Overview:** Interactive pie charts showing asset allocation.
- **Key Metrics:** Real-time calculation of Total Net Worth, Top Asset Classes, and Total Active Records.
- **Mobile First:** Fully responsive design that works perfectly on Desktop, Tablet, and Mobile.

### 3. Property Analysis
- **Cash Flow Tracking:** dedicated module for property investments.
- **ROI Calculation:** Automatically compares Total Invested (Outflow) vs Total Returned (Rent/Income).
- **Visualization:** Progress bars indicating investment recovery and profit phases.

### 4. AI Financial Assistant
- **Powered by Gemini 2.5:** Ask questions about your portfolio in natural language.
- **Context Aware:** The AI understands your specific data context to provide relevant answers.

### 5. Robust Backend (Supabase)
- **Authentication:** Secure Email/Password login.
- **Row Level Security (RLS):** Data is isolated per user at the database level.
- **Cloud Database:** All data is stored in PostgreSQL.
- **Audit Logs:** (Mature Feature) Immutable tracking of all system changes, viewable in Settings.

### 6. User Preferences
- **Themes:** Toggle between Light and Dark mode.
- **Multi-language:** Support for English, Chinese (Simplified), and Malay.
- **Profile Management:** Update passwords and customize experience.

## 🛠 Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Framer Motion, Recharts
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions)
- **AI:** Google Gemini API
- **Build Tool:** Vite
- **Hosting:** Netlify

## 📦 Setup Instructions

1. **Clone the repository**
2. **Install Dependencies:** `npm install`
3. **Environment Variables:**
   Create a `.env` file (or set in Netlify) with:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY`
4. **Run Locally:** `npm run dev`

## 🔒 Security

- **RLS Policies:** Ensures users can only access their own records.
- **Audit Logging:** Database triggers capture every `INSERT`, `UPDATE`, and `DELETE` operation for compliance.

---
*My Asset - Manage your wealth effectively.*