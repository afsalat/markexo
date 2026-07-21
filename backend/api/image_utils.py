"""
Image processing utilities for VorionMart.

Converts any uploaded image to WebP format with quality compression
and applies EXIF orientation correction to avoid auto-rotation issues.
"""
import io
import os
import logging
from pathlib import Path

from django.core.files.base import ContentFile
from PIL import Image, ImageOps

logger = logging.getLogger(__name__)

# WebP quality (0-100). 82 is a good balance of quality vs file size.
WEBP_QUALITY = 82
# Maximum dimension (width or height) in pixels. Images larger than this are resized.
MAX_DIMENSION = 2000


def convert_image_to_webp(image_field, name_hint: str = '') -> bool:
    """
    Convert an ImageField's file to WebP format in-place.

    - Applies EXIF orientation (fixes phone camera rotation issues).
    - Converts to WebP with configurable quality.
    - Resizes if either dimension exceeds MAX_DIMENSION.
    - Skips if no file is attached.

    Returns True if the image was replaced, False if it was skipped.
    """
    if not image_field or not image_field.name:
        return False

    try:
        # Read the current file into memory
        image_field.open('rb')
        raw = image_field.read()
        image_field.close()
    except Exception as exc:
        logger.warning("convert_image_to_webp: could not read %s -- %s", image_field.name, exc)
        return False

    try:
        img = Image.open(io.BytesIO(raw))

        # 1. Fix EXIF orientation BEFORE any other operation
        # ImageOps.exif_transpose reads the EXIF Orientation tag and physically
        # rotates/flips the pixel data so downstream code sees correct orientation.
        # This prevents the rotated-after-re-save bug common with phone photos.
        img = ImageOps.exif_transpose(img)

        # 2. Convert colour mode
        # WebP supports RGBA. Convert palette/CMYK/etc. to RGB(A) first.
        if img.mode == 'P':
            img = img.convert('RGBA')
        elif img.mode not in ('RGB', 'RGBA'):
            img = img.convert('RGB')

        # 3. Resize if too large
        w, h = img.size
        if w > MAX_DIMENSION or h > MAX_DIMENSION:
            img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)

        # 4. Encode as WebP
        output = io.BytesIO()
        save_kwargs = {
            'format': 'WEBP',
            'quality': WEBP_QUALITY,
            'method': 6,
        }
        img.save(output, **save_kwargs)
        webp_bytes = output.getvalue()

    except Exception as exc:
        logger.error("convert_image_to_webp: PIL error on %s -- %s", image_field.name, exc)
        return False

    # 5. Build new filename with .webp extension
    old_name = Path(image_field.name).name
    stem = Path(old_name).stem
    new_filename = f"{stem}.webp"

    # 6. Replace the file on the ImageField
    try:
        image_field.delete(save=False)
        image_field.save(new_filename, ContentFile(webp_bytes), save=False)
        logger.debug("convert_image_to_webp: saved %s as WebP (%d bytes)", new_filename, len(webp_bytes))
        return True
    except Exception as exc:
        logger.error("convert_image_to_webp: could not save WebP for %s -- %s", image_field.name, exc)
        return False
