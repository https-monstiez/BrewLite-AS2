"""Export the AS2 Markdown report to standalone A4 PDF and editable DOCX."""
import base64
import hashlib
import html
import json
import re
import subprocess
import tempfile
from pathlib import Path
from urllib.parse import quote

import markdown
from bs4 import BeautifulSoup, NavigableString, Tag
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor
from docx.opc.constants import RELATIONSHIP_TYPE as RT
from docx.image.image import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/report-as2.md'
OUT = ROOT / 'docs/exports'
OUT.mkdir(parents=True, exist_ok=True)
TEMP = Path(tempfile.mkdtemp(prefix='brewlite-report-'))
text = SOURCE.read_text()
body = text.split('\n---\n', 1)[1]
slug = lambda value, sep: re.sub(r'[^\w\s-]', '', value.lower()).replace(' ', '-')
rendered = markdown.markdown(body, extensions=['tables', 'toc', 'sane_lists'], extension_configs={'toc': {'slugify': slug}})
soup = BeautifulSoup(rendered, 'html.parser')
figures = []
for index, image in enumerate(soup.find_all('img')):
    path = (SOURCE.parent / image['src']).resolve()
    assert path.is_relative_to(ROOT), path
    png = TEMP / f'figure-{index+1}.png'
    figures.append({'svg': str(path), 'png': str(png)})
    image['data-word-png'] = str(png)
    image['src'] = 'data:image/svg+xml;base64,' + base64.b64encode(path.read_bytes()).decode()
    parent = image.parent
    following = parent.find_next_sibling()
    if following and following.name == 'p' and following.get_text().startswith('Hình '):
        figure = soup.new_tag('figure')
        parent.replace_with(figure)
        figure.append(parent)
        caption = soup.new_tag('figcaption')
        caption.extend(list(following.contents))
        following.extract()
        figure.append(caption)
for link in soup.find_all('a', href=True):
    href = link['href']
    if not href.startswith(('https://', 'http://', '#', 'mailto:')):
        rel, _, anchor = href.partition('#')
        path = (SOURCE.parent / rel).resolve().relative_to(ROOT)
        link['href'] = 'https://github.com/https-monstiez/BrewLite-AS2/blob/main/' + quote(path.as_posix()) + ('#' + anchor if anchor else '')
cover = '''<section class="cover"><p>TRƯỜNG ĐẠI HỌC SÀI GÒN<br><b>KHOA CÔNG NGHỆ THÔNG TIN</b></p>
<div class="cover-title"><p>BÁO CÁO ĐỒ ÁN CÔNG NGHỆ PHẦN MỀM</p><h1>BREWLITE</h1><h2>HỆ THỐNG ĐẶT THỨC UỐNG TRỰC TUYẾN</h2><p>Assignment 2 — Requirements to Deployment</p></div>
<p>Học kỳ I — Năm học 2026–2027</p><p><b>Giảng viên hướng dẫn:</b> Từ Lãng Phiêu</p>
<table><tr><th>Họ và tên</th><th>MSSV</th></tr><tr><td>Lê Ngọc Hiếu</td><td>3124410095</td></tr><tr><td>Nguyễn Tiến Đạt</td><td>3124410060</td></tr></table>
<p>Ngày nộp sản phẩm: 16/11/2026<br>Ngày bảo vệ dự kiến: 18/11/2026</p><p class="cover-end">TP. Hồ Chí Minh, năm 2026</p></section>'''
css = '''body{font-family:"Times New Roman",serif;font-size:12pt;line-height:1.35;color:#17251e;margin:0}p{text-align:justify;margin:7pt 0}h1,h2,h3{color:#264b39;break-after:avoid}h2{font-size:16pt;margin-top:21pt;border-bottom:1px solid #bac9bf;padding-bottom:5pt}h3{font-size:13pt;margin-top:14pt}a{color:#235b46;text-decoration:none;overflow-wrap:anywhere}code{font-family:monospace;font-size:9pt;overflow-wrap:anywhere}table{width:100%;border-collapse:collapse;margin:10pt 0;font-size:10pt;table-layout:fixed}th,td{border:1px solid #bac9bf;padding:6pt;vertical-align:top;overflow-wrap:anywhere}th{background:#e8eee8;text-align:left}thead{display:table-header-group}tr{break-inside:avoid}ul,ol{padding-left:19pt}li{margin:5pt 0}figure{break-inside:avoid;margin:12pt 0;text-align:center}figure p{text-align:center}figure img{max-width:100%;max-height:190mm;object-fit:contain}figcaption{text-align:center;font-size:10pt;line-height:1.2}blockquote{margin:10pt 0;padding:6pt 12pt;border-left:3pt solid #78967e}.cover{text-align:center;height:250mm;box-sizing:border-box;break-after:page;padding-top:7mm}.cover p{text-align:center}.cover-title{margin:23mm 0 16mm}.cover h1{font-size:30pt;margin:8mm 0}.cover h2{font-size:18pt;border:0;margin:0}.cover table{width:90%;margin:12mm auto}.cover-end{margin-top:19mm}'''
html_path = TEMP / 'report.html'
html_path.write_text('<!doctype html><html lang="vi"><meta charset="utf-8"><title>BrewLite AS2 — Báo cáo</title><style>'+css+'</style><body>'+cover+str(soup)+'</body></html>')
manifest = {'html': str(html_path), 'pdf': str(OUT/'BrewLite-AS2-Bao-cao.pdf'), 'figures': figures, 'preview': str(TEMP/'preview.png')}
manifest_path = TEMP / 'manifest.json'
manifest_path.write_text(json.dumps(manifest))
subprocess.run(['node', str(ROOT/'scripts/render-report-assets.mjs'), str(manifest_path)], cwd=ROOT, check=True)

