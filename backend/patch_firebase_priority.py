from pathlib import Path

f = Path("app/services/firebase_sync.py")
code = f.read_text()

if '"priority":' in code:
    print("✅ Already patched.")
    raise SystemExit(0)

needle = '''            "date_scraped": payload.get("date_scraped", datetime.utcnow().isoformat()),
        }'''

addition = '''            "date_scraped": payload.get("date_scraped", datetime.utcnow().isoformat()),
            "priority": payload.get("priority", "normal"),
        }'''

if needle in code:
    code = code.replace(needle, addition, 1)
    f.write_text(code)
    print("✅ Added priority to Firebase payload.")
else:
    print("⚠️  Could not find payload dict.")
