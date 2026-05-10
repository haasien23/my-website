from __future__ import annotations

import html
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, StyleSheet1, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfbase.pdfmetrics import registerFont
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "output" / "pdf" / "毕业论文初稿_汇总版.md"
OUTPUT = ROOT / "output" / "pdf" / "毕业论文初稿_汇总版.pdf"


def build_styles() -> StyleSheet1:
    registerFont(UnicodeCIDFont("STSong-Light"))
    styles = getSampleStyleSheet()

    styles.add(
        ParagraphStyle(
            name="ZhTitle",
            fontName="STSong-Light",
            fontSize=22,
            leading=30,
            alignment=TA_CENTER,
            spaceAfter=10,
            textColor=colors.HexColor("#0f172a"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhSubTitle",
            fontName="STSong-Light",
            fontSize=12,
            leading=18,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#334155"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhH1",
            fontName="STSong-Light",
            fontSize=18,
            leading=26,
            spaceBefore=10,
            spaceAfter=10,
            textColor=colors.HexColor("#111827"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhH2",
            fontName="STSong-Light",
            fontSize=14,
            leading=22,
            spaceBefore=8,
            spaceAfter=6,
            textColor=colors.HexColor("#111827"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhH3",
            fontName="STSong-Light",
            fontSize=12,
            leading=20,
            spaceBefore=6,
            spaceAfter=4,
            textColor=colors.HexColor("#1f2937"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhBody",
            fontName="STSong-Light",
            fontSize=11,
            leading=20,
            alignment=TA_JUSTIFY,
            firstLineIndent=22,
            spaceAfter=6,
            textColor=colors.black,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhBullet",
            fontName="STSong-Light",
            fontSize=11,
            leading=20,
            alignment=TA_JUSTIFY,
            leftIndent=18,
            spaceAfter=4,
            textColor=colors.black,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhRef",
            fontName="STSong-Light",
            fontSize=10.5,
            leading=18,
            alignment=TA_JUSTIFY,
            spaceAfter=4,
            textColor=colors.black,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ZhEq",
            fontName="Courier",
            fontSize=8.3,
            leading=12,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#111827"),
            spaceBefore=2,
            spaceAfter=6,
        )
    )
    return styles


def escape_text(text: str) -> str:
    return html.escape(text).replace("\n", "<br/>")


def add_cover(story: list, styles: StyleSheet1) -> None:
    story.append(Spacer(1, 45 * mm))
    story.append(Paragraph("基于集群的多任务协同态势感知平台", styles["ZhTitle"]))
    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph("毕业论文初稿（汇总版）", styles["ZhTitle"]))
    story.append(Spacer(1, 18 * mm))
    story.append(Paragraph("学生：贺小双", styles["ZhSubTitle"]))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("专业：计算机相关方向", styles["ZhSubTitle"]))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("说明：本稿依据当前项目实现内容汇总生成", styles["ZhSubTitle"]))
    story.append(PageBreak())


def parse_markdown(text: str, styles: StyleSheet1) -> list:
    story: list = []
    paragraph_lines: list[str] = []

    def flush_paragraph() -> None:
        nonlocal paragraph_lines
        if not paragraph_lines:
            return
        paragraph = " ".join(line.strip() for line in paragraph_lines).strip()
        if paragraph:
            style_name = "ZhRef" if paragraph.startswith("[") else "ZhBody"
            story.append(Paragraph(escape_text(paragraph), styles[style_name]))
        paragraph_lines = []

    for raw in text.splitlines():
        line = raw.rstrip()
        stripped = line.strip()

        if not stripped:
            flush_paragraph()
            continue

        if stripped == "---":
            flush_paragraph()
            story.append(PageBreak())
            continue

        if stripped.startswith("$$") and stripped.endswith("$$") and len(stripped) > 4:
            flush_paragraph()
            story.append(Paragraph(escape_text(stripped[2:-2].strip()), styles["ZhEq"]))
            continue

        if stripped.startswith("# "):
            flush_paragraph()
            story.append(Paragraph(escape_text(stripped[2:]), styles["ZhH1"]))
            continue

        if stripped.startswith("## "):
            flush_paragraph()
            story.append(Paragraph(escape_text(stripped[3:]), styles["ZhH2"]))
            continue

        if stripped.startswith("### "):
            flush_paragraph()
            story.append(Paragraph(escape_text(stripped[4:]), styles["ZhH3"]))
            continue

        if stripped.startswith("- "):
            flush_paragraph()
            story.append(Paragraph(escape_text("• " + stripped[2:]), styles["ZhBullet"]))
            continue

        paragraph_lines.append(stripped)

    flush_paragraph()
    return story


def draw_page_number(canvas, doc) -> None:
    canvas.saveState()
    canvas.setFont("Helvetica", 9)
    canvas.setFillColor(colors.HexColor("#64748b"))
    canvas.drawCentredString(A4[0] / 2, 10 * mm, f"{canvas.getPageNumber()}")
    canvas.restoreState()


def build_pdf() -> Path:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    styles = build_styles()
    content = SOURCE.read_text(encoding="utf-8")

    story: list = []
    add_cover(story, styles)
    story.extend(parse_markdown(content, styles))

    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        topMargin=22 * mm,
        bottomMargin=18 * mm,
        leftMargin=22 * mm,
        rightMargin=20 * mm,
        title="基于集群的多任务协同态势感知平台毕业论文初稿（汇总版）",
        author="贺小双",
    )
    doc.build(story, onFirstPage=draw_page_number, onLaterPages=draw_page_number)
    return OUTPUT


if __name__ == "__main__":
    path = build_pdf()
    print(path)
