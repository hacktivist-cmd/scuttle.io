import logging
from datetime import datetime, timedelta

from app.services.email_service import send_digest, send_announcement_alert
from app.services.firebase_sync import init_firebase

logger = logging.getLogger("digest_service")

APP_ID = "scuttle-io-default"


def _get_all_users():
    """Load all user profiles from Firestore."""
    client = init_firebase()
    if not client:
        return []
    try:
        snap = client.collection("users").stream()
        return [{"_id": d.id, **d.to_dict()} for d in snap]
    except Exception as e:
        logger.error(f"Failed to fetch users: {e}")
        return []


def _get_recent_announcements(hours: int = 24):
    """Fetch announcements from the last N hours."""
    client = init_firebase()
    if not client:
        return []
    try:
        cutoff = (datetime.utcnow() - timedelta(hours=hours)).isoformat()
        col = (
            client.collection("artifacts")
            .document(APP_ID)
            .collection("public")
            .document("data")
            .collection("announcements")
        )
        docs = col.where("date_scraped", ">=", cutoff).stream()
        return [d.to_dict() for d in docs]
    except Exception as e:
        logger.error(f"Failed to fetch announcements: {e}")
        return []


def send_daily_digests():
    """Send one digest per user with today's matched announcements."""
    users = _get_all_users()
    announcements = _get_recent_announcements(hours=24)

    logger.info(f"📬 Daily digest: {len(users)} users, {len(announcements)} announcements")

    sent = 0
    for u in users:
        if u.get("emailFrequency") != "daily":
            continue
        if not u.get("newsletterEnabled", True):
            continue
        if not u.get("email"):
            continue

        matched = _match_for_user(u, announcements)
        if not matched:
            continue

        send_digest(
            to_email=u["email"],
            recipient_name=u.get("name", ""),
            subject="Your daily Scuttle.io updates",
            items=matched[:10],
        )
        sent += 1

    logger.info(f"✅ Daily digests sent: {sent}")
    return {"sent": sent}


def send_weekly_digests():
    """Send one digest per user with the week's matched announcements."""
    users = _get_all_users()
    announcements = _get_recent_announcements(hours=24 * 7)

    logger.info(f"📬 Weekly digest: {len(users)} users, {len(announcements)} announcements")

    sent = 0
    for u in users:
        if u.get("emailFrequency") != "weekly":
            continue
        if not u.get("newsletterEnabled", True):
            continue
        if not u.get("email"):
            continue

        matched = _match_for_user(u, announcements)
        if not matched:
            continue

        send_digest(
            to_email=u["email"],
            recipient_name=u.get("name", ""),
            subject="Your weekly Scuttle.io digest",
            items=matched[:15],
        )
        sent += 1

    logger.info(f"✅ Weekly digests sent: {sent}")
    return {"sent": sent}


def _match_for_user(user, announcements):
    """Return announcements matching this user's interests/followed unis."""
    interests = user.get("interests") or []
    followed = user.get("followedUniversities") or []

    matched = []
    for a in announcements:
        cat = a.get("category", "")
        uni = (a.get("university_name") or "").upper()
        code = (a.get("university_code") or "").upper()

        matches_cat = cat in interests
        matches_uni = code in [f.upper() for f in followed] or any(
            uni.startswith(f.upper()) for f in followed
        )

        if matches_cat or matches_uni:
            matched.append({
                "university_name": a.get("university_name", ""),
                "category": cat,
                "title": a.get("title", ""),
                "summary": a.get("summary", ""),
                "source_url": a.get("source_url", ""),
            })

    return matched
