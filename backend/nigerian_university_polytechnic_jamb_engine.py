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

    # Scraper tracking
    scrape_interval_minutes = Column(String(20), default="360", nullable=False)
    last_scraped_at = Column(DateTime, nullable=True)
    last_scrape_status = Column(String(20), default="unknown", nullable=False)
    last_scrape_error = Column(Text, nullable=True)
    consecutive_failures = Column(String(10), default="0", nullable=False)

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
    university_name: Optional[str] = None
    institution_type: Optional[str] = None
    university_code: Optional[str] = None
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
    {"name": 'Joint Admissions and Matriculation Board', "short_code": 'JAMB', "institution_type": 'Board', "base_url": 'https://www.jamb.gov.ng'},
    {"name": 'National Open University of Nigeria', "short_code": 'NOUN', "institution_type": 'Federal University', "base_url": 'https://nouedu.net'},
    {"name": 'Abubakar Tafawa Balewa University', "short_code": 'ATBU', "institution_type": 'Federal University', "base_url": 'https://atbu.edu.ng'},
    {"name": 'Ahmadu Bello University', "short_code": 'ABU', "institution_type": 'Federal University', "base_url": 'https://abu.edu.ng'},
    {"name": 'Alex Ekwueme Federal University, Ndufu-Alike', "short_code": 'FUNAI', "institution_type": 'Federal University', "base_url": 'https://funai.edu.ng'},
    {"name": 'Bayero University Kano', "short_code": 'BUK', "institution_type": 'Federal University', "base_url": 'https://buk.edu.ng'},
    {"name": 'Federal University, Birnin Kebbi', "short_code": 'FUBK', "institution_type": 'Federal University', "base_url": 'https://fubk.edu.ng'},
    {"name": 'Federal University, Dutse', "short_code": 'FUD', "institution_type": 'Federal University', "base_url": 'https://fud.edu.ng'},
    {"name": 'Federal University, Dutsin-Ma', "short_code": 'FUDMA', "institution_type": 'Federal University', "base_url": 'https://fudma.edu.ng'},
    {"name": 'Federal University, Gashua', "short_code": 'FUGASHUA', "institution_type": 'Federal University', "base_url": 'https://fugashua.edu.ng'},
    {"name": 'Federal University, Gusau', "short_code": 'FUGUSAU', "institution_type": 'Federal University', "base_url": 'https://fugusau.edu.ng'},
    {"name": 'Federal University, Kashere', "short_code": 'FUKASHERE', "institution_type": 'Federal University', "base_url": 'https://fukashere.edu.ng'},
    {"name": 'Federal University, Lafia', "short_code": 'FULAFIA', "institution_type": 'Federal University', "base_url": 'https://fulafia.edu.ng'},
    {"name": 'Federal University, Lokoja', "short_code": 'FULOKOJA', "institution_type": 'Federal University', "base_url": 'https://fulokoja.edu.ng'},
    {"name": 'Federal University, Otuoke', "short_code": 'FUOTUOKE', "institution_type": 'Federal University', "base_url": 'https://fuotuoke.edu.ng'},
    {"name": 'Federal University, Oye-Ekiti', "short_code": 'FUOYE', "institution_type": 'Federal University', "base_url": 'https://fuoye.edu.ng'},
    {"name": 'Federal University, Wukari', "short_code": 'FUWUKARI', "institution_type": 'Federal University', "base_url": 'https://fuwukari.edu.ng'},
    {"name": 'Federal University of Agriculture, Abeokuta', "short_code": 'FUNAAB', "institution_type": 'Federal University', "base_url": 'https://funaab.edu.ng'},
    {"name": 'Federal University of Petroleum Resources, Effurun', "short_code": 'FUPRE', "institution_type": 'Federal University', "base_url": 'https://fupre.edu.ng'},
    {"name": 'Federal University of Technology, Akure', "short_code": 'FUTA', "institution_type": 'Federal University', "base_url": 'https://futa.edu.ng'},
    {"name": 'Federal University of Technology, Minna', "short_code": 'FUTMINNA', "institution_type": 'Federal University', "base_url": 'https://futminna.edu.ng'},
    {"name": 'Federal University of Technology, Owerri', "short_code": 'FUTO', "institution_type": 'Federal University', "base_url": 'https://futo.edu.ng'},
    {"name": 'Michael Okpara University of Agriculture, Umudike', "short_code": 'MOUAU', "institution_type": 'Federal University', "base_url": 'https://mouau.edu.ng'},
    {"name": 'Modibbo Adama University, Yola', "short_code": 'MAU', "institution_type": 'Federal University', "base_url": 'https://mau.edu.ng'},
    {"name": 'Nnamdi Azikiwe University, Awka', "short_code": 'UNIZIK', "institution_type": 'Federal University', "base_url": 'https://unizik.edu.ng'},
    {"name": 'Obafemi Awolowo University, Ile-Ife', "short_code": 'OAU', "institution_type": 'Federal University', "base_url": 'https://oauife.edu.ng'},
    {"name": 'University of Benin', "short_code": 'UNIBEN', "institution_type": 'Federal University', "base_url": 'https://uniben.edu.ng'},
    {"name": 'University of Calabar', "short_code": 'UNICAL', "institution_type": 'Federal University', "base_url": 'https://unical.edu.ng'},
    {"name": 'University of Ibadan', "short_code": 'UI', "institution_type": 'Federal University', "base_url": 'https://ui.edu.ng'},
    {"name": 'University of Ilorin', "short_code": 'UNILORIN', "institution_type": 'Federal University', "base_url": 'https://unilorin.edu.ng'},
    {"name": 'University of Jos', "short_code": 'UNIJOS', "institution_type": 'Federal University', "base_url": 'https://unijos.edu.ng'},
    {"name": 'University of Lagos', "short_code": 'UNILAG', "institution_type": 'Federal University', "base_url": 'https://unilag.edu.ng'},
    {"name": 'University of Maiduguri', "short_code": 'UNIMAID', "institution_type": 'Federal University', "base_url": 'https://unimaid.edu.ng'},
    {"name": 'University of Nigeria, Nsukka', "short_code": 'UNN', "institution_type": 'Federal University', "base_url": 'https://unn.edu.ng'},
    {"name": 'University of Port Harcourt', "short_code": 'UNIPORT', "institution_type": 'Federal University', "base_url": 'https://uniport.edu.ng'},
    {"name": 'University of Uyo', "short_code": 'UNIUYO', "institution_type": 'Federal University', "base_url": 'https://uniuyo.edu.ng'},
    {"name": 'Usmanu Danfodiyo University, Sokoto', "short_code": 'UDUSOK', "institution_type": 'Federal University', "base_url": 'https://udusok.edu.ng'},
    {"name": 'Federal University of Health Sciences, Otukpo', "short_code": 'FUHSO', "institution_type": 'Federal University', "base_url": 'https://fuhso.edu.ng'},
    {"name": 'Federal University of Health Sciences, Ila Orangun', "short_code": 'FUHSI', "institution_type": 'Federal University', "base_url": 'https://fuhsi.edu.ng'},
    {"name": 'Federal University of Agriculture, Zuru', "short_code": 'FUAZ', "institution_type": 'Federal University', "base_url": 'https://fuaz.edu.ng'},
    {"name": 'Yusuf Maitama Sule Federal University of Education', "short_code": 'YMSFUE', "institution_type": 'Federal University', "base_url": 'https://ymsfue.edu.ng'},
    {"name": 'Adeyemi Federal University of Education', "short_code": 'AFUED', "institution_type": 'Federal University', "base_url": 'https://afued.edu.ng'},
    {"name": 'Federal University of Allied Health Sciences', "short_code": 'FUAHS', "institution_type": 'Federal University', "base_url": 'https://fuahse.edu.ng'},
    {"name": 'Federal University of Medicine and Medical Sciences', "short_code": 'FUMMSA', "institution_type": 'Federal University', "base_url": 'https://fummsa.net'},
    {"name": 'Federal University of Education Pankshin', "short_code": 'FEDUNIPANKS', "institution_type": 'Federal University', "base_url": 'https://fedunipanks.edu.ng'},
    {"name": 'Federal University of Education Kontagora', "short_code": 'FEDUNIKONT', "institution_type": 'Federal University', "base_url": 'https://fedunikont.edu.ng'},
    {"name": 'University of Maritime Studies', "short_code": 'UNIMARITIME', "institution_type": 'Federal University', "base_url": 'https://unimaritime.edu.ng'},
    {"name": 'Federal University of Environment and Technology', "short_code": 'FUET', "institution_type": 'Federal University', "base_url": 'https://fuet.edu.ng'},
    {"name": 'Federal University of Applied Sciences', "short_code": 'FUDAPPLIED', "institution_type": 'Federal University', "base_url": 'https://fudapplied.edu.ng'},
    {"name": 'Tai Solarin Federal University of Education', "short_code": 'TSFUE', "institution_type": 'Federal University', "base_url": 'https://tsfue.edu.ng'},
    {"name": 'Federal University of Agriculture and Developmental Studies', "short_code": 'FUADS', "institution_type": 'Federal University', "base_url": 'https://fuads.edu.ng'},
    {"name": 'Federal University of Technology and Environmental Studies', "short_code": 'FUTES', "institution_type": 'Federal University', "base_url": 'https://futes.edu.ng'},
    {"name": 'Federal University of Agriculture and Technology Okeho', "short_code": 'FUATO', "institution_type": 'Federal University', "base_url": 'https://fuato.edu.ng'},
    {"name": 'Federal University of Health Science and Technology', "short_code": 'FUHST', "institution_type": 'Federal University', "base_url": 'https://fuhst.edu.ng'},
    {"name": 'Federal University of Agriculture and Technology Obio-Akpa', "short_code": 'FUATOBIO', "institution_type": 'Federal University', "base_url": 'https://fuatobio.edu.ng'},
    {"name": 'Federal University of Science and Technology, Epe', "short_code": 'FUSTEPE', "institution_type": 'Federal University', "base_url": 'https://fustepe.edu.ng'},
    {"name": 'Federal University of Science and Technology, Kabo', "short_code": 'FUSTKABO', "institution_type": 'Federal University', "base_url": 'https://fustkabo.edu.ng'},
    {"name": 'Nigerian Maritime University Okerenkoko', "short_code": 'NMU', "institution_type": 'Federal University', "base_url": 'https://nmu.edu.ng'},
    {"name": 'Air Force Institute of Technology', "short_code": 'AFIT', "institution_type": 'Federal University', "base_url": 'https://afit.edu.ng'},
    {"name": 'Nigerian Army University Biu', "short_code": 'NAUB', "institution_type": 'Federal University', "base_url": 'https://naub.edu.ng'},
    {"name": 'David Nweze Umahi Federal University of Medical Sciences', "short_code": 'DNUMFUMS', "institution_type": 'Federal University', "base_url": 'https://kdums.edu.ng'},
    {"name": 'Admiralty University Ibusa', "short_code": 'ADUN', "institution_type": 'Federal University', "base_url": 'https://adun.edu.ng'},
    {"name": 'Federal University of Transportation Daura', "short_code": 'FUTDAURA', "institution_type": 'Federal University', "base_url": 'https://futrd.edu.ng'},
    {"name": 'African Aviation and Aerospace University', "short_code": 'AAAU', "institution_type": 'Federal University', "base_url": 'https://aaau.edu.ng'},
    {"name": 'National University of Science and Technology', "short_code": 'NUST', "institution_type": 'Federal University', "base_url": 'https://nust.edu.ng'},
    {"name": 'Federal University of Agriculture Bassam-Biri', "short_code": 'FUAB', "institution_type": 'Federal University', "base_url": 'https://fuab.edu.ng'},
    {"name": 'Federal University of Health Sciences Kwale', "short_code": 'FUHSKWALE', "institution_type": 'Federal University', "base_url": 'https://fuhskwale.edu.ng'},
    {"name": 'Federal University of Health Sciences, Katsina', "short_code": 'FUHSKATSINA', "institution_type": 'Federal University', "base_url": 'https://fuhskatsina.edu.ng'},
    {"name": 'Federal University of Agriculture, Mubi', "short_code": 'FUAMUBI', "institution_type": 'Federal University', "base_url": 'https://fuamubi.edu.ng'},
    {"name": 'Federal University of Education, Zaria', "short_code": 'FUEZARIA', "institution_type": 'Federal University', "base_url": 'https://fuezaria.edu.ng'},
    {"name": 'Alvan Ikoku Federal University of Education', "short_code": 'AIFUE', "institution_type": 'Federal University', "base_url": 'https://aifue.edu.ng'},
    {"name": 'Abia State University', "short_code": 'ABSU', "institution_type": 'State University', "base_url": 'https://absu.edu.ng'},
    {"name": 'Adamawa State University', "short_code": 'ADSU', "institution_type": 'State University', "base_url": 'https://adsu.edu.ng'},
    {"name": 'Adekunle Ajasin University', "short_code": 'AAUA', "institution_type": 'State University', "base_url": 'https://aaua.edu.ng'},
    {"name": 'Akwa Ibom State University', "short_code": 'AKSU', "institution_type": 'State University', "base_url": 'https://aksu.edu.ng'},
    {"name": 'Ambrose Alli University', "short_code": 'AAU', "institution_type": 'State University', "base_url": 'https://aauekpoma.edu.ng'},
    {"name": 'Anambra State University (COOU)', "short_code": 'COOU', "institution_type": 'State University', "base_url": 'https://coou.edu.ng'},
    {"name": 'Bauchi State University, Gadau', "short_code": 'BASU', "institution_type": 'State University', "base_url": 'https://basug.edu.ng'},
    {"name": 'Benue State University', "short_code": 'BSU', "institution_type": 'State University', "base_url": 'https://bsum.edu.ng'},
    {"name": 'Borno State University', "short_code": 'BOSU', "institution_type": 'State University', "base_url": 'https://bosu.edu.ng'},
    {"name": 'Cross River University of Technology', "short_code": 'CRUTECH', "institution_type": 'State University', "base_url": 'https://crutech.edu.ng'},
    {"name": 'Delta State University, Abraka', "short_code": 'DELSU', "institution_type": 'State University', "base_url": 'https://delsu.edu.ng'},
    {"name": 'Delta State University of Science and Technology', "short_code": 'DSUST', "institution_type": 'State University', "base_url": 'https://dsust.edu.ng'},
    {"name": 'Ebonyi State University', "short_code": 'EBSU', "institution_type": 'State University', "base_url": 'https://ebsu.edu.ng'},
    {"name": 'Ekiti State University', "short_code": 'EKSU', "institution_type": 'State University', "base_url": 'https://eksu.edu.ng'},
    {"name": 'Enugu State University of Science and Technology', "short_code": 'ESUT', "institution_type": 'State University', "base_url": 'https://esut.edu.ng'},
    {"name": 'Gombe State University', "short_code": 'GSU', "institution_type": 'State University', "base_url": 'https://gsu.edu.ng'},
    {"name": 'Ibrahim Badamasi Babangida University', "short_code": 'IBBU', "institution_type": 'State University', "base_url": 'https://ibbu.edu.ng'},
    {"name": 'Imo State University', "short_code": 'IMSU', "institution_type": 'State University', "base_url": 'https://imsu.edu.ng'},
    {"name": 'Kaduna State University', "short_code": 'KASU', "institution_type": 'State University', "base_url": 'https://kasu.edu.ng'},
    {"name": 'Kano University of Science and Technology', "short_code": 'KUST', "institution_type": 'State University', "base_url": 'https://kustwudil.edu.ng'},
    {"name": 'Kebbi State University of Science and Technology', "short_code": 'KSUSTA', "institution_type": 'State University', "base_url": 'https://ksusta.edu.ng'},
    {"name": 'Kogi State University (PAAU)', "short_code": 'PAAU', "institution_type": 'State University', "base_url": 'https://paau.edu.ng'},
    {"name": 'Kwara State University', "short_code": 'KWASU', "institution_type": 'State University', "base_url": 'https://kwasu.edu.ng'},
    {"name": 'Ladoke Akintola University of Technology', "short_code": 'LAUTECH', "institution_type": 'State University', "base_url": 'https://lautech.edu.ng'},
    {"name": 'Lagos State University', "short_code": 'LASU', "institution_type": 'State University', "base_url": 'https://lasu.edu.ng'},
    {"name": 'Nasarawa State University, Keffi', "short_code": 'NSUK', "institution_type": 'State University', "base_url": 'https://nsuk.edu.ng'},
    {"name": 'Olabisi Onabanjo University', "short_code": 'OOU', "institution_type": 'State University', "base_url": 'https://oouagoiwoye.edu.ng'},
    {"name": 'Ondo State University of Science and Technology', "short_code": 'OAUSTECH', "institution_type": 'State University', "base_url": 'https://oaustech.edu.ng'},
    {"name": 'Osu State University (PLASU)', "short_code": 'PLASU', "institution_type": 'State University', "base_url": 'https://plasu.edu.ng'},
    {"name": 'Rivers State University', "short_code": 'RSU', "institution_type": 'State University', "base_url": 'https://rsu.edu.ng'},
    {"name": 'Sokoto State University', "short_code": 'SSU', "institution_type": 'State University', "base_url": 'https://ssu.edu.ng'},
    {"name": 'Taraba State University', "short_code": 'TSU', "institution_type": 'State University', "base_url": 'https://tsuniversity.edu.ng'},
    {"name": 'Yobe State University', "short_code": 'YSU', "institution_type": 'State University', "base_url": 'https://ysu.edu.ng'},
    {"name": 'Zamfara State University', "short_code": 'ZAMFARA', "institution_type": 'State University', "base_url": 'https://zamsu.edu.ng'},
    {"name": 'Kwara State University of Education', "short_code": 'KWASUEDU', "institution_type": 'State University', "base_url": 'https://kwasuedu.edu.ng'},
    {"name": 'Abdulsalam Abubakar University of Agriculture and Climate Action', "short_code": 'AAUACA', "institution_type": 'State University', "base_url": 'https://aauaca.edu.ng'},
    {"name": 'Ebonyi State University of ICT, Science and Technology', "short_code": 'EBSUICT', "institution_type": 'State University', "base_url": 'https://ebsuict.edu.ng'},
    {"name": 'Cross River University of Education and Entrepreneurship', "short_code": 'CRUEE', "institution_type": 'State University', "base_url": 'https://cruee.edu.ng'},
    {"name": 'Benue State University of Agriculture Science and Technology', "short_code": 'BSUAST', "institution_type": 'State University', "base_url": 'https://bsuast.edu.ng'},
    {"name": 'University of Aeronautics and Aerospace Engineering Ezza', "short_code": 'UAAE', "institution_type": 'State University', "base_url": 'https://uaae.edu.ng'},
    {"name": 'University of Innovation, Science and Technology, Omuma', "short_code": 'UIST', "institution_type": 'State University', "base_url": 'https://uist.edu.ng'},
    {"name": 'Taraba State University of Tropical Agriculture', "short_code": 'TSUAT', "institution_type": 'State University', "base_url": 'https://tsuat.edu.ng'},
    {"name": 'Jigawa State University of Medical and Allied Health Sciences', "short_code": 'JSUMAHS', "institution_type": 'State University', "base_url": 'https://jsumahs.edu.ng'},
    {"name": 'Delta University of Science and Technology, Ozoro', "short_code": 'DSUSTOZORO', "institution_type": 'State University', "base_url": 'https://dsust.edu.ng'},
    {"name": 'Dennis Osadebe University, Asaba', "short_code": 'DOU', "institution_type": 'State University', "base_url": 'https://dou.edu.ng'},
    {"name": 'Lagos State University of Education', "short_code": 'LASUED', "institution_type": 'State University', "base_url": 'https://lasued.edu.ng'},
    {"name": 'Lagos State University of Science and Technology', "short_code": 'LASUSTECH', "institution_type": 'State University', "base_url": 'https://lasustech.edu.ng'},
    {"name": 'Shehu Shagari University of Education', "short_code": 'SSUE', "institution_type": 'State University', "base_url": 'https://ssue.edu.ng'},
    {"name": 'State University of Medical and Applied Sciences', "short_code": 'SUMAS', "institution_type": 'State University', "base_url": 'https://sumas.edu.ng'},
    {"name": 'University of Ilesa', "short_code": 'UNILESA', "institution_type": 'State University', "base_url": 'https://unilesa.edu.ng'},
    {"name": 'Emanuel Alayande University of Education', "short_code": 'EAUED', "institution_type": 'State University', "base_url": 'https://eaued.edu.ng'},
    {"name": 'Kogi State University, Kabba', "short_code": 'KSUKABBA', "institution_type": 'State University', "base_url": 'https://ksukabba.edu.ng'},
    {"name": 'Abdulkadir Kure University', "short_code": 'AKU', "institution_type": 'State University', "base_url": 'https://aku.edu.ng'},
    {"name": 'Kingsley Ozumba Mbadiwe University', "short_code": 'KOMU', "institution_type": 'State University', "base_url": 'https://komu.edu.ng'},
    {"name": 'University of Africa Toru Orua', "short_code": 'UAT', "institution_type": 'State University', "base_url": 'https://uat.edu.ng'},
    {"name": 'Kashim Ibrahim University, Maiduguri', "short_code": 'KSU', "institution_type": 'State University', "base_url": 'https://ksu.edu.ng'},
    {"name": 'Moshood Abiola University of Science and Technology', "short_code": 'MAUSTECH', "institution_type": 'State University', "base_url": 'https://maustech.edu.ng'},
    {"name": 'Bayelsa Medical University', "short_code": 'BMU', "institution_type": 'State University', "base_url": 'https://bmu.edu.ng'},
    {"name": 'University of Agriculture and Environmental Sciences', "short_code": 'UAES', "institution_type": 'State University', "base_url": 'https://uaes.edu.ng'},
    {"name": 'Confluence University of Science and Technology', "short_code": 'CUSTECH', "institution_type": 'State University', "base_url": 'https://custech.edu.ng'},
    {"name": 'Bamidele Olumilua University of Science and Technology', "short_code": 'BOUESTI', "institution_type": 'State University', "base_url": 'https://bouesti.edu.ng'},
    {"name": 'University of Delta, Agbor', "short_code": 'UNIDEL', "institution_type": 'State University', "base_url": 'https://unidel.edu.ng'},
    {"name": 'Babcock University', "short_code": 'BABCOCK', "institution_type": 'Private University', "base_url": 'https://babcock.edu.ng'},
    {"name": 'Igbinedion University Okada', "short_code": 'IGBINEDION', "institution_type": 'Private University', "base_url": 'https://iuokada.edu.ng'},
    {"name": 'Madonna University', "short_code": 'MADONNA', "institution_type": 'Private University', "base_url": 'https://madonnauniversity.edu.ng'},
    {"name": 'Bowen University', "short_code": 'BOWEN', "institution_type": 'Private University', "base_url": 'https://bowen.edu.ng'},
    {"name": 'Benson Idahosa University', "short_code": 'BIU', "institution_type": 'Private University', "base_url": 'https://biu.edu.ng'},
    {"name": 'Covenant University', "short_code": 'COVENANT', "institution_type": 'Private University', "base_url": 'https://covenantuniversity.edu.ng'},
    {"name": 'Pan-Atlantic University', "short_code": 'PAU', "institution_type": 'Private University', "base_url": 'https://pau.edu.ng'},
    {"name": 'American University of Nigeria', "short_code": 'AUN', "institution_type": 'Private University', "base_url": 'https://aun.edu.ng'},
    {"name": 'Ajayi Crowther University', "short_code": 'ACU', "institution_type": 'Private University', "base_url": 'https://acu.edu.ng'},
    {"name": 'Al-Hikmah University', "short_code": 'ALHIKMAH', "institution_type": 'Private University', "base_url": 'https://alhikmah.edu.ng'},
    {"name": 'Al-Qalam University', "short_code": 'ALQALAM', "institution_type": 'Private University', "base_url": 'https://auk.edu.ng'},
    {"name": 'Bells University of Technology', "short_code": 'BELLS', "institution_type": 'Private University', "base_url": 'https://bellsuniversity.edu.ng'},
    {"name": 'Bingham University', "short_code": 'BINGHAM', "institution_type": 'Private University', "base_url": 'https://binghamuni.edu.ng'},
    {"name": 'Caritas University', "short_code": 'CARITAS', "institution_type": 'Private University', "base_url": 'https://caritasuni.edu.ng'},
    {"name": 'Crawford University', "short_code": 'CRAWFORD', "institution_type": 'Private University', "base_url": 'https://crawforduniversity.edu.ng'},
    {"name": 'Crescent University', "short_code": 'CRESCENT', "institution_type": 'Private University', "base_url": 'https://crescent-university.edu.ng'},
    {"name": 'Kwararafa University', "short_code": 'KWARARAFA', "institution_type": 'Private University', "base_url": 'https://kwararafauniversity.edu.ng'},
    {"name": 'Lead City University', "short_code": 'LEADCITY', "institution_type": 'Private University', "base_url": 'https://lcu.edu.ng'},
    {"name": 'Novena University', "short_code": 'NOVENA', "institution_type": 'Private University', "base_url": 'https://novenauniversity.edu.ng'},
    {"name": 'Renaissance University', "short_code": 'RENAISSANCE', "institution_type": 'Private University', "base_url": 'https://rnu.edu.ng'},
    {"name": 'University of Mkar', "short_code": 'UNIMKAR', "institution_type": 'Private University', "base_url": 'https://unimkar.edu.ng'},
    {"name": 'Joseph Ayo Babalola University', "short_code": 'JABU', "institution_type": 'Private University', "base_url": 'https://jabu.edu.ng'},
    {"name": 'Achievers University', "short_code": 'ACHIEVERS', "institution_type": 'Private University', "base_url": 'https://achievers.edu.ng'},
    {"name": 'Caleb University', "short_code": 'CALEB', "institution_type": 'Private University', "base_url": 'https://calebuniversity.edu.ng'},
    {"name": 'Fountain University', "short_code": 'FOUNTAIN', "institution_type": 'Private University', "base_url": 'https://fuo.edu.ng'},
    {"name": 'African University of Science and Technology', "short_code": 'AUST', "institution_type": 'Private University', "base_url": 'https://aust.edu.ng'},
    {"name": 'Obong University', "short_code": 'OBONG', "institution_type": 'Private University', "base_url": 'https://obonguniversity.net'},
    {"name": 'Salem University', "short_code": 'SALEM', "institution_type": 'Private University', "base_url": 'https://salemuniversity.edu.ng'},
    {"name": 'Tansian University', "short_code": 'TANSIAN', "institution_type": 'Private University', "base_url": 'https://tansianuniversity.edu.ng'},
    {"name": 'Veritas University', "short_code": 'VERITAS', "institution_type": 'Private University', "base_url": 'https://veritas.edu.ng'},
    {"name": 'Wesley University', "short_code": 'WESLEY', "institution_type": 'Private University', "base_url": 'https://wesleyuni.edu.ng'},
    {"name": 'Western Delta University', "short_code": 'WDU', "institution_type": 'Private University', "base_url": 'https://wdu.edu.ng'},
    {"name": 'Afe Babalola University', "short_code": 'ABUAD', "institution_type": 'Private University', "base_url": 'https://abuad.edu.ng'},
    {"name": 'Godfrey Okoye University', "short_code": 'GOUNI', "institution_type": 'Private University', "base_url": 'https://gouni.edu.ng'},
    {"name": 'Nile University of Nigeria', "short_code": 'NILE', "institution_type": 'Private University', "base_url": 'https://nileuniversity.edu.ng'},
    {"name": 'Oduduwa University', "short_code": 'ODUDUWA', "institution_type": 'Private University', "base_url": 'https://oduduwauniversity.edu.ng'},
    {"name": 'Paul University', "short_code": 'PAUL', "institution_type": 'Private University', "base_url": 'https://pauluniversity.edu.ng'},
    {"name": 'Rhema University', "short_code": 'RHEMA', "institution_type": 'Private University', "base_url": 'https://rhemauniversity.edu.ng'},
    {"name": 'Wellspring University', "short_code": 'WELLSPRING', "institution_type": 'Private University', "base_url": 'https://wellspringuniversity.net'},
    {"name": 'Adeleke University', "short_code": 'ADELEKE', "institution_type": 'Private University', "base_url": 'https://adelekeuniversity.edu.ng'},
    {"name": 'Baze University', "short_code": 'BAZE', "institution_type": 'Private University', "base_url": 'https://bazeuniversity.edu.ng'},
    {"name": 'Landmark University', "short_code": 'LANDMARK', "institution_type": 'Private University', "base_url": 'https://lmu.edu.ng'},
    {"name": 'Glorious Vision University', "short_code": 'GLORIOUS', "institution_type": 'Private University', "base_url": 'https://sau.edu.ng'},
    {"name": 'Elizade University', "short_code": 'ELIZADE', "institution_type": 'Private University', "base_url": 'https://elizadeuniversity.edu.ng'},
    {"name": 'Evangel University', "short_code": 'EVANGEL', "institution_type": 'Private University', "base_url": 'https://evangeluniversity.edu.ng'},
    {"name": 'Gregory University', "short_code": 'GREGORY', "institution_type": 'Private University', "base_url": 'https://gregoryuniversity.com'},
    {"name": 'Mcpherson University', "short_code": 'MCPHERSON', "institution_type": 'Private University', "base_url": 'https://mcu.edu.ng'},
    {"name": 'Southwestern University', "short_code": 'SOUTHWESTERN', "institution_type": 'Private University', "base_url": 'https://southwesternuniversity.edu.ng'},
    {"name": 'Augustine University', "short_code": 'AUGUSTINE', "institution_type": 'Private University', "base_url": 'https://augustineuniversity.edu.ng'},
    {"name": 'Chrisland University', "short_code": 'CHRISLAND', "institution_type": 'Private University', "base_url": 'https://chrislanduniversity.edu.ng'},
    {"name": 'Edwin Clark University', "short_code": 'EDWINCLARK', "institution_type": 'Private University', "base_url": 'https://edwinclarkuniversity.edu.ng'},
    {"name": 'Hallmark University', "short_code": 'HALLMARK', "institution_type": 'Private University', "base_url": 'https://hallmark.edu.ng'},
    {"name": 'Hezekiah University', "short_code": 'HEZEKIAH', "institution_type": 'Private University', "base_url": 'https://hezekiah.edu.ng'},
    {"name": 'Kings University', "short_code": 'KINGS', "institution_type": 'Private University', "base_url": 'https://kingsuniversity.edu.ng'},
    {"name": 'Micheal & Cecilia Ibru University', "short_code": 'MCIU', "institution_type": 'Private University', "base_url": 'https://mciu.edu.ng'},
    {"name": 'Mountain Top University', "short_code": 'MOUNTAINTOP', "institution_type": 'Private University', "base_url": 'https://mtu.edu.ng'},
    {"name": 'Ritman University', "short_code": 'RITMAN', "institution_type": 'Private University', "base_url": 'https://ritmanuniversity.edu.ng'},
    {"name": 'Summit University', "short_code": 'SUMMIT', "institution_type": 'Private University', "base_url": 'https://summituniversity.edu.ng'},
    {"name": 'Christopher University', "short_code": 'CHRISTOPHER', "institution_type": 'Private University', "base_url": 'https://christopheruniversity.edu.ng'},
    {"name": 'Kola Daisi University', "short_code": 'KOLADAISI', "institution_type": 'Private University', "base_url": 'https://koladaisiuniversity.edu.ng'},
    {"name": 'Anchor University', "short_code": 'ANCHOR', "institution_type": 'Private University', "base_url": 'https://aul.edu.ng'},
    {"name": 'Dominican University', "short_code": 'DOMINICAN', "institution_type": 'Private University', "base_url": 'https://dui.edu.ng'},
    {"name": 'Legacy University', "short_code": 'LEGACY', "institution_type": 'Private University', "base_url": 'https://legacyuniversity.edu.ng'},
    {"name": 'Arthur Jarvis University', "short_code": 'ARTHURJARVIS', "institution_type": 'Private University', "base_url": 'https://arthurjarvisuniversity.edu.ng'},
    {"name": 'Ojaja University', "short_code": 'OJAJA', "institution_type": 'Private University', "base_url": 'https://crownhilluniversity.edu.ng'},
    {"name": 'Coal City University', "short_code": 'COALCITY', "institution_type": 'Private University', "base_url": 'https://ccu.edu.ng'},
    {"name": 'Clifford University', "short_code": 'CLIFFORD', "institution_type": 'Private University', "base_url": 'https://clifforduni.edu.ng'},
    {"name": 'Spiritan University', "short_code": 'SPIRITAN', "institution_type": 'Private University', "base_url": 'https://spiritanuniversity.edu.ng'},
    {"name": 'Precious Cornerstone University', "short_code": 'PRECIOUS', "institution_type": 'Private University', "base_url": 'https://pcu.edu.ng'},
    {"name": 'PAMO University of Medical Sciences', "short_code": 'PAMO', "institution_type": 'Private University', "base_url": 'https://pums.edu.ng'},
    {"name": 'Atiba University', "short_code": 'ATIBA', "institution_type": 'Private University', "base_url": 'https://atiba.edu.ng'},
    {"name": 'Eko University of Medical and Health Sciences', "short_code": 'EKOUNIVMED', "institution_type": 'Private University', "base_url": 'https://ekounivmed.edu.ng'},
    {"name": 'Skyline University', "short_code": 'SKYLINE', "institution_type": 'Private University', "base_url": 'https://sun.edu.ng'},
    {"name": 'Greenfield University', "short_code": 'GREENFIELD', "institution_type": 'Private University', "base_url": 'https://gfu.edu.ng'},
    {"name": 'Dominion University', "short_code": 'DOMINION', "institution_type": 'Private University', "base_url": 'https://dominionuniversity.edu.ng'},
    {"name": 'Trinity University', "short_code": 'TRINITY', "institution_type": 'Private University', "base_url": 'https://trinityuniversity.edu.ng'},
    {"name": 'Westland University', "short_code": 'WESTLAND', "institution_type": 'Private University', "base_url": 'https://westland.edu.ng'},
    {"name": 'Topfaith University', "short_code": 'TOPFAITH', "institution_type": 'Private University', "base_url": 'https://topfaith.edu.ng'},
    {"name": 'Thomas Adewumi University', "short_code": 'THOMASADEWUMI', "institution_type": 'Private University', "base_url": 'https://tau.edu.ng'},
    {"name": 'Maranatha University', "short_code": 'MARANATHA', "institution_type": 'Private University', "base_url": 'https://maranatha.edu.ng'},
    {"name": 'Ave Maria University', "short_code": 'AVEMARIA', "institution_type": 'Private University', "base_url": 'https://avemaria.edu.ng'},
    {"name": 'Al-Istiqama University', "short_code": 'ALISTIQAMA', "institution_type": 'Private University', "base_url": 'https://alistiqama.edu.ng'},
    {"name": 'Mudiame University', "short_code": 'MUDIAME', "institution_type": 'Private University', "base_url": 'https://mudiame.edu.ng'},
    {"name": 'Havilla University', "short_code": 'HAVILLA', "institution_type": 'Private University', "base_url": 'https://havillauniversity.edu.ng'},
    {"name": 'Claretian University of Nigeria', "short_code": 'CLARETIAN', "institution_type": 'Private University', "base_url": 'https://claretian.edu.ng'},
    {"name": 'Karl-Kumm University', "short_code": 'KARLKUMM', "institution_type": 'Private University', "base_url": 'https://karlkumm.edu.ng'},
    {"name": 'James Hope University', "short_code": 'JAMESHOPE', "institution_type": 'Private University', "base_url": 'https://jhu.edu.ng'},
    {"name": 'Maryam Abacha American University of Nigeria', "short_code": 'MAAUN', "institution_type": 'Private University', "base_url": 'https://maau.edu.ng'},
    {"name": 'Capital City University', "short_code": 'CAPITALCITY', "institution_type": 'Private University', "base_url": 'https://ccuk.edu.ng'},
    {"name": 'Ahman Pategi University', "short_code": 'AHMANPATIEGI', "institution_type": 'Private University', "base_url": 'https://ahmanpategi.edu.ng'},
    {"name": 'University of Offa', "short_code": 'UNIOFFA', "institution_type": 'Private University', "base_url": 'https://unioffa.edu.ng'},
    {"name": 'Mewar International University', "short_code": 'MEWAR', "institution_type": 'Private University', "base_url": 'https://miu.edu.ng'},
    {"name": 'Edusoko University', "short_code": 'EDUSOKO', "institution_type": 'Private University', "base_url": 'https://edusoko.edu.ng'},
    {"name": 'Philomath University', "short_code": 'PHILOMATH', "institution_type": 'Private University', "base_url": 'https://philomath.edu.ng'},
    {"name": 'Anan University', "short_code": 'ANAN', "institution_type": 'Private University', "base_url": 'https://anan.edu.ng'},
    {"name": 'North Eastern University', "short_code": 'NORTHEASTERN', "institution_type": 'Private University', "base_url": 'https://pru.edu.ng'},
    {"name": 'Al-Ansar University', "short_code": 'ALANSAR', "institution_type": 'Private University', "base_url": 'https://alansar.edu.ng'},
    {"name": 'Margaret Lawrence University', "short_code": 'MARGARETLAWRENCE', "institution_type": 'Private University', "base_url": 'https://mlu.edu.ng'},
    {"name": 'Khalifa Isiyaku Rabiu University', "short_code": 'KHALIFAISIYAKU', "institution_type": 'Private University', "base_url": 'https://kiru.edu.ng'},
    {"name": 'Sports University', "short_code": 'SPORTS', "institution_type": 'Private University', "base_url": 'https://sportsuniversity.edu.ng'},
    {"name": 'Saisa University of Medical Sciences and Technology', "short_code": 'SAISA', "institution_type": 'Private University', "base_url": 'https://saisa.edu.ng'},
    {"name": 'Nigerian British University', "short_code": 'NIGERIANBRITISH', "institution_type": 'Private University', "base_url": 'https://nbu.edu.ng'},
    {"name": 'Peter University', "short_code": 'PETER', "institution_type": 'Private University', "base_url": 'https://peteruniversity.edu.ng'},
    {"name": 'Newgate University', "short_code": 'NEWGATE', "institution_type": 'Private University', "base_url": 'https://newgate.edu.ng'},
    {"name": 'European University of Nigeria', "short_code": 'EUROPEAN', "institution_type": 'Private University', "base_url": 'https://eun.edu.ng'},
    {"name": 'NorthWest University Sokoto', "short_code": 'NORTHWEST', "institution_type": 'Private University', "base_url": 'https://nwu.edu.ng'},
    {"name": 'Rayhaan University', "short_code": 'RAYHAAN', "institution_type": 'Private University', "base_url": 'https://rayhaan.edu.ng'},
    {"name": 'Sam Maris University', "short_code": 'SAMMARIS', "institution_type": 'Private University', "base_url": 'https://sammaris.edu.ng'},
    {"name": 'Lux Mundi University', "short_code": 'LUXMUNDI', "institution_type": 'Private University', "base_url": 'https://luxmundi.edu.ng'},
    {"name": 'Maduka University', "short_code": 'MADUKA', "institution_type": 'Private University', "base_url": 'https://madukauniversity.edu.ng'},
    {"name": 'PeaceLand University', "short_code": 'PEACELAND', "institution_type": 'Private University', "base_url": 'https://peaceland.edu.ng'},
    {"name": 'Amadeus University', "short_code": 'AMADEUS', "institution_type": 'Private University', "base_url": 'https://amadeus.edu.ng'},
    {"name": 'Vision University', "short_code": 'VISION', "institution_type": 'Private University', "base_url": 'https://vision.edu.ng'},
    {"name": 'Azman University', "short_code": 'AZMAN', "institution_type": 'Private University', "base_url": 'https://azman.edu.ng'},
    {"name": 'Huda University', "short_code": 'HUDA', "institution_type": 'Private University', "base_url": 'https://huda.edu.ng'},
    {"name": 'Franco British International University', "short_code": 'FRANCOBRITISH', "institution_type": 'Private University', "base_url": 'https://fbiu.edu.ng'},
    {"name": 'Canadian University of Nigeria', "short_code": 'CANADIAN', "institution_type": 'Private University', "base_url": 'https://cun.edu.ng'},
    {"name": 'Gerar University of Medical Science', "short_code": 'GERAR', "institution_type": 'Private University', "base_url": 'https://gerar.edu.ng'},
    {"name": 'British Canadian University', "short_code": 'BRITISHCANADIAN', "institution_type": 'Private University', "base_url": 'https://bcu.edu.ng'},
    {"name": 'Hensard University', "short_code": 'HENSARD', "institution_type": 'Private University', "base_url": 'https://hensard.edu.ng'},
    {"name": 'Amaj University', "short_code": 'AMAJ', "institution_type": 'Private University', "base_url": 'https://amaj.edu.ng'},
    {"name": 'Phoenix University', "short_code": 'PHOENIX', "institution_type": 'Private University', "base_url": 'https://phoenix.edu.ng'},
    {"name": 'Wigwe University', "short_code": 'WIGWE', "institution_type": 'Private University', "base_url": 'https://wigweuniversity.edu.ng'},
    {"name": 'Hillside University of Science and Technology', "short_code": 'HILLSIDE', "institution_type": 'Private University', "base_url": 'https://hust.edu.ng'},
    {"name": 'University on the Niger', "short_code": 'UNIVERSITYONNIGER', "institution_type": 'Private University', "base_url": 'https://uniniger.edu.ng'},
    {"name": 'Elrazi Medical University Yargaya', "short_code": 'ELRAZI', "institution_type": 'Private University', "base_url": 'https://elrazi.edu.ng'},
    {"name": 'Venite University', "short_code": 'VENITE', "institution_type": 'Private University', "base_url": 'https://venite.edu.ng'},
    {"name": 'Shanahan University', "short_code": 'SHANAHAN', "institution_type": 'Private University', "base_url": 'https://shanahan.edu.ng'},
    {"name": 'The Duke Medical University', "short_code": 'DUKE', "institution_type": 'Private University', "base_url": 'https://duke.edu.ng'},
    {"name": 'Mercy Medical University', "short_code": 'MERCY', "institution_type": 'Private University', "base_url": 'https://mercy.edu.ng'},
    {"name": 'Cosmopolitan University Abuja', "short_code": 'COSMOPOLITAN', "institution_type": 'Private University', "base_url": 'https://cosmopolitan.edu.ng'},
    {"name": 'Miva Open University', "short_code": 'MIVA', "institution_type": 'Private University', "base_url": 'https://miva.university'},
    {"name": 'Iconic Open University', "short_code": 'ICONIC', "institution_type": 'Private University', "base_url": 'https://iconic.edu.ng'},
    {"name": 'West Midlands Open University', "short_code": 'WESTMIDLANDS', "institution_type": 'Private University', "base_url": 'https://wmou.edu.ng'},
    {"name": 'Al-Muhibbah Open University', "short_code": 'ALMUHIBBAH', "institution_type": 'Private University', "base_url": 'https://almuhibbah.edu.ng'},
    {"name": 'El-Amin University', "short_code": 'ELAMIN', "institution_type": 'Private University', "base_url": 'https://elamin.edu.ng'},
    {"name": 'College of Petroleum and Energy Studies', "short_code": 'CPES', "institution_type": 'Private University', "base_url": 'https://cpes.edu.ng'},
    {"name": 'Jewel University', "short_code": 'JEWEL', "institution_type": 'Private University', "base_url": 'https://jewel.edu.ng'},
    {"name": 'Prime University', "short_code": 'PRIME', "institution_type": 'Private University', "base_url": 'https://prime.edu.ng'},
    {"name": 'Nigerian University of Technology and Management', "short_code": 'NUTM', "institution_type": 'Private University', "base_url": 'https://nutm.edu.ng'},
    {"name": 'Al-Bayan University', "short_code": 'ALBAYAN', "institution_type": 'Private University', "base_url": 'https://albayan.edu.ng'},
    {"name": 'Lighthouse University', "short_code": 'LIGHTHOUSE', "institution_type": 'Private University', "base_url": 'https://lighthouse.edu.ng'},
    {"name": 'African University of Economics', "short_code": 'AFRICANUNIECON', "institution_type": 'Private University', "base_url": 'https://aue.edu.ng'},
    {"name": 'New City University', "short_code": 'NEWCITY', "institution_type": 'Private University', "base_url": 'https://newcity.edu.ng'},
    {"name": 'University of Fortune', "short_code": 'UNIFORTUNE', "institution_type": 'Private University', "base_url": 'https://unifortune.edu.ng'},
    {"name": 'Eranova University', "short_code": 'ERANOVA', "institution_type": 'Private University', "base_url": 'https://eranova.edu.ng'},
    {"name": 'Minaret University', "short_code": 'MINARET', "institution_type": 'Private University', "base_url": 'https://minaret.edu.ng'},
    {"name": 'Southern Atlantic University', "short_code": 'SOUTHERNATLANTIC', "institution_type": 'Private University', "base_url": 'https://sau.edu.ng'},
    {"name": 'Lens University', "short_code": 'LENS', "institution_type": 'Private University', "base_url": 'https://lens.edu.ng'},
    {"name": 'Monarch University', "short_code": 'MONARCH', "institution_type": 'Private University', "base_url": 'https://monarch.edu.ng'},
    {"name": 'Tonine Iredia University of Communication', "short_code": 'TONINEIREDIA', "institution_type": 'Private University', "base_url": 'https://tiuc.edu.ng'},
    {"name": 'Isaac Balami University of Aeronautics and Management', "short_code": 'ISAACBALAMI', "institution_type": 'Private University', "base_url": 'https://ibu.edu.ng'},
    {"name": 'Kevin Eze University', "short_code": 'KEVINEZE', "institution_type": 'Private University', "base_url": 'https://kevin.edu.ng'},
    {"name": 'Tazkiyah University', "short_code": 'TAZKIYAH', "institution_type": 'Private University', "base_url": 'https://tazkiyah.edu.ng'},
    {"name": 'Leadership University', "short_code": 'LEADERSHIP', "institution_type": 'Private University', "base_url": 'https://leadership.edu.ng'},
    {"name": 'Bridget University Mbaise', "short_code": 'BRIDGET', "institution_type": 'Private University', "base_url": 'https://bridget.edu.ng'},
    {"name": 'Greenland University', "short_code": 'GREENLAND', "institution_type": 'Private University', "base_url": 'https://greenland.edu.ng'},
    {"name": 'JEFAP University', "short_code": 'JEFAP', "institution_type": 'Private University', "base_url": 'https://jefap.edu.ng'},
    {"name": 'Azione Verde University', "short_code": 'AZIONVERDE', "institution_type": 'Private University', "base_url": 'https://azione.edu.ng'},
    {"name": 'Unique Open University', "short_code": 'UNIQUEOPEN', "institution_type": 'Private University', "base_url": 'https://unique.edu.ng'},
    {"name": 'American Open University', "short_code": 'AMERICANOPEN', "institution_type": 'Private University', "base_url": 'https://aou.edu.ng'},
    {"name": 'Millennium Crest University', "short_code": 'MILLENNIUMCREST', "institution_type": 'Private University', "base_url": 'https://mcu.edu.ng'},
    {"name": 'Euston University', "short_code": 'EUSTON', "institution_type": 'Private University', "base_url": 'https://euston.edu.ng'},
    {"name": 'Sani Bello University', "short_code": 'SANIBELLO', "institution_type": 'Private University', "base_url": 'https://sbu.edu.ng'},
    {"name": 'Godday Erewa University', "short_code": 'GODDAYEREWA', "institution_type": 'Private University', "base_url": 'https://geu.edu.ng'},
    {"name": 'Owolabi University', "short_code": 'OWOLABI', "institution_type": 'Private University', "base_url": 'https://owolabi.edu.ng'},
    {"name": 'Regnum Medical University', "short_code": 'REGNUM', "institution_type": 'Private University', "base_url": 'https://regnum.edu.ng'},
    {"name": 'City University Abuja', "short_code": 'CITYUNIVERSITY', "institution_type": 'Private University', "base_url": 'https://cityuniversity.edu.ng'},
    {"name": 'Transatlantic University of Medicine and Health Sciences', "short_code": 'TRANSATLANTIC', "institution_type": 'Private University', "base_url": 'https://tumhs.edu.ng'},
    {"name": 'Maria Assumpta University Owerri', "short_code": 'MARIAASSUMPTA', "institution_type": 'Private University', "base_url": 'https://mau.edu.ng'},
    {"name": 'High Flyers University', "short_code": 'HIGHFLYERS', "institution_type": 'Private University', "base_url": 'https://hfu.edu.ng'},
    {"name": 'Ummah University of Nigeria', "short_code": 'UMMAH', "institution_type": 'Private University', "base_url": 'https://ummah.edu.ng'},
    {"name": 'Pearl University', "short_code": 'PEARL', "institution_type": 'Private University', "base_url": 'https://pearl.edu.ng'},
    {"name": 'Omega University Kaduna', "short_code": 'OMEGA', "institution_type": 'Private University', "base_url": 'https://omega.edu.ng'},
    {"name": 'Yaba College of Technology', "short_code": 'YABATECH', "institution_type": 'Polytechnic', "base_url": 'https://yabatech.edu.ng'},
    {"name": 'Federal Polytechnic, Ilaro', "short_code": 'ILAROPOLY', "institution_type": 'Polytechnic', "base_url": 'https://federalpolyilaro.edu.ng'},
    {"name": 'Federal Polytechnic, Offa', "short_code": 'OFFAPOLY', "institution_type": 'Polytechnic', "base_url": 'https://fedpoffaonline.edu.ng'},
    {"name": 'Auchi Polytechnic', "short_code": 'AUCHIPOLY', "institution_type": 'Polytechnic', "base_url": 'https://auchipoly.edu.ng'},
    {"name": 'Kaduna Polytechnic', "short_code": 'KADPOLY', "institution_type": 'Polytechnic', "base_url": 'https://kadpoly.edu.ng'},
    {"name": 'Lagos State Polytechnic', "short_code": 'LASPOTECH', "institution_type": 'Polytechnic', "base_url": 'https://mylaspotech.edu.ng'},
    {"name": 'Moshood Abiola Polytechnic', "short_code": 'MAPOLY', "institution_type": 'Polytechnic', "base_url": 'https://mapoly.edu.ng'},
    {"name": 'The Polytechnic, Ibadan', "short_code": 'POLYIBADAN', "institution_type": 'Polytechnic', "base_url": 'https://polyibadan.edu.ng'},
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



