'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Loader2,
  Lock,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCcw,
  Store,
  Target,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  createLaunchChecklistItem,
  createLaunchChecklistSection,
  deleteLaunchChecklistSection,
  fetchLaunchChecklist,
  seedLaunchChecklist,
  updateLaunchChecklistItem,
  updateLaunchChecklistSection,
} from '@/lib/api';
import type {
  LaunchChecklistDocument,
  LaunchChecklistItem,
  LaunchChecklistPriority,
  LaunchChecklistSection,
  LaunchChecklistStatus,
} from '@/types/launchChecklist';

type SectionDraft = {
  title: string;
  description: string;
};

type ItemDraft = {
  title: string;
  description: string;
  priority: LaunchChecklistPriority;
  status: LaunchChecklistStatus;
  owner: string;
  notes: string;
};

const statusOptions: LaunchChecklistStatus[] = [
  'Not Started',
  'In Progress',
  'Blocked',
  'Testing',
  'Completed',
];

const priorityOptions: LaunchChecklistPriority[] = [
  'Critical',
  'High',
  'Medium',
  'Low',
];

const sectionIcons: Record<string, typeof ClipboardList> = {
  'Core Website Setup': Store,
  'Product Management': ClipboardList,
  'Checkout and Order Flow': Truck,
  'SEO Setup': Target,
  'Google Merchant / Free Listings Setup': BarChart3,
  'Legal and Trust': Lock,
  'Marketing Readiness': Target,
  'Analytics and Tracking': BarChart3,
  'Admin and Operations': ClipboardList,
  'Final QA Testing': CheckCircle2,
};

const getEmptySectionDraft = (): SectionDraft => ({
  title: '',
  description: '',
});

const getEmptyItemDraft = (): ItemDraft => ({
  title: '',
  description: '',
  priority: 'High',
  status: 'Not Started',
  owner: '',
  notes: '',
});

const isComplete = (item: LaunchChecklistItem) =>
  item.is_completed || item.status === 'Completed';

const sortItems = (items: LaunchChecklistItem[]) =>
  items.slice().sort((a, b) => a.display_order - b.display_order || a.id - b.id);

const sortSections = (sections: LaunchChecklistSection[]) =>
  sections
    .slice()
    .sort((a, b) => a.display_order - b.display_order || a.id - b.id)
    .map((section) => ({
      ...section,
      items: sortItems(section.items),
    }));

const normalizeDocument = (document: LaunchChecklistDocument): LaunchChecklistDocument => ({
  ...document,
  sections: sortSections(document.sections),
});

const getPriorityClasses = (priority: LaunchChecklistPriority) => {
  if (priority === 'Critical') {
    return 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200';
  }

  if (priority === 'High') {
    return 'border-red-500/30 bg-red-500/10 text-red-200';
  }

  if (priority === 'Medium') {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
  }

  return 'border-sky-500/30 bg-sky-500/10 text-sky-200';
};

const getStatusClasses = (status: LaunchChecklistStatus) => {
  if (status === 'Completed') {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
  }

  if (status === 'Testing') {
    return 'border-violet-500/30 bg-violet-500/10 text-violet-200';
  }

  if (status === 'In Progress') {
    return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200';
  }

  if (status === 'Blocked') {
    return 'border-rose-500/30 bg-rose-500/10 text-rose-200';
  }

  return 'border-slate-500/30 bg-slate-500/10 text-slate-200';
};

