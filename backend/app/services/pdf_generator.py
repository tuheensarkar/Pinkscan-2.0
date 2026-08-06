import os
import uuid
from datetime import datetime, timezone

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MEDIA_DIR = os.path.join(BASE_DIR, "media", "reports")
os.makedirs(MEDIA_DIR, exist_ok=True)

BRAND_PINK = colors.HexColor("#F62477")
BRAND_VIOLET = colors.HexColor("#FF0052")
TEXT = colors.HexColor("#1F2937")
MUTED = colors.HexColor("#64748B")
BORDER = colors.HexColor("#E2E8F0")
SOFT_BG = colors.HexColor("#F8FAFC")
INFO_BG = colors.HexColor("#EFF6FF")


def _status_colors(result: str):
    normalized = result.lower()
    if "benign" in normalized or "low" in normalized:
        return colors.HexColor("#F62477"), colors.HexColor("#FDF2F8")
    if "moderate" in normalized:
        return colors.HexColor("#B45309"), colors.HexColor("#FFFBEB")
    return colors.HexColor("#BE123C"), colors.HexColor("#FFF1F2")


def _split_items(value: str):
    cleaned = value.replace("\n", "; ")
    return [item.strip(" -") for item in cleaned.split(";") if item.strip(" -")]


def _parse_details(details: str | None):
    parsed: dict[str, str] = {}
    if not details:
        return parsed
    for line in details.splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        parsed[key.strip().lower()] = value.strip()
    return parsed


def _section_title(text: str, styles):
    return Paragraph(text, styles["SectionTitle"])


def _bullet_table(items: list[str], styles):
    rows = [[Paragraph("-", styles["BulletDot"]), Paragraph(item, styles["Body"])] for item in items]
    table = Table(rows, colWidths=[0.18 * inch, 6.15 * inch])
    table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    return table


