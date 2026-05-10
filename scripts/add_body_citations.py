import argparse
import copy
import json
import re
import zipfile
from pathlib import Path

from docx import Document
from docx.oxml import OxmlElement
from docx.oxml.ns import qn


CITATION_INSERTS = [
    {
        "paragraph": 28,
        "anchor": "快速响应的能力密切相关",
        "citation": "[1-3]",
        "reason": "态势感知理论与测量研究",
    },
    {
        "paragraph": 31,
        "anchor": "提升了集群任务执行效率",
        "citation": "[7-10,15,18]",
        "reason": "多机器人/多无人机任务分配研究",
    },
    {
        "paragraph": 32,
        "anchor": "以提高定位的稳定性和感知精度",
        "citation": "[4-5]",
        "reason": "多传感器信息融合理论",
    },
    {
        "paragraph": 34,
        "anchor": "提升了无人机集群在特定场景下的任务完成效率",
        "citation": "[11-14,17]",
        "reason": "国内外多无人机任务分配与优化方法",
    },
    {
        "paragraph": 63,
        "anchor": "提升覆盖能力、观测冗余和系统鲁棒性",
        "citation": "[7-8,18]",
        "reason": "集群协同与联盟形成相关研究",
    },
    {
        "paragraph": 68,
        "anchor": "提高最终定位结果的稳定性和可信度",
        "citation": "[4-5]",
        "reason": "多源信息融合方法",
    },
    {
        "paragraph": 70,
        "anchor": "并进一步为任务分配提供实际路径代价",
        "citation": "[6,16]",
        "reason": "路径规划基础与多无人机路径规划综述",
    },
]


def clone_run_with_text(source_run, text):
    new_r = copy.deepcopy(source_run._r)
    for child in list(new_r):
        if child.tag != qn("w:rPr"):
            new_r.remove(child)
    t = OxmlElement("w:t")
    t.text = text
    if text.startswith(" ") or text.endswith(" "):
        t.set(qn("xml:space"), "preserve")
    new_r.append(t)
    return new_r


def set_superscript(run_element):
    rpr = run_element.find(qn("w:rPr"))
    if rpr is None:
        rpr = OxmlElement("w:rPr")
        run_element.insert(0, rpr)
    for existing in rpr.findall(qn("w:vertAlign")):
        rpr.remove(existing)
    vert = OxmlElement("w:vertAlign")
    vert.set(qn("w:val"), "superscript")
    rpr.append(vert)


def insert_citation_after_anchor(paragraph, anchor, citation):
    for run in paragraph.runs:
        text = run.text
        pos = text.find(anchor)
        if pos < 0:
            continue

        cut = pos + len(anchor)
        before = text[:cut]
        after = text[cut:]

        run.text = before
        citation_run = clone_run_with_text(run, citation)
        set_superscript(citation_run)
        run._r.addnext(citation_run)

        if after:
            after_run = clone_run_with_text(run, after)
            citation_run.addnext(after_run)
        return True
    return False


def document_counts(path):
    with zipfile.ZipFile(path) as zf:
        xml = zf.read("word/document.xml").decode("utf-8")
    return {
        "math_nodes": len(re.findall(r"<m:oMath\b|<m:oMathPara\b", xml)),
        "drawings": xml.count("<w:drawing"),
        "tables_xml": xml.count("<w:tbl>"),
    }


def apply_citations(input_path, output_path, log_path):
    doc = Document(input_path)
    log = []
    for item in CITATION_INSERTS:
        paragraph = doc.paragraphs[item["paragraph"]]
        before = paragraph.text
        if item["citation"] in before:
            raise RuntimeError(
                f"Citation {item['citation']} already exists in paragraph {item['paragraph']}"
            )
        ok = insert_citation_after_anchor(paragraph, item["anchor"], item["citation"])
        if not ok:
            raise RuntimeError(
                f"Anchor not found in paragraph {item['paragraph']}: {item['anchor']}"
            )
        after = paragraph.text
        log.append(
            {
                **item,
                "before": before,
                "after": after,
                "changed": before != after,
            }
        )

    doc.save(output_path)
    Path(log_path).write_text(json.dumps(log, ensure_ascii=False, indent=2), encoding="utf-8")
    return log


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--log", required=True)
    args = parser.parse_args()

    log = apply_citations(args.input, args.output, args.log)
    print(
        json.dumps(
            {
                "inserted": len(log),
                "output": args.output,
                "counts": document_counts(args.output),
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
