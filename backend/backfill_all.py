"""Backfill university_code + image_url for existing announcements."""
import os, sys
from datetime import datetime
from time import sleep

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv()

from nigerian_university_polytechnic_jamb_engine import (
    SessionLocal, AnnouncementModel, UniversityModel, extract_image_from_page,
)
from app.services.firebase_sync import push_announcement


def backfill():
    db = SessionLocal()
    try:
        rows = (
            db.query(AnnouncementModel, UniversityModel)
            .join(UniversityModel, AnnouncementModel.university_id == UniversityModel.id)
            .all()
        )
        print(f"Found {len(rows)} announcements to backfill.\n")

        ok, failed = 0, 0
        for i, (ann, uni) in enumerate(rows, 1):
            print(f"[{i}/{len(rows)}] {ann.title[:55]}")

            img = ann.image_url
            if not img:
                img = extract_image_from_page(ann.source_url)
                if img:
                    ann.image_url = img
                    db.commit()

            push_announcement({
                "slug_hash": ann.slug_hash,
                "university_name": uni.name,
                "institution_type": uni.institution_type,
                "category": ann.category,
                "title": ann.title,
                "summary": ann.summary or "",
                "source_url": ann.source_url,
                "pdf_extracted_text": ann.pdf_extracted_text,
                "date_scraped": ann.date_scraped.isoformat() if ann.date_scraped else datetime.utcnow().isoformat(),
                "priority": ann.priority or "normal",
                "university_code": uni.short_code,  # ← THE KEY FIX
                "image_url": img or "",
            })
            ok += 1
            print(f"   ✅ code={uni.short_code}, img={'yes' if img else 'no'}")
            sleep(0.3)

        print(f"\n═══════════════════")
        print(f"✅ Synced: {ok}")
        print(f"❌ Failed: {failed}")
        print(f"═══════════════════")
    finally:
        db.close()


if __name__ == "__main__":
    backfill()