def _build_styles():
    base = getSampleStyleSheet()
    base.add(
        ParagraphStyle(
            name="ReportTitle",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=27,
            textColor=colors.white,
            alignment=TA_LEFT,
            spaceAfter=4,
        )
    )
    base.add(
        ParagraphStyle(
            name="HeaderSmall",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#FCE7F3"),
        )
    )
    base.add(
        ParagraphStyle(
            name="SectionTitle",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=15,
            textColor=TEXT,
            spaceBefore=12,
            spaceAfter=7,
        )
    )
    base.add(
        ParagraphStyle(
            name="Body",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=14,
            textColor=TEXT,
        )
    )
    base.add(
        ParagraphStyle(
            name="Muted",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=12,
            textColor=MUTED,
        )
    )
    base.add(
        ParagraphStyle(
            name="Badge",
            parent=base["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=14,
            leading=17,
            alignment=TA_CENTER,
        )
    )
    base.add(
        ParagraphStyle(
            name="MetricLabel",
            parent=base["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=MUTED,
            alignment=TA_CENTER,
        )
    )
    base.add(
        ParagraphStyle(
            name="MetricValue",
            parent=base["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            textColor=TEXT,
            alignment=TA_CENTER,
        )
    )
    base.add(
        ParagraphStyle(
            name="BulletDot",
            parent=base["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=14,
            textColor=BRAND_PINK,
            alignment=TA_CENTER,
        )
    )
    return base


def generate_pdf_report(patient_name: str, result: str, confidence: float, notes: str, details: str = None) -> str:
    filename = f"report_{uuid.uuid4().hex}.pdf"
    filepath = os.path.join(MEDIA_DIR, filename)

    styles = _build_styles()
    doc = SimpleDocTemplate(
        filepath,
        pagesize=letter,
        rightMargin=0.65 * inch,
        leftMargin=0.65 * inch,
        topMargin=0.55 * inch,
        bottomMargin=0.55 * inch,
        title="PinkScan Breast Cancer Risk Report",
        author="PinkScan",
    )

    parsed = _parse_details(details)
    status_text, status_bg = _status_colors(result)
    generated_at = datetime.now(timezone.utc).strftime("%d %b %Y, %H:%M UTC")
    score_label = "Risk Score" if "risk" in result.lower() else "Model Confidence"

    story = []

    header = Table(
        [
            [
                Paragraph("PinkScan<br/><font size='9'>Breast Cancer Risk Assessment Report</font>", styles["ReportTitle"]),
                Paragraph("Patient Copy", styles["HeaderSmall"]),
            ]
        ],
        colWidths=[5.0 * inch, 1.55 * inch],
    )
    header.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), BRAND_PINK),
                ("BOX", (0, 0), (-1, -1), 0, BRAND_PINK),
                ("LEFTPADDING", (0, 0), (-1, -1), 18),
                ("RIGHTPADDING", (0, 0), (-1, -1), 18),
                ("TOPPADDING", (0, 0), (-1, -1), 18),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 18),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (1, 0), (1, 0), "RIGHT"),
            ]
        )
    )
    story.extend([header, Spacer(1, 14)])

    summary = Table(
        [
            [
                Paragraph("<b>Patient Name</b><br/>" + (patient_name or "Not provided"), styles["Body"]),
                Paragraph("<b>Generated</b><br/>" + generated_at, styles["Body"]),
                Paragraph(result, styles["Badge"]),
            ],
            [
                Paragraph("<b>Assessment Type</b><br/>" + ("Self-assessment" if "risk" in result.lower() else "Clinical model prediction"), styles["Body"]),
                Paragraph(f"<b>{score_label}</b><br/>{confidence:.1f}%", styles["Body"]),
                Paragraph("Review with a qualified healthcare professional.", styles["Muted"]),
            ],
        ],
        colWidths=[2.35 * inch, 2.1 * inch, 2.1 * inch],
    )
    summary.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.8, BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER),
                ("BACKGROUND", (0, 0), (1, -1), SOFT_BG),
                ("BACKGROUND", (2, 0), (2, 0), status_bg),
                ("TEXTCOLOR", (2, 0), (2, 0), status_text),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 12),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    story.extend([summary, Spacer(1, 8)])

    story.append(
        Paragraph(
            "This report summarizes information entered into PinkScan. It is intended to support patient education and clinical discussion.",
            styles["Muted"],
        )
    )

    factors = _split_items(parsed.get("factors", ""))
    recommendations = _split_items(parsed.get("recommendations", ""))
    ai_recommendations = parsed.get("ai recommendations")
    disclaimer = parsed.get(
        "disclaimer",
        "This assessment is not a medical diagnosis and cannot confirm or rule out breast cancer.",
    )

    if factors:
        story.append(_section_title("Key Factors", styles))
        story.append(_bullet_table(factors, styles))

    if recommendations:
        story.append(_section_title("Recommended Next Steps", styles))
        story.append(_bullet_table(recommendations, styles))

    if notes:
        story.append(_section_title("Notes", styles))
        story.append(Paragraph(str(notes).replace("\n", "<br/>"), styles["Body"]))

    if ai_recommendations:
        story.append(_section_title("Additional Guidance", styles))
        story.append(Paragraph(ai_recommendations.replace("\n", "<br/>"), styles["Body"]))

    if not factors and not recommendations and details:
        story.append(_section_title("Assessment Details", styles))
        story.append(Paragraph(details.replace("\n", "<br/>"), styles["Body"]))

    story.append(_section_title("Important Medical Disclaimer", styles))
    disclaimer_table = Table(
        [[Paragraph(disclaimer, styles["Body"])]],
        colWidths=[6.55 * inch],
    )
    disclaimer_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), INFO_BG),
                ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#BFDBFE")),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    story.append(disclaimer_table)
    story.append(Spacer(1, 10))
    story.append(
        Paragraph(
            "For urgent symptoms such as a new lump, nipple discharge, skin dimpling, swelling, or persistent pain, seek medical care promptly.",
            styles["Muted"],
        )
    )

    def footer(canvas, document):
        canvas.saveState()
        canvas.setStrokeColor(BORDER)
        canvas.line(document.leftMargin, 0.38 * inch, letter[0] - document.rightMargin, 0.38 * inch)
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(MUTED)
        canvas.drawString(document.leftMargin, 0.24 * inch, "PinkScan - Patient report")
        canvas.drawRightString(letter[0] - document.rightMargin, 0.24 * inch, f"Page {document.page}")
        canvas.restoreState()

    doc.build(story, onFirstPage=footer, onLaterPages=footer)

    return f"/media/reports/{filename}"