const getSectionProgress = (section: LaunchChecklistSection) => {
  const completed = section.items.filter(isComplete).length;
  const total = section.items.length;

  return {
    completed,
    total,
    percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
};

const getOverallProgress = (sections: LaunchChecklistSection[]) => {
  const items = sections.flatMap((section) => section.items);
  const completed = items.filter(isComplete).length;
  const blocked = items.filter((item) => item.status === 'Blocked').length;
  const criticalOpen = items.filter(
    (item) => item.priority === 'Critical' && !isComplete(item)
  ).length;
  const percentage = items.length === 0 ? 0 : Math.round((completed / items.length) * 100);

  return {
    completed,
    total: items.length,
    blocked,
    criticalOpen,
    percentage,
  };
};

const replaceChecklistItem = (
  document: LaunchChecklistDocument,
  itemId: number,
  updater: (item: LaunchChecklistItem) => LaunchChecklistItem
): LaunchChecklistDocument =>
  normalizeDocument({
    ...document,
    sections: document.sections.map((section) => ({
      ...section,
      items: section.items.map((item) => (item.id === itemId ? updater(item) : item)),
    })),
  });

const upsertChecklistSection = (
  document: LaunchChecklistDocument,
  section: LaunchChecklistSection
): LaunchChecklistDocument => {
  const exists = document.sections.some((entry) => entry.id === section.id);

  return normalizeDocument({
    ...document,
    sections: exists
      ? document.sections.map((entry) => (entry.id === section.id ? section : entry))
      : [...document.sections, section],
  });
};

const removeChecklistSection = (
  document: LaunchChecklistDocument,
  sectionId: number
): LaunchChecklistDocument =>
  normalizeDocument({
    ...document,
    sections: document.sections.filter((section) => section.id !== sectionId),
  });

const appendChecklistItem = (
  document: LaunchChecklistDocument,
  sectionId: number,
  item: LaunchChecklistItem
): LaunchChecklistDocument =>
  normalizeDocument({
    ...document,
    sections: document.sections.map((section) =>
      section.id === sectionId
        ? { ...section, items: [...section.items, item] }
        : section
    ),
  });

const findChecklistItem = (
  document: LaunchChecklistDocument,
  itemId: number
): LaunchChecklistItem | null => {
  for (const section of document.sections) {
    const item = section.items.find((entry) => entry.id === itemId);
    if (item) {
      return item;
    }
  }

  return null;
};

export default function LaunchReadinessTab() {
  const { token } = useAuth();
  const [checklist, setChecklist] = useState<LaunchChecklistDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingItemIds, setSavingItemIds] = useState<number[]>([]);
  const [savingSectionIds, setSavingSectionIds] = useState<number[]>([]);
  const [syncingSeed, setSyncingSeed] = useState(false);
  const [showAddSectionForm, setShowAddSectionForm] = useState(false);
  const [sectionDraft, setSectionDraft] = useState<SectionDraft>(getEmptySectionDraft);
  const [creatingSection, setCreatingSection] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [editingSectionDraft, setEditingSectionDraft] = useState<SectionDraft>(getEmptySectionDraft);
  const [openSectionMenuId, setOpenSectionMenuId] = useState<number | null>(null);
  const [addingItemSectionId, setAddingItemSectionId] = useState<number | null>(null);
  const [itemDrafts, setItemDrafts] = useState<Record<number, ItemDraft>>({});
  const [creatingItemSectionId, setCreatingItemSectionId] = useState<number | null>(null);

  const loadChecklist = useCallback(async () => {
    if (!token) {
      setChecklist(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchLaunchChecklist(token);
      setChecklist(normalizeDocument(data));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load launch checklist');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadChecklist();
  }, [loadChecklist]);

  const markItemSaving = (itemId: number, saving: boolean) => {
    setSavingItemIds((current) => {
      if (saving) {
        return current.includes(itemId) ? current : [...current, itemId];
      }
      return current.filter((id) => id !== itemId);
    });
  };

  const markSectionSaving = (sectionId: number, saving: boolean) => {
    setSavingSectionIds((current) => {
      if (saving) {
        return current.includes(sectionId) ? current : [...current, sectionId];
      }
      return current.filter((id) => id !== sectionId);
    });
  };

  const markManySectionsSaving = (sectionIds: number[], saving: boolean) => {
    setSavingSectionIds((current) => {
      if (saving) {
        return Array.from(new Set([...current, ...sectionIds]));
      }
      return current.filter((id) => !sectionIds.includes(id));
    });
  };

  const syncSeedData = async () => {
    if (!token) {
      return;
    }

    setSyncingSeed(true);
    setError(null);

    try {
      const data = await seedLaunchChecklist(token, false);
      setChecklist(normalizeDocument(data));
      setEditingSectionId(null);
      setOpenSectionMenuId(null);
      setAddingItemSectionId(null);
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : 'Failed to sync checklist seed');
    } finally {
      setSyncingSeed(false);
    }
  };

  const persistItem = async (
    itemId: number,
    optimisticUpdater: (item: LaunchChecklistItem) => LaunchChecklistItem,
    payload: Record<string, unknown>
  ) => {
    if (!token || !checklist) {
      return;
    }

    const previousItem = findChecklistItem(checklist, itemId);
    if (!previousItem) {
      return;
    }

    setChecklist((current) =>
      current ? replaceChecklistItem(current, itemId, optimisticUpdater) : current
    );
    markItemSaving(itemId, true);
    setError(null);

    try {
      const updatedItem = await updateLaunchChecklistItem(token, itemId, payload);
      setChecklist((current) =>
        current ? replaceChecklistItem(current, itemId, () => updatedItem) : current
      );
    } catch (saveError) {
      setChecklist((current) =>
        current ? replaceChecklistItem(current, itemId, () => previousItem) : current
      );
      setError(saveError instanceof Error ? saveError.message : 'Failed to save checklist item');
    } finally {
      markItemSaving(itemId, false);
    }
  };

  const updateDraftField = <K extends keyof LaunchChecklistItem>(
    itemId: number,
    field: K,
    value: LaunchChecklistItem[K]
  ) => {
    setChecklist((current) =>
      current
        ? replaceChecklistItem(current, itemId, (item) => ({
            ...item,
            [field]: value,
          }))
        : current
    );
  };

  const handleToggle = async (item: LaunchChecklistItem) => {
    const nextCompleted = !isComplete(item);
    const nextStatus: LaunchChecklistStatus = nextCompleted ? 'Completed' : 'Not Started';

    await persistItem(
      item.id,
      (current) => ({
        ...current,
        status: nextStatus,
        is_completed: nextCompleted,
      }),
      {
        status: nextStatus,
        is_completed: nextCompleted,
      }
    );
  };

  const handleStatusChange = async (
    item: LaunchChecklistItem,
    status: LaunchChecklistStatus
  ) => {
    await persistItem(
      item.id,
      (current) => ({
        ...current,
        status,
        is_completed: status === 'Completed',
      }),
      {
        status,
      }
    );
  };

  const handlePriorityChange = async (
    item: LaunchChecklistItem,
    priority: LaunchChecklistPriority
  ) => {
    await persistItem(
      item.id,
      (current) => ({
        ...current,
        priority,
      }),
      {
        priority,
      }
    );
  };

  const handleOwnerBlur = async (item: LaunchChecklistItem) => {
    await persistItem(
      item.id,
      (current) => ({
        ...current,
        owner: item.owner,
      }),
      {
        owner: item.owner,
      }
    );
  };

  const handleNotesBlur = async (item: LaunchChecklistItem) => {
    await persistItem(
      item.id,
      (current) => ({
        ...current,
        notes: item.notes,
      }),
      {
        notes: item.notes,
      }
    );
  };

  const beginSectionEdit = (section: LaunchChecklistSection) => {
    setEditingSectionId(section.id);
    setEditingSectionDraft({
      title: section.title,
      description: section.description,
    });
    setOpenSectionMenuId(null);
  };

  const cancelSectionEdit = () => {
    setEditingSectionId(null);
    setEditingSectionDraft(getEmptySectionDraft());
  };

  const handleCreateSection = async () => {
    if (!token || !checklist) {
      return;
    }

    const title = sectionDraft.title.trim();
    if (!title) {
      setError('Section title is required.');
      return;
    }

    setCreatingSection(true);
    setError(null);

    try {
      const createdSection = await createLaunchChecklistSection(token, {
        title,
        description: sectionDraft.description.trim(),
        display_order: checklist.sections.length,
      });

      setChecklist((current) =>
        current ? upsertChecklistSection(current, { ...createdSection, items: [] }) : current
      );
      setSectionDraft(getEmptySectionDraft());
      setShowAddSectionForm(false);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create section');
    } finally {
      setCreatingSection(false);
    }
  };

  const handleSaveSection = async (sectionId: number) => {
    if (!token || !checklist) {
      return;
    }

    const title = editingSectionDraft.title.trim();
    if (!title) {
      setError('Section title is required.');
      return;
    }

    markSectionSaving(sectionId, true);
    setError(null);

    try {
      const updatedSection = await updateLaunchChecklistSection(token, sectionId, {
        title,
        description: editingSectionDraft.description.trim(),
      });

      setChecklist((current) =>
        current ? upsertChecklistSection(current, updatedSection) : current
      );
      cancelSectionEdit();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update section');
    } finally {
      markSectionSaving(sectionId, false);
    }
  };

  const handleDeleteSection = async (section: LaunchChecklistSection) => {
    if (!token || !checklist) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${section.title}" and its ${section.items.length} checklist item(s)? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    markSectionSaving(section.id, true);
    setError(null);

    try {
      await deleteLaunchChecklistSection(token, section.id);
      setChecklist((current) =>
        current ? removeChecklistSection(current, section.id) : current
      );
      if (editingSectionId === section.id) {
        cancelSectionEdit();
      }
      if (addingItemSectionId === section.id) {
        setAddingItemSectionId(null);
      }
      setOpenSectionMenuId(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete section');
    } finally {
      markSectionSaving(section.id, false);
    }
  };

  const handleMoveSection = async (sectionId: number, direction: 'up' | 'down') => {
    if (!token || !checklist) {
      return;
    }

    const orderedSections = sortSections(checklist.sections);
    const currentIndex = orderedSections.findIndex((section) => section.id === sectionId);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= orderedSections.length) {
      return;
    }

    const previousChecklist = checklist;
    const nextSections = orderedSections.slice();
    const [sectionToMove] = nextSections.splice(currentIndex, 1);
    nextSections.splice(targetIndex, 0, sectionToMove);

    const reorderedSections = nextSections.map((section, index) => ({
      ...section,
      display_order: index,
    }));
    const changedSections = reorderedSections.filter(
      (section, index) => orderedSections[index]?.id !== section.id
    );

    if (changedSections.length === 0) {
      return;
    }

    setChecklist({
      ...checklist,
      sections: reorderedSections,
    });
    markManySectionsSaving(
      changedSections.map((section) => section.id),
      true
    );
    setError(null);

    try {
      const updatedSections = await Promise.all(
        changedSections.map((section) =>
          updateLaunchChecklistSection(token, section.id, {
            display_order: section.display_order,
          })
        )
      );

      setChecklist((current) => {
        if (!current) {
          return current;
        }

        return normalizeDocument({
          ...current,
          sections: current.sections.map((section) => {
            const updated = updatedSections.find((entry) => entry.id === section.id);
            return updated ?? section;
          }),
        });
      });
    } catch (moveError) {
      setChecklist(previousChecklist);
      setError(moveError instanceof Error ? moveError.message : 'Failed to reorder sections');
    } finally {
      markManySectionsSaving(
        changedSections.map((section) => section.id),
        false
      );
    }
  };

  const openAddItemForm = (sectionId: number) => {
    setAddingItemSectionId(sectionId);
    setItemDrafts((current) => ({
      ...current,
      [sectionId]: current[sectionId] ?? getEmptyItemDraft(),
    }));
    setOpenSectionMenuId(null);
  };

  const handleItemDraftChange = <K extends keyof ItemDraft>(
    sectionId: number,
    field: K,
    value: ItemDraft[K]
  ) => {
    setItemDrafts((current) => ({
      ...current,
      [sectionId]: {
        ...(current[sectionId] ?? getEmptyItemDraft()),
        [field]: value,
      },
    }));
  };

  const handleCreateItem = async (section: LaunchChecklistSection) => {
    if (!token || !checklist) {
      return;
    }

    const draft = itemDrafts[section.id] ?? getEmptyItemDraft();
    const title = draft.title.trim();

    if (!title) {
      setError('Item title is required.');
      return;
    }

    setCreatingItemSectionId(section.id);
    setError(null);

    try {
      const createdItem = await createLaunchChecklistItem(token, {
        section: section.id,
        title,
        description: draft.description.trim(),
        priority: draft.priority,
        status: draft.status,
        owner: draft.owner.trim(),
        notes: draft.notes.trim(),
        display_order: section.items.length,
      });

      setChecklist((current) =>
        current ? appendChecklistItem(current, section.id, createdItem) : current
      );
      setItemDrafts((current) => ({
        ...current,
        [section.id]: getEmptyItemDraft(),
      }));
      setAddingItemSectionId(null);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create checklist item');
    } finally {
      setCreatingItemSectionId(null);
    }
  };

  const overall = useMemo(
    () => getOverallProgress(checklist?.sections ?? []),
    [checklist]
  );

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-[28px] border border-dark-700 bg-dark-800/95">
        <div className="flex items-center gap-3 text-silver-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading launch checklist...
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="rounded-[28px] border border-red-500/20 bg-red-500/10 p-6 text-red-100">
        Admin authentication is required to load the launch checklist.
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="rounded-[28px] border border-red-500/20 bg-dark-800/95 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Launch checklist unavailable</h2>
            <p className="mt-2 text-sm text-silver-500">
              {error || 'The checklist could not be loaded right now.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadChecklist()}
            className="inline-flex items-center gap-2 rounded-full border border-dark-600 bg-dark-900 px-4 py-2 text-sm font-medium text-white transition hover:border-accent-500"
          >
            <RefreshCcw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-cyan-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-2xl shadow-cyan-950/30">
        <div className="grid gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
              <ClipboardList className="h-4 w-4" />
              Launch Readiness
            </div>
            <div className="space-y-3">
              <h1 className="font-['Space_Grotesk'] text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {checklist.project_name} launch control room
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
                Sections and items are fully CMS-managed now, so the launch plan can be
                expanded, reordered, and maintained directly from the admin panel.
              </p>
            </div>
            <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Overall readiness
                  </p>
                  <p className="mt-1 text-3xl font-semibold text-white">
                    {overall.percentage}%
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void loadChecklist()}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddSectionForm((current) => !current);
                      setOpenSectionMenuId(null);
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:border-emerald-400"
                  >
                    <Plus className="h-4 w-4" />
                    Add Section
                  </button>
                  <button
                    type="button"
                    onClick={() => void syncSeedData()}
                    disabled={syncingSeed}
                    className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {syncingSeed ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCcw className="h-4 w-4" />
                    )}
                    Sync Seed Data
                  </button>
                </div>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 transition-all duration-300"
                  style={{ width: `${overall.percentage}%` }}
                />
              </div>
              <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Completed
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-white">
                    {overall.completed}/{overall.total}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Critical open
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-white">
                    {overall.criticalOpen}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Blocked
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-white">{overall.blocked}</p>
                </div>
              </div>
            </div>
            {showAddSectionForm && (
              <div className="rounded-3xl border border-emerald-500/20 bg-dark-900/80 p-4">
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-silver-500">
                      Section title
                    </label>
                    <input
                      type="text"
                      value={sectionDraft.title}
                      onChange={(event) =>
                        setSectionDraft((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-dark-600 bg-dark-800 px-4 py-3 text-sm text-white outline-none transition focus:border-accent-500"
                      placeholder="Example: Launch Week Support Operations"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-silver-500">
                      Description
                    </label>
                    <input
                      type="text"
                      value={sectionDraft.description}
                      onChange={(event) =>
                        setSectionDraft((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-dark-600 bg-dark-800 px-4 py-3 text-sm text-white outline-none transition focus:border-accent-500"
                      placeholder="Short summary shown under the section title"
                    />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCreateSection()}
                    disabled={creatingSection}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-dark-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {creatingSection ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Save Section
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddSectionForm(false);
                      setSectionDraft(getEmptySectionDraft());
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-dark-600 bg-dark-800 px-4 py-2 text-sm font-medium text-silver-200 transition hover:border-dark-500 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {error && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {[
              {
                label: 'Sections',
                value: checklist.sections.length,
                icon: Store,
                tone: 'text-cyan-200',
              },
              {
                label: 'COD and checkout items',
                value:
                  checklist.sections.find(
                    (section) => section.title === 'Checkout and Order Flow'
                  )?.items.length ?? 0,
                icon: Truck,
                tone: 'text-emerald-200',
              },
              {
                label: 'Sections saving',
                value: savingSectionIds.length,
                icon: Target,
                tone: 'text-amber-200',
              },
              {
                label: 'Items saving',
                value: savingItemIds.length,
                icon: AlertTriangle,
                tone: 'text-rose-200',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 backdrop-blur"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
                  </div>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 ${stat.tone}`}
                  >
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {checklist.sections.length === 0 ? (
        <section className="rounded-[28px] border border-dark-700 bg-dark-800/95 p-10 text-center shadow-lg shadow-black/20">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
            <ClipboardList className="h-7 w-7" />
          </div>
          <h2 className="mt-5 font-['Space_Grotesk'] text-2xl font-semibold text-white">
            No checklist sections yet
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-silver-500">
            Create your first section to start managing launch tasks directly from the admin UI.
          </p>
          <button
            type="button"
            onClick={() => setShowAddSectionForm(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-dark-900 transition hover:bg-emerald-400"
          >
            <Plus className="h-4 w-4" />
            Add First Section
          </button>
        </section>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {sortSections(checklist.sections).map((section, index, orderedSections) => {
            const progress = getSectionProgress(section);
            const SectionIcon = sectionIcons[section.title] ?? ClipboardList;
            const sectionSaving = savingSectionIds.includes(section.id);
            const itemDraft = itemDrafts[section.id] ?? getEmptyItemDraft();
            const showItemForm = addingItemSectionId === section.id;
            const isEditingSection = editingSectionId === section.id;

            return (
              <section
                key={section.id}
                className="rounded-[28px] border border-dark-700 bg-dark-800/95 p-5 shadow-lg shadow-black/20"
              >
                <div className="mb-5 border-b border-dark-700 pb-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
                          <SectionIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          {isEditingSection ? (
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={editingSectionDraft.title}
                                onChange={(event) =>
                                  setEditingSectionDraft((current) => ({
                                    ...current,
                                    title: event.target.value,
                                  }))
                                }
                                className="w-full rounded-2xl border border-dark-600 bg-dark-900 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-accent-500"
                              />
                              <textarea
                                rows={2}
                                value={editingSectionDraft.description}
                                onChange={(event) =>
                                  setEditingSectionDraft((current) => ({
                                    ...current,
                                    description: event.target.value,
                                  }))
                                }
                                className="w-full rounded-2xl border border-dark-600 bg-dark-900 px-4 py-3 text-sm leading-6 text-silver-200 outline-none transition focus:border-accent-500"
                                placeholder="Optional section description"
                              />
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => void handleSaveSection(section.id)}
                                  disabled={sectionSaving}
                                  className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-dark-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {sectionSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Check className="h-4 w-4" />
                                  )}
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelSectionEdit}
                                  className="inline-flex items-center gap-2 rounded-full border border-dark-600 bg-dark-900 px-4 py-2 text-sm font-medium text-silver-200 transition hover:border-dark-500 hover:text-white"
                                >
                                  <X className="h-4 w-4" />
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex flex-wrap items-center gap-2">
                                <h2 className="truncate font-['Space_Grotesk'] text-xl font-semibold text-white">
                                  {section.title}
                                </h2>
                                {sectionSaving && (
                                  <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Saving
                                  </span>
                                )}
                              </div>
                              {section.description ? (
                                <p className="mt-1 text-sm leading-6 text-silver-500">
                                  {section.description}
                                </p>
                              ) : (
                                <p className="mt-1 text-sm leading-6 text-silver-600">
                                  No section description yet.
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-start gap-2">
                      <button
                        type="button"
                        onClick={() => openAddItemForm(section.id)}
                        className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-100 transition hover:border-emerald-400"
                      >
                        <Plus className="h-4 w-4" />
                        Add Item
                      </button>
                      <button
                        type="button"
                        disabled={index === 0 || sectionSaving}
                        onClick={() => void handleMoveSection(section.id, 'up')}
                        className="inline-flex items-center gap-2 rounded-full border border-dark-600 bg-dark-900 px-3 py-2 text-sm font-medium text-silver-200 transition hover:border-dark-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronUp className="h-4 w-4" />
                        Up
                      </button>
                      <button
                        type="button"
                        disabled={index === orderedSections.length - 1 || sectionSaving}
                        onClick={() => void handleMoveSection(section.id, 'down')}
                        className="inline-flex items-center gap-2 rounded-full border border-dark-600 bg-dark-900 px-3 py-2 text-sm font-medium text-silver-200 transition hover:border-dark-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronDown className="h-4 w-4" />
                        Down
                      </button>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenSectionMenuId((current) =>
                              current === section.id ? null : section.id
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-full border border-dark-600 bg-dark-900 px-3 py-2 text-sm font-medium text-silver-200 transition hover:border-dark-500 hover:text-white"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          Actions
                        </button>
                        {openSectionMenuId === section.id && (
                          <div className="absolute right-0 top-full z-20 mt-2 min-w-[180px] rounded-2xl border border-dark-600 bg-dark-900 p-2 shadow-xl shadow-black/30">
                            <button
                              type="button"
                              onClick={() => beginSectionEdit(section)}
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-silver-200 transition hover:bg-dark-800 hover:text-white"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit Section
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteSection(section)}
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-200 transition hover:bg-red-500/10 hover:text-red-100"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Section
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 w-full rounded-2xl border border-white/10 bg-dark-900/80 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs uppercase tracking-[0.24em] text-silver-500">
                        Section progress
                      </span>
                      <span className="text-lg font-semibold text-white">
                        {progress.percentage}%
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-dark-700">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                    <p className="mt-3 text-sm text-silver-500">
                      {progress.completed} of {progress.total} items complete
                    </p>
                  </div>
                </div>
                {showItemForm && (
                  <div className="mb-4 rounded-3xl border border-emerald-500/20 bg-dark-900/80 p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-silver-500">
                          Item title
                        </label>
                        <input
                          type="text"
                          value={itemDraft.title}
                          onChange={(event) =>
                            handleItemDraftChange(section.id, 'title', event.target.value)
                          }
                          className="w-full rounded-2xl border border-dark-600 bg-dark-800 px-4 py-3 text-sm text-white outline-none transition focus:border-accent-500"
                          placeholder="Example: Confirm launch-day support rota"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-silver-500">
                          Owner
                        </label>
                        <input
                          type="text"
                          value={itemDraft.owner}
                          onChange={(event) =>
                            handleItemDraftChange(section.id, 'owner', event.target.value)
                          }
                          className="w-full rounded-2xl border border-dark-600 bg-dark-800 px-4 py-3 text-sm text-white outline-none transition focus:border-accent-500"
                          placeholder="Assign owner"
                        />
                      </div>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-[160px_160px_minmax(0,1fr)]">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-silver-500">
                          Priority
                        </label>
                        <select
                          value={itemDraft.priority}
                          onChange={(event) =>
                            handleItemDraftChange(
                              section.id,
                              'priority',
                              event.target.value as LaunchChecklistPriority
                            )
                          }
                          className="w-full rounded-2xl border border-dark-600 bg-dark-800 px-4 py-3 text-sm text-white outline-none transition focus:border-accent-500"
                        >
                          {priorityOptions.map((priority) => (
                            <option key={priority} value={priority}>
                              {priority}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-silver-500">
                          Status
                        </label>
                        <select
                          value={itemDraft.status}
                          onChange={(event) =>
                            handleItemDraftChange(
                              section.id,
                              'status',
                              event.target.value as LaunchChecklistStatus
                            )
                          }
                          className="w-full rounded-2xl border border-dark-600 bg-dark-800 px-4 py-3 text-sm text-white outline-none transition focus:border-accent-500"
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-silver-500">
                          Description
                        </label>
                        <input
                          type="text"
                          value={itemDraft.description}
                          onChange={(event) =>
                            handleItemDraftChange(section.id, 'description', event.target.value)
                          }
                          className="w-full rounded-2xl border border-dark-600 bg-dark-800 px-4 py-3 text-sm text-white outline-none transition focus:border-accent-500"
                          placeholder="Implementation detail or expected outcome"
                        />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-silver-500">
                        Notes
                      </label>
                      <textarea
                        rows={3}
                        value={itemDraft.notes}
                        onChange={(event) =>
                          handleItemDraftChange(section.id, 'notes', event.target.value)
                        }
                        className="w-full rounded-2xl border border-dark-600 bg-dark-800 px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-accent-500"
                        placeholder="Optional notes for the new item"
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleCreateItem(section)}
                        disabled={creatingItemSectionId === section.id}
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-dark-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {creatingItemSectionId === section.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Save Item
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddingItemSectionId(null);
                          setItemDrafts((current) => ({
                            ...current,
                            [section.id]: getEmptyItemDraft(),
                          }));
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-dark-600 bg-dark-800 px-4 py-2 text-sm font-medium text-silver-200 transition hover:border-dark-500 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {section.items.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-dark-600 bg-dark-900/40 p-6 text-center">
                      <p className="text-sm text-silver-500">
                        No items in this section yet. Add the first task to start tracking progress.
                      </p>
                    </div>
                  ) : (
                    sortItems(section.items).map((item) => {
                      const isSaving = savingItemIds.includes(item.id);

                      return (
                        <article
                          key={item.id}
                          className="rounded-3xl border border-dark-700 bg-dark-900/70 p-4 transition hover:border-dark-600"
                        >
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div className="flex items-start gap-3">
                                <label className="mt-1 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center">
                                  <input
                                    type="checkbox"
                                    checked={isComplete(item)}
                                    onChange={() => void handleToggle(item)}
                                    className="h-5 w-5 rounded border-dark-500 bg-dark-800 text-accent-500 focus:ring-accent-500/30"
                                  />
                                </label>
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-base font-semibold text-white">
                                      {item.title}
                                    </h3>
                                    {isSaving && (
                                      <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Saving
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-1 text-sm leading-6 text-silver-500">
                                    {item.description}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <span
                                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getPriorityClasses(item.priority)}`}
                                >
                                  {item.priority} Priority
                                </span>
                                <span
                                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(item.status)}`}
                                >
                                  {item.status}
                                </span>
                              </div>
                            </div>
                            <div className="grid gap-4 xl:grid-cols-[180px_180px_minmax(0,1fr)]">
                              <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-silver-500">
                                  Status
                                </label>
                                <select
                                  value={item.status}
                                  onChange={(event) =>
                                    void handleStatusChange(
                                      item,
                                      event.target.value as LaunchChecklistStatus
                                    )
                                  }
                                  className="w-full rounded-2xl border border-dark-600 bg-dark-800 px-4 py-3 text-sm text-white outline-none transition focus:border-accent-500"
                                >
                                  {statusOptions.map((status) => (
                                    <option key={status} value={status}>
                                      {status}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-silver-500">
                                  Priority
                                </label>
                                <select
                                  value={item.priority}
                                  onChange={(event) =>
                                    void handlePriorityChange(
                                      item,
                                      event.target.value as LaunchChecklistPriority
                                    )
                                  }
                                  className="w-full rounded-2xl border border-dark-600 bg-dark-800 px-4 py-3 text-sm text-white outline-none transition focus:border-accent-500"
                                >
                                  {priorityOptions.map((priority) => (
                                    <option key={priority} value={priority}>
                                      {priority}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-silver-500">
                                  Owner
                                </label>
                                <input
                                  type="text"
                                  value={item.owner}
                                  onChange={(event) =>
                                    updateDraftField(item.id, 'owner', event.target.value)
                                  }
                                  onBlur={() => void handleOwnerBlur(item)}
                                  className="w-full rounded-2xl border border-dark-600 bg-dark-800 px-4 py-3 text-sm text-white placeholder:text-silver-600 outline-none transition focus:border-accent-500"
                                  placeholder="Assign owner"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-silver-500">
                                Notes
                              </label>
                              <textarea
                                value={item.notes}
                                onChange={(event) =>
                                  updateDraftField(item.id, 'notes', event.target.value)
                                }
                                onBlur={() => void handleNotesBlur(item)}
                                rows={3}
                                className="w-full rounded-2xl border border-dark-600 bg-dark-800 px-4 py-3 text-sm leading-6 text-white placeholder:text-silver-600 outline-none transition focus:border-accent-500"
                                placeholder="Add implementation notes, blockers, or test evidence"
                              />
                            </div>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
