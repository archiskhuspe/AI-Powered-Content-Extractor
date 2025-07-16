import React, { useState } from 'react';
import { Input } from "./ui/input";
import { Button } from "./ui/button";

// Icon for key points
function PointsIcon() {
  return (
    <span className="inline-block align-middle mr-2 text-blue-500">
      <svg width="22" height="22" fill="none" viewBox="0 0 22 22"><rect x="2" y="4" width="18" height="14" rx="3" fill="#2563eb" opacity="0.08"/><rect x="6" y="8" width="10" height="2" rx="1" fill="#2563eb"/><rect x="6" y="12" width="7" height="2" rx="1" fill="#2563eb"/></svg>
    </span>
  );
}

// Friendly empty state
function EmptyState() {
  return (
    <tr>
      <td colSpan={3} className="text-center text-gray-400 py-8">
        <span className="block text-2xl mb-2">📝</span>
        <span>No key points found.</span>
      </td>
    </tr>
  );
}

// Skeleton loader for key points table
function KeyPointsSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-4 animate-pulse mb-4 border border-gray-100">
      <div className="h-5 w-24 bg-gray-200 rounded mb-3" />
      <table className="w-full text-sm border-separate border-spacing-y-2">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left px-2 py-1 w-10">#</th>
            <th className="text-left px-2 py-1">Point</th>
            <th className="px-2 py-1 w-24">Actions</th>
          </tr>
        </thead>
        <tbody>
          {[1,2,3,4].map(i => (
            <tr key={i} className="">
              <td className="px-2 py-1 align-top"><div className="h-4 w-4 bg-gray-200 rounded" /></td>
              <td className="px-2 py-1 align-top"><div className="h-4 w-full bg-gray-200 rounded" /></td>
              <td className="px-2 py-1 align-top"><div className="h-4 w-16 bg-gray-200 rounded" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Pagination component (simple, shadcn/ui style)
function Pagination({ page, pageCount, onPageChange }) {
  if (pageCount <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-2 mt-4">
      <Button variant="outline" className="px-2 py-1" disabled={page === 1} onClick={() => onPageChange(page - 1)}>&lt;</Button>
      {[...Array(pageCount)].map((_, i) => (
        <button
          key={i}
          className={`w-8 h-8 rounded-md text-sm font-medium ${page === i + 1 ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-500'} transition-colors`}
          onClick={() => onPageChange(i + 1)}
          disabled={page === i + 1}
        >
          {i + 1}
        </button>
      ))}
      <Button variant="outline" className="px-2 py-1" disabled={page === pageCount} onClick={() => onPageChange(page + 1)}>&gt;</Button>
    </div>
  );
}

// KeyPointsTable: Notion-style table for key points (search, filter, edit, delete)
export default function KeyPointsTable({ keyPoints, setKeyPoints, loading, onKeyPointsChange }) {
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Convert keyPoints to row objects
  const rows = keyPoints.map((point, i) => ({ id: i + 1, text: point }));
  // Filtered rows
  const filtered = rows.filter(row => row.text.toLowerCase().includes(search.toLowerCase()));
  const pageCount = Math.ceil(filtered.length / pageSize);
  const pagedRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Edit handlers
  const startEdit = (id, text) => {
    setEditId(id);
    setEditText(text);
  };
  const saveEdit = (id) => {
    const newRows = rows.map(r => r.id === id ? { ...r, text: editText } : r);
    setKeyPoints(newRows.map(r => r.text));
    setEditId(null);
    setEditText('');
    if (onKeyPointsChange) onKeyPointsChange(newRows.map(r => r.text));
  };
  const cancelEdit = () => {
    setEditId(null);
    setEditText('');
  };
  const deleteRow = (id) => {
    setDeletingId(id);
    setTimeout(() => {
      const newRows = rows.filter(r => r.id !== id);
      setKeyPoints(newRows.map(r => r.text));
      setDeletingId(null);
      // After deletion, check if current page is empty
      const newFiltered = newRows.filter(row => row.text.toLowerCase().includes(search.toLowerCase()));
      const newPageCount = Math.ceil(newFiltered.length / pageSize);
      const newPagedRows = newFiltered.slice((page - 1) * pageSize, page * pageSize);
      // Only go to previous page if current page is now empty and not the first page
      if (newPagedRows.length === 0 && page > 1) setPage(page - 1);
      if (onKeyPointsChange) onKeyPointsChange(newRows.map(r => r.text));
    }, 350); // animate out
  };

  // Reset table if search changes (not keyPoints)
  React.useEffect(() => {
    setPage(1);
  }, [search]);

  React.useEffect(() => {
    if (onKeyPointsChange) onKeyPointsChange(keyPoints);
    // eslint-disable-next-line
  }, [keyPoints]);

  if (loading) return <KeyPointsSkeleton />;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 animate-fade-in">
      <div className="flex items-center mb-4">
        <PointsIcon />
        <h2 className="font-bold text-lg text-blue-800 tracking-tight flex-1">Key Points</h2>
        <Input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-40 text-sm ml-2"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-separate border-spacing-y-2">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-2 py-1 w-10">#</th>
              <th className="text-left px-2 py-1">Point</th>
              <th className="px-2 py-1 w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedRows.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-gray-400 py-8">
                  <span className="block text-2xl mb-2">📝</span>
                  <span>{search ? 'No results found.' : 'No key points found.'}</span>
                </td>
              </tr>
            )}
            {pagedRows.map((row, idx) => (
              <tr
                key={row.id}
                className={`transition-all duration-300 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md focus-within:ring-2 focus-within:ring-blue-200 ${deletingId === row.id ? 'opacity-0 translate-x-8 pointer-events-none' : 'opacity-100'}`}
                tabIndex={0}
              >
                <td className="px-2 py-2 align-top font-mono text-gray-400">{(page - 1) * pageSize + idx + 1}</td>
                <td className="px-2 py-2 align-top">
                  {editId === row.id ? (
                    <Input
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      autoFocus
                      className="w-full"
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEdit(row.id);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                    />
                  ) : (
                    <span className="block cursor-pointer" tabIndex={0} onDoubleClick={() => startEdit(row.id, row.text)}>
                      {search
                        ? highlightText(row.text, search)
                        : row.text}
                    </span>
                  )}
                </td>
                <td className="px-2 py-2 align-top flex gap-2">
                  {editId === row.id ? (
                    <>
                      <Button className="text-green-600" variant="outline" onClick={() => saveEdit(row.id)}>Save</Button>
                      <Button className="text-gray-500" variant="outline" onClick={cancelEdit}>Cancel</Button>
                    </>
                  ) : (
                    <>
                      <Button className="text-blue-600" variant="outline" onClick={() => startEdit(row.id, row.text)}>Edit</Button>
                      <Button className="text-red-600" variant="outline" onClick={() => deleteRow(row.id)}>Delete</Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
      </div>
    </div>
  );
}

// Highlight helper
function highlightText(text, search) {
  if (!search) return text;
  const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} className="bg-yellow-200 text-black px-0.5 rounded">{part}</mark>
      : part
  );
}

// Add fade-in animation
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `@keyframes fade-in { from { opacity: 0; transform: translateY(16px);} to { opacity: 1; transform: none; } } .animate-fade-in { animation: fade-in 0.7s cubic-bezier(.4,0,.2,1) both; }`;
  document.head.appendChild(style);
} 