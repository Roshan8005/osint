import React, { useState } from 'react';
import {
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Clock,
  Bookmark,
  BookmarkCheck,
  Search,
  Filter,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import type { UsernameResult, VerificationStatus } from '../types/osint';

interface UsernameScanViewProps {
  results: UsernameResult[];
  target: string;
  onBookmarkFinding: (finding: {
    category: 'username';
    summary: string;
    value: string;
    status: VerificationStatus;
    notes?: string;
  }) => void;
  bookmarkedValues: Set<string>;
}

export const UsernameScanView: React.FC<UsernameScanViewProps> = ({
  results,
  target,
  onBookmarkFinding,
  bookmarkedValues,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'not_found'>('verified');
  const [searchQuery, setSearchQuery] = useState('');

  const verifiedCount = results.filter((r) => r.status === 'PUBLIC_VERIFIED').length;
  const notFoundCount = results.filter((r) => r.status === 'NOT_FOUND').length;
  const rateLimitCount = results.filter((r) => r.status === 'RATE_LIMITED').length;

  const filtered = results.filter((item) => {
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    if (filterStatus === 'verified' && item.status !== 'PUBLIC_VERIFIED') return false;
    if (filterStatus === 'not_found' && item.status === 'PUBLIC_VERIFIED') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.platformName.toLowerCase().includes(q) ||
        item.profileUrl.toLowerCase().includes(q) ||
        (item.metadata?.claimedName && item.metadata.claimedName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
          <p className="text-xs font-mono text-slate-400 uppercase">Target Identity</p>
          <p className="text-lg font-bold font-mono text-cyan-300 mt-1 truncate">@{target || 'none'}</p>
          <span className="text-[10px] text-slate-500 font-mono">Maigret / Sherlock probe</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
          <p className="text-xs font-mono text-slate-400 uppercase">Verified Accounts</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-emerald-400">{verifiedCount}</span>
            <span className="text-xs text-emerald-500/80 font-mono font-medium">Found</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {results.length > 0 ? `${((verifiedCount / results.length) * 100).toFixed(1)}% hit rate` : '0%'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
          <p className="text-xs font-mono text-slate-400 uppercase">Scanned Platforms</p>
          <p className="text-2xl font-bold font-mono text-slate-200 mt-1">{results.length}</p>
          <span className="text-[10px] text-slate-500 font-mono">{notFoundCount} negative matches</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
          <p className="text-xs font-mono text-slate-400 uppercase">Protected / Rate Limits</p>
          <p className="text-2xl font-bold font-mono text-amber-400 mt-1">{rateLimitCount}</p>
          <span className="text-[10px] text-slate-500 font-mono">Anti-scraping defense active</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="developer">Developer</option>
              <option value="social">Social</option>
              <option value="community">Community</option>
              <option value="media">Media / Content</option>
              <option value="professional">Professional</option>
              <option value="gaming">Gaming</option>
            </select>
          </div>

          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setFilterStatus('verified')}
              className={`px-3 py-1 rounded-md transition ${
                filterStatus === 'verified'
                  ? 'bg-emerald-600/30 text-emerald-300 font-medium border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Verified Only ({verifiedCount})
            </button>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-md transition ${
                filterStatus === 'all'
                  ? 'bg-slate-800 text-white font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Scanned ({results.length})
            </button>
          </div>
        </div>

        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search platform or profile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Results Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
          <p className="text-sm text-slate-400 font-mono">No profile matches found with selected criteria.</p>
          <button
            onClick={() => {
              setFilterStatus('all');
              setFilterCategory('all');
              setSearchQuery('');
            }}
            className="mt-3 text-xs text-cyan-400 hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const isBookmarked = bookmarkedValues.has(item.profileUrl);
            const isVerified = item.status === 'PUBLIC_VERIFIED';

            return (
              <div
                key={item.platformId}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  isVerified
                    ? 'bg-slate-900/90 border-slate-700/80 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-950/20'
                    : 'bg-slate-950/60 border-slate-800/60 opacity-65'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
                        {item.platformName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                          {item.platformName}
                          {isVerified && (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-500 uppercase">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isVerified && (
                        <button
                          onClick={() =>
                            onBookmarkFinding({
                              category: 'username',
                              summary: `${item.platformName} Profile`,
                              value: item.profileUrl,
                              status: item.status,
                              notes: item.metadata?.bio || item.metadata?.claimedName,
                            })
                          }
                          className={`p-1.5 rounded transition ${
                            isBookmarked
                              ? 'text-cyan-400 bg-cyan-950/80 border border-cyan-800'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                          title={isBookmarked ? 'Bookmarked in Case' : 'Bookmark finding to case'}
                        >
                          {isBookmarked ? (
                            <BookmarkCheck className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <Bookmark className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Profile info / bio snippet */}
                  {isVerified && item.metadata && (
                    <div className="mt-2 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
                      {item.metadata.claimedName && (
                        <p className="font-medium text-cyan-300 truncate font-mono">
                          {item.metadata.claimedName}
                        </p>
                      )}
                      {item.metadata.bio && (
                        <p className="text-slate-400 text-[11px] line-clamp-2 italic">
                          "{item.metadata.bio}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* URL */}
                  <p className="mt-2 text-[11px] font-mono text-slate-400 truncate">
                    {item.profileUrl}
                  </p>
                </div>

                {/* Footer metadata */}
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <div className="flex items-center gap-2">
                    {isVerified ? (
                      <span className="text-emerald-400 font-medium">HTTP {item.httpStatus || 200}</span>
                    ) : item.status === 'RATE_LIMITED' ? (
                      <span className="text-amber-400">Rate Limited</span>
                    ) : (
                      <span className="text-slate-500">HTTP {item.httpStatus || 404}</span>
                    )}
                    {item.latencyMs && (
                      <span className="text-slate-600">&bull; {item.latencyMs}ms</span>
                    )}
                  </div>

                  {isVerified && (
                    <a
                      href={item.profileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition text-[11px]"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
