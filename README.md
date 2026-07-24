# My Asset - Personal Wealth Management
 
**My Asset** is a cloud-native application designed to help you track, visualize, and manage your financial portfolio. Built with React and Supabase, it provides a comprehensive dashboard for all your assets, real-time metrics, and AI-powered insights.

**Current Version:** Beta 2.5.0

> **Note:** Fully compatible and optimized for hosting on **GitHub Pages**.

## 🚀 Quick Overview

- **Multi-Asset Tracking:** Manage Stocks, ETFs, Fixed Deposits, EPF, Properties, and more.
- **Smart Dashboard:** Real-time net worth calculation, global currency filtering, and dynamic pie charts.
- **Live Stock Prices:** Real-time market price fetching via Twelve Data with automatic Yahoo Finance fallback & KLSE resolution.
- **AI Assistant:** Chat with your portfolio using the integrated Gemini 2.0 Flash AI.
- **Advanced Import:** CSV import with duplicate detection and smart metadata parsing.
- **Security First:** Powered by Supabase Auth and Row Level Security (RLS).

For detailed documentation, architecture, and complete feature lists, please see [PROJECT.md](./PROJECT.md).

## 🛠 Tech Stack

React 18 • TypeScript • Tailwind CSS • Supabase • Google GenAI • Vite

## 📦 Setup Instructions

1. **Clone the repository**
2. **Install Dependencies:** `npm install`
3. **Environment Variables:**
   Create a `.env` file with:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_TWELVEDATA_API_KEY=your_twelvedata_key
   VITE_GEMINI_API_KEY=your_gemini_key (Optional)
   ```
4. **Run Locally:** `npm run dev`

---
*For recent updates, check the [Changelog](./Changelog.md).*
