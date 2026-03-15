'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw, Search, TerminalSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/apiConfig';

type LogLevel = 'ALL' | 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

interface LogsResponse {
    path: string;
    exists: boolean;
    updated_at: string | null;
    lines: string[];
}

const LEVELS: LogLevel[] = ['ALL', 'DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];
const LIMITS = [100, 250, 500, 1000];

function getLineClass(line: string) {
    if (line.includes(' CRITICAL ')) return 'text-fuchsia-300';
    if (line.includes(' ERROR ')) return 'text-red-300';
    if (line.includes(' WARNING ')) return 'text-amber-300';
    if (line.includes(' DEBUG ')) return 'text-sky-300';
    return 'text-emerald-300';
}

export default function SystemLogsTab() {
    const { token } = useAuth();
    const [logs, setLogs] = useState<LogsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [level, setLevel] = useState<LogLevel>('ALL');
    const [limit, setLimit] = useState(250);
    const [search, setSearch] = useState('');
    const [autoRefresh, setAutoRefresh] = useState(true);

    const query = useMemo(() => {
        const params = new URLSearchParams({
            level,
            limit: String(limit),
        });
        if (search.trim()) {
            params.set('search', search.trim());
        }
        return params.toString();
    }, [level, limit, search]);

    const fetchLogs = async (silent = false) => {
        if (!token) return;

        if (silent) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const res = await fetch(`${API_BASE_URL}/admin/system-logs/?${query}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                throw new Error('Failed to fetch system logs');
            }

            const data: LogsResponse = await res.json();
            setLogs(data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch system logs:', err);
            setError('Unable to load system logs right now.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [token, query]);

    useEffect(() => {
        if (!autoRefresh) return;

        const interval = window.setInterval(() => {
            fetchLogs(true);
        }, 5000);

        return () => window.clearInterval(interval);
    }, [autoRefresh, token, query]);

    const updatedLabel = logs?.updated_at
        ? new Date(logs.updated_at).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        })
        : 'Never';

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                    <h1 className="font-display text-2xl font-bold text-white flex items-center gap-3">
                        <TerminalSquare className="text-accent-500" size={28} />
                        System Logs
                    </h1>
                    <p className="text-silver-500 mt-1">
                        Live debugging output from the Django app and server logger.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 rounded-xl border border-dark-700 bg-dark-800 px-3 py-2 text-sm text-silver-400">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="h-4 w-4 rounded border-dark-600 bg-dark-900 text-accent-500 focus:ring-accent-500"
                        />
                        Auto refresh
                    </label>

                    <button
                        onClick={() => fetchLogs(true)}
                        className="inline-flex items-center gap-2 rounded-xl border border-accent-500/30 bg-accent-500/10 px-4 py-2 text-sm font-medium text-accent-400 transition-colors hover:bg-accent-500/20"
                    >
                        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.2fr_180px_160px_auto]">
                <label className="flex items-center gap-3 rounded-2xl border border-dark-700 bg-dark-800 px-4 py-3 text-silver-400">
                    <Search size={18} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search log text..."
                        className="w-full bg-transparent text-sm text-white placeholder:text-silver-600 focus:outline-none"
                    />
                </label>

                <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as LogLevel)}
                    className="rounded-2xl border border-dark-700 bg-dark-800 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
                >
                    {LEVELS.map((item) => (
                        <option key={item} value={item}>
                            {item}
                        </option>
                    ))}
                </select>

                <select
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="rounded-2xl border border-dark-700 bg-dark-800 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
                >
                    {LIMITS.map((item) => (
                        <option key={item} value={item}>
                            Last {item} lines
                        </option>
                    ))}
                </select>

                <div className="rounded-2xl border border-dark-700 bg-dark-800 px-4 py-3 text-sm text-silver-400">
                    Updated: <span className="text-white">{updatedLabel}</span>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-300">
                    <AlertTriangle size={18} />
                    <span>{error}</span>
                </div>
            )}

            <div className="overflow-hidden rounded-3xl border border-dark-700 bg-[#0a0c10] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
                <div className="flex items-center justify-between border-b border-dark-700 bg-[#11151c] px-4 py-3">
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-red-400" />
                        <span className="h-3 w-3 rounded-full bg-amber-400" />
                        <span className="h-3 w-3 rounded-full bg-emerald-400" />
                    </div>
                    <div className="truncate px-4 text-center font-mono text-xs text-silver-500">
                        {logs?.path || 'system.log'}
                    </div>
                    <div className="text-xs font-mono text-silver-600">
                        {logs?.lines.length || 0} lines
                    </div>
                </div>

                <div className="h-[68vh] min-h-[420px] overflow-auto bg-[#05070a] p-4 font-mono text-sm leading-6 custom-scrollbar">
                    {loading ? (
                        <div className="flex h-full items-center justify-center text-emerald-300">
                            <div className="animate-pulse">$ loading system logs...</div>
                        </div>
                    ) : logs?.exists === false ? (
                        <div className="text-silver-500">$ log file not found yet. New entries will appear here after the first server log write.</div>
                    ) : logs?.lines.length ? (
                        logs.lines.map((line, index) => (
                            <div key={`${index}-${line.slice(0, 24)}`} className="flex gap-4 whitespace-pre-wrap break-words">
                                <span className="w-10 shrink-0 text-right text-silver-700">
                                    {index + 1}
                                </span>
                                <span className={`${getLineClass(line)} flex-1`}>{line}</span>
                            </div>
                        ))
                    ) : (
                        <div className="text-silver-500">$ no log lines matched the current filters.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
