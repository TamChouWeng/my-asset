# Changelog

All notable changes to the "My Asset" project will be documented in this file.

## [Beta 2.5.4]
## Fixed / Improved
- **Twelve Data Rate-Limit Resilience:** Requests are now split into plan-sized chunks (default 8 symbols) with a spacing delay between chunks, so a single refresh no longer exceeds the per-minute API credit cap on its own.
- **Graceful 429 Handling:** A Twelve Data rate-limit response (429) is now logged distinctly and no longer treated as a generic failure. No retry is attempted; previously fetched prices remain visible until the next refresh.
- **Mount-Only Auto Refresh:** The Investment view now fetches prices once when the page loads instead of re-fetching every time the holdings calculation changes (search, sort, pagination, filters no longer trigger a Twelve Data request).
- **60-Second Refresh Cooldown:** Automatic refreshes are throttled to once per 60 seconds; the existing "Refresh Prices" button still allows an immediate manual refresh that bypasses the cooldown.
- **Duplicate-Refresh Guard:** A refresh already in progress blocks additional automatic refresh attempts, preventing overlapping Twelve Data requests.

## [Beta 2.5.3]
## Added / Improved
- **Expandable Investment Lots:** Stock and ETF holdings now have an expand/collapse control to view the individual purchase lots that are still currently held.
- **FIFO Lot Calculation:** Buy and Sold transactions are reconstructed using First In, First Out (FIFO) so that sold quantities are correctly removed from the oldest purchase lots first, including partial sales across multiple lots.
- **Remaining Purchase Lots:** Expanded Stock/ETF holdings now show each remaining purchase lot with its quantity, original purchase price, current market price, and individual Unrealized Profit/Loss.
- **Lot-Based Unrealized P/L:** Unrealized Profit/Loss is now calculated from the actual remaining purchase lots rather than relying solely on the weighted average purchase price.
- **Aggregated Unrealized P/L:** The Unrealized P/L shown on the collapsed holding row is the sum of the Unrealized P/L from all remaining purchase lots.
- **Unrealized P/L Percentage:** The Unrealized P/L percentage is calculated against the total cost basis of the remaining purchase lots.
- **Sold Quantity Exclusion:** Shares that have already been sold no longer contribute to the current holding quantity or Unrealized P/L calculation.

## [Beta 2.5.2]
### Maintenance & Updates
- **Version Bump:** Updated project documentation and window title for Beta 2.5.2 release.

## [Beta 2.5.1]
### Added / Improved
- **Active Net Holdings Calculation:** Investment tab now calculates active stock holdings by subtracting sold records (`AssetStatus.Sold` or `action: 'Sold'`). Fully sold stocks (quantity <= 0) are cleanly filtered out.
- **Table Column Sorting:** Interactive sort toggle buttons added to Ticker, Qty, and Unrealized P/L headers in the Investment view table.
- **Holdings Table Pagination & Search:** Added search bar, items-per-page dropdown (10, 20, 50, 100), page number navigation, and entry count indicator to the Investment view table.

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
