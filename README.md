# The Execution System — Whetstone

Landing page, diagnostic tool, and PDF report generator for the Execution System service.

## Quick Start

```bash
npm install
npm run dev       # → localhost:5173
npm run build     # → production build in /dist
```

## Deploy to Vercel (recommended)

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com), sign in with GitHub
3. Click "Import Project" → select the repo
4. Vercel auto-detects Vite — click Deploy
5. (Optional) Add custom domain: `execute.whetstoneadmissions.com`

That's it. Vercel handles builds, SSL, and CDN automatically.

---

## Connect Google Sheets (email capture)

This collects two types of leads into a Google Spreadsheet:
- **Playbook Leads** — email captures from the free Chapter One modal  
- **Diagnostic Results** — name, email, all 11 capacity ratings, recommendation, bottlenecks

### Setup (5 minutes)

1. Create a new Google Sheet (name it anything, e.g. "Execution System Leads")

2. Open **Extensions → Apps Script**

3. Delete whatever's in `Code.gs` and paste the contents of `google-apps-script.js` from this project

4. Click **Deploy → New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**

5. Click **Deploy**, then **Authorize access** (follow the prompts — you may need to click "Advanced → Go to [project name]" if Google shows a warning)

6. Copy the **Web app URL** (looks like `https://script.google.com/macros/s/AKfyc.../exec`)

7. Paste it into `src/config.js`:
   ```js
   sheetsWebhookUrl: 'https://script.google.com/macros/s/AKfyc.../exec',
   ```

8. Rebuild and redeploy

### Test it

In the Apps Script editor, you can run `testPost()` to verify both sheet tabs get created with test data.

### What gets captured

**Playbook Leads tab:**
| Timestamp | Email |
|-----------|-------|
| 2025-02-07T... | parent@example.com |

**Diagnostic Results tab:**
| Timestamp | Name | Email | Recommendation | Weakest Capacities | Missing Levers | All Ratings (JSON) |
|-----------|------|-------|----------------|--------------------|-----------------|--------------------|
| 2025-02-07T... | Sarah M. | sarah@... | full_system | Task Initiation, Planning, Time Awareness | accountability, accountability, environment | {"response_inhibition":7,...} |

---

## Calendly

All "Schedule a Consultation" buttons link to the Calendly URL in `src/config.js`:

```js
calendlyUrl: 'https://calendly.com/cole-whetstone',
```

Change this to update every button across the site.

---

## PDF Report

The diagnostic results page includes a "Download PDF Report" button. This generates a styled PDF entirely in the browser using [jsPDF](https://github.com/parallax/jsPDF) — no backend needed.

The PDF includes:
- All 11 capacity ratings with visual bars
- Top 3 bottlenecks with missing-lever analysis
- Recommendation (Tier 1 vs Tier 2)
- Next steps with Calendly link
- Whetstone branding

---

## Configuration

Everything editable is in `src/config.js`:

```js
export const CONFIG = {
  calendlyUrl: 'https://calendly.com/cole-whetstone',
  sheetsWebhookUrl: '',  // ← paste your Apps Script URL here
  founderPhotoUrl: 'https://whetstoneadmissions.com/wp-content/uploads/2025/09/cole.webp',
  contactEmail: 'hello@whetstoneadmissions.com',
  contactPhone: '917-562-5668',
};
```

---

## Project Structure

```
execution-system/
├── index.html                 # Entry HTML with Google Fonts
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── google-apps-script.js      # Copy into Google Apps Script editor
├── README.md
└── src/
    ├── main.jsx               # React entry
    ├── index.css              # Tailwind directives
    ├── config.js              # All editable URLs and settings
    ├── App.jsx                # Full application (landing + diagnostic + results)
    └── utils/
        ├── sheets.js          # Google Sheets submission helper
        └── pdf.js             # jsPDF diagnostic report generator
```

---

## Custom Domain Setup

To use `execute.whetstoneadmissions.com`:

1. In Vercel: Project Settings → Domains → Add `execute.whetstoneadmissions.com`
2. In your DNS provider: Add a CNAME record:
   - Name: `execute`
   - Value: `cname.vercel-dns.com`
3. Vercel handles SSL automatically

---

## Tech Stack

- **React 18** — UI
- **Vite 5** — build tool
- **Tailwind CSS 3** — styling
- **jsPDF** — client-side PDF generation
- **Lucide React** — icons
- **Google Apps Script** — form submissions → Sheets
- **Playfair Display + DM Sans** — typography (via Google Fonts)
