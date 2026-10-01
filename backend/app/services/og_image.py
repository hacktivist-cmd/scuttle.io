"""Generate dynamic OG images for share previews."""
import logging
from datetime import datetime
from io import BytesIO
from urllib.parse import quote

from fastapi import Response

logger = logging.getLogger("og_image")

# Category → emoji + color mapping
CATEGORY_STYLE = {
    "Post-UTME": ("📝", "#0071E3"),
    "Admission List": ("🎓", "#16A34A"),
    "JAMB CAPS": ("📊", "#9333EA"),
    "School Fees": ("💰", "#D97706"),
    "JAMB Registration": ("📋", "#4F46E5"),
    "Academic Calendar": ("📅", "#E11D48"),
    "General News": ("📰", "#6B7280"),
}


def _escape_xml(text: str) -> str:
    """Escape special chars for SVG."""
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;")
    )


def _truncate(text: str, max_len: int) -> str:
    if len(text) <= max_len:
        return text
    return text[: max_len - 1].rstrip() + "…"


def _wrap_text(text: str, max_chars: int, max_lines: int) -> list:
    """Split text into lines."""
    words = text.split()
    lines = []
    current = ""
    for w in words:
        if len(current) + len(w) + 1 <= max_chars:
            current += (" " if current else "") + w
        else:
            if current:
                lines.append(current)
            current = w
            if len(lines) >= max_lines - 1:
                break
    if current:
        lines.append(current)
    if len(lines) > max_lines:
        lines = lines[:max_lines]
        lines[-1] = _truncate(lines[-1], max_chars - 1)
    return lines


def generate_og_svg(
    title: str,
    university: str = "Scuttle.io",
    category: str = "General News",
    subtitle: str = "",
) -> str:
    """Generate an SVG OG card (1200x630)."""
    emoji, color = CATEGORY_STYLE.get(category, ("📰", "#6B7280"))

    title_lines = _wrap_text(title, max_chars=42, max_lines=3)
    title_svg = "".join(
        f'<tspan x="80" dy="{0 if i == 0 else 72}">{_escape_xml(line)}</tspan>'
        for i, line in enumerate(title_lines)
    )

    uni_short = _truncate(university, 40)

    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#1E293B"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="{color}"/>
      <stop offset="100%" stop-color="{color}" stop-opacity="0.6"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1100" cy="100" r="300" fill="{color}" opacity="0.08"/>
  <circle cx="100" cy="550" r="200" fill="{color}" opacity="0.05"/>

  <!-- Top bar accent -->
  <rect x="0" y="0" width="1200" height="6" fill="url(#accent)"/>

  <!-- Category badge -->
  <g transform="translate(80, 80)">
    <rect x="0" y="0" rx="28" ry="28" width="{len(category) * 13 + 70}" height="56" fill="{color}" opacity="0.18"/>
    <text x="35" y="37" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="22" font-weight="600" fill="{color}">{emoji} {_escape_xml(category.upper())}</text>
  </g>

  <!-- Title -->
  <text x="80" y="240" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="58" font-weight="700" fill="#FFFFFF" letter-spacing="-1">
    {title_svg}
  </text>

  <!-- University -->
  <text x="80" y="480" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="26" font-weight="500" fill="#94A3B8">
    {_escape_xml(uni_short)}
  </text>

  <!-- Bottom branding -->
  <g transform="translate(80, 540)">
    <rect x="0" y="0" width="52" height="52" rx="14" fill="#FFFFFF"/>
    <text x="26" y="36" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="28" font-weight="800" fill="#0F172A">S</text>
    <text x="72" y="22" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="20" font-weight="700" fill="#FFFFFF">Scuttle.io</text>
    <text x="72" y="44" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="14" font-weight="400" fill="#94A3B8">Live Nigerian University Updates</text>
  </g>

  <!-- Right side: Scuttle logo mark -->
  <g transform="translate(1050, 480)">
    <text x="0" y="0" text-anchor="end" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" font-size="18" font-weight="500" fill="#64748B">
      scuttle-io.netlify.app
    </text>
  </g>
</svg>'''


def make_og_response(title: str, university: str = "", category: str = "") -> Response:
    """Return a Response with the OG image SVG."""
    svg = generate_og_svg(title, university, category)
    return Response(
        content=svg,
        media_type="image/svg+xml",
        headers={
            "Cache-Control": "public, max-age=86400",
            "Content-Type": "image/svg+xml; charset=utf-8",
        },
    )
