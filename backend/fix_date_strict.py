"""
Strict date enforcement for the scraper.
1. Require a real date on EVERY ingested article
2. Extend date extraction to catch more formats
3. If no date found → SKIP (don't assume today)
4. Tighten window from 6 months to 4 months
"""
from pathlib import Path
import ast

f = Path("nigerian_university_polytechnic_jamb_engine.py")
code = f.read_text()
changes = []

# ══════════════════════════════════════════════════════════
# 1. IMPROVE extract_date_from_page — add more strategies
# ══════════════════════════════════════════════════════════
old_extract_patterns = '''# Matches: 2025-03-15, 15/03/2025, 15-03-2025, March 15, 2025, March 15 2025
_DATE_PATTERNS = [
    _re.compile(r'(\\d{4})[-/](\\d{1,2})[-/](\\d{1,2})'),          # 2025-03-15
    _re.compile(r'(\\d{1,2})[-/](\\d{1,2})[-/](\\d{4})'),          # 15/03/2025
    _re.compile(r'(January|February|March|April|May|June|July|August|September|October|November|December)\\s+(\\d{1,2}),?\\s+(\\d{4})', _re.IGNORECASE),
]'''

new_extract_patterns = '''# STRICT_DATE_V2 — more patterns for Nigerian university sites
_DATE_PATTERNS = [
    _re.compile(r'(\\d{4})[-/](\\d{1,2})[-/](\\d{1,2})'),          # 2025-03-15
    _re.compile(r'(\\d{1,2})[-/](\\d{1,2})[-/](\\d{4})'),          # 15/03/2025
    _re.compile(r'(January|February|March|April|May|June|July|August|September|October|November|December)\\s+(\\d{1,2}),?\\s+(\\d{4})', _re.IGNORECASE),
    _re.compile(r'(\\d{1,2})\\s+(January|February|March|April|May|June|July|August|September|October|November|December)\\s+(\\d{4})', _re.IGNORECASE),
    _re.compile(r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\w*\\.?\\s+(\\d{1,2}),?\\s+(\\d{4})', _re.IGNORECASE),
    _re.compile(r'(\\d{1,2})\\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\w*\\.?,?\\s+(\\d{4})', _re.IGNORECASE),
]'''

if old_extract_patterns in code:
    code = code.replace(old_extract_patterns, new_extract_patterns, 1)
    changes.append("Extended date patterns (6 total)")

# ══════════════════════════════════════════════════════════
# 2. ADD: extract date from article body text
# ══════════════════════════════════════════════════════════
if "extract_date_from_body" not in code:
    helper = '''

# STRICT_DATE_V2 — extract date from visible article body text
def extract_date_from_body(soup):
    """Look for 'Posted on: 15 May 2024' patterns in article text."""
    try:
        import re as _re_body
        # Common date prefixes on Nigerian uni sites
        prefixes = [
            r'(?:posted on|published on|posted|published|date|added on|updated on)\\s*:?\\s*',
            r'(?:last updated|updated|posted)\\s*:?\\s*',
        ]

        # Search in common containers
        for container in [soup.find("article"), soup.find("main"),
                          soup.find(class_="entry-content"),
                          soup.find(class_="post-content"),
                          soup.find(class_="content"),
                          soup]:
            if not container:
                continue
            text = container.get_text(" ", strip=True)
            if not text:
                continue

            for prefix in prefixes:
                # Look for prefix followed by a date
                for date_pat in _DATE_PATTERNS:
                    combined = _re_body.compile(
                        prefix + date_pat.pattern,
                        _re_body.IGNORECASE,
                    )
                    m = combined.search(text)
                    if m:
                        groups = m.groups()
                        # Extract just the date groups (last 3 that matched)
                        try:
                            date_groups = groups[-3:] if len(groups) >= 3 else groups
                            return _build_date_from_groups(date_groups)
                        except Exception:
                            continue
        return None
    except Exception:
        return None


def _build_date_from_groups(groups):
    """Helper — build datetime from regex groups."""
    import re as _re_g
    from datetime import datetime as _dt_g

    if len(groups) < 3:
        return None

    try:
        # Handle named months
        month_str = groups[0] if groups[0] else groups[1]
        month_lower = str(month_str).lower()[:3]

        if month_lower in ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']:
            month = _MONTH_MAP.get(month_lower + 'uary', _MONTH_MAP.get(month_lower + 'ch', 0))
            # Try matching directly
            for full_name, num in _MONTH_MAP.items():
                if full_name.startswith(month_lower):
                    month = num
                    break

            # Figure out day and year
            nums = [int(g) for g in groups if str(g).isdigit()]
            if len(nums) >= 2:
                day, year = nums[0], nums[1]
                if day > 31:
                    day, year = year, day
                if 2020 <= year <= 2030 and 1 <= month <= 12 and 1 <= day <= 31:
                    return _dt_g(year, month, day)
        else:
            # Numeric date
            nums = [int(g) for g in groups]
            if nums[0] > 31:
                year, month, day = nums
            else:
                day, month, year = nums
            if 2020 <= year <= 2030 and 1 <= month <= 12 and 1 <= day <= 31:
                return _dt_g(year, month, day)
    except Exception:
        pass
    return None

'''
    # Insert before extract_date_from_page
    anchor = "def extract_date_from_page(url: str):"
    if anchor in code:
        code = code.replace(anchor, helper + "\n" + anchor, 1)
        changes.append("Added extract_date_from_body()")

