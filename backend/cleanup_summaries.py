"""One-time cleanup: replace lazy placeholder summaries in Firestore."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from app.services.firebase_sync import init_firebase

APP_ID = "scuttle-io-default"


def cleanup():
    client = init_firebase()
    if not client:
        print("❌ Firebase not initialized.")
        return

    col_ref = (
        client.collection("artifacts")
        .document(APP_ID)
        .collection("public")
        .document("data")
        .collection("announcements")
    )

    docs = list(col_ref.stream())
    print(f"Found {len(docs)} documents to scan.\n")

    updated = 0
    for doc in docs:
        data = doc.to_dict()
        summary = data.get("summary", "")
        uni_name = data.get("university_name", "this institution")

        # Detect the lazy placeholder
        if summary.startswith("Via HTML crawler"):
            new_summary = (
                f"Official update from {uni_name}. "
                f"Click 'Visit Original Source' to read the full notice on the institution's website."
            )
            doc.reference.update({"summary": new_summary})
            updated += 1
            print(f"  ✏️  {data.get('title', '')[:70]}")

    print(f"\n═══════════════════════════")
    print(f"✅ Updated: {updated}")
    print(f"═══════════════════════════")


if __name__ == "__main__":
    cleanup()
