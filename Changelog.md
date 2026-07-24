# Changelog

All notable changes to the "My Asset" project will be documented in this file.

## [Beta 2.5.0]
### Added / Improved
- **Live Market Price Engine:** Real-time stock & ETF price fetching powered by Twelve Data with automatic Yahoo Finance fallback.
- **Dynamic KLSE Symbol Resolution:** Dynamic Yahoo Search API integration to automatically resolve Malaysian stock symbols (e.g. `FFB`, `BIMB`, `KOPI`, `HUPSENG`, `SUNMED`) to their 4-digit `.KL` stock codes.
- **Auto Price Refresh:** Automatic background price updates on Investment view load and holdings state change.
- **Unified Currency Settings:** Investment Analysis view now strictly follows the global currency selection from Settings.
- **Tooltip Visual Parity:** Restyled Investment pie chart tooltip with percentage breakdown and theme-aware contrast matching the Dashboard page.
- **GitHub Actions Deployment:** Updated `.github/workflows/deploy.yml` to pass `VITE_TWELVEDATA_API_KEY` for GitHub Pages build deployments.

## [Beta 2.4.1]
### Added / Improved
- **Intelligent Autocomplete:** The "Name / Identifier" field in the transaction form now intelligently auto-suggests historical names filtered by the selected Asset Type.
- **Property Asset Type Update:** The 'Quantity' field is now fixed to "1" and made uneditable by default for Property assets, aligning with EPF and Fixed Deposit behaviors.

## [Beta 2.4]
### Added
- **CSV Import Engine Enhancements:**
  - Smart Metadata Parsing: Automatically extracts interest rates and dividends from remarks.
  - Duplicate Detection: Automatic verification against existing records to prevent double-counting.
  - Batch Confirmation: Review records in a summary modal before committing.
  - Date Normalization: Automatic conversion of various date formats to ISO.
- **Net Asset Calculation:** Correctly handles "Sold" actions as deductions for Stocks, ETFs, and REITs. Filters out zero-unit assets from charts.
- **Active Only Mode:** Fixed Deposit summaries and charts now strictly exclude Non-Active (Mature/Sold) records.
- **Refactored Calc Logic:** Switched Stock/ETF valuation from "Average Cost" to "Net Invested" (Buy - Sell).

### Changed
- Streamlined header UI with square icon buttons for Export, Import, and Add actions.
