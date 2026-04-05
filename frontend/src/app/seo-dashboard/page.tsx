'use client';

import React, { useState, useMemo, useCallback } from 'react';
import seoData from '@/data/vorionmart-seo-checklist.json';
import type {
  SEOChecklistDocument,
  SEOChecklistItem,
  SEOChecklistCategory,
  SEOPriority,
  SEOStatus,
  SEOImpact,
  SEODifficulty,
  SEOKeyword,
  SEOBlogIdea,
  SEOQuickWin,
} from '@/types/seoChecklist';

/* ──────────────────────────────
   Constants & Colors
   ────────────────────────────── */

const PRIORITY_COLOR: Record<SEOPriority, string> = {
  Critical: '#ff4757',
  High: '#ff6b35',
  Medium: '#ffa502',
  Low: '#2ed573',
};

const STATUS_COLOR: Record<SEOStatus, string> = {
  'Not Started': '#636e72',
  'In Progress': '#0984e3',
  Blocked: '#d63031',
  Testing: '#6c5ce7',
  Completed: '#00b894',
};

const IMPACT_COLOR: Record<SEOImpact, string> = {
  Traffic: '#0984e3',
  Conversion: '#00b894',
  Indexing: '#6c5ce7',
  Technical: '#636e72',
  Brand: '#fdcb6e',
};

const DIFFICULTY_COLOR: Record<SEODifficulty, string> = {
  Easy: '#00b894',
  Medium: '#ffa502',
  Hard: '#ff4757',
};

type Tab = 'checklist' | 'keywords' | 'blog' | 'quickwins';

/* ──────────────────────────────
   COMPONENT
   ────────────────────────────── */
