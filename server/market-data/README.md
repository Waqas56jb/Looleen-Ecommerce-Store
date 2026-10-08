# LOOKS market data — collectors & master catalog builder

Builds the LOOKS master product catalog: Saudi online retail prices (VAT-inclusive), supplier purchase costs (VAT-exclusive) and margins, in one Excel workbook that can be imported into the LOOKS website/admin.

```bash
cd server/market-data
npm install

# 1. Supplier price lists (PDFs in suppliers/pdf — confidential, git-ignored)
pip install pdfplumber
python scripts/parse_suppliers.py          # → suppliers/keune.json, suppliers/wella.json

# 2. Collect market prices (each is re-runnable and resumable; --limit N for a quick test)
node collectors/looieen.mjs
node collectors/whites.mjs
node collectors/niceone.mjs
node collectors/nahdi.mjs
node collectors/watsons.mjs
node collectors/faces.mjs
node collectors/cosmeticssa.mjs
node collectors/beautyselect.mjs
node collectors/kohlalward.mjs

# 3. (Optional) add a new supplier price list (xlsx/csv) — matched automatically on the next build
node scripts/add_supplier.mjs path/to/list.xlsx --supplier "Supplier name" [--brand "Brand"] [--discount 0.25]

# 4. Build and verify the workbook
node --max-old-space-size=6144 scripts/build_master.mjs   # → output/LOOKS-Master-Catalog-<date>.xlsx + output/master-catalog.json
node scripts/verify_master.mjs
```

## Collection rules

- Only factual, publicly displayed data: name, brand, category, size, variant, barcode/SKU (when public), price, original price, stock, product URL, image URL (reference only). No descriptions, reviews or images are copied.
- `lib/http.mjs` obeys robots.txt — including rules addressed to Anthropic/Claude agents, since the collection is AI-assisted — throttles to one request at a time per host (≥ 1 s apart), retries politely and caches responses.
- No bot protection is bypassed. Stores that block scripted access are reported, not worked around.
- Excluded: Amazon.sa and Noon (terms prohibit automated collection), Golden Scent (robots.txt opts out of AI agents). Blocked: Sephora KSA, Al-Dawaa.

## Matching (exact product only)

1. Brand names are unified first (`canonicalBrands`): "KEUNE CARE" / "كيون كير" → keune, "La Rouche Posay" → larocheposay.
2. Barcode (EAN) equality → **High** confidence.
3. Store ↔ store: same brand + identical size + near-identical name with identical shade numbers → **Medium**.
4. Supplier ↔ store (`matchSuppliersToMarket`): same brand, identical size, same product type (shampoo ≠ conditioner), the supplier's product-line words present in the store name (Arabic names are translated; abbreviations like "SMOO" accepted), no conflicting line word ("Derma Activate" ≠ "Derma Exfoliate"), identical shades → **Medium**.
5. Anything weaker is never combined — it goes to the "Match Review" sheet.

Amazon.sa / Noon / Golden Scent / Sephora / Al-Dawaa / brand stores get per-product search links (manual check, no collection).

## Files

| Path | Purpose |
|---|---|
| `lib/record.mjs` | Normalized listing schema, JSONL writer, price/size/barcode helpers |
| `lib/http.mjs` | Polite fetch with robots.txt + cache |
| `lib/match.mjs` | Cross-store product matching (barcode → brand + size + name) |
| `lib/category.mjs` | Maps listings to the LOOKS category tree |
| `collectors/*.mjs` | One collector per store |
| `scripts/parse_suppliers.py` | Supplier PDF → JSON |
| `scripts/add_supplier.mjs` | Supplier Excel/CSV → JSON (auto-matched on next build) |
| `scripts/supplier_match_check.mjs` | Quick report: how many supplier items match store listings |
| `scripts/build_master.mjs` | Builds the workbook and the import JSON |
| `scripts/verify_master.mjs` | Quality gate (no blank cells, unique IDs, formulas) |
| `scripts/*test.mjs` | Unit checks for matching, categories, helpers |