# ==================== Date Extraction ====================

import re as _re
from datetime import datetime as _dt

# Matches: 2025-03-15, 15/03/2025, 15-03-2025, March 15, 2025, March 15 2025
_DATE_PATTERNS = [
    _re.compile(r'(\d{4})[-/](\d{1,2})[-/](\d{1,2})'),          # 2025-03-15
    _re.compile(r'(\d{1,2})[-/](\d{1,2})[-/](\d{4})'),          # 15/03/2025
    _re.compile(r'(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})', _re.IGNORECASE),
]

_MONTH_MAP = {
    'january': 1, 'february': 2, 'march': 3, 'april': 4, 'may': 5, 'june': 6,
    'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12,
}


def extract_date_from_text(text: str):
    """Try to find a publication date in the text. Returns datetime or None."""
    if not text:
        return None
    text = text[:3000]  # Only scan first bit

    for pat in _DATE_PATTERNS:
        m = pat.search(text)
        if m:
            groups = m.groups()
            try:
                # Handle named months
                if groups[0].lower() in _MONTH_MAP:
                    month = _MONTH_MAP[groups[0].lower()]
                    day = int(groups[1])
                    year = int(groups[2])
                else:
                    parts = [int(g) for g in groups]
                    if parts[0] > 31:  # Year first
                        year, month, day = parts
                    else:  # Day first
                        day, month, year = parts
                if 2020 <= year <= 2030 and 1 <= month <= 12 and 1 <= day <= 31:
                    return _dt(year, month, day)
            except (ValueError, TypeError):
                continue
    return None