export default function SEODashboardPage() {
  const data = seoData as SEOChecklistDocument;

  /* ── State ── */
  const [activeTab, setActiveTab] = useState<Tab>('checklist');
  const [statusFilter, setStatusFilter] = useState<SEOStatus | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<SEOPriority | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [localStatuses, setLocalStatuses] = useState<Record<string, SEOStatus>>({});

  /* ── Helpers ── */
  const getStatus = useCallback(
    (item: SEOChecklistItem): SEOStatus => localStatuses[item.id] ?? item.status,
    [localStatuses],
  );

  const allItems = useMemo(
    () => data.categories.flatMap((c) => c.items),
    [data.categories],
  );

  const filteredCategories = useMemo(() => {
    return data.categories
      .filter((cat) => categoryFilter === 'All' || cat.id === categoryFilter)
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((item) => {
          const s = getStatus(item);
          if (statusFilter !== 'All' && s !== statusFilter) return false;
          if (priorityFilter !== 'All' && item.priority !== priorityFilter) return false;
          if (
            searchQuery &&
            !item.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !item.description.toLowerCase().includes(searchQuery.toLowerCase())
          )
            return false;
          return true;
        }),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [data.categories, statusFilter, priorityFilter, categoryFilter, searchQuery, getStatus]);

  const stats = useMemo(() => {
    const total = allItems.length;
    const completed = allItems.filter((i) => getStatus(i) === 'Completed').length;
    const inProgress = allItems.filter((i) => getStatus(i) === 'In Progress').length;
    const blocked = allItems.filter((i) => getStatus(i) === 'Blocked').length;
    const notStarted = allItems.filter((i) => getStatus(i) === 'Not Started').length;
    const critical = allItems.filter((i) => i.priority === 'Critical').length;
    return { total, completed, inProgress, blocked, notStarted, critical, pct: Math.round((completed / total) * 100) };
  }, [allItems, getStatus]);

  const toggleStatus = (id: string) => {
    setLocalStatuses((prev) => {
      const current = prev[id] ?? allItems.find((i) => i.id === id)!.status;
      const order: SEOStatus[] = ['Not Started', 'In Progress', 'Testing', 'Completed'];
      const idx = order.indexOf(current);
      const next = order[(idx + 1) % order.length];
      return { ...prev, [id]: next };
    });
  };

  /* ── Render Helpers ── */
  const Badge = ({
    label,
    color,
    small,
  }: {
    label: string;
    color: string;
    small?: boolean;
  }) => (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: small ? '2px 8px' : '4px 12px',
        borderRadius: 20,
        fontSize: small ? 10 : 11,
        fontWeight: 600,
        letterSpacing: 0.3,
        color: '#fff',
        background: `${color}22`,
        border: `1px solid ${color}44`,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, marginRight: 6 }} />
      {label}
    </span>
  );

  /* ──────────────────────────────
     TABS
     ────────────────────────────── */
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'checklist', label: 'SEO Checklist', icon: '📋' },
    { id: 'keywords', label: 'Keywords', icon: '🔑' },
    { id: 'blog', label: 'Blog Ideas', icon: '✍️' },
    { id: 'quickwins', label: 'Quick Wins', icon: '⚡' },
  ];

  return (
    <div style={styles.page}>
      {/* ── HEADER ── */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <div style={styles.headerBadge}>🚀 ANTIGRAVITY GROWTH ENGINE</div>
            <h1 style={styles.h1}>SEO Command Center</h1>
            <p style={styles.subtitle}>Vorionmart • {allItems.length} execution tasks • India-focused organic growth</p>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.progressRing}>
              <svg viewBox="0 0 100 100" width={100} height={100}>
                <circle cx="50" cy="50" r="42" fill="none" stroke="#1e272e33" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="url(#grad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${stats.pct * 2.64} 264`}
                  transform="rotate(-90 50 50)"
                  style={{ transition: 'stroke-dasharray .6s ease' }}
                />
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00b894" />
                    <stop offset="100%" stopColor="#0984e3" />
                  </linearGradient>
                </defs>
                <text x="50" y="48" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="700">{stats.pct}%</text>
                <text x="50" y="64" textAnchor="middle" fill="#636e72" fontSize="10">COMPLETE</text>
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* ── STATS ROW ── */}
      <div style={styles.statsRow}>
        {[
          { label: 'Total Tasks', value: stats.total, color: '#dfe6e9' },
          { label: 'Completed', value: stats.completed, color: '#00b894' },
          { label: 'In Progress', value: stats.inProgress, color: '#0984e3' },
          { label: 'Blocked', value: stats.blocked, color: '#d63031' },
          { label: 'Not Started', value: stats.notStarted, color: '#636e72' },
          { label: 'Critical', value: stats.critical, color: '#ff4757' },
        ].map((s) => (
          <div key={s.label} style={styles.statCard}>
            <div style={{ ...styles.statValue, color: s.color }}>{s.value}</div>
            <div style={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── TABS ── */}
      <nav style={styles.tabBar}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              ...styles.tabBtn,
              ...(activeTab === t.id ? styles.tabBtnActive : {}),
            }}
          >
            <span style={{ marginRight: 6 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {/* ── CHECKLIST TAB ── */}
      {activeTab === 'checklist' && (
        <>
          {/* Filters */}
          <div style={styles.filtersBar}>
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as never)} style={styles.select}>
              <option value="All">All Status</option>
              {Object.keys(STATUS_COLOR).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as never)} style={styles.select}>
              <option value="All">All Priority</option>
              {Object.keys(PRIORITY_COLOR).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={styles.select}>
              <option value="All">All Categories</option>
              {data.categories.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          {/* Categories */}
          <div style={styles.categoriesGrid}>
            {filteredCategories.map((cat) => {
              const isExpanded = expandedCategory === cat.id;
              const catCompleted = cat.items.filter((i) => getStatus(i) === 'Completed').length;
              const catPct = Math.round((catCompleted / cat.items.length) * 100);
              return (
                <div key={cat.id} style={styles.categoryCard}>
                  {/* Category header */}
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                    style={styles.categoryHeader}
                  >
                    <div style={styles.categoryHeaderLeft}>
                      <span style={{ fontSize: 24, marginRight: 12 }}>{cat.icon}</span>
                      <div>
                        <div style={styles.categoryTitle}>{cat.title}</div>
                        <div style={styles.categoryDesc}>{cat.description}</div>
                      </div>
                    </div>
                    <div style={styles.categoryHeaderRight}>
                      <div style={styles.miniProgress}>
                        <div style={{ ...styles.miniProgressFill, width: `${catPct}%` }} />
                      </div>
                      <span style={styles.catCount}>
                        {catCompleted}/{cat.items.length}
                      </span>
                      <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: '.2s', fontSize: 16 }}>▼</span>
                    </div>
                  </button>

                  {/* Items */}
                  {isExpanded && (
                    <div style={styles.itemsList}>
                      {cat.items.map((item) => {
                        const status = getStatus(item);
                        const isCompleted = status === 'Completed';
                        return (
                          <div
                            key={item.id}
                            style={{
                              ...styles.itemCard,
                              borderLeft: `3px solid ${PRIORITY_COLOR[item.priority]}`,
                              opacity: isCompleted ? 0.7 : 1,
                            }}
                          >
                            <div style={styles.itemTop}>
                              <button
                                onClick={() => toggleStatus(item.id)}
                                style={{
                                  ...styles.checkbox,
                                  background: isCompleted ? '#00b89433' : 'transparent',
                                  borderColor: isCompleted ? '#00b894' : '#636e72',
                                }}
                                title="Click to cycle status"
                              >
                                {isCompleted && <span style={{ color: '#00b894', fontSize: 14 }}>✓</span>}
                              </button>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    ...styles.itemTitle,
                                    textDecoration: isCompleted ? 'line-through' : 'none',
                                  }}
                                >
                                  {item.title}
                                </div>
                                <div style={styles.itemDesc}>{item.description}</div>
                                <div style={styles.itemBadges}>
                                  <Badge label={item.priority} color={PRIORITY_COLOR[item.priority]} small />
                                  <Badge label={status} color={STATUS_COLOR[status]} small />
                                  <Badge label={item.estimated_impact} color={IMPACT_COLOR[item.estimated_impact]} small />
                                  <Badge label={item.difficulty} color={DIFFICULTY_COLOR[item.difficulty]} small />
                                  {item.assignee && (
                                    <span style={styles.assignee}>👤 {item.assignee}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── KEYWORDS TAB ── */}
      {activeTab === 'keywords' && (
        <div style={styles.tableWrapper}>
          <h2 style={styles.sectionTitle}>🔑 20 High-Value Keywords — India Market</h2>
          <p style={styles.sectionSubtitle}>Curated for Vorionmart&apos;s COD-first ecommerce model targeting Tier 2/3 cities</p>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={{ ...styles.th, textAlign: 'left' }}>Keyword</th>
                  <th style={styles.th}>Search Volume</th>
                  <th style={styles.th}>Difficulty</th>
                  <th style={styles.th}>Intent</th>
                  <th style={styles.th}>Priority</th>
                </tr>
              </thead>
              <tbody>
                {(data.keywords as SEOKeyword[]).map((kw, i) => (
                  <tr key={i} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                    <td style={styles.td}>{i + 1}</td>
                    <td style={{ ...styles.td, textAlign: 'left', fontWeight: 600 }}>{kw.keyword}</td>
                    <td style={styles.td}>{kw.search_volume}</td>
                    <td style={styles.td}>
                      <Badge label={kw.difficulty} color={kw.difficulty === 'Low' ? '#00b894' : kw.difficulty === 'Medium' ? '#ffa502' : '#ff4757'} small />
                    </td>
                    <td style={styles.td}>
                      <Badge label={kw.intent} color={kw.intent.includes('Transactional') ? '#00b894' : kw.intent.includes('Informational') ? '#0984e3' : '#6c5ce7'} small />
                    </td>
                    <td style={styles.td}>
                      <Badge label={kw.priority} color={PRIORITY_COLOR[kw.priority]} small />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── BLOG IDEAS TAB ── */}
      {activeTab === 'blog' && (
        <div style={styles.tableWrapper}>
          <h2 style={styles.sectionTitle}>✍️ 15 Blog Ideas — Categorized Strategy</h2>
          <p style={styles.sectionSubtitle}>Content calendar for driving organic traffic through informational, transactional, and comparison posts</p>
          <div style={styles.blogGrid}>
            {(['Informational', 'Transactional', 'Comparison'] as const).map((type) => {
              const typeColor = type === 'Informational' ? '#0984e3' : type === 'Transactional' ? '#00b894' : '#6c5ce7';
              const blogs = (data.blogIdeas as SEOBlogIdea[]).filter((b) => b.type === type);
              return (
                <div key={type} style={styles.blogColumn}>
                  <div style={{ ...styles.blogColumnHeader, borderBottomColor: typeColor }}>
                    <span style={{ fontSize: 18 }}>
                      {type === 'Informational' ? '📘' : type === 'Transactional' ? '💰' : '⚖️'}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 15, color: typeColor }}>{type}</span>
                    <span style={{ fontSize: 12, color: '#636e72' }}>{blogs.length} posts</span>
                  </div>
                  {blogs.map((blog, i) => (
                    <div key={i} style={styles.blogCard}>
                      <div style={styles.blogTitle}>{blog.title}</div>
                      <div style={styles.blogMeta}>
                        <span>🎯 {blog.target_keyword}</span>
                        <span>📈 {blog.estimated_traffic}</span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── QUICK WINS TAB ── */}
      {activeTab === 'quickwins' && (
        <div style={styles.tableWrapper}>
          <h2 style={styles.sectionTitle}>⚡ 10 Quick Win SEO Tasks</h2>
          <p style={styles.sectionSubtitle}>High-impact tasks executable within 1–2 days for immediate SEO gains</p>
          <div style={styles.quickWinGrid}>
            {(data.quickWins as SEOQuickWin[]).map((qw) => (
              <div key={qw.id} style={styles.quickWinCard}>
                <div style={styles.qwNumber}>{qw.id}</div>
                <div style={{ flex: 1 }}>
                  <div style={styles.qwTask}>{qw.task}</div>
                  <div style={styles.qwImpact}>{qw.impact}</div>
                  <div style={styles.qwMeta}>
                    <Badge label={qw.category} color="#0984e3" small />
                    <span style={styles.qwTime}>⏱ {qw.time_estimate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer style={styles.footer}>
        <p>Antigravity SEO Engine v{data.version} • Generated {data.generatedAt} • {data.totalTasks} tasks</p>
      </footer>
    </div>
  );
}

/* ──────────────────────────────
   STYLES
   ────────────────────────────── */
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0f1a 0%, #111827 50%, #0d1321 100%)',
    color: '#dfe6e9',
    fontFamily: "'Inter', -apple-system, sans-serif",
    padding: 0,
  },
  header: {
    background: 'linear-gradient(135deg, rgba(9,132,227,.15) 0%, rgba(0,184,148,.1) 100%)',
    borderBottom: '1px solid rgba(255,255,255,.06)',
    padding: '32px 32px 24px',
  },
  headerContent: {
    maxWidth: 1400,
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: 24,
  },
  headerBadge: {
    display: 'inline-flex',
    padding: '4px 14px',
    borderRadius: 20,
    background: 'linear-gradient(135deg, #0984e322, #00b89422)',
    border: '1px solid #0984e344',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.5,
    color: '#74b9ff',
    marginBottom: 8,
  },
  h1: {
    fontSize: 32,
    fontWeight: 800,
    margin: 0,
    background: 'linear-gradient(135deg, #fff 0%, #74b9ff 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: 14,
    color: '#636e72',
    marginTop: 4,
  },
  headerRight: { display: 'flex', alignItems: 'center', gap: 16 },
  progressRing: {},

  /* Stats */
  statsRow: {
    maxWidth: 1400,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 12,
    padding: '20px 32px',
  },
  statCard: {
    background: 'rgba(255,255,255,.03)',
    border: '1px solid rgba(255,255,255,.06)',
    borderRadius: 12,
    padding: '16px 20px',
    textAlign: 'center' as const,
  },
  statValue: { fontSize: 28, fontWeight: 800 },
  statLabel: { fontSize: 11, color: '#636e72', marginTop: 4, textTransform: 'uppercase' as const, letterSpacing: 0.8 },

  /* Tabs */
  tabBar: {
    maxWidth: 1400,
    margin: '0 auto',
    display: 'flex',
    gap: 4,
    padding: '0 32px 0',
    borderBottom: '1px solid rgba(255,255,255,.06)',
  },
  tabBtn: {
    padding: '12px 20px',
    border: 'none',
    background: 'transparent',
    color: '#636e72',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    transition: '.2s',
  },
  tabBtnActive: {
    color: '#74b9ff',
    borderBottomColor: '#0984e3',
    background: 'rgba(9,132,227,.08)',
  },

  /* Filters */
  filtersBar: {
    maxWidth: 1400,
    margin: '0 auto',
    display: 'flex',
    gap: 12,
    padding: '20px 32px',
    flexWrap: 'wrap' as const,
  },
  searchInput: {
    flex: '1 1 240px',
    padding: '10px 16px',
    background: 'rgba(255,255,255,.05)',
    border: '1px solid rgba(255,255,255,.1)',
    borderRadius: 8,
    color: '#dfe6e9',
    fontSize: 14,
    outline: 'none',
  },
  select: {
    padding: '10px 14px',
    background: 'rgba(255,255,255,.05)',
    border: '1px solid rgba(255,255,255,.1)',
    borderRadius: 8,
    color: '#dfe6e9',
    fontSize: 13,
    outline: 'none',
    cursor: 'pointer',
  },

  /* Categories */
  categoriesGrid: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '0 32px 32px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  },
  categoryCard: {
    background: 'rgba(255,255,255,.025)',
    border: '1px solid rgba(255,255,255,.06)',
    borderRadius: 14,
    overflow: 'hidden',
  },
  categoryHeader: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 24px',
    background: 'transparent',
    border: 'none',
    color: '#dfe6e9',
    cursor: 'pointer',
    gap: 16,
    textAlign: 'left' as const,
  },
  categoryHeaderLeft: { display: 'flex', alignItems: 'flex-start', gap: 4, flex: 1, minWidth: 0 },
  categoryTitle: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  categoryDesc: { fontSize: 12, color: '#636e72', lineHeight: 1.5 },
  categoryHeaderRight: { display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 },
  miniProgress: {
    width: 80,
    height: 4,
    background: 'rgba(255,255,255,.06)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #00b894, #0984e3)',
    borderRadius: 4,
    transition: 'width .4s ease',
  },
  catCount: { fontSize: 12, color: '#636e72', fontWeight: 600 },

  /* Items */
  itemsList: {
    borderTop: '1px solid rgba(255,255,255,.04)',
    padding: '8px 16px 16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  itemCard: {
    background: 'rgba(255,255,255,.02)',
    borderRadius: 10,
    padding: '14px 16px',
    transition: '.2s',
  },
  itemTop: { display: 'flex', gap: 12, alignItems: 'flex-start' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    border: '2px solid #636e72',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    marginTop: 2,
    background: 'transparent',
    transition: '.2s',
  },
  itemTitle: { fontSize: 14, fontWeight: 600, lineHeight: 1.4, marginBottom: 4 },
  itemDesc: { fontSize: 12, color: '#636e72', lineHeight: 1.6, marginBottom: 8 },
  itemBadges: { display: 'flex', gap: 6, flexWrap: 'wrap' as const, alignItems: 'center' },
  assignee: { fontSize: 10, color: '#74b9ff', fontWeight: 500 },

  /* Table */
  tableWrapper: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '24px 32px 32px',
  },
  sectionTitle: { fontSize: 22, fontWeight: 800, marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: '#636e72', marginBottom: 20 },
  tableContainer: { overflowX: 'auto' as const },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: 13,
  },
  th: {
    padding: '12px 16px',
    textAlign: 'center' as const,
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    color: '#636e72',
    background: 'rgba(255,255,255,.03)',
    borderBottom: '1px solid rgba(255,255,255,.06)',
  },
  td: {
    padding: '12px 16px',
    textAlign: 'center' as const,
    borderBottom: '1px solid rgba(255,255,255,.03)',
  },
  trEven: { background: 'rgba(255,255,255,.015)' },
  trOdd: { background: 'transparent' },

  /* Blog */
  blogGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 20,
  },
  blogColumn: {
    background: 'rgba(255,255,255,.02)',
    border: '1px solid rgba(255,255,255,.06)',
    borderRadius: 14,
    overflow: 'hidden',
  },
  blogColumnHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 18px',
    borderBottom: '2px solid',
  },
  blogCard: {
    padding: '14px 18px',
    borderBottom: '1px solid rgba(255,255,255,.04)',
  },
  blogTitle: { fontSize: 14, fontWeight: 600, lineHeight: 1.5, marginBottom: 6 },
  blogMeta: {
    display: 'flex',
    gap: 16,
    fontSize: 11,
    color: '#636e72',
  },

  /* Quick Wins */
  quickWinGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  },
  quickWinCard: {
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
    background: 'rgba(255,255,255,.025)',
    border: '1px solid rgba(255,255,255,.06)',
    borderRadius: 12,
    padding: '18px 20px',
    transition: '.2s',
  },
  qwNumber: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #0984e3, #00b894)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 15,
    color: '#fff',
    flexShrink: 0,
  },
  qwTask: { fontSize: 14, fontWeight: 700, lineHeight: 1.5, marginBottom: 4 },
  qwImpact: { fontSize: 12, color: '#636e72', lineHeight: 1.5, marginBottom: 8 },
  qwMeta: { display: 'flex', gap: 12, alignItems: 'center' },
  qwTime: { fontSize: 11, color: '#74b9ff', fontWeight: 500 },

  /* Footer */
  footer: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '20px 32px',
    borderTop: '1px solid rgba(255,255,255,.06)',
    textAlign: 'center' as const,
    fontSize: 12,
    color: '#636e72',
  },
};
