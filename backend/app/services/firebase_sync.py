import os
import base64
import json
import logging
from datetime import datetime

import firebase_admin
from firebase_admin import credentials, firestore

logger = logging.getLogger("firebase_sync")

_fs_client = None
APP_ID = "scuttle-io-default"


def init_firebase():
    """Initialize Firebase Admin SDK once at startup."""
    global _fs_client
    if _fs_client is not None:
        return _fs_client

    cred_path = os.getenv("FIREBASE_CREDENTIALS", "./firebase-service-account.json")
    cred_b64 = os.getenv("FIREBASE_CREDENTIALS_B64")

    try:
        if not firebase_admin._apps:
            if cred_b64:
                cred_dict = json.loads(base64.b64decode(cred_b64).decode("utf-8"))
                cred = credentials.Certificate(cred_dict)
            elif os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
            else:
                logger.warning("No Firebase credentials found. Sync disabled.")
                return None
            firebase_admin.initialize_app(cred)
        _fs_client = firestore.client()
        logger.info("Firebase Admin initialized successfully.")
        return _fs_client
    except Exception as e:
        logger.error(f"Firebase init failed: {e}")
        return None


def push_announcement(payload):
    """Push a scraped announcement to Firestore for the React frontend."""
    client = init_firebase()
    if not client:
        return False

    try:
        doc_ref = (
            client.collection("artifacts")
            .document(APP_ID)
            .collection("public")
            .document("data")
            .collection("announcements")
        )

        doc_id = payload.get("slug_hash")
        data = {
            "university_name": payload.get("university_name", ""),
            "institution_type": payload.get("institution_type", "University"),
            "category": payload.get("category", "General News"),
            "title": payload.get("title", ""),
            "summary": payload.get("summary", ""),
            "source_url": payload.get("source_url", ""),
            "pdf_extracted_text": payload.get("pdf_extracted_text") or "",
            "date_scraped": payload.get("date_scraped", datetime.utcnow().isoformat()),
            "priority": payload.get("priority", "normal"),
            "university_code": payload.get("university_code", ""),
            "image_url": payload.get("image_url", ""),
        }

        if doc_id:
            doc_ref.document(doc_id).set(data, merge=True)
        else:
            doc_ref.add(data)

        logger.info(f"Pushed to Firestore: {data['title'][:60]}")
        return True
    except Exception as e:
        logger.error(f"Firestore push failed: {e}")
        return False
