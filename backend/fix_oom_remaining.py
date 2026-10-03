"""
One-shot OOM fixes — no external /tmp files needed.
Applies all 5 missing memory protections.
"""
from pathlib import Path
import ast

f = Path("nigerian_university_polytechnic_jamb_engine.py")
code = f.read_text()
changes = []

# ══════════════════════════════════════════════════════════
# 1. MEMORY_CAP_URLS — cap per-uni URL processing at 40
# ══════════════════════════════════════════════════════════
if "MEMORY_CAP_URLS" not in code:
    # Find the sitemap scraper's loop and cap it
    old = '''    added = 0
    for url in all_urls[:80]:  # Cap at 80 URLs per uni'''

    new = '''    added = 0
    # MEMORY_CAP_URLS — hard cap at 40 URLs per uni (UNILAG had 4578)
    for url in all_urls[:40]:'''

    if old in code:
        code = code.replace(old, new, 1)
        changes.append("MEMORY_CAP_URLS")

# ══════════════════════════════════════════════════════════
# 2. MEMORY_FLUSH — force gc between batches
# ══════════════════════════════════════════════════════════
if "MEMORY_FLUSH" not in code:
    old = '''            # Sleep between batches so we don't hammer servers
            if i + BATCH_SIZE < len(all_insts):
                logger.info(f"⏸️  Sleeping {batch_delay}s before next batch...")
                _time.sleep(batch_delay)'''

    new = '''            # MEMORY_FLUSH — force gc to release BeautifulSoup/requests objects
            try:
                import gc as _gc
                _gc.collect()
                logger.info(f"🧹 GC collected after batch {i // BATCH_SIZE + 1}")
            except Exception:
                pass

            # Sleep between batches so we don't hammer servers
            if i + BATCH_SIZE < len(all_insts):
                logger.info(f"⏸️  Sleeping {batch_delay}s before next batch...")
                _time.sleep(batch_delay)'''

    if old in code:
        code = code.replace(old, new, 1)
        changes.append("MEMORY_FLUSH")

# ══════════════════════════════════════════════════════════
# 3. MEMORY_GUARD_V1 — memory diagnostic endpoint
# ══════════════════════════════════════════════════════════
if "MEMORY_GUARD_V1" not in code:
    endpoint = '''

# ══════════════════════════════════════════════════════════
#  MEMORY_GUARD_V1 — diagnostics + forced GC
# ══════════════════════════════════════════════════════════

@app.get("/api/v1/admin/memory", tags=["Admin"])
def memory_check(force_gc: bool = False):
    """Current memory + optional forced garbage collection."""
    import os
    try:
        import psutil
        import gc
    except ImportError:
        return {"error": "psutil not installed"}

    if force_gc:
        gc.collect()

    proc = psutil.Process(os.getpid())
    mem = proc.memory_info()
    sys_mem = psutil.virtual_memory()

    return {
        "process_rss_mb": round(mem.rss / 1024 / 1024, 2),
        "system_total_mb": round(sys_mem.total / 1024 / 1024, 2),
        "system_used_mb": round(sys_mem.used / 1024 / 1024, 2),
        "system_available_mb": round(sys_mem.available / 1024 / 1024, 2),
        "system_percent": sys_mem.percent,
        "scrape_running": _scrape_lock.locked() if '_scrape_lock' in dir() else None,
        "scrape_started_at": _current_scrape_started_at[0] if '_current_scrape_started_at' in dir() else None,
    }

'''
    needle = '@app.get("/", tags=["Health Check"])'
    if needle in code:
        code = code.replace(needle, endpoint + "\n" + needle, 1)
        changes.append("MEMORY_GUARD_V1")

# ══════════════════════════════════════════════════════════
# 4. AUTO_GC_AFTER_SCRAPE
# ══════════════════════════════════════════════════════════
if "AUTO_GC_AFTER_SCRAPE" not in code:
    old = '''        logger.info(f"🎉 Scrape complete: {succeeded} ✅ / {failed} ❌")'''

    new = '''        logger.info(f"🎉 Scrape complete: {succeeded} ✅ / {failed} ❌")

        # AUTO_GC_AFTER_SCRAPE — release accumulated memory
        try:
            import gc as _gc
            collected = _gc.collect()
            logger.info(f"🧹 Post-scrape GC: collected {collected} objects")
        except Exception:
            pass'''

    if old in code:
        code = code.replace(old, new, 1)
        changes.append("AUTO_GC_AFTER_SCRAPE")

# ══════════════════════════════════════════════════════════
# 5. STARTUP_GC_V1 — force gc on boot
# ══════════════════════════════════════════════════════════
if "STARTUP_GC_V1" not in code:
    old = '''    logger.info("✅ Uvicorn can bind port now — heavy init running in background")'''

    new = '''    logger.info("✅ Uvicorn can bind port now — heavy init running in background")

    # STARTUP_GC_V1 — force garbage collection on boot
    try:
        import gc as _gc
        _gc.collect()
    except Exception:
        pass'''

    if old in code:
        code = code.replace(old, new, 1)
        changes.append("STARTUP_GC_V1")

# ══════════════════════════════════════════════════════════
# 6. Switch to lxml parser (faster + less memory)
# ══════════════════════════════════════════════════════════
parser_swaps = 0
for old_parser in ['BeautifulSoup(r.text, "html.parser")',
                    'BeautifulSoup(html_text, "html.parser")',
                    'BeautifulSoup(r.text, "html.parser",']:
    new_parser = old_parser.replace('"html.parser"', '"lxml"')
    count = code.count(old_parser)
    if count > 0:
        code = code.replace(old_parser, new_parser)
        parser_swaps += count
if parser_swaps > 0:
    changes.append(f"lxml parser ({parser_swaps} swaps)")

# ══════════════════════════════════════════════════════════
# Save + verify
# ══════════════════════════════════════════════════════════
f.write_text(code)

print("=== Changes applied ===")
for c in changes:
    print(f"   ✅ {c}")
if not changes:
    print("   ℹ️  Nothing new — all fixes already present")

# Syntax check
try:
    ast.parse(code)
    print()
    print("✅ Syntax OK")
except SyntaxError as e:
    print(f"\n❌ Syntax error: {e}")
    lines = code.split("\n")
    line_num = e.lineno - 1
    for i in range(max(0, line_num - 5), min(len(lines), line_num + 5)):
        marker = ">>>" if i == line_num else "   "
        print(f"{marker} {i+1}: {lines[i]}")

# Final marker verification
print()
print("=== Fix markers ===")
for marker in ["SCRAPE_LOCK_V1", "MEMORY_CAP_URLS", "MEMORY_FLUSH",
                "MEMORY_GUARD_V1", "AUTO_GC_AFTER_SCRAPE", "STARTUP_GC_V1"]:
    count = code.count(marker)
    print(f"  {'✅' if count > 0 else '❌'} {marker}: {count}")