doc = Document()
section = doc.sections[0]
section.page_width, section.page_height = Cm(21), Cm(29.7)
section.top_margin, section.bottom_margin = Cm(2), Cm(2)
section.left_margin, section.right_margin = Cm(2.5), Cm(1.8)
normal = doc.styles['Normal']
normal.font.name = 'Times New Roman'
normal.font.size = Pt(12)
normal.paragraph_format.line_spacing = 1.25
normal.paragraph_format.space_after = Pt(6)
for name, size in [('Title',24),('Heading 1',16),('Heading 2',14),('Heading 3',12)]:
    style = doc.styles[name]
    style.font.name = 'Times New Roman'
    style.font.size = Pt(size)
    style.font.color.rgb = RGBColor.from_string('264B39')
    style.paragraph_format.keep_with_next = True
section.different_first_page_header_footer = True
footer = section.footer.paragraphs[0]
footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
footer.add_run('BrewLite — Assignment 2 · ').font.size = Pt(9)
field = OxmlElement('w:fldSimple'); field.set(qn('w:instr'), 'PAGE'); footer._p.append(field)

def cover_line(value, size=13, bold=False):
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(value); r.bold=bold; r.font.size=Pt(size)
    return p
cover_line('TRƯỜNG ĐẠI HỌC SÀI GÒN\nKHOA CÔNG NGHỆ THÔNG TIN',14,True)
doc.add_paragraph('\n')
cover_line('BÁO CÁO ĐỒ ÁN\nCÔNG NGHỆ PHẦN MỀM',17,True)
cover_line('BREWLITE',26,True)
cover_line('HỆ THỐNG ĐẶT THỨC UỐNG TRỰC TUYẾN',16,True)
cover_line('Assignment 2 — Requirements to Deployment')
cover_line('Học kỳ I — Năm học 2026–2027')
doc.add_paragraph('')
cover_line('Giảng viên hướng dẫn: Từ Lãng Phiêu')
cover_line('Lê Ngọc Hiếu — 3124410095\nNguyễn Tiến Đạt — 3124410060')
cover_line('Ngày nộp sản phẩm: 16/11/2026\nNgày bảo vệ dự kiến: 18/11/2026')
doc.add_paragraph('')
cover_line('TP. Hồ Chí Minh, năm 2026')
doc.add_page_break()
bookmark_id = 0

def bookmark_name(anchor): return 'bm'+hashlib.sha1(anchor.encode()).hexdigest()[:24]

