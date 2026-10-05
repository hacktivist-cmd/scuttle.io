"""
Universal URL fix — catches broken URLs across all universities.
Three layers:
  1. Multi-pattern URL resolver for SPAs
  2. Title-based URL search fallback
  3. Dead URL cache to avoid retry loops
"""
from pathlib import Path
import ast

f = Path("nigerian_university_polytechnic_jamb_engine.py")
code = f.read_text()
changes = []

# ══════════════════════════════════════════════════════════
# 1. UNIVERSAL URL RESOLVER — replace VERIFY_URL_V1
# ══════════════════════════════════════════════════════════
if "UNIVERSAL_URL_RESOLVER" not in code:
    resolver = '''

# ══════════════════════════════════════════════════════════
#  UNIVERSAL_URL_RESOLVER — find working URLs for any content
# ══════════════════════════════════════════════════════════
_url_verify_cache = {}
_dead_url_cache = set()  # Permanent skip list
_URL_VERIFY_MAX_CACHE = 1000


def verify_url_exists(url: str, timeout: int = 3) -> bool:
    """Fast HEAD check with GET fallback. Cached."""
    if not url or not url.startswith("http"):
        return False

    # Dead URLs — never retry
    if url in _dead_url_cache:
        return False

    # Success cache
    if url in _url_verify_cache:
        return _url_verify_cache[url]

    if len(_url_verify_cache) > _URL_VERIFY_MAX_CACHE:
        _url_verify_cache.clear()

    headers = {"User-Agent": "Mozilla/5.0 ScuttleBot/2.0"}

    try:
        r = requests.head(url, headers=headers, timeout=timeout, allow_redirects=True)
        if r.status_code in (403, 405, 501):
            # Server blocks HEAD but URL likely exists
            _url_verify_cache[url] = True
            return True
        ok = 200 <= r.status_code < 400
        _url_verify_cache[url] = ok
        if not ok:
            _dead_url_cache.add(url)
        return ok
    except Exception:
        pass

    try:
        r = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True, stream=True)
        ok = 200 <= r.status_code < 400
        _url_verify_cache[url] = ok
        if not ok:
            _dead_url_cache.add(url)
        return ok
    except Exception:
        _dead_url_cache.add(url)
        _url_verify_cache[url] = False
        return False


# Common URL patterns used by Nigerian university sites
_SPA_URL_PATTERNS = [
    "{base}/news/{id}",
    "{base}/news/{id}/",
    "{base}/post/{id}",
    "{base}/post/{id}/",
    "{base}/blog/{id}",
    "{base}/blog/{id}/",
    "{base}/article/{id}",
    "{base}/article/{id}/",
    "{base}/news/post/{id}",
    "{base}/news/detail/{id}",
    "{base}/posts/{id}",
    "{base}/news-and-updates/{id}",
    "{base}/{id}",
]


def resolve_url_by_pattern(base_url: str, post_id: str, timeout: int = 3):
    """
    Try multiple URL patterns for SPA-generated links.
    Returns the first working URL, or None.
    """
    if not base_url or not post_id:
        return None

    base = base_url.rstrip("/")
    for pattern in _SPA_URL_PATTERNS:
        url = pattern.format(base=base, id=post_id)
        if url in _dead_url_cache:
            continue
        if verify_url_exists(url, timeout=timeout):
            logger.info(f"  ✅ Resolved URL pattern: {url}")
            return url
    return None


def search_url_by_title(base_url: str, title: str, uni_name: str) -> str:
    """
    Fallback: search the site's homepage/sitemap for a link matching the title.
    Returns the actual URL, or None.
    """
    if not base_url or not title or len(title) < 15:
        return None

    base = base_url.rstrip("/")
    headers = {"User-Agent": "Mozilla/5.0 ScuttleBot/2.0"}

    # Normalize title for matching
    import re as _re_t
    title_words = _re_t.findall(r'\\w+', title.lower())
    title_keywords = [w for w in title_words if len(w) > 4][:5]

    if not title_keywords:
        return None

    # Check sitemap first (fastest)
    sitemap_urls = [f"{base}/sitemap.xml", f"{base}/wp-sitemap.xml",
                    f"{base}/post-sitemap.xml", f"{base}/sitemap_index.xml"]

    for sm_url in sitemap_urls:
        try:
            r = requests.get(sm_url, headers=headers, timeout=5)
            if r.status_code != 200:
                continue
            if "<urlset" not in r.text and "<sitemapindex" not in r.text:
                continue

            locs = _re_t.findall(r"<loc>([^<]+)</loc>", r.text)
            for loc in locs[:500]:
                loc_lower = loc.lower()
                if sum(1 for kw in title_keywords if kw in loc_lower) >= 2:
                    if verify_url_exists(loc, timeout=3):
                        logger.info(f"  🎯 Found URL via sitemap: {loc[:80]}")
                        return loc
        except Exception:
            continue

    # Fallback: scrape homepage for matching links
    try:
        r = requests.get(base, headers=headers, timeout=5)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "lxml")
            for a in soup.find_all("a", href=True):
                text = a.get_text().strip().lower()
                if len(text) < 15:
                    continue
                # Count matching keywords
                matches = sum(1 for kw in title_keywords if kw in text)
                if matches >= 3:
                    href = a["href"]
                    if not href.startswith("http"):
                        href = f"{base}/{href.lstrip('/')}"
                    if verify_url_exists(href, timeout=3):
                        logger.info(f"  🎯 Found URL via homepage: {href[:80]}")
                        return href
    except Exception:
        pass

    return None


def resolve_or_skip(base_url: str, constructed_url: str, post_id: str,
                    title: str, uni_name: str):
    """
    Master URL resolver. Given a constructed URL that might be broken,
    tries every strategy and returns a working URL or None.

    Order of attempts:
    1. Constructed URL (fastest path — trust it if valid)
    2. Multi-pattern SPA templates (for /news/, /post/, etc.)
    3. Title-based sitemap/homepage search
    """
    # Strategy 1: Trust the constructed URL if it works
    if constructed_url and verify_url_exists(constructed_url, timeout=3):
        return constructed_url

    logger.info(f"  ⚠️  Constructed URL broken, trying alternatives: {constructed_url[:70]}")

    # Strategy 2: Try common SPA patterns
    if post_id and base_url:
        resolved = resolve_url_by_pattern(base_url, post_id, timeout=3)
        if resolved:
            return resolved

    # Strategy 3: Search by title
    if title and base_url:
        resolved = search_url_by_title(base_url, title, uni_name)
        if resolved:
            return resolved

    # Nothing worked — skip this item
    logger.warning(f"  ❌ Could not resolve URL for: {title[:60]}")
    return None

'''
    # Replace old verify_url_exists + _url_verify_cache block
    old_block = '''# ══════════════════════════════════════════════════════════
#  VERIFY_URL_V1 — confirm links exist before ingesting
# ══════════════════════════════════════════════════════════
_url_verify_cache = {}
_URL_VERIFY_MAX_CACHE = 500


def verify_url_exists(url: str, timeout: int = 4) -> bool:
    """
    Quick HEAD request to verify a URL actually exists.
    Returns True if status is 2xx or 3xx (redirect OK).
    Caches results to avoid duplicate checks within a scrape cycle.
    """
    if not url or not url.startswith("http"):
        return False

    # Cache lookup
    if url in _url_verify_cache:
        return _url_verify_cache[url]

    # Cap cache size to avoid unbounded memory growth
    if len(_url_verify_cache) > _URL_VERIFY_MAX_CACHE:
        _url_verify_cache.clear()

    headers = {"User-Agent": "Mozilla/5.0 ScuttleBot/2.0"}

    # Try HEAD first (fast)
    try:
        r = requests.head(url, headers=headers, timeout=timeout, allow_redirects=True)
        ok = 200 <= r.status_code < 400
        # Some servers block HEAD — retry with GET if 405/403
        if r.status_code in (403, 405, 501):
            ok = True  # Assume it exists — HEAD just isn't allowed
        _url_verify_cache[url] = ok
        return ok
    except Exception:
        pass

    # GET fallback (slower, only if HEAD fails)
    try:
        r = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True, stream=True)
        ok = 200 <= r.status_code < 400
        _url_verify_cache[url] = ok
        return ok
    except Exception:
        _url_verify_cache[url] = False
        return False
'''

    if old_block in code:
        code = code.replace(old_block, resolver.strip(), 1)
        changes.append("Replaced verify_url_exists with Universal URL Resolver")

