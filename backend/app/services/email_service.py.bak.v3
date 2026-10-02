"""
Beautiful, Apple-inspired email templates for Scuttle.io
- Base wrapper with header + footer
- Templates: welcome, announcement, newsletter, digest, subscription
- Rich HTML/CSS with gradient heroes, category badges, and CTAs
- Anti-spam headers + List-Unsubscribe
- Brevo HTTP API (primary) + Gmail SMTP fallback
"""
import os
import logging
import json
import urllib.request
import urllib.error
import smtplib
import ssl
import hashlib as _hashlib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr, formatdate, make_msgid
from typing import List, Dict

logger = logging.getLogger("email_service")

# ══════════════════════════════════════════════════════════
#  CONFIG
# ══════════════════════════════════════════════════════════

GMAIL_USER = os.getenv("GMAIL_USER", "")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")
GMAIL_FROM_NAME = os.getenv("GMAIL_FROM_NAME", "Scuttle.io")

BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL", "scuttle.io.ng@gmail.com")
BREVO_SENDER_NAME = os.getenv("BREVO_SENDER_NAME", "Scuttle.io")

SITE_URL = os.getenv("SITE_URL", "https://scuttle-io.netlify.app")
LOGO_URL = f"{SITE_URL}/logo.png"
API_URL = os.getenv("VITE_API_URL", "https://scuttle-api.onrender.com")

# ══════════════════════════════════════════════════════════
#  DESIGN TOKENS
# ══════════════════════════════════════════════════════════

COLORS = {
    "bg": "#F5F5F7",
    "card": "#FFFFFF",
    "dark": "#1D1D1F",
    "gray": "#86868B",
    "blue": "#0071E3",
    "blue_dark": "#0051A0",
    "purple": "#9333EA",
    "green": "#16A34A",
    "amber": "#D97706",
    "red": "#E11D48",
    "light_blue": "#EBF5FF",
    "border": "#E5E7EB",
    "border_soft": "#F3F4F6",
}

# Category → gradient + emoji + label
CATEGORY_STYLES = {
    "Post-UTME":         ("📝", "#EFF6FF", "#0071E3", "linear-gradient(135deg,#0071E3,#0051A0)"),
    "Admission List":    ("🎓", "#F0FDF4", "#16A34A", "linear-gradient(135deg,#16A34A,#059669)"),
    "JAMB CAPS":         ("📊", "#FAF5FF", "#9333EA", "linear-gradient(135deg,#9333EA,#7E22CE)"),
    "School Fees":       ("💰", "#FFFBEB", "#D97706", "linear-gradient(135deg,#D97706,#B45309)"),
    "JAMB Registration": ("📋", "#EEF2FF", "#4F46E5", "linear-gradient(135deg,#4F46E5,#4338CA)"),
    "Academic Calendar": ("📅", "#FFF1F2", "#E11D48", "linear-gradient(135deg,#E11D48,#BE123C)"),
    "General News":      ("📰", "#F3F4F6", "#6B7280", "linear-gradient(135deg,#6B7280,#4B5563)"),
}

FONT_STACK = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
MONO_STACK = "ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace"

# ══════════════════════════════════════════════════════════
#  HELPERS
# ══════════════════════════════════════════════════════════

def _make_unsub_token(email: str) -> str:
    secret = os.getenv("GMAIL_APP_PASSWORD", "default-secret")[:16]
    return _hashlib.sha256(f"{email}:{secret}".encode()).hexdigest()[:32]


def _is_configured() -> bool:
    return bool(GMAIL_USER and GMAIL_APP_PASSWORD and len(GMAIL_APP_PASSWORD) >= 16)


