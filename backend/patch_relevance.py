from pathlib import Path

f = Path("nigerian_university_polytechnic_jamb_engine.py")
code = f.read_text()

if "RELEVANCE_PATCHED" in code:
    print("✅ Already patched.")
    raise SystemExit(0)

# Add a priority field to the model
old_ann_cols = '''    date_scraped = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    university = relationship("UniversityModel", back_populates="announcements")'''

new_ann_cols = '''    date_scraped = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    priority = Column(String(20), default="normal", nullable=False, index=True)  # RELEVANCE_PATCHED
    university = relationship("UniversityModel", back_populates="announcements")'''

if old_ann_cols in code:
    code = code.replace(old_ann_cols, new_ann_cols, 1)
    print("✅ Added priority column.")
else:
    print("⚠️  Could not find announcement model insertion point.")

# Add helper to determine priority
helper = '''

def determine_priority(category: str) -> str:
    """High priority categories float to the top of the UI."""
    high = {"Post-UTME", "Admission List", "JAMB CAPS", "School Fees"}
    medium = {"JAMB Registration", "Academic Calendar"}
    if category in high:
        return "high"
    if category in medium:
        return "medium"
    return "normal"

'''

# Insert helper before submit function
needle_submit = "def submit_scraped_item_to_backend"
if needle_submit in code:
    code = code.replace(needle_submit, helper + needle_submit, 1)
    print("✅ Added priority helper.")

# Update the insert to include priority
old_insert = '''        new_ann = AnnouncementModel(
            university_id=university_id,
            category=category,
            title=title,
            slug_hash=slug_hash,'''

new_insert = '''        priority = determine_priority(category)
        new_ann = AnnouncementModel(
            university_id=university_id,
            category=category,
            title=title,
            slug_hash=slug_hash,
            priority=priority,'''

if old_insert in code:
    code = code.replace(old_insert, new_insert, 1)
    print("✅ Wired priority into insert.")

f.write_text(code)
print("✅ Backend patched.")
