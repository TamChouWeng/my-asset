# My Asset - Project Documentation

My Asset is a robust, cloud-native personal finance dashboard built to track, visualize, and analyze various asset classes including Stocks, ETFs, Fixed Deposits, and Properties. It offers enterprise-grade data security, real-time synchronization, and AI-powered insights.

## Project Structure & Tech Stack

- **Frontend:** React 18 (Vite), TypeScript
- **Styling:** Tailwind CSS, Framer Motion (Animations), Lucide React (Icons)
- **Charts:** Recharts
- **Backend / Database:** Supabase (PostgreSQL, Auth, RLS)
- **AI:** Google GenAI SDK (Gemini 2.0 Flash)
- **Deployment:** GitHub Actions -> GitHub Pages / Netlify

## Key Files & Architecture
- `App.tsx`: Main entry point, handles routing (view switching), data fetching (`useSupabase`), and global state.
- `components/views/DashboardView.tsx`: Main dashboard UI.
- `components/views/InvestmentView.tsx`: Investment analysis UI with holdings aggregation and live price refresh.
- `components/PieChartComponent.tsx`: Asset allocation visualization.
- `utils/twelveDataUtils.ts`: Primary live market price fetcher (Twelve Data) with Yahoo Finance fallback and dynamic KLSE ticker resolution.
- `utils/yahooFinanceUtils.ts`: Single stock price fetcher via proxy.
- `utils/assetUtils.ts`: Core logic for asset aggregation and valuation.
- `types.ts`: TypeScript definitions for `AssetRecord`, `AssetType`, etc.

## Comprehensive Features

### 1. Dashboard & Visualization
- **Asset Allocation:** Visual Pie Chart breakdown of portfolio by Asset Type and individual assets.
- **Global Currency Filtering:** Toggle between MYR and USD. All charts, lists, and summaries instantly reflect the selected currency.
- **Real-time Metrics:** Total Net Worth, Top Asset Class, and Active Asset Count.
- **Net Invested Valuation:** Stocks and ETFs are valued based on "Net Invested Cost" (Total Buy Cost - Total Sell Proceeds), ensuring that realized profits/losses are accounted for and zero-unit assets are hidden.

### 2. Asset Management & Import
- **Multi-Asset Support:** Track Stocks, ETFs, REITs, Fixed Deposits, Properties, EPF, and Custom Assets (Gold, etc.).
- **Smart Forms:** Advanced form validation that adapts fields based on asset type. Form inputs automatically suggest historical names based on the selected asset type.
- **Batch Operations:** Efficiently delete multiple records at once.
- **CSV Import Engine:**
  - Manual upload support for transaction history.
  - **Smart Metadata Parsing:** Automatically extracts interest rates and dividends from remarks.
  - **Duplicate Detection:** Automatic verification against existing records to prevent double-counting.
  - **Batch Confirmation:** Review records in a summary modal before committing to the database.
  - **Date Normalization:** Automatic conversion of various date formats (DD-MM-YY, etc.) to ISO (YYYY-MM-DD).

### 3. Specialized Views
- **Property Analysis:**
  - Cash Flow Analysis (Rental Income vs Expenses/Installments).
  - Inflow (Rent/Sold) vs Outflow (Pay/Maintenance/Renovation).
  - ROI and Total Investment tracking.
- **Fixed Deposit Portfolio:**
  - Interest calculation (Simple Interest).
  - Maturity date tracking and auto-maturity status updates.
  - Strict filtering to show only "Active" deposits in summary views.

### 4. AI Financial Assistant
- Built-in Chatbot powered by Google GenAI (Gemini 2.0 Flash).
- Context-aware: Can analyze the user's active portfolio records to answer questions via natural language.
- Security: API Key configuration support for personal keys.

### 5. Settings, System & Customization
- **Theme:** Dark / Light mode support.
- **Language:** Multi-language support (English, Chinese Simplified, Malay).
- **Authentication:** Supabase Email/Password Auth. Password updates.
- **Data Protection:** Row Level Security (RLS) ensures strict user data isolation. Secure environment variable handling.
