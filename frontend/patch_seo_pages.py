from pathlib import Path

patches = {
    "src/pages/Home.jsx": (
        "import { useAuthGate } from '../hooks/useAuthGate'",
        "import { useAuthGate } from '../hooks/useAuthGate'\nimport { useSEO } from '../hooks/useSEO'"
    ),
    "src/pages/Universities.jsx": (
        "import RevealWrapper from '../components/RevealWrapper'",
        "import RevealWrapper from '../components/RevealWrapper'\nimport { useSEO } from '../hooks/useSEO'"
    ),
}

for file, (needle, replacement) in patches.items():
    p = Path(file)
    if not p.exists():
        continue
    code = p.read_text()
    if "useSEO" in code:
        print(f"✅ {file} already patched")
        continue
    if needle in code:
        code = code.replace(needle, replacement, 1)
        p.write_text(code)
        print(f"✅ Added useSEO import to {file}")
    else:
        print(f"⚠️  Could not patch {file}")