def _escape(s: str) -> str:
    """Basic HTML escape for user content."""
    if not s:
        return ""
    return (
        str(s).replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def _category_style(cat: str):
    return CATEGORY_STYLES.get(cat, CATEGORY_STYLES["General News"])

# ══════════════════════════════════════════════════════════
#  SHARED PARTIALS
# ══════════════════════════════════════════════════════════

def _header_html() -> str:
    return f"""
    <tr>
      <td align="center" style="padding:36px 24px 28px;">
        <table cellpadding="0" cellspacing="0" border="0" role="presentation">
          <tr>
            <td align="center" style="padding:0;">
              <a href="{SITE_URL}" style="text-decoration:none;display:block;">
                <img src="{LOGO_URL}" alt="Scuttle.io" width="72" height="72" style="display:block;width:72px;height:72px;border-radius:20px;background:#ffffff;border:1px solid {COLORS['border']};object-fit:contain;box-shadow:0 8px 24px rgba(0,0,0,0.08);" />
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:16px 0 0;font-family:{FONT_STACK};font-size:20px;font-weight:700;color:{COLORS['dark']};letter-spacing:-0.4px;">
              <a href="{SITE_URL}" style="color:{COLORS['dark']};text-decoration:none;">Scuttle.io</a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:4px 0 0;font-family:{FONT_STACK};font-size:12px;font-weight:500;color:{COLORS['gray']};letter-spacing:0.4px;text-transform:uppercase;">
              Live Nigerian University Updates
            </td>
          </tr>
        </table>
      </td>
    </tr>
    """


def _footer_html(recipient_email: str = "") -> str:
    token = _make_unsub_token(recipient_email) if recipient_email else ""
    unsub_url = f"{API_URL}/api/v1/unsubscribe?token={token}" if token else f"{SITE_URL}/profile"
    prefs_url = f"{SITE_URL}/profile"

    return f"""
    <tr>
      <td align="center" style="padding:0 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:600px;margin:0 auto;">
          <tr>
            <td align="center" style="padding:32px 0 24px;">
              <table cellpadding="0" cellspacing="0" border="0" role="presentation">
                <tr>
                  <td style="padding:0 8px;">
                    <a href="{SITE_URL}" style="display:inline-block;width:36px;height:36px;background:#FFFFFF;border-radius:10px;text-decoration:none;border:1px solid {COLORS['border']};">
                      <span style="display:block;line-height:36px;text-align:center;font-size:18px;">🌐</span>
                    </a>
                  </td>
                  <td style="padding:0 8px;">
                    <a href="https://whatsapp.com" style="display:inline-block;width:36px;height:36px;background:#25D366;border-radius:10px;text-decoration:none;">
                      <span style="display:block;line-height:36px;text-align:center;font-size:18px;">💬</span>
                    </a>
                  </td>
                  <td style="padding:0 8px;">
                    <a href="{SITE_URL}/universities" style="display:inline-block;width:36px;height:36px;background:#FFFFFF;border-radius:10px;text-decoration:none;border:1px solid {COLORS['border']};">
                      <span style="display:block;line-height:36px;text-align:center;font-size:18px;">🎓</span>
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="font-family:{FONT_STACK};font-size:13px;line-height:1.6;color:{COLORS['gray']};">
              <p style="margin:0 0 6px;font-weight:600;color:{COLORS['dark']};font-size:14px;">Scuttle.io</p>
              <p style="margin:0 0 16px;">Real-time Nigerian university admission intelligence</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 0 12px;">
              <a href="{prefs_url}" style="font-family:{FONT_STACK};font-size:12px;color:{COLORS['gray']};text-decoration:underline;margin:0 8px;">Manage preferences</a>
              <span style="color:{COLORS['border']};">·</span>
              <a href="{unsub_url}" style="font-family:{FONT_STACK};font-size:12px;color:{COLORS['gray']};text-decoration:underline;margin:0 8px;">Unsubscribe</a>
              <span style="color:{COLORS['border']};">·</span>
              <a href="{SITE_URL}/privacy" style="font-family:{FONT_STACK};font-size:12px;color:{COLORS['gray']};text-decoration:underline;margin:0 8px;">Privacy</a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 0 40px;font-family:{FONT_STACK};font-size:11px;color:#A1A1A6;line-height:1.5;">
              You're receiving this because you subscribed to Scuttle.io updates.<br>
              © 2026 DARKGRID_AUTOMATION · Built for Nigerian students
            </td>
          </tr>
        </table>
      </td>
    </tr>
    """


def _wrap(inner: str, preheader: str = "", recipient_email: str = "") -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Scuttle.io</title>
</head>
<body style="margin:0;padding:0;background:{COLORS['bg']};width:100%;-webkit-font-smoothing:antialiased;">
  <div style="display:none;font-size:1px;color:{COLORS['bg']};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">{_escape(preheader)}</div>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:{COLORS['bg']};">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:640px;width:100%;">
          {_header_html()}
          {inner}
          {_footer_html(recipient_email=recipient_email)}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

# ══════════════════════════════════════════════════════════
#  TEMPLATE 1 — WELCOME EMAIL
# ══════════════════════════════════════════════════════════

def _render_welcome(recipient_name: str, recipient_email: str = "") -> str:
    name = recipient_name or "there"

    inner = f"""
    <tr>
      <td style="padding:0 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:{COLORS['card']};border-radius:28px;box-shadow:0 12px 40px rgba(0,0,0,0.08);overflow:hidden;">

          <!-- Hero -->
          <tr>
            <td style="background:linear-gradient(135deg,#0071E3 0%,#9333EA 100%);padding:48px 36px 44px;text-align:center;position:relative;">
              <div style="display:inline-block;padding:8px 16px;border-radius:9999px;background:rgba(255,255,255,0.2);backdrop-filter:blur(10px);font-family:{FONT_STACK};font-size:11px;font-weight:700;color:#FFFFFF;letter-spacing:1px;text-transform:uppercase;margin-bottom:20px;">
                🚀 You're in
              </div>
              <h1 style="margin:0 0 12px;font-family:{FONT_STACK};font-size:34px;font-weight:700;color:#FFFFFF;letter-spacing:-0.8px;line-height:1.2;">
                Welcome to Scuttle.io, {_escape(name)}!
              </h1>
              <p style="margin:0;font-family:{FONT_STACK};font-size:16px;font-weight:400;color:rgba(255,255,255,0.9);line-height:1.6;">
                You'll never miss another admission update.
              </p>
            </td>
          </tr>

          <!-- Features -->
          <tr>
            <td style="padding:40px 36px 8px;">
              <p style="margin:0 0 8px;font-family:{FONT_STACK};font-size:13px;font-weight:700;color:{COLORS['gray']};letter-spacing:1px;text-transform:uppercase;">Here's what you can do</p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 36px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">

                <tr>
                  <td style="padding:14px 0;border-bottom:1px solid {COLORS['border_soft']};">
                    <table cellpadding="0" cellspacing="0" border="0" role="presentation">
                      <tr>
                        <td width="52" valign="top">
                          <div style="width:44px;height:44px;background:#EFF6FF;border-radius:12px;line-height:44px;text-align:center;font-size:20px;">🎓</div>
                        </td>
                        <td valign="middle" style="padding-left:14px;font-family:{FONT_STACK};">
                          <p style="margin:0 0 2px;font-size:15px;font-weight:600;color:{COLORS['dark']};">Follow your universities</p>
                          <p style="margin:0;font-size:14px;color:{COLORS['gray']};line-height:1.5;">Track 200+ Federal, State & Private institutions</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:14px 0;border-bottom:1px solid {COLORS['border_soft']};">
                    <table cellpadding="0" cellspacing="0" border="0" role="presentation">
                      <tr>
                        <td width="52" valign="top">
                          <div style="width:44px;height:44px;background:#F0FDF4;border-radius:12px;line-height:44px;text-align:center;font-size:20px;">🔔</div>
                        </td>
                        <td valign="middle" style="padding-left:14px;font-family:{FONT_STACK};">
                          <p style="margin:0 0 2px;font-size:15px;font-weight:600;color:{COLORS['dark']};">Pick your interests</p>
                          <p style="margin:0;font-size:14px;color:{COLORS['gray']};line-height:1.5;">Post-UTME, admission lists, JAMB CAPS, school fees</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:14px 0;">
                    <table cellpadding="0" cellspacing="0" border="0" role="presentation">
                      <tr>
                        <td width="52" valign="top">
                          <div style="width:44px;height:44px;background:#FAF5FF;border-radius:12px;line-height:44px;text-align:center;font-size:20px;">⚡</div>
                        </td>
                        <td valign="middle" style="padding-left:14px;font-family:{FONT_STACK};">
                          <p style="margin:0 0 2px;font-size:15px;font-weight:600;color:{COLORS['dark']};">Get instant alerts</p>
                          <p style="margin:0;font-size:14px;color:{COLORS['gray']};line-height:1.5;">Push + email the moment something matches</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:36px;">
              <table cellpadding="0" cellspacing="0" border="0" role="presentation">
                <tr>
                  <td align="center" style="background:linear-gradient(135deg,#0071E3,#0051A0);border-radius:14px;box-shadow:0 8px 20px rgba(0,113,227,0.3);">
                    <a href="{SITE_URL}/profile" style="display:inline-block;padding:16px 40px;font-family:{FONT_STACK};font-size:16px;font-weight:600;color:#FFFFFF;text-decoration:none;letter-spacing:-0.2px;">
                      Set your preferences →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 0;font-family:{FONT_STACK};font-size:13px;color:{COLORS['gray']};line-height:1.5;">
                Takes 30 seconds. Free forever. No spam.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
    """

    return _wrap(inner, preheader=f"Welcome to Scuttle.io, {name}! Here's how to track your universities.", recipient_email=recipient_email)

# ══════════════════════════════════════════════════════════
#  TEMPLATE 2 — ANNOUNCEMENT ALERT (THE MOST IMPORTANT ONE)
# ══════════════════════════════════════════════════════════

def _render_announcement(
    university: str,
    category: str,
    title: str,
    summary: str,
    source_url: str,
    recipient_name: str = "",
    recipient_email: str = "",
    image_url: str = "",
    reason: str = "",
) -> str:
    greeting = f"Hi {recipient_name}," if recipient_name else "Hi there,"
    emoji, bg_tint, fg_color, gradient = _category_style(category)

    summary_text = _escape(summary) if summary else "Tap below to read the full notice on the institution's website."

    # Hero image if provided
    hero = ""
    if image_url:
        hero = f"""
        <tr>
          <td style="padding:0;line-height:0;">
            <a href="{source_url}" style="text-decoration:none;display:block;">
              <img src="{image_url}" alt="{_escape(title)}" width="640" style="display:block;width:100%;max-width:640px;height:240px;object-fit:cover;" />
            </a>
          </td>
        </tr>
        """

    # Reason banner
    reason_banner = ""
    if reason:
        reason_banner = f"""
        <tr>
          <td style="padding:20px 36px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:{bg_tint};border:1px solid {fg_color}22;border-radius:14px;">
              <tr>
                <td style="padding:14px 18px;font-family:{FONT_STACK};font-size:13px;color:{fg_color};line-height:1.5;">
                  🎯 <strong>Why you're seeing this:</strong> {_escape(reason)}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        """

    inner = f"""
    <tr>
      <td style="padding:0 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:{COLORS['card']};border-radius:28px;box-shadow:0 12px 40px rgba(0,0,0,0.08);overflow:hidden;">

          {hero}

          <!-- Top accent bar -->
          <tr>
            <td style="padding:0;line-height:0;">
              <div style="height:5px;background:{gradient};"></div>
            </td>
          </tr>

          {reason_banner}

          <tr>
            <td style="padding:28px 36px 0;font-family:{FONT_STACK};">

              <!-- Category + University row -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                <tr>
                  <td valign="middle" style="padding-bottom:16px;">
                    <span style="display:inline-block;padding:6px 12px;border-radius:9999px;font-size:11px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;background:{bg_tint};color:{fg_color};">
                      {emoji} {_escape(category)}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- University -->
              <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:{COLORS['gray']};letter-spacing:1px;text-transform:uppercase;">
                {_escape(university)}
              </p>

              <!-- Title -->
              <h1 style="margin:0 0 20px;font-size:26px;font-weight:700;color:{COLORS['dark']};letter-spacing:-0.5px;line-height:1.3;">
                {_escape(title)}
              </h1>

              <!-- Greeting + summary -->
              <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:{COLORS['dark']};">
                {greeting}
              </p>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#4B5563;">
                {summary_text}
              </p>

            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 36px 36px;">
              <table cellpadding="0" cellspacing="0" border="0" role="presentation">
                <tr>
                  <td align="center" style="background:linear-gradient(135deg,#0071E3,#0051A0);border-radius:14px;box-shadow:0 8px 20px rgba(0,113,227,0.3);">
                    <a href="{source_url}" style="display:inline-block;padding:16px 36px;font-family:{FONT_STACK};font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;letter-spacing:-0.2px;">
                      Read Full Notice →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:20px 0 0;font-family:{FONT_STACK};font-size:12px;color:{COLORS['gray']};line-height:1.5;">
                Source: official notice from {_escape(university)}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
    """

    return _wrap(inner, preheader=f"{emoji} {university}: {title[:80]}", recipient_email=recipient_email)

# ══════════════════════════════════════════════════════════
#  TEMPLATE 3 — NEWSLETTER (ADMIN BROADCAST)
# ══════════════════════════════════════════════════════════

def _render_newsletter(subject: str, message: str, recipient_name: str, recipient_email: str = "") -> str:
    greeting = f"Hi {recipient_name}," if recipient_name else "Hi there,"
    paragraphs = "".join(
        f'<p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:{COLORS["dark"]};">{_escape(p)}</p>'
        for p in message.split("\n\n")
        if p.strip()
    )

    inner = f"""
    <tr>
      <td style="padding:0 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:{COLORS['card']};border-radius:28px;box-shadow:0 12px 40px rgba(0,0,0,0.08);overflow:hidden;">

          <!-- Hero -->
          <tr>
            <td style="background:linear-gradient(135deg,#0071E3 0%,#9333EA 100%);padding:40px 36px 36px;">
              <p style="margin:0 0 8px;font-family:{FONT_STACK};font-size:11px;font-weight:700;color:rgba(255,255,255,0.8);letter-spacing:1.2px;text-transform:uppercase;">
                📬 Newsletter
              </p>
              <h1 style="margin:0;font-family:{FONT_STACK};font-size:28px;font-weight:700;color:#FFFFFF;letter-spacing:-0.5px;line-height:1.3;">
                {_escape(subject)}
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px;font-family:{FONT_STACK};">
              <p style="margin:0 0 20px;font-size:15px;color:{COLORS['gray']};">
                {greeting}
              </p>
              {paragraphs}
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 36px 36px;">
              <table cellpadding="0" cellspacing="0" border="0" role="presentation">
                <tr>
                  <td align="center" style="background:linear-gradient(135deg,#0071E3,#0051A0);border-radius:14px;box-shadow:0 8px 20px rgba(0,113,227,0.3);">
                    <a href="{SITE_URL}" style="display:inline-block;padding:16px 36px;font-family:{FONT_STACK};font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;">
                      Open Scuttle.io →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
    """

    return _wrap(inner, preheader=f"{subject} — from Scuttle.io", recipient_email=recipient_email)

# ══════════════════════════════════════════════════════════
#  TEMPLATE 4 — WEEKLY DIGEST
# ══════════════════════════════════════════════════════════

def _render_digest(subject: str, items: List[Dict], recipient_name: str = "", recipient_email: str = "") -> str:
    greeting = f"Hi {recipient_name}," if recipient_name else "Hi there,"

    rows = ""
    for i, item in enumerate(items):
        emoji, bg_tint, fg_color, _ = _category_style(item.get("category", ""))
        border = "" if i == len(items) - 1 else f"border-bottom:1px solid {COLORS['border_soft']};"
        rows += f"""
        <tr>
          <td style="padding:20px 0;{border}">
            <span style="display:inline-block;padding:4px 10px;border-radius:9999px;font-size:10px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;background:{bg_tint};color:{fg_color};margin-bottom:8px;">
              {emoji} {_escape(item.get("category", ""))}
            </span>
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:{COLORS['gray']};letter-spacing:0.5px;text-transform:uppercase;">
              {_escape(item.get("university_name", ""))}
            </p>
            <a href="{item.get('source_url', SITE_URL)}" style="margin:0 0 8px;font-size:16px;font-weight:600;color:{COLORS['dark']};text-decoration:none;line-height:1.4;display:block;">
              {_escape(item.get("title", ""))}
            </a>
            <p style="margin:0;font-size:14px;line-height:1.6;color:#6B7280;">
              {_escape((item.get("summary") or "")[:160])}{"…" if len(item.get("summary") or "") > 160 else ""}
            </p>
          </td>
        </tr>
        """

    inner = f"""
    <tr>
      <td style="padding:0 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:{COLORS['card']};border-radius:28px;box-shadow:0 12px 40px rgba(0,0,0,0.08);overflow:hidden;">

          <tr>
            <td style="background:linear-gradient(135deg,#0071E3 0%,#9333EA 100%);padding:40px 36px;">
              <p style="margin:0 0 8px;font-family:{FONT_STACK};font-size:11px;font-weight:700;color:rgba(255,255,255,0.8);letter-spacing:1.2px;text-transform:uppercase;">
                📊 Your update digest
              </p>
              <h1 style="margin:0;font-family:{FONT_STACK};font-size:26px;font-weight:700;color:#FFFFFF;letter-spacing:-0.5px;line-height:1.3;">
                {_escape(subject)}
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 36px 0;font-family:{FONT_STACK};">
              <p style="margin:0 0 8px;font-size:15px;color:{COLORS['dark']};">{greeting}</p>
              <p style="margin:0 0 8px;font-size:14px;color:{COLORS['gray']};line-height:1.6;">
                Here are the updates matching your interests:
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 36px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                {rows}
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:36px;">
              <table cellpadding="0" cellspacing="0" border="0" role="presentation">
                <tr>
                  <td align="center" style="background:linear-gradient(135deg,#1D1D1F,#000000);border-radius:14px;box-shadow:0 8px 20px rgba(0,0,0,0.2);">
                    <a href="{SITE_URL}" style="display:inline-block;padding:16px 36px;font-family:{FONT_STACK};font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;">
                      See all updates →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
    """

    return _wrap(inner, preheader=f"{len(items)} new updates matching your interests", recipient_email=recipient_email)

# ══════════════════════════════════════════════════════════
#  TEMPLATE 5 — SUBSCRIPTION CONFIRMATION
# ══════════════════════════════════════════════════════════

def _render_subscription(recipient_name: str, frequency: str = "instant", recipient_email: str = "") -> str:
    name = recipient_name or "there"
    freq_labels = {
        "instant": ("⚡", "Instant", "You'll get emails as soon as updates match your interests."),
        "daily":   ("📅", "Daily Digest", "One summary email per day at 8 AM."),
        "weekly":  ("🗓️", "Weekly Digest", "Every Monday at 8 AM with the week's top updates."),
    }
    emoji, freq_label, freq_desc = freq_labels.get(frequency, freq_labels["instant"])

    inner = f"""
    <tr>
      <td style="padding:0 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:{COLORS['card']};border-radius:28px;box-shadow:0 12px 40px rgba(0,0,0,0.08);overflow:hidden;">

          <tr>
            <td style="background:linear-gradient(135deg,#16A34A,#059669);padding:48px 36px;text-align:center;">
              <div style="width:80px;height:80px;background:rgba(255,255,255,0.2);border-radius:24px;margin:0 auto 20px;line-height:80px;font-size:40px;">✅</div>
              <h1 style="margin:0 0 8px;font-family:{FONT_STACK};font-size:28px;font-weight:700;color:#FFFFFF;letter-spacing:-0.5px;line-height:1.3;">
                You're subscribed, {_escape(name)}!
              </h1>
              <p style="margin:0;font-family:{FONT_STACK};font-size:15px;color:rgba(255,255,255,0.9);line-height:1.6;">
                Updates are on the way.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:36px;font-family:{FONT_STACK};">

              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:{COLORS['light_blue']};border:1px solid {COLORS['blue']}22;border-radius:16px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:{COLORS['blue']};letter-spacing:0.6px;text-transform:uppercase;">
                      {emoji} Your frequency
                    </p>
                    <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:{COLORS['dark']};">
                      {freq_label}
                    </p>
                    <p style="margin:0;font-size:14px;color:{COLORS['gray']};line-height:1.5;">
                      {freq_desc}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:{COLORS['dark']};">
                What you'll receive
              </p>
              <p style="margin:0 0 12px;font-size:14px;color:#4B5563;line-height:1.7;">
                ✅ Only announcements matching <strong>your interests</strong><br>
                ✅ Only from <strong>universities you follow</strong><br>
                ✅ Zero spam — unsubscribe anytime in one click
              </p>

            </td>
          </tr>

          <tr>
            <td align="center" style="padding:0 36px 36px;">
              <table cellpadding="0" cellspacing="0" border="0" role="presentation">
                <tr>
                  <td align="center" style="background:linear-gradient(135deg,#0071E3,#0051A0);border-radius:14px;box-shadow:0 8px 20px rgba(0,113,227,0.3);">
                    <a href="{SITE_URL}/profile" style="display:inline-block;padding:16px 36px;font-family:{FONT_STACK};font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;">
                      Manage preferences →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
    """

    return _wrap(inner, preheader=f"You're subscribed! {freq_desc}", recipient_email=recipient_email)

# ══════════════════════════════════════════════════════════
#  SENDERS
# ══════════════════════════════════════════════════════════

def _send_via_brevo(to_email: str, subject: str, html: str, list_unsubscribe: bool = True) -> bool:
    if not BREVO_API_KEY:
        return False

    try:
        payload = {
            "sender": {"name": BREVO_SENDER_NAME, "email": BREVO_SENDER_EMAIL},
            "to": [{"email": to_email}],
            "subject": subject[:200],
            "htmlContent": html,
        }
        if list_unsubscribe:
            payload["headers"] = {
                "List-Unsubscribe": f"<{SITE_URL}/profile>",
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            }

        req = urllib.request.Request(
            "https://api.brevo.com/v3/smtp/email",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "accept": "application/json",
                "content-type": "application/json",
                "api-key": BREVO_API_KEY,
            },
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=15) as resp:
            logger.info(f"📧 [Brevo] Sent to {to_email}: {subject[:60]}")
            return True
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="ignore") if hasattr(e, "read") else str(e)
        logger.error(f"❌ [Brevo] HTTP {e.code}: {body[:300]}")
        return False
    except Exception as e:
        logger.error(f"❌ [Brevo] {type(e).__name__}: {e}")
        return False


