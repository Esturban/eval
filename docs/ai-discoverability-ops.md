# AI Discoverability Operations

This repo now exposes the core AI-discoverability surfaces in code:

- `/robots.txt`
- `/sitemap.xml`
- `/llms.txt`
- richer JSON-LD on home, service, insight, and FAQ-bearing pages
- traffic attribution capture for AI-assisted visits

The remaining launch steps are operational.

## Deployment Source Of Truth

Treat **Netlify** as the canonical production deployment target for `https://evadvisory.ca`.

Reasons:

- the site already uses Netlify form handling on the contact page
- `netlify.toml` contains the build contract for production
- production verification in this workflow is based on the Netlify output path

## Post-Deploy Verification

Run these checks against production:

1. `https://evadvisory.ca/`
2. `https://evadvisory.ca/scorecard/`
3. `https://evadvisory.ca/contact/`
4. `https://evadvisory.ca/services/`
5. `https://evadvisory.ca/insights/`
6. `https://evadvisory.ca/robots.txt`
7. `https://evadvisory.ca/sitemap.xml`
8. `https://evadvisory.ca/llms.txt`

Confirm each returns `200`.

## Search Console / Webmaster Tools

After deployment:

1. Re-submit `https://evadvisory.ca/sitemap.xml` in Google Search Console.
2. Submit the same sitemap in Bing Webmaster Tools.
3. Request indexing for:
   - homepage
   - services index
   - scorecard
   - methodology
   - proof
   - the four refreshed insight pages

## AI Referral Measurement

The site now records AI-assisted traffic hints in `sessionStorage` and pushes an `eva_traffic_attribution` event into `dataLayer`.

Recommended reporting slices:

- `utm_source=chatgpt.com`
- `eva_channel=ai_assisted`
- `eva_source_detail`
- lead submissions where `traffic_channel=ai_assisted`

## Crawl Log Review

If CDN or platform logs are available, review requests from:

- `OAI-SearchBot`
- `GPTBot`
- `ChatGPT-User`
- `Claude-SearchBot`
- `ClaudeBot`
- `PerplexityBot`
- `Googlebot`
- `Bingbot`

The key question is whether they are receiving `200` responses for the core authority pages.