def is_too_old(date_obj, max_age_months: int = 6):
    """Check if a date is older than the max allowed age."""
    if date_obj is None:
        return False  # Unknown dates pass through
    now = _dt.utcnow()
    days_old = (now - date_obj).days
    return days_old > max_age_months * 30


def extract_date_from_page(url: str):
    """Fetch a page and try to extract the publication date. IMPROVED_DATE_SCAN_V3"""
    try:
        headers = {"User-Agent": "Mozilla/5.0 ScuttleBot/2.0"}
        r = requests.get(url, headers=headers, timeout=5)
        if r.status_code != 200:
            return None
        soup = BeautifulSoup(r.text, "html.parser")

        # 1. Meta tags — check many variants
        meta_variants = [
            ("property", "article:published_time"),
            ("property", "og:published_time"),
            ("property", "og:updated_time"),
            ("name", "article:published_time"),
            ("name", "datePublished"),
            ("name", "publishdate"),
            ("name", "pubdate"),
            ("name", "date"),
            ("itemprop", "datePublished"),
            ("itemprop", "dateModified"),
        ]
        for attr, val in meta_variants:
            meta = soup.find("meta", attrs={attr: val})
            if meta and meta.get("content"):
                try:
                    return _dt.fromisoformat(meta["content"][:19].replace("Z", ""))
                except Exception:
                    d = extract_date_from_text(meta["content"])
                    if d:
                        return d

        # 2. <time> tags anywhere
        for t in soup.find_all("time"):
            dt_attr = t.get("datetime")
            if dt_attr:
                try:
                    return _dt.fromisoformat(dt_attr[:19].replace("Z", ""))
                except Exception:
                    d = extract_date_from_text(dt_attr)
                    if d:
                        return d
            text_date = extract_date_from_text(t.get_text())
            if text_date:
                return text_date

        # 3. Common date CSS classes
        date_classes = [
            "date", "post-date", "entry-date", "published", "post-meta",
            "meta-date", "post__date", "article-date", "card-date",
            "wp-block-post-date", "posted-on", "timestamp", "post-date-2",
            "single-post-date", "news-date", "pub-date", "date-published",
        ]
        for cls in date_classes:
            node = soup.find(class_=cls)
            if node:
                d = extract_date_from_text(node.get_text())
                if d:
                    return d

        # 4. Fallback: scan top of article
        body = soup.find("article") or soup.find("main") or soup.body
        if body:
            text = body.get_text()
            d = extract_date_from_text(text[:5000])
            if d:
                return d

        # 5. URL year hints
        for y in ["2020", "2021", "2022", "2023", "2024", "2025", "2026"]:
            if f"/{y}/" in url or f"-{y}-" in url or f"_{y}_" in url:
                return _dt(int(y), 1, 1)

        return None
    except Exception as e:
        logger.debug(f"Date extraction failed for {url}: {e}")
        return None

