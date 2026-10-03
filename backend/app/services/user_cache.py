"""
User cache — prevents Firestore quota exhaustion.
Reads the users collection ONCE per scrape cycle, reuses for all ingests.
"""
import time
import logging

logger = logging.getLogger("user_cache")

_cache = {
    "users": None,
    "fetched_at": 0,
}
CACHE_TTL_SECONDS = 300  # 5 minutes


def get_cached_users(force_refresh: bool = False):
    """
    Get the users list from Firestore, cached for 5 minutes.
    Returns a list of dicts with '_id' key added.
    """
    from app.services.firebase_sync import init_firebase

    now = time.time()
    age = now - _cache["fetched_at"]

    if not force_refresh and _cache["users"] is not None and age < CACHE_TTL_SECONDS:
        return _cache["users"]

    client = init_firebase()
    if not client:
        logger.warning("[user_cache] Firestore unavailable")
        return _cache["users"] or []

    try:
        users = [{"_id": d.id, **d.to_dict()} for d in client.collection("users").stream()]
        _cache["users"] = users
        _cache["fetched_at"] = now
        logger.info(f"[user_cache] Refreshed: {len(users)} users (age was {int(age)}s)")
        return users
    except Exception as e:
        logger.error(f"[user_cache] Fetch failed: {e}")
        return _cache["users"] or []


def invalidate_cache():
    """Force next get_cached_users to refresh."""
    _cache["fetched_at"] = 0


def get_cache_age_seconds():
    if _cache["fetched_at"] == 0:
        return None
    return int(time.time() - _cache["fetched_at"])
