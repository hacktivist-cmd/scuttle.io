"""
Auto-newsletter — sends announcement alerts ONLY to users whose preferences match.
STRICT MODE: user must have prefs AND content must match one of them.
"""
import logging

from app.services.email_service import send_announcement_alert
from app.services.firebase_sync import init_firebase

logger = logging.getLogger("auto_newsletter")


def notify_matching_users_from_firestore(announcement: dict) -> dict:
    """Fetch Firestore users, filter by STRICT preference match, send emails."""
    client = init_firebase()
    if not client:
        logger.warning("[newsletter] Firestore unavailable")
        return {"notified": 0, "matched": [], "skipped": 0}

    uni_name = (announcement.get("university_name") or "").strip()
    uni_code = (announcement.get("university_code") or "").strip().upper()
    category = (announcement.get("category") or "").strip()
    title = announcement.get("title", "")

    if not (uni_name and category):
        logger.warning(f"[newsletter] Missing metadata for: {title[:60]}")
        return {"notified": 0, "matched": [], "skipped": 0}

    from app.services.user_cache import get_cached_users
    try:
        users = get_cached_users()
    except Exception as e:
        logger.error(f"[newsletter] Failed to get users: {e}")
        return {"notified": 0, "matched": [], "skipped": 0}

    matched = []
    matched_reasons = []
    skipped = 0
    skip = {"no_email": 0, "newsletter_off": 0, "suspended": 0,
            "frequency_not_instant": 0, "no_preferences": 0, "no_match": 0}

    for u in users:
        email = u.get("email")
        if not email:
            skip["no_email"] += 1; skipped += 1; continue
        if u.get("newsletterEnabled") is False:
            skip["newsletter_off"] += 1; skipped += 1; continue
        if u.get("suspended") is True:
            skip["suspended"] += 1; skipped += 1; continue

        frequency = u.get("emailFrequency") or "instant"
        if frequency != "instant":
            skip["frequency_not_instant"] += 1; skipped += 1; continue

        interests = u.get("interests") or []
        followed = u.get("followedUniversities") or []

        if not interests and not followed:
            skip["no_preferences"] += 1; skipped += 1; continue

        # Category match
        matches_category = category in interests if interests else False

        # University match (accept code OR name substring)
        matches_university = False
        if followed:
            upper_followed = [f.upper() for f in followed if f]
            if uni_code and uni_code in upper_followed:
                matches_university = True
            elif uni_name:
                for f in upper_followed:
                    if f in uni_name.upper():
                        matches_university = True
                        break
                if not matches_university:
                    first_word = uni_name.split()[0].upper()
                    if len(first_word) >= 4 and first_word in upper_followed:
                        matches_university = True

        if not (matches_category or matches_university):
            skip["no_match"] += 1; skipped += 1; continue

        reason_parts = []
        if matches_university:
            reason_parts.append(f"from {uni_name}, a university you follow")
        if matches_category:
            reason_parts.append(f"in {category}, one of your interests")
        reason = " and ".join(reason_parts).capitalize()

        try:
            ok = send_announcement_alert(
                to_email=email,
                recipient_name=u.get("name", ""),
                university=uni_name,
                category=category,
                title=title,
                summary=announcement.get("summary") or "",
                source_url=announcement.get("source_url") or "",
                image_url=announcement.get("image_url") or "",
                reason=reason,
            )
            if ok:
                matched.append(email)
                matched_reasons.append({"email": email, "reason": reason})
        except Exception as e:
            logger.warning(f"[newsletter] Send error for {email}: {e}")

    logger.info(f"📬 [newsletter] '{title[:50]}' → {len(matched)}/{len(users)} matched")
    if skip["no_preferences"] > 0:
        logger.info(f"   Skipped: {skip['no_preferences']} users with no preferences")
    if skip["no_match"] > 0:
        logger.info(f"   Skipped: {skip['no_match']} users with prefs that didn't match")
    if skip["frequency_not_instant"] > 0:
        logger.info(f"   Skipped: {skip['frequency_not_instant']} non-instant")
    if skip["newsletter_off"] > 0:
        logger.info(f"   Skipped: {skip['newsletter_off']} newsletter disabled")
    if skip["suspended"] > 0:
        logger.info(f"   Skipped: {skip['suspended']} suspended")

    for m in matched_reasons[:5]:
        logger.info(f"   ✅ {m['email']} — {m['reason']}")

    return {"notified": len(matched), "matched": matched, "skipped": skipped,
            "skip_reasons": skip}


def notify_matching_users(announcement: dict, users: list) -> dict:
    """Legacy alias — routes to Firestore version."""
    return notify_matching_users_from_firestore(announcement)
