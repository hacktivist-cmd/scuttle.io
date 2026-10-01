import os
import uuid
import hashlib
import logging
from datetime import datetime
from typing import List, Optional

import requests
import pdfplumber
from bs4 import BeautifulSoup
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey, String, Text, create_engine,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, relationship, sessionmaker
from celery import Celery
from celery.schedules import crontab
from dotenv import load_dotenv

load_dotenv()

# SYS_PATH_PATCHED — ensure `app` module is importable from Celery workers
import sys as _sys
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if _BACKEND_DIR not in _sys.path:
    _sys.path.insert(0, _BACKEND_DIR)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("scuttle_engine")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/scuttle_db")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

celery_app = Celery("scuttle_tasks", broker=REDIS_URL, backend=REDIS_URL)
celery_app.conf.timezone = "Africa/Lagos"

# ==================== Beat Schedule ====================
celery_app.conf.beat_schedule = {
    "scrape-all-institutions-and-jamb-dynamic": {
        "task": "main.run_all_scrapers_and_jamb",
        "schedule": 43200.0,
    },
    "cleanup-old-announcements-daily": {
        "task": "main.cleanup_old_announcements",
        "schedule": crontab(hour=2, minute=0),
    },
    "send-daily-digests": {
        "task": "main.send_daily_digests",
        "schedule": crontab(hour=8, minute=0),
    },
    "send-weekly-digests": {
        "task": "main.send_weekly_digests",
        "schedule": crontab(hour=8, minute=0, day_of_week="mon"),
    },
}

class UniversityModel(Base):
    __tablename__ = "universities"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    short_code = Column(String(50), unique=True, nullable=False, index=True)
    institution_type = Column(String(50), nullable=False, default="University")
    base_url = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    announcements = relationship("AnnouncementModel", back_populates="university", cascade="all, delete-orphan")


