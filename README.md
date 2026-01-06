# My Asset - Personal Wealth Management
 
**My Asset** is a robust, cloud-native application designed to help you track, visualize, and manage your financial portfolio. Built with React and Supabase, it offers enterprise-grade data security, real-time synchronization, and AI-powered insights.

**Current Version:** Beta 2.1

> **Note:** This build is fully compatible and optimized for hosting on **GitHub Pages**.

## 🚀 Features

### 1. Asset Management (CRUD)
- **Multi-Asset Support:** Full tracking support for:
    - **Stocks** (Buy/Sold/Dividend)
    - **ETF** (Buy/Sold/Dividend) - *New in Beta 2.1*
    - **Fixed Deposits** (Auto-interest calculation upon maturity)
    - **EPF** (Self/Employee contributions)
    - **Property** (Rental/Maintenance/Renovation tracking)
    - **Custom Assets** (Gold, etc.)
- **Advanced Form Validation:** Smart forms that adapt fields based on asset type (e.g., Interest Rate & Maturity Date for FDs).
- **Auto-Calculations:**
    - Fixed Deposit Interest: Automatically calculated based on Principal, Rate, and Duration.
    - Total Amount: Automatically computed from Unit Price × Quantity.
- **Batch Operations:** Efficiently delete multiple records at once.

### 2. Dashboard & Visualization
- **Global Currency Filtering:** *New in Beta 2.0*
    - Toggle between **MYR** and **USD** in Settings.
    - All charts, lists, and summaries instantly reflect the selected currency.
- **Real-time Metrics:**
    - **Total Net Worth** (Live aggregation)
    - **Top Asset Class** breakdown
- **Interactive Charts:** Dynamic Pie Charts visualization of asset allocation.
- **Responsive Design:**
    - Mobile-responsive Sidebar (Collapsible/Expandable).
    - Mobile-first Data Lists/Cards.
    - Dark/Light mode synchronization with system or user preference.

### 3. Property Portfolio Intelligence
- **Dedicated Property View:** Filter and sort specific property records.
- **Cash Flow Engine:**
    - **Inflow:** Rent/Sold
    - **Outflow:** Pay/Maintenance/Renovation
    - **Net Cash Flow:** Automatic calculation of ROI and Profit/Loss per property.

### 4. AI Financial Assistant
- **Gemini 3 Flash Integration:**
    - Use natural language to query your portfolio ("How is my property performing?").
    - Context-aware answers based on your **active** assets.
    - Markdown-formatted responses (Bold text, Lists).
- **Security:** API Key configuration support for personal billing keys.

### 5. Fixed Deposit (FD) Management
- **Maturity Check:**
    - `Active` vs `Mature` status tracking.
    - Auto-calculation of simple interest upon maturity.
- **Search & Filter:** specific search bar for FD records.

### 6. System & Security
- **Authentication:** Supabase Email/Password Auth.
- **User Profile:**
    - Multi-language Support (English, Chinese Simplified, Malay).
    - Theme switching (Light/Dark).
    - Password updates.
- **Data Protection:**
    - Row Level Security (RLS) ensures strict user data isolation.
    - Secure environment variable handling.

## 🛠 Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Framer Motion
- **Charts:** Recharts
- **Icons:** Lucide React
- **Backend:** Supabase (Table Database, Auth, RLS)
- **AI:** Google GenAI SDK (Gemini 3 Flash)
- **Build Tool:** Vite
- **Deployment:** GitHub Actions -> GitHub Pages / Netlify

## 📦 Setup Instructions

1. **Clone the repository**
2. **Install Dependencies:** `npm install`
3. **Environment Variables:**
   Create a `.env` file with:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_key (Optional)
   ```
4. **Run Locally:** `npm run dev`

## 🔒 Security

- **RLS Policies:** Database-level security ensuring users can strictly access only their `user_id` rows.
- **Encrypted Auth:** Supabase handles secure session management.

---
*My Asset - Manage your wealth effectively.*
