"""One-time sync: pushes all announcements in PostgreSQL to Firebase Firestore."""
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from nigerian_university_polytechnic_jamb_engine import (
    SessionLocal, AnnouncementModel, UniversityModel,
)
from app.services.firebase_sync import push_announcement


def sync_all():
    db = SessionLocal()
    try:
        rows = (
            db.query(AnnouncementModel, UniversityModel)
            .join(UniversityModel, AnnouncementModel.university_id == UniversityModel.id)
            .all()
        )
        print(f"Found {len(rows)} announcements in PostgreSQL.\n")

        success = 0
        failed = 0
        for ann, uni in rows:
            ok = push_announcement({
                "slug_hash": ann.slug_hash,
                "university_name": uni.name,
                "institution_type": uni.institution_type,
                "category": ann.category,
                "title": ann.title,
                "summary": ann.summary or "",
                "source_url": ann.source_url,
                "pdf_extracted_text": ann.pdf_extracted_text,
                "date_scraped": ann.date_scraped.isoformat()
                    if ann.date_scraped else datetime.utcnow().isoformat(),
            })
            if ok:
                success += 1
                print(f"  ✅ {ann.title[:70]}")
            else:
                failed += 1
                print(f"  ❌ {ann.title[:70]}")

        print(f"\n═══════════════════════════")
        print(f"✅ Pushed:  {success}")
        print(f"❌ Failed:  {failed}")
        print(f"═══════════════════════════")
    finally:
        db.close()


if __name__ == "__main__":
    sync_all()