def extract_image_from_page(url: str) -> str:
    """Fetch a page and extract the best hero image (og:image preferred)."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ScuttleBot/2.0"
        }
        r = requests.get(url, headers=headers, timeout=5)
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
        # STRICT_DATE_CHECK_V2 — require a real publication date
        pub_date = extract_date_from_page(source_url) if source_url else None

        # If no date can be found, only allow it if it looks like a fresh announcement
        if pub_date is None:
            # Check the URL for a year hint (e.g. /2025/ or /2024/)
            url_year = None
            for y in ["2020", "2021", "2022", "2023", "2024", "2025", "2026"]:
                if y in (source_url or ""):
                    url_year = int(y)
                    break
            # If URL has an old year in it, skip
            if url_year and url_year < datetime.utcnow().year:
                logger.info(f"⏭️  Skipping (old URL year {url_year}): {title[:50]}")
                return
            # Otherwise accept it but mark date as today
            pub_date = datetime.utcnow()

        # Skip anything older than 6 months
        if is_too_old(pub_date, max_age_months=6):
            logger.info(f"⏭️  Skipping old ({pub_date.date()}): {title[:50]}")
            return

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
            # SET_DATE_PUBLISHED — use detected date if available
            date_published=pub_date if pub_date else datetime.utcnow(),
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
    """BATCH_SCRAPER_V2 — scan all universities in small batches."""
    import time as _time

    db = SessionLocal()
    try:
        all_insts = db.query(UniversityModel).filter(UniversityModel.is_active == True).all()
        logger.info(f"🚀 Scraper starting for {len(all_insts)} universities...")

        # BATCH_SCRAPER_V2 — chunk into groups of 20, sleep between batches
        BATCH_SIZE = 20
        batch_delay = 2  # seconds between batches
        succeeded, failed = 0, 0
        failed_codes = []

        for i in range(0, len(all_insts), BATCH_SIZE):
            batch = all_insts[i : i + BATCH_SIZE]
            logger.info(f"📦 Batch {i // BATCH_SIZE + 1}: {len(batch)} universities")

            for inst in batch:
                try:
                    if inst.short_code == "JAMB":
                        scrape_html_institution(str(inst.id), inst.base_url, inst.name)
                    else:
                        ok = scrape_wordpress_institution(str(inst.id), inst.base_url, inst.name)
                        if not ok:
                            scrape_html_institution(str(inst.id), inst.base_url, inst.name)

                    # HEALTH_TRACKING_V2
                    inst.last_scraped_at = datetime.utcnow()
                    inst.last_scrape_status = "ok"
                    inst.last_scrape_error = None
                    inst.consecutive_failures = "0"
                    db.commit()
                    succeeded += 1
                    logger.info(f"  ✅ {inst.short_code}")
                except Exception as inst_err:
                    inst.last_scrape_status = "failed"
                    inst.last_scrape_error = str(inst_err)[:500]
                    try:
                        failures = int(inst.consecutive_failures or 0) + 1
                        inst.consecutive_failures = str(failures)
                    except (ValueError, TypeError):
                        inst.consecutive_failures = "1"
                    db.commit()
                    failed += 1
                    failed_codes.append(inst.short_code)
                    logger.warning(f"  ❌ {inst.short_code}: {str(inst_err)[:80]}")

            # Sleep between batches so we don't hammer servers
            if i + BATCH_SIZE < len(all_insts):
                logger.info(f"⏸️  Sleeping {batch_delay}s before next batch...")
                _time.sleep(batch_delay)

        logger.info(f"🎉 Scrape complete: {succeeded} ✅ / {failed} ❌")
        if failed_codes:
            logger.info(f"   Failed: {', '.join(failed_codes[:20])}")

        # Alert if too many failures
        if failed >= 5 and failed > succeeded:
            try:
                send_failure_alert(
                    "run_all_scrapers_and_jamb",
                    f"{failed} of {len(all_insts)} failed. First: {', '.join(failed_codes[:5])}"
                )
            except Exception:
                pass
    except Exception as e:
        logger.error(f"Scraper crashed: {e}")
        try:
            send_failure_alert("run_all_scrapers_and_jamb", str(e))
        except Exception:
            pass
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
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:4173",
        "http://127.0.0.1:5173",
        "https://scuttle-io.netlify.app",
        "https://*.netlify.app",
    ],
    allow_origin_regex=r"https://.*\.netlify\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
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


@app.get("/api/v1/announcements", tags=["Announcements"])
def list_announcements(
    university_id: Optional[uuid.UUID] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
):
    # populate_university_name_v2
    q = (
        db.query(AnnouncementModel, UniversityModel)
        .join(UniversityModel, AnnouncementModel.university_id == UniversityModel.id)
    )
    if university_id:
        q = q.filter(AnnouncementModel.university_id == university_id)
    if category:
        q = q.filter(AnnouncementModel.category.ilike(f"%{category}%"))
    if search:
        q = q.filter(AnnouncementModel.title.ilike(f"%{search}%"))
    rows = q.order_by(AnnouncementModel.date_scraped.desc()).offset(skip).limit(limit).all()
    return [
        {
            "id": a.id,
            "university_id": a.university_id,
            "university_name": u.name,
            "institution_type": u.institution_type,
            "university_code": u.short_code,
            "category": a.category,
            "title": a.title,
            "summary": a.summary,
            "source_url": a.source_url,
            "has_attachment": a.has_attachment,
            "attachment_url": a.attachment_url,
            "pdf_extracted_text": a.pdf_extracted_text,
            "date_published": a.date_published,
            "date_scraped": a.date_scraped,
        }
        for a, u in rows
    ]


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




# ==================== OG Image Endpoint ====================

from fastapi.responses import Response as _Response

@app.get("/api/v1/og", tags=["SEO"])
def og_image(
    title: str = Query(..., max_length=200),
    university: str = Query("", max_length=100),
    category: str = Query("General News", max_length=50),
):
    """Generate a dynamic OG image for share previews."""
    from app.services.og_image import make_og_response
    return make_og_response(title, university, category)




# ==================== Stats Endpoint ====================

from sqlalchemy import func as _func, desc as _desc

@app.get("/api/v1/stats", tags=["Statistics"])
def get_stats(db: Session = Depends(get_db)):
    """Aggregate stats: totals, by category, top institutions, last 7 days."""
    total = db.query(_func.count(AnnouncementModel.id)).scalar() or 0
    total_universities = db.query(_func.count(UniversityModel.id)).scalar() or 0

    # By category
    by_cat = (
        db.query(AnnouncementModel.category, _func.count(AnnouncementModel.id))
        .group_by(AnnouncementModel.category)
        .order_by(_desc(_func.count(AnnouncementModel.id)))
        .all()
    )

    # Top institutions
    by_uni = (
        db.query(UniversityModel.name, UniversityModel.short_code, _func.count(AnnouncementModel.id))
        .join(AnnouncementModel, AnnouncementModel.university_id == UniversityModel.id)
        .group_by(UniversityModel.name, UniversityModel.short_code)
        .order_by(_desc(_func.count(AnnouncementModel.id)))
        .limit(20)
        .all()
    )

    # Last 7 days
    from datetime import timedelta as _td
    seven_ago = datetime.utcnow() - _td(days=7)
    by_day = (
        db.query(_func.date_trunc("day", AnnouncementModel.date_scraped), _func.count(AnnouncementModel.id))
        .filter(AnnouncementModel.date_scraped >= seven_ago)
        .group_by(_func.date_trunc("day", AnnouncementModel.date_scraped))
        .order_by(_func.date_trunc("day", AnnouncementModel.date_scraped))
        .all()
    )

    return {
        "totals": {
            "announcements": total,
            "universities": total_universities,
        },
        "by_category": [{"category": c, "count": n} for c, n in by_cat],
        "top_institutions": [
            {"name": name, "code": code, "count": n} for name, code, n in by_uni
        ],
        "last_7_days": [
            {"date": dt.isoformat() if dt else None, "count": n} for dt, n in by_day
        ],
        "generated_at": datetime.utcnow().isoformat(),
    }




# ==================== Admin Sync Endpoint ====================

@app.post("/api/v1/admin/sync-firestore", tags=["Admin"])
def sync_firestore(limit: int = 500):
    """Backfill all PostgreSQL announcements to Firestore (one-time + on-demand)."""
    from app.services.firebase_sync import push_announcement

    db = SessionLocal()
    try:
        rows = (
            db.query(AnnouncementModel, UniversityModel)
            .join(UniversityModel, AnnouncementModel.university_id == UniversityModel.id)
            .order_by(AnnouncementModel.date_scraped.desc())
            .limit(limit)
            .all()
        )

        ok, failed = 0, 0
        for ann, uni in rows:
            success = push_announcement({
                "slug_hash": ann.slug_hash,
                "university_name": uni.name,
                "institution_type": uni.institution_type,
                "category": ann.category,
                "title": ann.title,
                "summary": ann.summary or "",
                "source_url": ann.source_url,
                "pdf_extracted_text": ann.pdf_extracted_text,
                "date_scraped": ann.date_scraped.isoformat() if ann.date_scraped else datetime.utcnow().isoformat(),
                "priority": ann.priority or "normal",
                "university_code": uni.short_code,
                "image_url": getattr(ann, "image_url", "") or "",
            })
            if success:
                ok += 1
            else:
                failed += 1

        logger.info(f"🔄 Firestore sync: {ok} pushed, {failed} failed")
        return {
            "status": "complete",
            "synced": ok,
            "failed": failed,
            "total": len(rows),
        }
    except Exception as e:
        logger.error(f"Sync failed: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        db.close()




# ==================== Admin Delete Endpoints ====================

@app.delete("/api/v1/admin/announcements/{announcement_id}", tags=["Admin"])
def delete_announcement(announcement_id: uuid.UUID, db: Session = Depends(get_db)):
    """Delete a single announcement from PostgreSQL + Firestore."""
    ann = db.query(AnnouncementModel).filter(AnnouncementModel.id == announcement_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")

    # Delete from Firestore
    try:
        from app.services.firebase_sync import init_firebase
        client = init_firebase()
        if client:
            client.collection("artifacts").document("scuttle-io-default")\
                .collection("public").document("data")\
                .collection("announcements").document(ann.slug_hash).delete()
    except Exception as e:
        logger.warning(f"Firestore delete skipped: {e}")

    db.delete(ann)
    db.commit()
    logger.info(f"🗑️  Deleted: {ann.title[:60]}")
    return {"status": "deleted", "id": str(announcement_id)}


@app.post("/api/v1/admin/announcements/bulk-delete", tags=["Admin"])
def bulk_delete_announcements(payload: dict, db: Session = Depends(get_db)):
    """Delete multiple announcements. Expects {"ids": ["uuid1", "uuid2", ...]}."""
    ids = payload.get("ids", [])
    if not ids:
        return {"deleted": 0}

    try:
        uuids = [uuid.UUID(i) for i in ids]
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid UUID list")

    anns = db.query(AnnouncementModel).filter(AnnouncementModel.id.in_(uuids)).all()
    slug_hashes = [a.slug_hash for a in anns]

    # Delete from Firestore
    try:
        from app.services.firebase_sync import init_firebase
        client = init_firebase()
        if client:
            col = client.collection("artifacts").document("scuttle-io-default")\
                .collection("public").document("data")\
                .collection("announcements")
            for sh in slug_hashes:
                col.document(sh).delete()
    except Exception as e:
        logger.warning(f"Firestore bulk delete skipped: {e}")

    count = db.query(AnnouncementModel).filter(AnnouncementModel.id.in_(uuids)).delete(synchronize_session=False)
    db.commit()
    logger.info(f"🗑️  Bulk deleted: {count} announcements")
    return {"deleted": count}


@app.get("/api/v1/admin/announcements", tags=["Admin"])
def list_all_announcements(
    skip: int = 0, limit: int = 100,
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """List all announcements for admin management (with university info)."""
    q = db.query(AnnouncementModel, UniversityModel).join(
        UniversityModel, AnnouncementModel.university_id == UniversityModel.id
    )
    if search:
        q = q.filter(AnnouncementModel.title.ilike(f"%{search}%"))
    if category:
        q = q.filter(AnnouncementModel.category == category)
    rows = q.order_by(AnnouncementModel.date_scraped.desc()).offset(skip).limit(limit).all()
    return [
        {
            "id": str(a.id),
            "university_name": u.name,
            "university_code": u.short_code,
            "institution_type": u.institution_type,
            "category": a.category,
            "title": a.title,
            "summary": a.summary,
            "source_url": a.source_url,
            "date_published": a.date_published.isoformat() if a.date_published else None,
            "date_scraped": a.date_scraped.isoformat() if a.date_scraped else None,
            "has_attachment": a.has_attachment,
        }
        for a, u in rows
    ]




# ==================== Unsubscribe Endpoint ====================

import hashlib as _hashlib

def _make_unsub_token(email: str) -> str:
    """Create a deterministic token for an email."""
    secret = os.getenv("GMAIL_APP_PASSWORD", "default-secret")[:16]
    return _hashlib.sha256(f"{email}:{secret}".encode()).hexdigest()[:32]


@app.get("/api/v1/unsubscribe", tags=["Emails"])
def unsubscribe(token: str = Query(...)):
    """One-click unsubscribe from newsletter."""
    from app.services.firebase_sync import init_firebase

    # Find user by matching token against all users
    client = init_firebase()
    if not client:
        return {"status": "error", "message": "Firebase unavailable"}

    updated = 0
    for doc in client.collection("users").stream():
        data = doc.to_dict()
        email = data.get("email", "")
        if email and _make_unsub_token(email) == token:
            doc.reference.set({"newsletterEnabled": False}, merge=True)
            updated += 1
            logger.info(f"📬 Unsubscribed: {email}")
            break

    return {
        "status": "success" if updated else "not_found",
        "message": "You've been unsubscribed from Scuttle.io emails." if updated else "Token not recognized.",
    }




# ==================== University Health Dashboard ====================

@app.get("/api/v1/admin/health", tags=["Admin"])
def university_health(db: Session = Depends(get_db)):
    """Show scraper health for every university."""
    unis = db.query(UniversityModel).order_by(UniversityModel.short_code).all()

    # Announcement counts per university
    from sqlalchemy import func as _func
    counts = dict(
        db.query(AnnouncementModel.university_id, _func.count(AnnouncementModel.id))
        .group_by(AnnouncementModel.university_id)
        .all()
    )

    return [
        {
            "short_code": u.short_code,
            "name": u.name,
            "type": u.institution_type,
            "base_url": u.base_url,
            "announcements": counts.get(u.id, 0),
            "last_scraped_at": u.last_scraped_at.isoformat() if u.last_scraped_at else None,
            "status": u.last_scrape_status or "unknown",
            "error": u.last_scrape_error,
            "failures": int(u.consecutive_failures or 0),
        }
        for u in unis
    ]




# ==================== Purge Endpoint ====================

@app.post("/api/v1/admin/purge-announcements", tags=["Admin"])
def purge_all_announcements(db: Session = Depends(get_db)):
    """Delete ALL announcements from PostgreSQL + Firestore. Keeps users intact."""
    from app.services.firebase_sync import init_firebase

    # PostgreSQL
    pg_count = db.query(AnnouncementModel).count()
    db.query(AnnouncementModel).delete()
    db.commit()
    logger.info(f"🗑️  Purged {pg_count} from PostgreSQL")

    # Firestore
    fs_count = 0
    try:
        client = init_firebase()
        if client:
            col = (
                client.collection("artifacts")
                .document("scuttle-io-default")
                .collection("public").document("data")
                .collection("announcements")
            )
            docs = list(col.stream())
            for d in docs:
                d.reference.delete()
                fs_count += 1
            logger.info(f"🗑️  Purged {fs_count} from Firestore")
    except Exception as e:
        logger.warning(f"Firestore purge skipped: {e}")

    return {
        "status": "purged",
        "postgres_deleted": pg_count,
        "firestore_deleted": fs_count,
    }


@app.get("/", tags=["Health Check"])
def health_check():
    return {
        "status": "online",
        "service": "Scuttle.io Engine",
        "timestamp": datetime.utcnow().isoformat(),
    }