def _send_via_gmail_smtp(to_email: str, subject: str, html: str, list_unsubscribe: bool = True) -> bool:
    if not _is_configured():
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = formataddr((GMAIL_FROM_NAME, GMAIL_USER))
        msg["To"] = to_email
        msg["Date"] = formatdate(localtime=True)
        msg["Message-ID"] = make_msgid(domain="scuttle.io")
        msg["Reply-To"] = GMAIL_USER
        msg["X-Mailer"] = "Scuttle.io Mailer"
        msg["Precedence"] = "bulk"
        msg["Auto-Submitted"] = "auto-generated"
        if list_unsubscribe:
            msg["List-Unsubscribe"] = f"<mailto:{GMAIL_USER}?subject=unsubscribe>, <{SITE_URL}/profile>"
            msg["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click"

        msg.attach(MIMEText(html, "html"))

        context = ssl.create_default_context()
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context, timeout=15) as server:
            server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            server.sendmail(GMAIL_USER, to_email, msg.as_string())
        logger.info(f"📧 [Gmail] Sent to {to_email}: {subject[:60]}")
        return True
    except Exception as e:
        logger.error(f"[Gmail] Failed: {type(e).__name__}: {e}")
        return False


def _send_html(to_email: str, subject: str, html: str, list_unsubscribe: bool = True) -> bool:
    """Unified sender — Brevo first, Gmail SMTP fallback."""
    if BREVO_API_KEY:
        if _send_via_brevo(to_email, subject, html, list_unsubscribe):
            return True
        logger.warning("[Brevo] Failed, trying Gmail SMTP fallback...")
    return _send_via_gmail_smtp(to_email, subject, html, list_unsubscribe)

