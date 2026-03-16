#!/usr/bin/env python3
"""
Insert Annexe A screenshots into the KYA memoire .docx by editing the docx package.

Input:
  - mon_projet_soutenance/KYA_Memoire_PapaMalickTeuw.docx
  - mon_projet_soutenance/soutenance_pack_assets/captures_app/*.jpg

Output:
  - updates the .docx in place (creates a timestamped .bak first)
"""

from __future__ import annotations

import datetime as _dt
import os
import re
import shutil
import tempfile
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[2]
DOCX_PATH = ROOT / "mon_projet_soutenance" / "KYA_Memoire_PapaMalickTeuw.docx"
CAPTURES_DIR = ROOT / "mon_projet_soutenance" / "soutenance_pack_assets" / "captures_app"


CAPTURES = [
    ("A-1-login.jpg", "Figure A-1: Ecran de connexion"),
    ("A-2-dashboard.jpg", "Figure A-2: Tableau de bord (Dashboard)"),
    ("A-3-clients.jpg", "Figure A-3: Gestion des locataires (Clients)"),
    ("A-4-rentals.jpg", "Figure A-4: Gestion des baux / locations"),
    ("A-5-payments.jpg", "Figure A-5: Suivi des paiements"),
    ("A-6-documents.jpg", "Figure A-6: Gestion documentaire"),
    ("A-7-import-clients.jpg", "Figure A-7: Import Excel des clients"),
    ("A-8-blacklist.jpg", "Figure A-8: Liste noire (Blacklist)"),
]


