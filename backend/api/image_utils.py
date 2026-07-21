"""
Image processing utilities for VorionMart.

Converts any uploaded image to WebP format with quality compression
and applies EXIF orientation correction to avoid auto-rotation issues.

IMPORTANT: Call process_image_upload() BEFORE super().save() in model.save().
It intercepts the in-memory upload and replaces it with a WebP version
before Django writes anything to storage. This avoids delete+re-save
races and 500 errors.
"""
import io
import logging
from pathlib import Path

from django.core.files.base import ContentFile
from PIL import Image, ImageOps

logger = logging.getLogger(__name__)

# WebP quality (0-100). 82 is a good balance of quality vs file size.
WEBP_QUALITY = 82
# Maximum dimension (width or height) in pixels. Larger images are resized.
MAX_DIMENSION = 2000


def process_image_upload(image_field) -> bool:
    """
    Convert a newly uploaded image to WebP format, IN MEMORY, before it is
    written to storage.

    Call this BEFORE super().save() in a model's save() method.

    How it works:
    - Django marks freshly-uploaded files as `_committed = False`.
    - We intercept that uncommitted file, run Pillow on it, and replace
      image_field.file / image_field.name with the processed WebP data.
    - Django then saves the WebP file to storage during its normal pre_save flow.
    - No delete-then-re-save dance is needed, so no 500 errors.

    Already-stored files (_committed = True) are skipped silently.
    Returns True if the image was processed, False if it was skipped.
    """
    if not image_field:
        return False

    # Only process NEW uploads (uncommitted means the file hasn't hit storage yet)
    if getattr(image_field, '_committed', True):
        return False

    # Already WebP -- nothing to do
    current_name = getattr(image_field, 'name', '') or ''
    if current_name.lower().endswith('.webp'):
        return False

    try:
        file_obj = image_field.file
        if hasattr(file_obj, 'seek'):
            file_obj.seek(0)

        img: Image.Image = Image.open(file_obj)

        # -- 1. Fix EXIF orientation FIRST ----------------------------------
        # ImageOps.exif_transpose reads the EXIF Orientation tag and
        # physically rotates/flips pixels so the image is always upright.
        # Without this, phone-camera shots re-encode rotated.
        img = ImageOps.exif_transpose(img)

        # -- 2. Normalise colour mode ---------------------------------------
        if img.mode == 'P':
            img = img.convert('RGBA')
        elif img.mode not in ('RGB', 'RGBA'):
            img = img.convert('RGB')

        # -- 3. Resize if too large -----------------------------------------
        w, h = img.size
        if w > MAX_DIMENSION or h > MAX_DIMENSION:
            img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)

        # -- 4. Encode as WebP ---------------------------------------------
        output = io.BytesIO()
        img.save(output, format='WEBP', quality=WEBP_QUALITY, method=6)
        webp_bytes = output.getvalue()

    except Exception as exc:
        logger.error("process_image_upload: PIL error -- %s", exc)
        return False

    # -- 5. Replace the in-memory file with the WebP version ---------------
    # Django's FileField.pre_save() will call:
    #   storage.save(generate_filename(instance, image_field.name), image_field.file)
    # so we just need to swap out .file and .name before super().save() runs.
    try:
        stem = Path(Path(current_name).name).stem
        new_name = f"{stem}.webp"
        image_field.file = ContentFile(webp_bytes, name=new_name)
        image_field.name = new_name
        logger.debug(
            "process_image_upload: prepared WebP %s (%d bytes)",
            new_name, len(webp_bytes)
        )
        return True
    except Exception as exc:
        logger.error("process_image_upload: could not replace file -- %s", exc)
        return False