class AnnouncementModel(Base):
    __tablename__ = "announcements"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    university_id = Column(UUID(as_uuid=True), ForeignKey("universities.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    title = Column(Text, nullable=False)
    slug_hash = Column(String(64), unique=True, nullable=False, index=True)
    summary = Column(Text, nullable=True)
    source_url = Column(Text, nullable=False)
    has_attachment = Column(Boolean, default=False, nullable=False)
    attachment_url = Column(Text, nullable=True)
    pdf_extracted_text = Column(Text, nullable=True)
    date_published = Column(DateTime, nullable=True, index=True)
    date_scraped = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    priority = Column(String(20), default="normal", nullable=False, index=True)
    image_url = Column(Text, nullable=True)
    university = relationship("UniversityModel", back_populates="announcements")


class UniversityResponse(BaseModel):
    id: uuid.UUID
    name: str
    short_code: str
    institution_type: str
    base_url: str
    is_active: bool

    class Config:
        from_attributes = True


class AnnouncementResponse(BaseModel):
    id: uuid.UUID
    university_id: uuid.UUID
    category: str
    title: str
    summary: Optional[str] = None
    source_url: str
    has_attachment: bool
    attachment_url: Optional[str] = None
    pdf_extracted_text: Optional[str] = None
    date_published: Optional[datetime] = None
    date_scraped: datetime

    class Config:
        from_attributes = True


NIGERIAN_INSTITUTIONS_SEED = [
    {"name": "Joint Admissions and Matriculation Board", "short_code": "JAMB", "institution_type": "Board", "base_url": "https://www.jamb.gov.ng"},
    {"name": "University of Lagos", "short_code": "UNILAG", "institution_type": "Federal University", "base_url": "https://unilag.edu.ng"},
    {"name": "University of Ibadan", "short_code": "UI", "institution_type": "Federal University", "base_url": "https://ui.edu.ng"},
    {"name": "Obafemi Awolowo University", "short_code": "OAU", "institution_type": "Federal University", "base_url": "https://oauife.edu.ng"},
    {"name": "Ahmadu Bello University", "short_code": "ABU", "institution_type": "Federal University", "base_url": "https://abu.edu.ng"},
    {"name": "University of Nigeria, Nsukka", "short_code": "UNN", "institution_type": "Federal University", "base_url": "https://unn.edu.ng"},
    {"name": "University of Benin", "short_code": "UNIBEN", "institution_type": "Federal University", "base_url": "https://uniben.edu.ng"},
    {"name": "University of Ilorin", "short_code": "UNILORIN", "institution_type": "Federal University", "base_url": "https://unilorin.edu.ng"},
    {"name": "University of Port Harcourt", "short_code": "UNIPORT", "institution_type": "Federal University", "base_url": "https://uniport.edu.ng"},
    {"name": "Federal University of Technology, Akure", "short_code": "FUTA", "institution_type": "Federal University", "base_url": "https://futa.edu.ng"},
    {"name": "Lagos State University", "short_code": "LASU", "institution_type": "State University", "base_url": "https://lasu.edu.ng"},
    {"name": "Ladoke Akintola University of Technology", "short_code": "LAUTECH", "institution_type": "State University", "base_url": "https://lautech.edu.ng"},
    {"name": "Ambrose Alli University", "short_code": "AAU", "institution_type": "State University", "base_url": "https://aauekpoma.edu.ng"},
    {"name": "Delta State University", "short_code": "DELSU", "institution_type": "State University", "base_url": "https://delsu.edu.ng"},
    {"name": "Rivers State University", "short_code": "RSU", "institution_type": "State University", "base_url": "https://rsu.edu.ng"},
    {"name": "Covenant University", "short_code": "COVENANT", "institution_type": "Private University", "base_url": "https://covenantuniversity.edu.ng"},
    {"name": "Babcock University", "short_code": "BABCOCK", "institution_type": "Private University", "base_url": "https://babcock.edu.ng"},
    {"name": "Afe Babalola University", "short_code": "ABUAD", "institution_type": "Private University", "base_url": "https://abuad.edu.ng"},
    {"name": "Baze University", "short_code": "BAZE", "institution_type": "Private University", "base_url": "https://bazeuniversity.edu.ng"},
    {"name": "Yaba College of Technology", "short_code": "YABATECH", "institution_type": "Polytechnic", "base_url": "https://yabatech.edu.ng"},
    {"name": "Kaduna Polytechnic", "short_code": "KADPOLY", "institution_type": "Polytechnic", "base_url": "https://kadpoly.edu.ng"},
]


def classify_announcement_category(title: str) -> str:
    t = title.lower()
    if "caps" in t or "admission status" in t:
        return "JAMB CAPS"
    if "utme" in t or "registration" in t:
        return "JAMB Registration"
    if "post-utme" in t or "screening" in t:
        return "Post-UTME"
    if "admission" in t or "merit" in t or "admitted" in t:
        return "Admission List"
    if "school fees" in t or "tuition" in t or "charges" in t:
        return "School Fees"
    if "calendar" in t or "resumption" in t or "session" in t:
        return "Academic Calendar"
    return "General News"


def parse_pdf_attachment(pdf_url: str) -> Optional[str]:
    try:
        logger.info(f"Downloading PDF: {pdf_url}")
        r = requests.get(pdf_url, timeout=30)
        if r.status_code != 200:
            return None
        tmp = f"/tmp/{uuid.uuid4()}.pdf"
        with open(tmp, "wb") as f:
            f.write(r.content)
        text = ""
        with pdfplumber.open(tmp) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    text += t + "\n"
        os.remove(tmp)
        return text.strip()[:5000]
    except Exception as e:
        logger.error(f"PDF parse error: {e}")
        return None




# ==================== Image Extraction ====================

def extract_image_from_page(url: str) -> str:
    """Fetch a page and extract the best hero image (og:image preferred)."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ScuttleBot/2.0"
        }
        r = requests.get(url, headers=headers, timeout=8)
        if r.status_code != 200:
            return ""

        soup = BeautifulSoup(r.text, "html.parser")

        # 1. Try og:image
        og = soup.find("meta", property="og:image")
        if og and og.get("content"):
            return og["content"]

        # 2. Try twitter:image
        tw = soup.find("meta", attrs={"name": "twitter:image"})
        if tw and tw.get("content"):
            return tw["content"]

        # 3. Try first large image in article/main
        for container in ["article", "main", ".entry-content", ".post-content", ".content"]:
            node = soup.select_one(container)
            if node:
                img = node.find("img")
                if img and img.get("src"):
                    src = img["src"]
                    if src.startswith("//"):
                        src = "https:" + src
                    elif src.startswith("/"):
                        from urllib.parse import urlparse
                        parsed = urlparse(url)
                        src = f"{parsed.scheme}://{parsed.netloc}{src}"
                    if src.startswith("http"):
                        return src

        return ""
    except Exception as e:
        logger.debug(f"Image extraction failed for {url}: {e}")
        return ""




def determine_priority(category: str) -> str:
    """High priority categories float to the top of the UI."""
    high = {"Post-UTME", "Admission List", "JAMB CAPS", "School Fees"}
    medium = {"JAMB Registration", "Academic Calendar"}
    if category in high:
        return "high"
    if category in medium:
        return "medium"
    return "normal"

def submit_scraped_item_to_backend(university_id, title, source_url, summary=None, attachment_url=None):
    category = classify_announcement_category(title)
    slug_hash = hashlib.sha256(f"{university_id}-{title.strip().lower()}".encode()).hexdigest()

    db = SessionLocal()
    try:
        if db.query(AnnouncementModel).filter(AnnouncementModel.slug_hash == slug_hash).first():
            return
        uni = db.query(UniversityModel).filter(UniversityModel.id == university_id).first()
        if not uni:
            return

        pdf_text = None
        has_att = False
        if attachment_url and "pdf" in attachment_url.lower():
            has_att = True
            pdf_text = parse_pdf_attachment(attachment_url)

        # Extract hero image (only for new items)
        image_url = extract_image_from_page(source_url) if source_url else ""

        new_ann = AnnouncementModel(
            university_id=university_id,
            category=category,
            title=title,
            slug_hash=slug_hash,
            image_url=image_url,
            summary=summary,
            source_url=source_url,
            has_attachment=has_att,
            attachment_url=attachment_url,
            pdf_extracted_text=pdf_text,
            date_published=datetime.utcnow(),
        )
        db.add(new_ann)
        db.commit()
        db.refresh(new_ann)
        logger.info(f"Ingested: {title[:60]}")

        # Push to Firebase Firestore
        try:
            from app.services.firebase_sync import push_announcement
            push_announcement({
                "slug_hash": slug_hash,
                "university_name": uni.name,
                "institution_type": uni.institution_type,
                "category": category,
                "title": title,
                "summary": summary or "",
                "source_url": source_url,
                "pdf_extracted_text": pdf_text,
                "date_scraped": new_ann.date_scraped.isoformat() if new_ann.date_scraped else datetime.utcnow().isoformat(),
                "priority": priority,
                "university_code": uni.short_code,
                "image_url": image_url,
            })
        except Exception as fb_err:
            logger.warning(f"Firebase sync skipped: {fb_err}")
    except Exception as e:
        db.rollback()
        logger.error(f"Ingest error: {e}")
    finally:
        db.close()


def scrape_wordpress_institution(uni_id, base_url, uni_name):
    headers = {"User-Agent": "Mozilla/5.0 ScuttleBot/2.0"}
    try:
        url = f"{base_url.rstrip('/')}/wp-json/wp/v2/posts?per_page=10"
        r = requests.get(url, headers=headers, timeout=5)
        if r.status_code == 200:
            for post in r.json():
                t_html = post.get("title", {}).get("rendered", "")
                title = BeautifulSoup(t_html, "html.parser").get_text().strip()
                link = post.get("link", base_url)
                e_html = post.get("excerpt", {}).get("rendered", "")
                summary = BeautifulSoup(e_html, "html.parser").get_text().strip()[:300]
                if title:
                    submit_scraped_item_to_backend(uni_id, title, link, summary)
            return True
    except Exception:
        pass
    return False


def scrape_html_institution(uni_id, base_url, uni_name):
    headers = {"User-Agent": "Mozilla/5.0 ScuttleBot/2.0"}
    try:
        r = requests.get(base_url, headers=headers, timeout=5)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            for a in soup.find_all("a", href=True):
                title = a.get_text().strip()
                href = a["href"]
                if len(title) > 20:
                    kws = ["post-utme", "admission", "screening", "merit", "fees", "calendar", "notice"]
                    if any(k in title.lower() for k in kws):
                        full = href if href.startswith("http") else f"{base_url.rstrip('/')}/{href.lstrip('/')}"
                        submit_scraped_item_to_backend(uni_id, title, full, f"Official update from {uni_name}. Click to view the full notice on the institution\x27s website.")
    except Exception as e:
        logger.error(f"HTML scrape failed {uni_name}: {e}")


@celery_app.task(name="main.run_all_scrapers_and_jamb")
def run_all_scrapers_and_jamb():
    db = SessionLocal()
    try:
        insts = db.query(UniversityModel).filter(UniversityModel.is_active == True).all()
        logger.info(f"Starting scraper for {len(insts)} institutions...")
        for inst in insts:
            if inst.short_code == "JAMB":
                scrape_html_institution(str(inst.id), inst.base_url, inst.name)
            else:
                if not scrape_wordpress_institution(str(inst.id), inst.base_url, inst.name):
                    scrape_html_institution(str(inst.id), inst.base_url, inst.name)
    except Exception as e:
        logger.error(f"Scrape task error: {e}")
    finally:
        db.close()




# ==================== Digest Tasks ====================

@celery_app.task(name="main.send_daily_digests")
def send_daily_digests_task():
    from app.services.digest_service import send_daily_digests
    return send_daily_digests()


@celery_app.task(name="main.send_weekly_digests")
def send_weekly_digests_task():
    from app.services.digest_service import send_weekly_digests
    return send_weekly_digests()




# ==================== Email Celery Tasks ====================

@celery_app.task(name="main.send_welcome_async")
def send_welcome_async(email: str, name: str = ""):
    from app.services.email_service import send_welcome_email
    send_welcome_email(email, name)


@celery_app.task(name="main.send_subscription_async")
def send_subscription_async(email: str, name: str = "", frequency: str = "instant"):
    from app.services.email_service import send_subscription_confirmation
    send_subscription_confirmation(email, name, frequency)


@celery_app.task(name="main.send_newsletter_async")
def send_newsletter_async(recipients: list, subject: str, message: str):
    from app.services.email_service import send_bulk
    return send_bulk(recipients, subject, message)


app = FastAPI(
    title="Scuttle.io Engine",
    version="4.0.0",
    description="JAMB + Nigerian institutions scraper + Firebase sync",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for u in NIGERIAN_INSTITUTIONS_SEED:
            if not db.query(UniversityModel).filter(UniversityModel.short_code == u["short_code"]).first():
                db.add(UniversityModel(
                    name=u["name"], short_code=u["short_code"],
                    institution_type=u["institution_type"],
                    base_url=u["base_url"], is_active=True,
                ))
        db.commit()
        logger.info("Seeded institutions successfully.")
    except Exception as e:
        logger.error(f"Seed error: {e}")
    finally:
        db.close()


@app.get("/api/v1/universities", response_model=List[UniversityResponse], tags=["Institutions"])
def list_universities(skip: int = 0, limit: int = 250, db: Session = Depends(get_db)):
    return db.query(UniversityModel).offset(skip).limit(limit).all()


@app.get("/api/v1/announcements", response_model=List[AnnouncementResponse], tags=["Announcements"])
def list_announcements(
    university_id: Optional[uuid.UUID] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
):
    q = db.query(AnnouncementModel)
    if university_id:
        q = q.filter(AnnouncementModel.university_id == university_id)
    if category:
        q = q.filter(AnnouncementModel.category.ilike(f"%{category}%"))
    if search:
        q = q.filter(AnnouncementModel.title.ilike(f"%{search}%"))
    return q.order_by(AnnouncementModel.date_scraped.desc()).offset(skip).limit(limit).all()


@app.post("/api/v1/trigger-scrape", tags=["Scraper Control"])
def trigger_manual_scrape():
    run_all_scrapers_and_jamb.delay()
    return {"status": "success", "message": "Scraping job dispatched to Celery."}




# ==================== Newsletter ====================

from pydantic import BaseModel as _BaseModel
from typing import List as _List

class _NewsletterRecipient(_BaseModel):
    email: str
    name: str = ""

class _NewsletterPayload(_BaseModel):
    subject: str
    message: str
    recipients: _List[_NewsletterRecipient]




# ==================== Welcome & Subscription Endpoints ====================

class _WelcomePayload(BaseModel):
    email: str
    name: str = ""


class _SubscriptionPayload(BaseModel):
    email: str
    name: str = ""
    frequency: str = "instant"


@app.post("/api/v1/send-welcome", tags=["Emails"])
def send_welcome(payload: _WelcomePayload):
    """Fire a welcome email after registration (async via Celery)."""
    try:
        send_welcome_async.delay(payload.email, payload.name)
        return {"status": "queued", "to": payload.email}
    except Exception as e:
        logger.warning(f"Celery unavailable, sending sync: {e}")
        from app.services.email_service import send_welcome_email
        ok = send_welcome_email(payload.email, payload.name)
        return {"status": "sent" if ok else "failed", "to": payload.email}


@app.post("/api/v1/send-subscription", tags=["Emails"])
def send_subscription(payload: _SubscriptionPayload):
    """Fire a subscription confirmation email (async via Celery)."""
    try:
        send_subscription_async.delay(payload.email, payload.name, payload.frequency)
        return {"status": "queued", "to": payload.email}
    except Exception as e:
        logger.warning(f"Celery unavailable, sending sync: {e}")
        from app.services.email_service import send_subscription_confirmation
        ok = send_subscription_confirmation(payload.email, payload.name, payload.frequency)
        return {"status": "sent" if ok else "failed", "to": payload.email}


@app.post("/api/v1/send-newsletter", tags=["Newsletter"])
def send_newsletter(payload: _NewsletterPayload):
    """Queue a newsletter broadcast (email + optional WhatsApp)."""
    # For now, log it. In production, plug in SendGrid/Resend/Postmark.
    logger.info(f"📬 Newsletter queued: '{payload.subject}' → {len(payload.recipients)} recipients")

    for r in payload.recipients[:5]:
        logger.info(f"   → {r.email}")

    if len(payload.recipients) > 5:
        logger.info(f"   → ... and {len(payload.recipients) - 5} more")

    return {
        "status": "queued",
        "subject": payload.subject,
        "recipients": len(payload.recipients),
    }


@app.get("/", tags=["Health Check"])
def health_check():
    return {
        "status": "online",
        "service": "Scuttle.io Engine",
        "timestamp": datetime.utcnow().isoformat(),
    }
