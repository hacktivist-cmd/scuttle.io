from pathlib import Path
import ast

f = Path("nigerian_university_polytechnic_jamb_engine.py")
code = f.read_text()

if "extract_date_from_body(soup)" in code:
    print("✅ Already wired")
    raise SystemExit(0)

# Find the section in extract_date_from_page that ends with the fallback
old = '''        # 4. Fallback: scan top of article
        body = soup.find("article") or soup.find("main") or soup.body
        if body:
            text = body.get_text()
            d = extract_date_from_text(text[:5000])
            if d:
                return d'''

new = '''        # 3b. STRICT_DATE_V2 — try specialized body-text extraction
        try:
            d = extract_date_from_body(soup)
            if d:
                return d
        except Exception:
            pass

        # 4. Fallback: scan top of article
        body = soup.find("article") or soup.find("main") or soup.body
        if body:
            text = body.get_text()
            d = extract_date_from_text(text[:5000])
            if d:
                return d'''

if old in code:
    code = code.replace(old, new, 1)
    f.write_text(code)
    print("✅ Wired extract_date_from_body into extract_date_from_page")
else:
    print("⚠️  Could not find anchor — checking alternative...")
    # Alternative anchor
    if "# 4. Fallback: scan top of article" in code:
        code = code.replace(
            "        # 4. Fallback: scan top of article",
            '''        # 3b. STRICT_DATE_V2 — try body-text extraction
        try:
            d = extract_date_from_body(soup)
            if d:
                return d
        except Exception:
            pass

        # 4. Fallback: scan top of article''',
            1,
        )
        f.write_text(code)
        print("✅ Wired (fallback anchor)")
    else:
        print("❌ Manual wiring needed")

try:
    ast.parse(code)
    print("✅ Syntax OK")
except SyntaxError as e:
    print(f"❌ Syntax error: {e}")
