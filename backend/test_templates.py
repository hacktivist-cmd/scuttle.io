import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path.cwd() / ".env")

from app.services.email_service import (
    send_email,
    send_announcement_alert,
    send_digest,
)

TEST_TO = os.getenv("TEST_TO", "YOUR_REAL_EMAIL@gmail.com")

# ── Template 1: Custom Newsletter ──────────────────
print("Sending Template 1 (newsletter)...")
send_email(
    to_email=TEST_TO,
    subject="Welcome to Scuttle.io",
    message=(
        "We're live. From now on you'll get Nigerian university admission updates "
        "straight to your inbox — Post-UTME, admission lists, JAMB CAPS, school fees, "
        "and more.\n\n"
        "You can customize what you want to hear about in your profile."
    ),
    recipient_name="Boss",
)

# ── Template 2: Single Announcement Alert ──────────
print("Sending Template 2 (announcement alert)...")
send_announcement_alert(
    to_email=TEST_TO,
    recipient_name="Boss",
    university="University of Lagos (UNILAG)",
    category="Post-UTME",
    title="2026/2027 Post-UTME Screening Exercise — Registration Open",
    summary="Online registration for the Post-UTME screening is now open for all candidates who chose UNILAG as their first choice. Deadline: 30th October.",
    source_url="https://unilag.edu.ng",
    image_url="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200",
    reason="From University of Lagos, a university you follow",
)

# ── Template 3: Weekly Digest ──────────────────────
print("Sending Template 3 (weekly digest)...")
send_digest(
    to_email=TEST_TO,
    recipient_name="Boss",
    subject="Your weekly Scuttle.io digest",
    items=[
        {
            "university_name": "University of Lagos",
            "category": "Post-UTME",
            "title": "2026 Post-UTME Screening Registration Open",
            "summary": "Registration now open for all first-choice candidates. Deadline 30th October.",
            "source_url": "https://unilag.edu.ng",
        },
        {
            "university_name": "University of Ibadan",
            "category": "Admission List",
            "title": "First Batch Admission List Released",
            "summary": "Candidates can now check their admission status on the official UI portal.",
            "source_url": "https://ui.edu.ng",
        },
        {
            "university_name": "Ahmadu Bello University",
            "category": "School Fees",
            "title": "Approved Schedule of School Fees 2026/2027",
            "summary": "Management has released the fee breakdown for new and returning undergraduates.",
            "source_url": "https://abu.edu.ng",
        },
    ],
)

print("\n✅ All 3 templates sent. Check your inbox!")