# ══════════════════════════════════════════════════════════
#  PUBLIC FUNCTIONS
# ══════════════════════════════════════════════════════════

def send_email(to_email: str, subject: str, message: str, recipient_name: str = "") -> bool:
    html = _render_newsletter(subject, message, recipient_name, to_email)
    return _send_html(to_email, subject, html)


def send_welcome_email(to_email: str, recipient_name: str = "") -> bool:
    subject = "🚀 Welcome to Scuttle.io"
    html = _render_welcome(recipient_name, to_email)
    return _send_html(to_email, subject, html, list_unsubscribe=False)


def send_subscription_confirmation(to_email: str, recipient_name: str = "", frequency: str = "instant") -> bool:
    subject = "✅ You're subscribed to Scuttle.io updates"
    html = _render_subscription(recipient_name, frequency, to_email)
    return _send_html(to_email, subject, html, list_unsubscribe=True)


def send_announcement_alert(
    to_email: str,
    recipient_name: str,
    university: str,
    category: str,
    title: str,
    summary: str,
    source_url: str,
    image_url: str = "",
    reason: str = "",
) -> bool:
    emoji, _, _, _ = _category_style(category)
    subject = f"{emoji} {university}: {title[:70]}"
    html = _render_announcement(
        university=university,
        category=category,
        title=title,
        summary=summary,
        source_url=source_url,
        recipient_name=recipient_name,
        recipient_email=to_email,
        image_url=image_url,
        reason=reason,
    )
    return _send_html(to_email, subject, html)


def send_digest(to_email: str, recipient_name: str, subject: str, items: List[Dict]) -> bool:
    html = _render_digest(subject, items, recipient_name, to_email)
    return _send_html(to_email, subject, html)


def send_bulk(recipients: List[Dict], subject: str, message: str) -> Dict:
    from time import sleep
    ok, failed = 0, 0
    for r in recipients:
        email = r.get("email")
        name = r.get("name", "")
        if not email:
            failed += 1
            continue
        if send_email(email, subject, message, name):
            ok += 1
        else:
            failed += 1
        sleep(0.6)
    return {"sent": ok, "failed": failed, "total": len(recipients)}
