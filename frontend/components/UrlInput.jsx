import React, { useState } from 'react';
import { Input } from "./ui/input";
import { Button } from "./ui/button";

// UrlInput: Input box for entering a public URL and submitting it
export default function UrlInput({ onSubmit, loading }) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
      <Input
        type="url"
        placeholder="Enter a public URL (https://...)"
        value={url}
        onChange={e => setUrl(e.target.value)}
        required
        disabled={loading}
        className="flex-1"
      />
      <Button type="submit" disabled={loading}>
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle className="opacity-25" cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
              <path className="opacity-75" fill="currentColor" d="M15 8a7 7 0 11-7-7v2a5 5 0 100 10V8a7 7 0 017-7z" />
            </svg>
            Loading...
          </span>
        ) : 'Extract'}
      </Button>
    </form>
  );
} 