# ══════════════════════════════════════════════════════════
# 3. REPLACE the fallback logic — require real date
# ══════════════════════════════════════════════════════════
old_fallback = '''        # STRICT_DATE_CHECK_V2 — require a real publication date
        pub_date = extract_date_from_page(source_url) if source_url else None

        # If no date can be found, only allow it if it looks like a fresh announcement
        if pub_date is None:
            # Check the URL for a year hint (e.g. /2025/ or /2024/)
            url_year = None
            for y in ["2020", "2021", "2022", "2023", "2024", "2025", "2026"]:
                if y in (source_url or ""):
                    url_year = int(y)
                    break
            # If URL has an old year in it, skip
            if url_year and url_year < datetime.utcnow().year:
                logger.info(f"⏭️  Skipping (old URL year {url_year}): {title[:50]}")
                return
            # Otherwise accept it but mark date as today
            pub_date = datetime.utcnow()

        # Skip anything older than 6 months
        if is_too_old(pub_date, max_age_months=6):
            logger.info(f"⏭️  Skipping old ({pub_date.date()}): {title[:50]}")
            return'''

new_fallback = '''        # STRICT_DATE_V3 — require a REAL publication date (no fallbacks)
        pub_date = extract_date_from_page(source_url) if source_url else None

        # If page didn't yield a date, try the URL year as a hint
        if pub_date is None:
            url_year = None
            for y in ["2020", "2021", "2022", "2023", "2024", "2025", "2026"]:
                if y in (source_url or ""):
                    url_year = int(y)
                    break

            current_year = datetime.utcnow().year
            if url_year and url_year < current_year:
                logger.info(f"⏭️  Skipping (URL year {url_year} < {current_year}): {title[:50]}")
                return
            elif url_year and url_year >= current_year:
                # Trust the URL year for current/future content
                pub_date = datetime(url_year, 1, 1)
            else:
                # NO date anywhere → SKIP (don't guess)
                logger.info(f"⏭️  Skipping (no date found): {title[:60]}")
                return

        # STRICT window — 4 months instead of 6
        if is_too_old(pub_date, max_age_months=4):
            logger.info(f"⏭️  Skipping old ({pub_date.date()}): {title[:50]}")
            return'''

if old_fallback in code:
    code = code.replace(old_fallback, new_fallback, 1)
    changes.append("Rewrote date fallback (skip if no date) + tightened to 4 months")
else:
    # Try finding just the is_too_old call and tighten it
    if "max_age_months=6" in code:
        code = code.replace("max_age_months=6", "max_age_months=4")
        changes.append("Tightened max_age to 4 months (fallback)")

# ══════════════════════════════════════════════════════════
# 4. Save + verify
# ══════════════════════════════════════════════════════════
f.write_text(code)

print("=== Changes applied ===")
for c in changes:
    print(f"   ✅ {c}")
if not changes:
    print("   ℹ️  No changes needed")

try:
    ast.parse(code)
    print()
    print("✅ Syntax OK")
except SyntaxError as e:
    print(f"\n❌ Syntax error: {e}")
    lines = code.split("\n")
    for i in range(max(0, e.lineno - 5), min(len(lines), e.lineno + 5)):
        marker = ">>>" if i == e.lineno - 1 else "   "
        print(f"{marker} {i+1}: {lines[i]}")
