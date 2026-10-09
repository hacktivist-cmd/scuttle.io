from pathlib import Path
import ast

f = Path("nigerian_university_polytechnic_jamb_engine.py")
code = f.read_text()

if "INGEST_TRACE_V1" in code:
    print("✅ Already patched")
    raise SystemExit(0)

# Add trace logging right before the AnnouncementModel insert
old = '''    try:
        # DEDUPE_QUICK_V1 — quick check before doing expensive work
        if db.query(AnnouncementModel).filter(AnnouncementModel.slug_hash == slug_hash).first():
            return'''

new = '''    try:
        # INGEST_TRACE_V1 — log every attempt so we can trace failures
        logger.debug(f"  📥 Ingesting: {title[:60]} ({uni.short_code})")

        # DEDUPE_QUICK_V1 — quick check before doing expensive work
        if db.query(AnnouncementModel).filter(AnnouncementModel.slug_hash == slug_hash).first():
            logger.debug(f"  ⏭️  Duplicate: {title[:60]}")
            return'''

if old in code:
    code = code.replace(old, new, 1)
    f.write_text(code)
    print("✅ Added ingest trace logging")

try:
    ast.parse(code)
    print("✅ Syntax OK")
except SyntaxError as e:
    print(f"❌ Syntax error: {e}")