def inline(p, element, bold=False, italic=False):
    for child in element.children:
        if isinstance(child, NavigableString):
            run = p.add_run(str(child)); run.bold=bold; run.italic=italic
        elif child.name == 'br': p.add_run().add_break()
        elif child.name == 'a':
            link = OxmlElement('w:hyperlink')
            if child.get('href','').startswith('#'):
                link.set(qn('w:anchor'),bookmark_name(child['href'][1:]))
            else:
                rid = p.part.relate_to(child.get('href',''),RT.HYPERLINK,is_external=True)
                link.set(qn('r:id'),rid)
            run = OxmlElement('w:r'); props=OxmlElement('w:rPr')
            color=OxmlElement('w:color'); color.set(qn('w:val'),'235B46'); props.append(color)
            run.append(props); text=OxmlElement('w:t'); text.text=child.get_text(); run.append(text); link.append(run); p._p.append(link)
        elif child.name == 'code':
            run=p.add_run(child.get_text()); run.font.name='Courier New'; run.font.size=Pt(9)
        elif child.name not in ['img']: inline(p,child,bold or child.name in ['strong','b'],italic or child.name in ['em','i'])

def picture(image):
    path = image['data-word-png']
    im=Image.from_file(path)
    ratio=im.px_height/im.px_width
    width=min(16.5,20.5/ratio)
    p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.keep_with_next=True
    p.add_run().add_picture(path,width=Cm(width))

for element in soup.children:
    if not isinstance(element,Tag): continue
    if re.fullmatch('h[1-6]',element.name):
        level=min(int(element.name[1])-1,3)
        p=doc.add_paragraph(style=f'Heading {max(1,level)}')
        bookmark_id+=1
        start=OxmlElement('w:bookmarkStart'); start.set(qn('w:id'),str(bookmark_id)); start.set(qn('w:name'),bookmark_name(element.get('id',''))); p._p.append(start)
        inline(p,element)
        end=OxmlElement('w:bookmarkEnd'); end.set(qn('w:id'),str(bookmark_id)); p._p.append(end)
    elif element.name=='p':
        if element.find('img'): picture(element.find('img'))
        else:
            p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.JUSTIFY; inline(p,element)
    elif element.name=='figure':
        picture(element.find('img'))
        if element.find('figcaption'):
            p=doc.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; inline(p,element.find('figcaption'))
            for run in p.runs: run.font.size=Pt(10)
    elif element.name=='table':
        rows=element.find_all('tr'); count=max(len(row.find_all(['td','th'],recursive=False)) for row in rows)
        table=doc.add_table(rows=0,cols=count); table.style='Table Grid'
        for index,row in enumerate(rows):
            cells=table.add_row().cells
            for cell,item in zip(cells,row.find_all(['td','th'],recursive=False)):
                inline(cell.paragraphs[0],item,bold=item.name=='th')
                for p in cell.paragraphs:
                    for r in p.runs:r.font.size=Pt(10)
            if index==0:
                header=OxmlElement('w:tblHeader'); table.rows[0]._tr.get_or_add_trPr().append(header)
            props=table.rows[index]._tr.get_or_add_trPr(); props.append(OxmlElement('w:cantSplit'))
        doc.add_paragraph('')
    elif element.name in ['ol','ul']:
        for item in element.find_all('li',recursive=False):
            p=doc.add_paragraph(style='List Number' if element.name=='ol' else 'List Bullet'); inline(p,item)
    elif element.name=='blockquote':
        for item in element.find_all('p',recursive=False):inline(doc.add_paragraph(style='Quote'),item)
doc.core_properties.title='BrewLite — Báo cáo Assignment 2'
doc.core_properties.author='Lê Ngọc Hiếu; Nguyễn Tiến Đạt'
doc.core_properties.subject='Requirements to Deployment — phạm vi ngân hàng và điểm'
doc.save(OUT/'BrewLite-AS2-Bao-cao.docx')
print('PDF:',OUT/'BrewLite-AS2-Bao-cao.pdf')
print('Word:',OUT/'BrewLite-AS2-Bao-cao.docx')
print('Preview:',manifest['preview'])