def _read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _write_text(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8")


def _next_image_index(media_dir: Path) -> int:
    max_idx = 0
    for p in media_dir.glob("image*.*"):
        m = re.match(r"image(\d+)\.", p.name)
        if not m:
            continue
        max_idx = max(max_idx, int(m.group(1)))
    return max_idx + 1


def _max_rid(rels_xml: str) -> int:
    nums = [int(x) for x in re.findall(r'Id="rId(\d+)"', rels_xml)]
    return max(nums) if nums else 0


def _max_docpr_id(document_xml: str) -> int:
    nums = [int(x) for x in re.findall(r'<wp:docPr id="(\d+)"', document_xml)]
    return max(nums) if nums else 0


def _escape_text_for_wt(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def _caption_paragraph(text: str) -> str:
    # Match the general paragraph style used throughout the document (Arial, 11pt-ish).
    safe = _escape_text_for_wt(text)
    return (
        '<w:p><w:pPr><w:spacing w:before="80" w:after="120" w:line="290"/>'
        '<w:jc w:val="both"/></w:pPr>'
        '<w:r><w:rPr>'
        '<w:rFonts w:ascii="Arial" w:cs="Arial" w:eastAsia="Arial" w:hAnsi="Arial"/>'
        '<w:b w:val="false"/><w:bCs w:val="false"/>'
        '<w:i w:val="false"/><w:iCs w:val="false"/>'
        '<w:color w:val="333333"/><w:sz w:val="22"/><w:szCs w:val="22"/>'
        '</w:rPr><w:t xml:space="preserve">'
        + safe
        + "</w:t></w:r></w:p>"
    )


def _image_paragraph(embed_rid: str, pic_id: int, filename: str, cx: int, cy: int) -> str:
    # Inline drawing copied from existing figures, with adjusted relationship + sizing.
    safe_name = _escape_text_for_wt(filename)
    return (
        '<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="120"/></w:pPr>'
        "<w:r><w:drawing>"
        '<wp:inline distT="0" distB="0" distL="0" distR="0">'
        f'<wp:extent cx="{cx}" cy="{cy}"/>'
        '<wp:effectExtent l="0" t="0" r="0" b="0"/>'
        f'<wp:docPr id="{pic_id}" name="Picture {pic_id}"/>'
        "<wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect=\"1\"/></wp:cNvGraphicFramePr>"
        "<a:graphic><a:graphicData uri=\"http://schemas.openxmlformats.org/drawingml/2006/picture\">"
        "<pic:pic>"
        "<pic:nvPicPr>"
        f'<pic:cNvPr id="{pic_id}" name="{safe_name}"/>'
        "<pic:cNvPicPr/>"
        "</pic:nvPicPr>"
        "<pic:blipFill>"
        f'<a:blip r:embed="{embed_rid}" cstate="print"/>'
        "<a:stretch><a:fillRect/></a:stretch>"
        "</pic:blipFill>"
        "<pic:spPr>"
        "<a:xfrm>"
        '<a:off x="0" y="0"/>'
        f'<a:ext cx="{cx}" cy="{cy}"/>'
        "</a:xfrm>"
        '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>'
        "</pic:spPr>"
        "</pic:pic>"
        "</a:graphicData></a:graphic>"
        "</wp:inline>"
        "</w:drawing></w:r></w:p>"
    )


def _page_break_paragraph() -> str:
    return "<w:p><w:r><w:br w:type=\"page\"/></w:r></w:p>"


def main() -> int:
    if not DOCX_PATH.exists():
        raise SystemExit(f"Missing docx: {DOCX_PATH}")
    if not CAPTURES_DIR.exists():
        raise SystemExit(f"Missing captures dir: {CAPTURES_DIR}")

    for fname, _caption in CAPTURES:
        if not (CAPTURES_DIR / fname).exists():
            raise SystemExit(f"Missing capture: {CAPTURES_DIR / fname}")

    stamp = _dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = DOCX_PATH.with_suffix(f".docx.bak-annexeA-{stamp}")
    shutil.copy2(DOCX_PATH, backup)

    with tempfile.TemporaryDirectory(prefix="kya-docx-annexeA-") as td:
        td_path = Path(td)
        with zipfile.ZipFile(DOCX_PATH, "r") as zf:
            zf.extractall(td_path)

        media_dir = td_path / "word" / "media"
        rels_path = td_path / "word" / "_rels" / "document.xml.rels"
        doc_path = td_path / "word" / "document.xml"

        if not media_dir.exists() or not rels_path.exists() or not doc_path.exists():
            raise SystemExit("Unexpected docx structure (missing word/media or rels or document.xml).")

        # Copy images into word/media
        next_img = _next_image_index(media_dir)
        rels_xml = _read_text(rels_path)
        next_rid = _max_rid(rels_xml) + 1

        image_targets: list[tuple[str, str]] = []  # (rid, media_filename)
        for i, (src_name, _cap) in enumerate(CAPTURES):
            dest_name = f"image{next_img + i}.jpg"
            shutil.copyfile(CAPTURES_DIR / src_name, media_dir / dest_name)
            rid = f"rId{next_rid + i}"
            image_targets.append((rid, dest_name))

        # Append relationships via XML parsing (rels file may use a namespace prefix like ns0).
        tree = ET.parse(rels_path)
        root = tree.getroot()
        if not root.tag.endswith("}Relationships") and not root.tag.endswith("Relationships"):
            raise SystemExit("Malformed document.xml.rels (unexpected root).")

        ns = ""
        if root.tag.startswith("{") and "}" in root.tag:
            ns = root.tag.split("}", 1)[0].strip("{")

        existing_ids = {el.attrib.get("Id", "") for el in root.findall(f".//{{{ns}}}Relationship") if ns} | {
            el.attrib.get("Id", "") for el in root.findall(".//Relationship")
        }

        for rid, fname in image_targets:
            if rid in existing_ids:
                continue
            attrib = {
                "Id": rid,
                "Type": "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
                "Target": f"media/{fname}",
            }
            if ns:
                ET.SubElement(root, f"{{{ns}}}Relationship", attrib=attrib)
            else:
                ET.SubElement(root, "Relationship", attrib=attrib)

        tree.write(rels_path, encoding="utf-8", xml_declaration=True)

        # Build insertion XML for Annexe A.
        # Use same width as other figures (6.5in) and set height by 1440x900 ratio.
        cx = 5943600
        cy = 3714750
        document_xml = _read_text(doc_path)
        next_pic_id = _max_docpr_id(document_xml) + 1

        insert_parts: list[str] = []
        insert_parts.append(_caption_paragraph("Captures ecrans de l'application KYA (version demo locale)."))
        for idx, ((rid, media_name), (_src, caption)) in enumerate(zip(image_targets, CAPTURES)):
            pic_id = next_pic_id + idx
            insert_parts.append(_caption_paragraph(caption))
            insert_parts.append(_image_paragraph(rid, pic_id, media_name, cx, cy))
            # page break after each image, to keep annex readable
            insert_parts.append(_page_break_paragraph())

        insertion = "".join(insert_parts)

        annex_a_marker = "Annexe A: Captures ecrans application (a inserer)."
        annex_b_marker = "Annexe B: Exemples fichiers d&apos;import (anonymises) (a inserer)."
        a_idx = document_xml.find(annex_a_marker)
        b_idx = document_xml.find(annex_b_marker)
        if a_idx < 0 or b_idx < 0 or b_idx <= a_idx:
            raise SystemExit("Could not locate Annexe A/B markers in document.xml.")

        a_p_end = document_xml.find("</w:p>", a_idx)
        if a_p_end < 0:
            raise SystemExit("Could not locate end of Annexe A paragraph.")
        a_p_end += len("</w:p>")

        # Find the <w:p> that wraps Annexe B (avoid matching <w:pPr>).
        b_p_start = document_xml.rfind("<w:p>", 0, b_idx)
        if b_p_start < 0:
            raise SystemExit("Could not locate start of Annexe B paragraph.")

        document_xml = document_xml[:a_p_end] + insertion + document_xml[b_p_start:]
        _write_text(doc_path, document_xml)

        # Repack docx
        tmp_docx = td_path / "__out.docx"
        with zipfile.ZipFile(tmp_docx, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            for file_path in td_path.rglob("*"):
                if file_path.name == "__out.docx":
                    continue
                if file_path.is_dir():
                    continue
                rel = file_path.relative_to(td_path).as_posix()
                zf.write(file_path, rel)

        shutil.copyfile(tmp_docx, DOCX_PATH)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
