import logging

from app.services.email_service import send_announcement_alert

logger = logging.getLogger("auto_newsletter")


def notify_matching_users(announcement: dict, users: list) -> dict:
    """
    Given a new announcement, email everyone whose interests/followed
    universities match. Uses the beautiful announcement template.
    """
    uni = announcement.get("university_name", "")
    uni_code = announcement.get("university_code", "")
    category = announcement.get("category", "")
    title = announcement.get("title", "")
    summary = announcement.get("summary", "")
    source_url = announcement.get("source_url", "")
    image_url = announcement.get("image_url", "")

    matched = []
    for u in users:
        if not u.get("newsletterEnabled") or not u.get("email"):
            continue

        # FREQUENCY_GUARD — only instant users get real-time emails
        frequency = u.get("emailFrequency") or "instant"
        if frequency != "instant":
            continue

        interests = u.get("interests") or []
        followed = u.get("followedUniversities") or []

        matches_category = category in interests
        matches_university = (
            uni_code in followed
            or any(uni.upper().startswith(f.upper()) for f in followed)
        )

        if not (matches_category or matches_university):
            continue

        # Build the "why you're seeing this" reason
        reason_parts = []
        if matches_university:
            reason_parts.append(f"from {uni}, a university you follow")
        if matches_category:
            reason_parts.append(f"in {category}, one of your interests")
        reason = " and ".join(reason_parts).capitalize()

        send_announcement_alert(
            to_email=u["email"],
            recipient_name=u.get("name", ""),
            university=uni,
            category=category,
            title=title,
            summary=summary,
            source_url=source_url,
            image_url=image_url,
            reason=reason,
        )
        matched.append(u["email"])

    logger.info(f"📬 Auto-notified {len(matched)} users about: {title[:50]}")
    return {"notified": len(matched), "matched_emails": matched}

def notify_matching_users_from_firestore(announcement: dict) -> dict:
    """
    AUTO_NEWSLETTER_V1 — fetch Firestore users, match preferences, send emails.
    Called by the scraper after each new announcement is saved.
    """
    from app.services.firebase_sync import init_firebase
    from app.services.email_service import send_announcement_alert

    client = init_firebase()
    if not client:
        logger.warning("Firestore unavailable for auto-newsletter")
        return {"notified": 0}

    try:
        users = [{"_id": d.id, **d.to_dict()} for d in client.collection("users").stream()]
    except Exception as e:
        logger.error(f"Failed to fetch users: {e}")
        return {"notified": 0}

    uni = announcement.get("university_name", "")
    uni_code = announcement.get("university_code", "")
    category = announcement.get("category", "")
    title = announcement.get("title", "")
    summary = announcement.get("summary", "")
    source_url = announcement.get("source_url", "")
    image_url = announcement.get("image_url", "")

    matched = []
    for u in users:
        # Skip disabled or no email
        if not u.get("newsletterEnabled", True):
            continue
        if not u.get("email"):
            continue

        # Only instant-frequency users get real-time emails
        frequency = u.get("emailFrequency") or "instant"
        if frequency != "instant":
            continue

        interests = u.get("interests") or []
        followed = u.get("followedUniversities") or []

        matches_category = category in interests
        matches_university = (
            uni_code in followed
            or any(uni.upper().startswith(f.upper()) for f in followed)
        )

        if not (matches_category or matches_university):
            continue

        # Build reason for personalization
        reason_parts = []
        if matches_university:
            reason_parts.append(f"from {uni}, a university you follow")
        if matches_category:
            reason_parts.append(f"in {category}, one of your interests")
        reason = " and ".join(reason_parts).capitalize()

        try:
            send_announcement_alert(
                to_email=u["email"],
                recipient_name=u.get("name", ""),
                university=uni,
                category=category,
                title=title,
                summary=summary,
                source_url=source_url,
                image_url=image_url,
                reason=reason,
            )
            matched.append(u["email"])
        except Exception as e:
            logger.warning(f"Send failed for {u['email']}: {e}")

    logger.info(f"📬 Auto-notified {len(matched)} users about: {title[:50]}")
    return {"notified": len(matched), "matched_emails": matched[:10]}

