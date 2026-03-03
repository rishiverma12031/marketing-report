# Marketing Report Generator 📈

A CLI tool that reads marketing campaign data from a JSON file, validates it thoroughly, and generates a multi-level analytics report in the terminal. The most complex project in this series(after sales and class report generators) — built to practice rigorous data validation, derived metric calculation, and three-tier reporting architecture (campaign → channel → summary).

## What It Does

Given a JSON file of marketing campaigns across multiple channels, the tool validates all data and outputs four sections:

**Report Metadata**
- Company name, report period, and currency

**Campaign Report**
- Per-campaign breakdown of:
  - Click-Through Rate (CTR)
  - Conversion Rate
  - Return on Investment (ROI)

**Channel Report**
- Per-channel aggregation of:
  - Total spend, revenue, impressions, clicks, conversions
  - Channel-level ROI
  - Best performing campaign within each channel

**Final Marketing Summary**
- Total spend and total revenue across all campaigns
- Overall ROI
- Best and worst performing channels
- Highest and lowest ROI campaigns

## Sample Output

```
| REPORT METADATA |
  Company Name: Acme Digital
  Report Period: Q1 2025
  Currency: INR

| CAMPAIGN REPORT |
  Campaign: Spring Sale
  CTR: 0.036
  Conversion rate: 0.05
  ROI: 2

  Campaign: New Arrivals Launch
  ...

| CHANNEL REPORT |
  Channel: Google Ads
  Total spend: 120000
  Total revenue: 360000
  Total impressions: 500000
  Total clicks: 18000
  Total conversions: 900
  Channel ROI: 2
  Best performing campaign: Spring Sale
  ...

| FINAL MARKETING SUMMARY |
  Total marketing spend: 370000
  Total revenue generated: 1510000
  Overall ROI: 3.08
  Best performing channel: Email
  Worst performing channel: Influencer
  Highest ROI campaign: Email Re-engagement
  Lowest ROI campaign: Spring Sale
```

## How to Run

**Prerequisites:** Node.js installed on your machine.

```bash
# Clone the repository
git clone https://github.com/rishiverma12031/marketing-report.git

# Navigate into the project folder
cd marketing-report

# Run the app
node app.js
```

## Project Structure

```
marketing-report-generator/
├── app.js        # Main application logic
├── data.json     # Sample campaign data
├── package.json
└── README.md
```

## Key Concepts Practiced

- **Multi-field validation** — validating types, ranges, and logical constraints (e.g. clicks can't exceed impressions; conversions can't exceed clicks)
- **Cross-field validation** — campaigns are validated against the declared channels list using a `Set`
- **Derived metric calculation** — CTR, conversion rate, and ROI computed per campaign; division-by-zero handled explicitly
- **Three-tier reporting architecture** — campaign-level, channel-level, and summary-level reports generated independently and then composed
- **Channel aggregation with initialise/update pattern** — building per-channel totals by checking key existence before initialising vs updating
- **`Array.find()`** — looking up campaign names by ID when building the channel report
- **`Set` for duplicate detection** — catching duplicate channel names and campaign IDs during validation
- **`process.exit(1)`** — failing fast and cleanly when data doesn't meet expectations
- **Separation of concerns** — validation, utility, and display functions kept strictly separate throughout

## Data Format

```json
{
  "companyName": "Company Name",
  "reportPeriod": "Q1 2025",
  "currency": "INR",
  "channels": ["Google Ads", "Instagram", "Email"],
  "campaigns": [
    {
      "id": "CAMP001",
      "name": "Campaign Name",
      "channel": "Google Ads",
      "spend": 120000,
      "impressions": 500000,
      "clicks": 18000,
      "conversions": 900,
      "revenue": 360000
    }
  ]
}
```

The validator enforces: non-negative numbers, clicks ≤ impressions, conversions ≤ clicks, no duplicate campaign IDs, and all campaign channels must exist in the declared channels array.

---

*Part of my self-taught frontend development journey. See more projects at [github.com/rishiverma12031](https://github.com/rishiverma12031)*