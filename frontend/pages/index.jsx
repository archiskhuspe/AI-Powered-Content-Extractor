import React, { useState } from 'react';
import UrlInput from '../components/UrlInput';
import SummaryBox from '../components/SummaryBox';
import KeyPointsTable from '../components/KeyPointsTable';

// shadcn/ui Card component (manual, JS version)
function Card({ className = '', children }) {
  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-100 ${className}`}>{children}</div>
  );
}

// Document icon (like Summary)
function DocIcon() {
  return (
    <span className="inline-block mr-2 align-middle text-blue-500">
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3" fill="#2563eb" opacity="0.1"/><rect x="7" y="9" width="10" height="2" rx="1" fill="#2563eb"/><rect x="7" y="13" width="6" height="2" rx="1" fill="#2563eb"/></svg>
    </span>
  );
}

function HeaderCard() {
  return (
    <Card className="max-w-xl mx-auto mt-10 mb-8 p-8 flex flex-col items-center text-center">
      <div className="flex items-center mb-2">
        <DocIcon />
        <h1 className="text-3xl font-extrabold tracking-tight text-blue-800">AI-powered Content Extractor</h1>
      </div>
      <p className="text-gray-600 text-base max-w-xl">Extract summaries and key points from any public article URL.</p>
    </Card>
  );
}

function UrlInputCard({ onSubmit, loading }) {
  return (
    <Card className="max-w-xl mx-auto mb-8 p-6">
      <UrlInput onSubmit={onSubmit} loading={loading} />
    </Card>
  );
}

// Export as PDF button
function ExportPDFButton({ summary, keyPoints }) {
  const handleExport = async () => {
    const jsPDF = (await import('jspdf')).jsPDF;
    const doc = new jsPDF();
    let y = 15;
    doc.setFontSize(18);
    doc.text('AI-powered Content Extractor', 10, y);
    y += 10;
    doc.setFontSize(14);
    doc.text('Summary:', 10, y);
    y += 8;
    doc.setFontSize(11);
    summary.split(/\n\n|\n/).forEach(p => {
      doc.text(doc.splitTextToSize(p, 180), 10, y);
      y += 8 + Math.ceil(p.length / 90) * 5;
    });
    y += 4;
    doc.setFontSize(14);
    doc.text('Key Points:', 10, y);
    y += 8;
    doc.setFontSize(11);
    keyPoints.forEach((pt, i) => {
      doc.text(`${i + 1}. ${pt}`, 12, y);
      y += 7 + Math.ceil(pt.length / 90) * 4;
      if (y > 270) { doc.addPage(); y = 15; }
    });
    doc.save('extracted-summary.pdf');
  };
  return (
    <button
      className="mb-4 ml-auto flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition-colors text-sm font-medium"
      onClick={handleExport}
      title="Export summary and key points as PDF"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
      Export as PDF
    </button>
  );
}

// Simple Toast component
function Toast({ message, type, onClose }) {
  if (!message) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded shadow-lg text-white text-sm transition-all duration-300 ${type === 'error' ? 'bg-red-500' : 'bg-blue-600'}`}
      role="alert">
      {message}
      <button className="ml-4 text-white/80 hover:text-white" onClick={onClose}>&times;</button>
    </div>
  );
}

// Main page: manages state and layout
export default function Home() {
  const [summary, setSummary] = useState('');
  const [keyPoints, setKeyPoints] = useState([]);
  const [currentKeyPoints, setCurrentKeyPoints] = useState([]); // for export
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const handleSubmit = async (url) => {
    setLoading(true);
    setError('');
    setSummary('');
    setKeyPoints([]);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to extract content.');
        setToast({ message: data.error || 'Failed to extract content.', type: 'error' });
      } else {
        setSummary(data.summary);
        setKeyPoints(data.keyPoints);
        setCurrentKeyPoints(data.keyPoints);
        setToast({ message: 'Extraction complete!', type: 'info' });
      }
    } catch (err) {
      setError('Network error.');
      setToast({ message: 'Network error.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Auto-dismiss toast
  React.useEffect(() => {
    if (toast.message) {
      const t = setTimeout(() => setToast({ message: '', type: 'info' }), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-100 flex flex-col">
      <HeaderCard />
      <main className="flex-1 w-full">
        <UrlInputCard onSubmit={handleSubmit} loading={loading} />
        <div className="max-w-xl mx-auto flex flex-col gap-6 p-4">
          {(summary || keyPoints.length > 0) && (
            <ExportPDFButton summary={summary} keyPoints={currentKeyPoints.length ? currentKeyPoints : keyPoints} />
          )}
          {(loading || summary) && (
            <Card>
              <SummaryBox summary={summary} loading={loading} />
            </Card>
          )}
          {(loading || keyPoints.length > 0) && (
            <Card>
              <KeyPointsTable keyPoints={keyPoints} setKeyPoints={setKeyPoints} loading={loading} onKeyPointsChange={setCurrentKeyPoints} />
            </Card>
          )}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3 mb-4">
              <svg className="h-5 w-5 mt-0.5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 20 20" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14v2m0-8v2m-7 4a8 8 0 1116 0 8 8 0 01-16 0z" /></svg>
              <span>{error}</span>
            </div>
          )}
        </div>
      </main>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
      <footer className="py-6 text-center text-xs text-gray-400 border-t mt-8">
        Made by: Archis Khuspe
        <div className="text-gray-400 text-xs mt-1">
          Built with: React, Next.js, Spring Boot, Tailwind CSS, shadcn/ui, jsPDF
        </div>
      </footer>
    </div>
  );
} 