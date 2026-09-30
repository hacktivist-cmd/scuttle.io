"""Fetch hero images for existing announcements (one-time job)."""
import os
import sys
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
            .filter((AnnouncementModel.image_url == None) | (AnnouncementModel.image_url == ""))
            .all()
        )
        print(f"Found {len(rows)} announcements without images.\n")

        success, failed = 0, 0
        for i, (ann, uni) in enumerate(rows, 1):
            print(f"[{i}/{len(rows)}] {ann.title[:60]}")
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
                    "university_code": uni.short_code,
                    "image_url": img,
                })
                print(f"  ✅ {img[:80]}")
                success += 1
            else:
                print(f"  ⚠️  No image found")
                failed += 1
            sleep(0.5)

        print(f"\n═══════════════════════════")
        print(f"✅ Images found:  {success}")
        print(f"⚠️  No image:     {failed}")
        print(f"═══════════════════════════")
    finally:
        db.close()


if __name__ == "__main__":
    backfill()
