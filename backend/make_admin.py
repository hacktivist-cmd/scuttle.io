"""Mark a Firebase user as admin in Firestore."""
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path.cwd() / ".env")

from app.services.firebase_sync import init_firebase

UID = "Ao8FkY1Kwcbb7DblQpW9OKXx2Q62"


def make_admin(uid: str):
    client = init_firebase()
    if not client:
        print("❌ Firebase not initialized — check credentials")
        sys.exit(1)

    ref = client.collection("users").document(uid)
    snap = ref.get()

    if snap.exists:
        existing = snap.to_dict()
        print(f"📄 Existing profile:")
        print(f"   email: {existing.get('email', '—')}")
        print(f"   name:  {existing.get('name', '—')}")
        print(f"   isAdmin: {existing.get('isAdmin', False)}")
        print()

        # Merge in admin flag + ensure required fields exist
        updates = {
            "isAdmin": True,
            "newsletterEnabled": existing.get("newsletterEnabled", False),
            "emailFrequency": existing.get("emailFrequency", "off"),
            "interests": existing.get("interests", []),
            "followedUniversities": existing.get("followedUniversities", []),
        }
        ref.set(updates, merge=True)
        print(f"✅ Updated user {uid} → isAdmin: true")
    else:
        # Create the profile from scratch
        # (you'll need to fill in email + name manually afterward)
        ref.set({
            "uid": uid,
            "email": "scuttleadmin@gmail.com",
            "name": "Scuttle Admin",
            "isAdmin": True,
            "newsletterEnabled": False,
            "emailFrequency": "off",
            "interests": [],
            "followedUniversities": [],
        })
        print(f"✅ Created admin profile for {uid}")

    # Confirm
    final = ref.get().to_dict()
    print()
    print("─── Final state ───")
    for k, v in final.items():
        print(f"   {k}: {v}")


if __name__ == "__main__":
    make_admin(UID)
