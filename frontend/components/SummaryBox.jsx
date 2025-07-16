import React from 'react';

// Icon for summary
function SummaryIcon() {
  return (
    <span className="inline-block align-middle mr-2 text-blue-500">
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3" fill="#2563eb" opacity="0.1"/><rect x="7" y="9" width="10" height="2" rx="1" fill="#2563eb"/><rect x="7" y="13" width="6" height="2" rx="1" fill="#2563eb"/></svg>
    </span>
  );
}

// Skeleton loader for summary
function SummarySkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-4 border border-gray-100 animate-pulse">
      <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
  );
}

// SummaryBox: Displays the extracted summary as multiple paragraphs in a modern card style
export default function SummaryBox({ summary, loading }) {
  if (loading) return <SummarySkeleton />;
  if (!summary) return null;
  // Split summary into paragraphs (double newline or newline)
  const paragraphs = summary.split(/\n\n|\n/).filter(p => p.trim().length > 0);
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100 animate-fade-in">
      <div className="flex items-center mb-3">
        <SummaryIcon />
        <h2 className="font-bold text-xl text-blue-800 tracking-tight">Summary</h2>
      </div>
      <div className="space-y-4 text-gray-800 leading-relaxed text-base">
        {paragraphs.map((p, i) => (
          <p key={i} className="transition-opacity duration-500 ease-in opacity-90">{p}</p>
        ))}
      </div>
    </div>
  );
}

// Add fade-in animation
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `@keyframes fade-in { from { opacity: 0; transform: translateY(16px);} to { opacity: 1; transform: none; } } .animate-fade-in { animation: fade-in 0.7s cubic-bezier(.4,0,.2,1) both; }`;
  document.head.appendChild(style);
} 