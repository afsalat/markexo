"""Utilities for launch-readiness checklist seeding and syncing."""

from __future__ import annotations

import json
from pathlib import Path

from django.conf import settings
from django.db import transaction

from .models import ChecklistItem, ChecklistSection

LAUNCH_CHECKLIST_PROJECT_NAME = 'Vorionmart'
LAUNCH_CHECKLIST_SEED_PATH = (
    settings.BASE_DIR.parent / 'frontend' / 'src' / 'data' / 'vorionmart-launch-checklist.json'
)

PRIORITY_MAP = {
    'High': ChecklistItem.PRIORITY_HIGH,
    'Medium': ChecklistItem.PRIORITY_MEDIUM,
    'Low': ChecklistItem.PRIORITY_LOW,
    'Critical': ChecklistItem.PRIORITY_CRITICAL,
}

STATUS_MAP = {
    'Done': ChecklistItem.STATUS_COMPLETED,
    'Completed': ChecklistItem.STATUS_COMPLETED,
    'Testing': ChecklistItem.STATUS_TESTING,
    'Blocked': ChecklistItem.STATUS_BLOCKED,
    'In Progress': ChecklistItem.STATUS_IN_PROGRESS,
    'Not Started': ChecklistItem.STATUS_NOT_STARTED,
}


def load_launch_checklist_seed() -> dict:
    with Path(LAUNCH_CHECKLIST_SEED_PATH).open(encoding='utf-8') as seed_file:
        return json.load(seed_file)


def _normalize_priority(value: str | None) -> str:
    return PRIORITY_MAP.get(value or '', ChecklistItem.PRIORITY_HIGH)


def _normalize_status(value: str | None) -> str:
    return STATUS_MAP.get(value or '', ChecklistItem.STATUS_NOT_STARTED)


def get_launch_checklist_sections() -> list[ChecklistSection]:
    return list(ChecklistSection.objects.prefetch_related('items').order_by('display_order', 'id'))


def normalize_section_display_order() -> None:
    for index, section in enumerate(ChecklistSection.objects.order_by('display_order', 'id')):
        if section.display_order != index:
            ChecklistSection.objects.filter(pk=section.pk).update(display_order=index)


@transaction.atomic
def sync_launch_checklist_from_seed(*, replace_existing: bool = False) -> list[ChecklistSection]:
    """Create or update launch checklist rows from the JSON seed."""
    seed_data = load_launch_checklist_seed()
    sections = seed_data.get('sections', [])

    if replace_existing:
        ChecklistItem.objects.all().delete()
        ChecklistSection.objects.all().delete()

    for section_index, section_payload in enumerate(sections):
        section_slug = section_payload['id']

        section, _ = ChecklistSection.objects.update_or_create(
            slug=section_slug,
            defaults={
                'title': section_payload.get('title', section_slug.replace('-', ' ').title()),
                'description': section_payload.get('description', ''),
                'display_order': section_index,
            },
        )

        for item_index, item_payload in enumerate(section_payload.get('items', [])):
            item_slug = item_payload['id']
            title = item_payload.get('title') or item_payload.get('name') or item_slug.replace('-', ' ').title()
            status = _normalize_status(item_payload.get('status'))

            ChecklistItem.objects.update_or_create(
                slug=item_slug,
                defaults={
                    'section': section,
                    'title': title,
                    'description': item_payload.get('description', ''),
                    'priority': _normalize_priority(item_payload.get('priority')),
                    'status': status,
                    'owner': item_payload.get('owner', ''),
                    'notes': item_payload.get('notes', ''),
                    'is_completed': status == ChecklistItem.STATUS_COMPLETED,
                    'display_order': item_index,
                },
            )

    normalize_section_display_order()
    return get_launch_checklist_sections()


def ensure_launch_checklist_seeded() -> list[ChecklistSection]:
    if not ChecklistSection.objects.exists():
        return sync_launch_checklist_from_seed()
    normalize_section_display_order()
    return get_launch_checklist_sections()
