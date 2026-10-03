"""Send FCM push notifications to subscribed users."""
import logging
from typing import List, Dict

from firebase_admin import messaging

from app.services.firebase_sync import init_firebase

logger = logging.getLogger("push_service")


def _get_firestore():
    return init_firebase()


def send_push_to_user(
    fcm_token: str,
    title: str,
    body: str,
    url: str = "/",
) -> bool:
    """Send a single push notification to an FCM token."""
    if not fcm_token:
        return False

    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=title[:100],
                body=body[:200],
            ),
            data={
                "url": url,
                "click_action": url,
            },
            webpush=messaging.WebpushConfig(
                notification=messaging.WebpushNotification(
                    title=title[:100],
                    body=body[:200],
                    icon="/android-chrome-192x192.png",
                    badge="/favicon-32x32.png",
                    require_interaction=False,
                ),
                fcm_options=messaging.WebpushFCMOptions(
                    link=url,
                ),
            ),
            token=fcm_token,
        )

        response = messaging.send(message)
        logger.info(f"🔔 Push sent: {response[:20]}... to {fcm_token[:20]}...")
        return True
    except messaging.UnregisteredError:
        logger.warning(f"Token unregistered: {fcm_token[:20]}...")
        return False
    except messaging.SenderIdMismatchError:
        logger.warning(f"Token mismatch: {fcm_token[:20]}...")
        return False
    except Exception as e:
        logger.error(f"Push send failed: {e}")
        return False


def send_push_to_users_multicast(
    tokens: List[str],
    title: str,
    body: str,
    url: str = "/",
) -> Dict:
    """Send push to up to 500 tokens at once."""
    if not tokens:
        return {"success": 0, "failure": 0}

    # FCM allows max 500 tokens per multicast
    tokens = tokens[:500]

    try:
        message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title=title[:100],
                body=body[:200],
            ),
            data={"url": url, "click_action": url},
            webpush=messaging.WebpushConfig(
                notification=messaging.WebpushNotification(
                    title=title[:100],
                    body=body[:200],
                    icon="/android-chrome-192x192.png",
                    badge="/favicon-32x32.png",
                ),
                fcm_options=messaging.WebpushFCMOptions(link=url),
            ),
            tokens=tokens,
        )

        response = messaging.send_each_for_multicast(message)
        logger.info(f"🔔 Multicast: {response.success_count}/{len(tokens)} sent")
        return {
            "success": response.success_count,
            "failure": response.failure_count,
        }
    except Exception as e:
        logger.error(f"Multicast failed: {e}")
        return {"success": 0, "failure": len(tokens)}


def notify_users_about_announcement(announcement: dict):
    """
    Given a new announcement, send push to users whose interests match.
    Called from the scraper pipeline.
    """
    client = _get_firestore()
    if not client:
        logger.warning("Firestore not available for push")
        return

    uni_name = announcement.get("university_name", "")
    uni_code = announcement.get("university_code", "")
    category = announcement.get("category", "")
    title = announcement.get("title", "")
    summary = announcement.get("summary", "")
    source_url = announcement.get("source_url", "")

    # Collect matching users (from cache — prevents quota exhaustion)
    from app.services.user_cache import get_cached_users

    matching_tokens = []
    try:
        users = get_cached_users()
        for u in users:
            if not u.get("pushEnabled") or not u.get("fcmToken"):
                continue
            if u.get("suspended"):
                continue

            interests = u.get("interests") or []
            followed = u.get("followedUniversities") or []

            matches_cat = category in interests
            matches_uni = uni_code in followed or any(
                uni_name.upper().startswith(f.upper()) for f in followed
            )

            if matches_cat or matches_uni:
                matching_tokens.append(u["fcmToken"])
    except Exception as e:
        logger.error(f"Failed to get users from cache: {e}")
        return

    if not matching_tokens:
        logger.info(f"No subscribers to notify for: {title[:50]}")
        return

    # Compose notification
    push_title = f"🔔 {uni_name}: {category}"
    push_body = title[:150]
    push_url = source_url or "/"

    result = send_push_to_users_multicast(
        tokens=matching_tokens,
        title=push_title,
        body=push_body,
        url=push_url,
    )
    logger.info(f"📢 Pushed to {result['success']} users about: {title[:50]}")
    return result
