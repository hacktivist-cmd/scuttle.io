from pathlib import Path
import ast

f = Path("nigerian_university_polytechnic_jamb_engine.py")
code = f.read_text()
changes = []

# Fix 1: In the resolve_or_skip call inside submit_scraped_item_to_backend,
# uni_name isn't a parameter — need uni.name from the DB lookup
old = '''        resolved_url = resolve_or_skip(
            base_url=base_url,
            constructed_url=source_url,
            post_id=post_id,
            title=title,
            uni_name=uni_name,
            uni_code=uni.short_code,
        )'''

new = '''        # UNI_NAME_FIX — use uni.name from DB lookup (uni_name not in scope here)
        resolved_url = resolve_or_skip(
            base_url=base_url,
            constructed_url=source_url,
            post_id=post_id,
            title=title,
            uni_name=uni.name,
            uni_code=uni.short_code,
        )'''

if old in code:
    code = code.replace(old, new, 1)
    changes.append("Fixed uni_name → uni.name in resolver call")
else:
    print("⚠️  Could not find resolve_or_skip call")

# Fix 2: search_url_by_title also references uni_name but doesn't need it
old2 = '''def search_url_by_title(base_url: str, title: str, uni_name: str) -> str:'''
new2 = '''def search_url_by_title(base_url: str, title: str, uni_name: str = "") -> str:'''
if old2 in code:
    code = code.replace(old2, new2, 1)
    changes.append("Made uni_name optional in search_url_by_title")

# Fix 3: Any other stray uni_name references in scrape_html_institution
# Make sure the fallback path uses uni.name too
if 'summary=f"Discovered via' in code:
    # Already exists, skip
    pass

f.write_text(code)
print("=== Changes ===")
for c in changes:
    print(f"   ✅ {c}")
if not changes:
    print("   ℹ️  No changes")

try:
    ast.parse(code)
    print("\n✅ Syntax OK")
except SyntaxError as e:
    print(f"\n❌ Syntax error: {e}")
    lines = code.split("\n")
    for i in range(max(0, e.lineno - 3), min(len(lines), e.lineno + 3)):
        marker = ">>>" if i == e.lineno - 1 else "   "
        print(f"{marker} {i+1}: {lines[i]}")
