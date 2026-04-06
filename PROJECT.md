# My Asset - Personal Wealth Management

My Asset is a modern, responsive personal finance dashboard built to track and analyze various asset classes including Stocks, ETFs, Fixed Deposits, and Properties. It features specific analytical tools for different investment types and integrates AI for portfolio insights.

## Project Structure

- **Frontend**: React 19 (Vite), TypeScript
- **Styling**: Tailwind CSS, Framer Motion (Animations), Lucide React (Icons)
- **Charts**: Recharts
- **Backend / Database**: Supabase (PostgreSQL, Auth)
- **AI**: Google GenAI integration (Chatbot)

## Key Features

### 1. Dashboard Overview
-   **Asset Allocation**: Visual Pie Chart breakdown of portfolio by Asset Type and individual assets.
-   **Net Invested Valuation**: Stocks and ETFs are valued based on "Net Invested Cost" (Total Buy Cost - Total Sell Proceeds), ensuring that realized profits/losses are accounted for and zero-unit assets are hidden.
-   **Active Asset Tracking**: Metrics specifically track *Active* assets, filtering out matured Fixed Deposits or fully sold positions.
-   **Performance Metrics**: Total Net Worth, Top Asset Class, and Active Asset Count.

### 2. Asset Management
-   **Multi-Asset Support**: Track Stocks, ETFs, REITs, Fixed Deposits, Properties, EPF, and more.
-   **Transaction Recording**: Detailed forms for Buying, Selling, Dividends, Interest, etc.
-   **CSV Import/Export**: Bulk import capability with duplicate detection and full CSV export.

### 3. Specialized Views
-   **Property Analysis**:
    -   Cash Flow Analysis (Rental Income vs Expenses/Installments).
    -   ROI and Total Investment tracking.
-   **Fixed Deposit Portfolio**:
    -   Interest calculation (Simple Interest).
    -   Maturity date tracking and auto-maturity status updates.
    -   Strict filtering to show only "Active" deposits in summary views.

### 4. AI Financial Assistant
-   Built-in Chatbot powered by Google GenAI.
-   Context-aware: Can analyze the user's current current portfolio records to answer questions.

### 5. Settings & Customization
-   **Theme**: Dark / Light mode support.
-   **Language**: Multi-language support (English, Chinese, Malay).
-   **Currency**: Global currency toggle (e.g., MYR for all displays).

## Key Files
-   `App.tsx`: Main entry point, handles routing (view switching), data fetching (`useSupabase`), and global state.
-   `components/views/DashboardView.tsx`: Main dashboard UI.
-   `components/PieChartComponent.tsx`: Asset allocation visualization.
-   `utils/assetUtils.ts`: Core logic for asset aggregation and valuation (Net Cost logic).
-   `types.ts`: TypeScript definitions for `AssetRecord`, `AssetType`, etc.

## Recent Updates (Beta 3.7)
-   **Refactored Calc Logic**: Switched Stock/ETF valuation from "Average Cost" to "Net Invested" (Buy - Sell).
-   **Zero-Unit Filtering**: Assets with 0 remaining units are automatically excluded from charts.
-   **Active Only Mode**: Fixed Deposit summaries and charts now strictly exclude Non-Active (Mature/Sold) records.
