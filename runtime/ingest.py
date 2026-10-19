"""Bounded local document extraction. No hosted inference, OCR, or network fetching."""
import json
import sys
import zipfile
from pathlib import Path

path = Path(sys.argv[1])
extension = path.suffix.lower()
if extension in ('.docx', '.pptx', '.xlsx'):
    with zipfile.ZipFile(path) as archive:
        if len(archive.infolist()) > 3000 or sum(i.file_size for i in archive.infolist()) > 50_000_000:
            raise ValueError('Document expands beyond the extraction limit')
if extension in ('.png', '.jpg', '.jpeg', '.webp'):
    from PIL import Image
    Image.MAX_IMAGE_PIXELS = 20_000_000
    with Image.open(path) as image:
        image.verify()
    result = 'Uploaded image. Ask the presenter what it shows and how it should be used. No automatic OCR or image understanding has been performed.'
elif extension in ('.txt', '.md', '.csv', '.json'):
    result = path.read_text(encoding='utf-8')
else:
    from markitdown import MarkItDown
    result = MarkItDown(enable_plugins=False).convert(str(path)).text_content
if not result.strip():
    raise ValueError('No extractable text. For scanned documents, upload text or an image and describe it in chat.')
truncated = len(result) > 24000
print(json.dumps({'content': result[:23700] + '\n[Extraction shortened. Only this excerpt is available to agents.]' if truncated else result,
                  'truncated': truncated}))
