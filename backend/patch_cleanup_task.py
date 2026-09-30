from pathlib import Path

f = Path("nigerian_university_polytechnic_jamb_engine.py")
code = f.read_text()

if "CLEANUP_TASK_PATCHED" in code:
    print("✅ Already patched.")
    raise SystemExit(0)

# Add the cleanup task after the run_all_scrapers_and_jamb task
needle = '''@celery_app.task(name="main.run_all_scrapers_and_jamb")
def run_all_scrapers_and_jamb():'''

addition = '''# CLEANUP_TASK_PATCHED
@celery_app.task(name="main.cleanup_old_announcements")
def cleanup_old_announcements():
    """Delete normal-priority announcements older than 60 days."""
    from datetime import timedelta

    db = SessionLocal()
    try:
        cutoff = datetime.utcnow() - timedelta(days=60)
        deleted = (
            db.query(AnnouncementModel)
            .filter(
                AnnouncementModel.priority == "normal",
                AnnouncementModel.date_scraped < cutoff,
            )
            .delete(synchronize_session=False)
        )
        db.commit()
        logger.info(f"🧹 Cleanup: deleted {deleted} old low-priority announcements.")

        # Also delete from Firestore
        try:
            from app.services.firebase_sync import init_firebase
            client = init_firebase()
            if client:
                col_ref = (
                    client.collection("artifacts")
                    .document("scuttle-io-default")
                    .collection("public")
                    .document("data")
                    .collection("announcements")
                )
                docs = list(col_ref.stream())
                fs_deleted = 0
                for d in docs:
                    data = d.to_dict()
                    if data.get("priority") != "high" and data.get("priority") != "medium":
                        try:
                            ts = datetime.fromisoformat(data.get("date_scraped", "").replace("Z", ""))
                            if ts < cutoff:
                                d.reference.delete()
                                fs_deleted += 1
                        except Exception:
                            pass
                logger.info(f"🧹 Firestore cleanup: deleted {fs_deleted} old items.")
        except Exception as fs_err:
            logger.warning(f"Firestore cleanup skipped: {fs_err}")

        return {"deleted_postgres": deleted}
    except Exception as e:
        db.rollback()
        logger.error(f"Cleanup failed: {e}")
        return {"error": str(e)}
    finally:
        db.close()


@celery_app.task(name="main.run_all_scrapers_and_jamb")
def run_all_scrapers_and_jamb():'''

if needle in code:
    code = code.replace(needle, addition, 1)
    print("✅ Added cleanup task.")

# Update beat schedule to run cleanup daily
old_schedule = '''celery_app.conf.beat_schedule = {
    "scrape-all-institutions-and-jamb-every-6-hours": {
        "task": "main.run_all_scrapers_and_jamb",
        "schedule": 21600.0,
    },
}'''

new_schedule = '''celery_app.conf.beat_schedule = {
    "scrape-all-institutions-and-jamb-every-6-hours": {
        "task": "main.run_all_scrapers_and_jamb",
        "schedule": 21600.0,
    },
    "cleanup-old-announcements-daily": {
        "task": "main.cleanup_old_announcements",
        "schedule": 86400.0,  # every 24 hours
    },
}'''

if old_schedule in code:
    code = code.replace(old_schedule, new_schedule, 1)
    print("✅ Added cleanup to beat schedule.")

f.write_text(code)
print("✅ Backend patched with cleanup task.")
