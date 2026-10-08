"""
Parse supplier price-list PDFs into structured JSON.

    python scripts/parse_suppliers.py          (requires: pip install pdfplumber)

Inputs  (confidential, git-ignored):  suppliers/pdf/keune-2024.pdf, suppliers/pdf/wella.pdf
Outputs:                               suppliers/keune.json, suppliers/wella.json

All supplier prices are VAT-exclusive (confirmed by the client).
  Keune:  "Price Salon" = salon list price; net cost = list x (1 - discount)
  Wella:  RSP = recommended selling price (reference only), WSP = net salon purchase price
          after the supplier discount. LOOKS uses WSP as the purchase cost.
Nothing is estimated: rows without a price are skipped; missing codes/barcodes stay null
and are reported in "issues".
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

import pdfplumber

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / "suppliers" / "pdf"
OUT = ROOT / "suppliers"

ARABIC = re.compile(r"[؀-ۿﭐ-﷿ﹰ-﻿]")


def fix_arabic(s: str) -> str:
    """pdfplumber returns RTL runs in visual (reversed) order; reverse each Arabic run and normalize ligatures."""
    if not s:
        return ""
    out = []
    for run in re.split(r"([؀-ۿﭐ-﷿ﹰ-﻿][؀-ۿﭐ-﷿ﹰ-﻿\s\-/]*[؀-ۿﭐ-﷿ﹰ-﻿]|[؀-ۿﭐ-﷿ﹰ-﻿])", s):
        if run and ARABIC.search(run):
            words = run.split()
            out.append(" ".join(unicodedata.normalize("NFKC", w[::-1]) for w in reversed(words)))
        else:
            out.append(run)
    return re.sub(r"\s+", " ", "".join(out)).strip()


def split_name(s: str):
    """'CARE VITAL NUTRITION SHAMPOOشامبو...' -> (english, arabic)"""
    # Glued tokens like "SHAMPOOشامبو": separate the scripts before fixing RTL order
    ar_chars = "\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF"
    s = re.sub(r"([A-Za-z0-9).+])([" + ar_chars + r"])", r"\1 \2", s)
    s = re.sub(r"([" + ar_chars + r"])([A-Za-z0-9(])", r"\1 \2", s)
    fixed = fix_arabic(s)
    ar = " ".join(w for w in fixed.split() if ARABIC.search(w))
    en = " ".join(w for w in fixed.split() if not ARABIC.search(w))
    return en.strip() or None, ar.strip() or None



def num(s):
    if s is None:
        return None
    t = str(s).replace(",", "").strip()
    return float(t) if re.fullmatch(r"\d+(\.\d+)?", t) else None


def pct(s):
    m = re.search(r"(\d+(?:\.\d+)?)\s*%", str(s or ""))
    return float(m.group(1)) / 100 if m else None


def rows_of(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        for pno, page in enumerate(pdf.pages, start=1):
            for table in page.extract_tables():
                for r in table:
                    yield pno, [(c or "").replace("\n", " ").strip() for c in r]


KEUNE_LINES = [
    ("SO PURE", "So Pure"), ("TINTA", "Tinta Color"), ("SEMI", "Semi Color"), ("UB ", "Ultimate Blonde"), ("BOND FUSION", "Bond Fusion"),
    ("SP ", "Keune So Pure / Superior"), ("STYLE", "Style"), ("CARE", "Care"), ("SILVER", "Care Silver Savior"), ("MIRACLE", "Care Miracle Elixir"),
    ("BLONDE", "Blonde"), ("THE ROYAL", "Royal Tribute"), ("1922", "1922 by J.M. Keune"), ("DEVELOPER", "Developer"),
]


def keune_line(name_en: str):
    up = (name_en or "").upper()
    for key, label in KEUNE_LINES:
        if up.startswith(key) or f" {key.strip()} " in f" {up} ":
            return label
    return None


def parse_keune():
    items, issues = [], []
    section = None
    for pno, r in rows_of(PDF / "keune-2024.pdf"):
        r = (r + [""] * 5)[:5]
        code, size, name, price, disc = r
        # Section header rows: Arabic text with no price
        if not num(price) and (name or code) and ARABIC.search(name or code):
            section = fix_arabic(name or code)
            continue
        p = num(price)
        if p is None or not name:
            continue
        en, ar = split_name(name)
        d = pct(disc)
        item = {
            "supplier": "Keune",
            "brand": "Keune",
            "supplierCode": code or None,
            "barcode": None,
            "nameEn": en,
            "nameAr": ar,
            "productLine": keune_line(en),
            "sectionAr": section,
            "size": size or None,
            "listPrice": p,
            "discount": d,
            "netCost": round(p * (1 - (d or 0)), 2),
            "priceBasis": "Salon list price, VAT-exclusive; net = list x (1 - discount)",
            "discontinued": False,
            "sourcePage": pno,
        }
        if not code:
            issues.append({"type": "missing_code", "page": pno, "name": en})
        items.append(item)
    codes = [i["supplierCode"] for i in items if i["supplierCode"]]
    for c in sorted({c for c in codes if codes.count(c) > 1}):
        issues.append({"type": "duplicate_code", "code": c, "names": [i["nameEn"] for i in items if i["supplierCode"] == c]})
    return items, issues


def parse_wella():
    items, issues = [], []
    category, line = None, None
    for pno, r in rows_of(PDF / "wella.pdf"):
        r = (r + [""] * 6)[:6]
        barcode, code, name, rsp, disc, wsp = r
        if not name:
            continue
        if not num(rsp) and not num(wsp):
            if name.isupper() and len(name.split()) <= 3 and name not in ("Barcode",):
                category, line = name.title(), None
            elif not name.lower().startswith(("price list", "display name")):
                line = name
            continue
        if num(wsp) is None:
            continue
        clean = name
        discontinued = bool(re.search(r"\bDISC\b", clean))
        clean = re.sub(r"\bDISC\b", "", clean)
        m = re.search(r"\s(\d{8,12})\s*$", clean)
        material = m.group(1) if m else None
        if m:
            clean = clean[: m.start()]
        clean = re.sub(r"\s+", " ", clean).strip()
        size = None
        sm = re.search(r"(\d+(?:[.,]\d+)?\s*(?:ml|gr|g|l|L|pcs)(?:\s*-\s*\d+\s*ml)?)\b", clean, re.I)
        if sm:
            size = sm.group(1).replace(" ", "")
        bc = barcode if re.fullmatch(r"\d{8,14}", barcode or "") else None
        item = {
            "supplier": "Wella Professionals",
            "brand": "Wella Professionals",
            "supplierCode": code or None,
            "barcode": bc,
            "materialNo": material,
            "nameEn": clean,
            "nameAr": None,
            "productLine": line,
            "category": category,
            "size": size,
            "listPrice": num(rsp),
            "discount": pct(disc),
            "netCost": num(wsp),
            "priceBasis": "RSP = recommended selling price (reference); WSP = net salon purchase price after discount; VAT-exclusive",
            "discontinued": discontinued,
            "nonSaleable": (category or "").upper() in ("POSM", "COLOR CHART"),
            "sourcePage": pno,
        }
        if not bc:
            issues.append({"type": "missing_barcode", "page": pno, "code": code, "name": clean})
        if discontinued:
            issues.append({"type": "discontinued", "page": pno, "code": code, "name": clean})
        items.append(item)
    bars = [i["barcode"] for i in items if i["barcode"]]
    for b in sorted({b for b in bars if bars.count(b) > 1}):
        issues.append({"type": "duplicate_barcode", "barcode": b})
    return items, issues


if __name__ == "__main__":
    for name, fn in (("keune", parse_keune), ("wella", parse_wella)):
        items, issues = fn()
        (OUT / f"{name}.json").write_text(json.dumps({"supplier": name, "vat": "exclusive", "items": items, "issues": issues}, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"{name}: {len(items)} items, {len(issues)} issues -> suppliers/{name}.json")