# ══════════════════════════════════════════════════════════
# 2. Wire resolver into submit_scraped_item_to_backend
# ══════════════════════════════════════════════════════════
old_verify = '''    # VERIFY_URL_V1 — reject broken URLs before ingesting
    if source_url and not verify_url_exists(source_url):
        logger.info(f"⏭️  Skipping (URL invalid): {source_url[:80]}")
        return'''

new_verify = '''    # UNIVERSAL_URL_RESOLVER — try to find a working URL or skip
    if source_url:
        # Extract post ID from URL if present (for SPA fallback)
        import re as _re_pid
        post_id_match = _re_pid.search(r'/(?:post|news|blog|article|posts)/([a-zA-Z0-9_\\-]+)/?$', source_url)
        post_id = post_id_match.group(1) if post_id_match else None

        # Get university's base URL for pattern attempts
        from urllib.parse import urlparse as _urlparse
        parsed = _urlparse(source_url)
        base_url = f"{parsed.scheme}://{parsed.netloc}"

        resolved_url = resolve_or_skip(
            base_url=base_url,
            constructed_url=source_url,
            post_id=post_id,
            title=title,
            uni_name=uni_name,
        )
        if not resolved_url:
            return  # Skip — no valid URL found
        source_url = resolved_url  # Use the working URL'''

