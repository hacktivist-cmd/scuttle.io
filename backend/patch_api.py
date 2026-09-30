from pathlib import Path

f = Path("nigerian_university_polytechnic_jamb_engine.py")
code = f.read_text()

old = '''    return q.order_by(AnnouncementModel.date_scraped.desc()).offset(skip).limit(limit).all()'''

new = '''    from sqlalchemy import case
    priority_order = case(
        (AnnouncementModel.priority == "high", 0),
        (AnnouncementModel.priority == "medium", 1),
        else_=2,
    )
    return q.order_by(priority_order, AnnouncementModel.date_scraped.desc()).offset(skip).limit(limit).all()'''

if old in code:
    code = code.replace(old, new, 1)
    f.write_text(code)
    print("✅ API sorted by priority + date.")
else:
    print("⚠️  Could not find API sort line.")
