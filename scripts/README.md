# scripts/

Build and maintenance tooling for this repo. Nothing in this directory is
referenced by the public site (`content/`, `layouts/`).

## Internal Stripe billing

`stripe-bill` creates a one-off Stripe Payment Link or Invoice for fast
manual deal billing: price a deal in conversation, run one command, send the
returned URL to the client. It is internal-only tooling, not part of the
site's checkout flow.

```
scripts/stripe-bill --type link --amount 150000 --currency usd \
  --email client@example.com --description "Q4 Shopify audit"

scripts/stripe-bill --type invoice --amount 500000 --currency usd \
  --email client@example.com --description "Build Queue retainer, October"
```

Run `scripts/stripe-bill --help` for the full flag list. Highlights:

- Shells out to the `stripe` CLI, which must already be authenticated
  (`stripe login`). The script never asks for, stores, or prints an API key
  or any other credential.
- Defaults to Stripe test mode, matching the Stripe CLI's own default. Pass
  `--live` to bill for real.
- `--dry-run` prints the exact `stripe` commands a run would execute, in
  order, without calling the API.
- Every object it creates (Price, Payment Link, Customer, Invoice) carries
  `metadata[created_via]=stripe-bill` so it is easy to find in the
  Dashboard later.
- Payment Links cannot pre-fill a buyer's email at checkout, so `--email` on
  the link path is stored as link metadata only. On the invoice path,
  `--email` is used to find or create the Stripe Customer who gets billed.