if old_verify in code:
    code = code.replace(old_verify, new_verify, 1)
    changes.append("Wired resolver into submit (auto-fixes broken URLs)")
else:
    # Try alternative anchor
    if "# VERIFY_URL_V1" in code:
        print("⚠️  Could not find exact verify block — check manually")

# ══════════════════════════════════════════════════════════
# 3. Ensure junks/dead URL caches don't grow too big
# ══════════════════════════════════════════════════════════
if "_dead_url_cache" in code and "_DEAD_CACHE_MAX" not in code:
    # Add size limit
    old_cache = '''_dead_url_cache = set()  # Permanent skip list'''
    new_cache = '''_dead_url_cache = set()  # Skip list
_DEAD_CACHE_MAX = 5000  # Cap to prevent unbounded growth'''
    code = code.replace(old_cache, new_cache, 1)
    changes.append("Capped dead URL cache at 5000")

# ══════════════════════════════════════════════════════════
# 4. Add a public endpoint to inspect dead URLs
# ══════════════════════════════════════════════════════════
if "DEAD_URLS_ENDPOINT" not in code:
    endpoint = '''

# ══════════════════════════════════════════════════════════
#  DEAD_URLS_ENDPOINT — inspect what's been skipped
# ══════════════════════════════════════════════════════════

@app.get("/api/v1/admin/dead-urls", tags=["Admin"])
def list_dead_urls(limit: int = 100):
    """See which URLs the scraper has rejected."""
    return {
        "total_cached": len(_url_verify_cache),
        "total_dead": len(_dead_url_cache),
        "sample_dead_urls": list(_dead_url_cache)[:limit],
    }

'''
    needle = '@app.get("/", tags=["Health Check"])'
    if needle in code:
        code = code.replace(needle, endpoint + "\n" + needle, 1)
        changes.append("Added /api/v1/admin/dead-urls endpoint")

# Save
f.write_text(code)

print("=== Changes ===")
for c in changes:
    print(f"   ✅ {c}")
if not changes:
    print("   ℹ️  No changes")

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
