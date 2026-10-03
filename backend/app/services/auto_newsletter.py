"""
Auto-newsletter — sends announcement alerts to users whose preferences match.
STRICT MODE: only sends if user has preferences AND content matches.
"""
import logging

from app.services.email_service import send_announcement_alert
from app.services.firebase_sync import init_firebase

logger = logging.getLogger("auto_newsletter")


def notify_matching_users_from_firestore(announcement: dict) -> dict:
    """
    Fetch Firestore users, filter by STRICT preference match, send emails.

    Matching rules (user MUST have at least one preference):
    1. newsletterEnabled == True
    2. NOT suspended
    3. emailFrequency == 'instant' (daily/weekly handled separately)
    4. Has at least ONE of:
       - followedUniversities non-empty AND matches announcement's university
       - interests non-empty AND matches announcement's category

    Every skipped user is logged with a reason so we can audit.
    """
    client = init_firebase()
    if not client:
        logger.warning("[newsletter] Firestore unavailable")
        return {"notified": 0, "matched": [], "skipped": 0}

    # ── Announcement metadata ──
    uni_name = (announcement.get("university_name") or "").strip()
    uni_code = (announcement.get("university_code") or "").strip().upper()
    category = (announcement.get("category") or "").strip()
    title = announcement.get("title", "")

    if not (uni_name and category):
        logger.warning(f"[newsletter] Missing metadata for: {title[:60]}")
        return {"notified": 0, "matched": [], "skipped": 0}

    # ── Fetch users ──
    try:
        users = [{"_id": d.id, **d.to_dict()} for d in client.collection("users").stream()]
    except Exception as e:
        logger.error(f"[newsletter] Failed to fetch users: {e}")
        return {"notified": 0, "matched": [], "skipped": 0}

    matched = []
    matched_reasons = []
    skipped = 0
    skip_reasons = {
        "no_email": 0,
        "newsletter_off": 0,
        "suspended": 0,
        "frequency_not_instant": 0,
        "no_preferences": 0,
        "no_match": 0,
    }

    for u in users:
        # ── Gate 1: has email ──
        email = u.get("email")
        if not email:
            skip_reasons["no_email"] += 1
            skipped += 1
            continue

        # ── Gate 2: newsletter enabled (default True) ──
        if u.get("newsletterEnabled") is False:
            skip_reasons["newsletter_off"] += 1
            skipped += 1
            continue

        # ── Gate 3: not suspended ──
        if u.get("suspended") is True:
            skip_reasons["suspended"] += 1
            skipped += 1
            continue

        # ── Gate 4: instant frequency only (daily/weekly handled by digest service) ──
        frequency = u.get("emailFrequency") or "instant"
        if frequency != "instant":
            skip_reasons["frequency_not_instant"] += 1
            skipped += 1
            continue

        # ── Gate 5: MUST have at least one preference ──
        interests = u.get("interests") or []
        followed = u.get("followedUniversities") or []

        if not interests and not followed:
            skip_reasons["no_preferences"] += 1
            skipped += 1
            continue

        # ── Gate 6: content must match at least one preference ──
        matches_category = category in interests if interests else False

        # University match — accept multiple formats
        matches_university = False
        if followed:
            upper_followed = [f.upper() for f in followed]
            if uni_code and uni_code in upper_followed:
                matches_university = True
            elif uni_name:
                # Check if any followed code appears in the uni name
                for f in upper_followed:
                    if f and f in uni_name.upper():
                        matches_university = True
                        break
                # Or if any followed matches the first word of the uni name
                if not matches_university:
                    first_word = uni_name.split()[0].upper()
                    if len(first_word) >= 4 and first_word in upper_followed:
                        matches_university = True

        if not (matches_category or matches_university):
            skip_reasons["no_match"] += 1
            skipped += 1
            continue

        # ── Build reason text ──
        reason_parts = []
        if matches_university:
            reason_parts.append(f"from {uni_name}, a university you follow")
        if matches_category:
            reason_parts.append(f"in {category}, one of your interests")
        reason = " and ".join(reason_parts).capitalize()

        # ── Send ──
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
                matched_reasons.append({
                    "email": email,
                    "reason": reason,
                    "matched_by": {
                        "category": matches_category,
                        "university": matches_university,
                    },
                })
            else:
                logger.warning(f"[newsletter] Send failed for {email}")
        except Exception as e:
            logger.warning(f"[newsletter] Send error for {email}: {e}")

    # ── Report ──
    logger.info(f"📬 [newsletter] '{title[:50]}' → {len(matched)}/{len(users)} matched")
    if skip_reasons["no_preferences"] > 0:
        logger.info(f"   Skipped: {skip_reasons['no_preferences']} users with no preferences")
    if skip_reasons["no_match"] > 0:
        logger.info(f"   Skipped: {skip_reasons['no_match']} users with prefs that didn't match")
    if skip_reasons["frequency_not_instant"] > 0:
        logger.info(f"   Skipped: {skip_reasons['frequency_not_instant']} non-instant frequency")
    if skip_reasons["newsletter_off"] > 0:
        logger.info(f"   Skipped: {skip_reasons['newsletter_off']} newsletter disabled")
    if skip_reasons["suspended"] > 0:
        logger.info(f"   Skipped: {skip_reasons['suspended']} suspended")

    for m in matched_reasons[:5]:  # log first 5 matches
        logger.info(f"   ✅ {m['email']} — {m['reason']}")

    return {
        "notified": len(matched),
        "matched": matched,
        "skipped": skipped,
        "skip_reasons": skip_reasons,
    }


# Legacy alias — some code may still call this
def notify_matching_users(announcement: dict, users: list) -> dict:
    """Fallback for in-memory user lists (rarely used)."""
    logger.info("[newsletter] Legacy notify_matching_users called — using Firestore")
    return notify_matching_users_from_firestore(announcement)
