import React, { useState } from 'react';
import { Search, Loader2, Link, Globe2, ShieldAlert } from 'lucide-react';

export default function App() {
  const [url, setUrl] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError('');
    setHtmlContent('');

    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
      setUrl(formattedUrl);
    }

    try {
      let html = '';
      
      const proxies = [
        `https://api.allorigins.win/get?url=${encodeURIComponent(formattedUrl)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(formattedUrl)}`
      ];

      for (const proxyUrl of proxies) {
        try {
          const response = await fetch(proxyUrl);
          if (response.ok) {
            if (proxyUrl.includes('allorigins')) {
              const data = await response.json();
              if (data.contents) {
                html = data.contents;
                break;
              }
            } else {
              const text = await response.text();
              if (text) {
                html = text;
                break;
              }
            }
          }
        } catch (e) {
          // Continue to next proxy
          console.warn('Proxy failed:', proxyUrl);
        }
      }

      if (!html) {
        throw new Error('Failed to proxy the URL using available services.');
      }
      
      // Inject base tag so relative assets load
      const baseTag = `<base href="${formattedUrl}">`;
      if (html.toLowerCase().includes('<head>')) {
        html = html.replace(/<head>/i, `<head>\n    ${baseTag}`);
      } else {
        html = `${baseTag}\n${html}`;
      }
      
      setHtmlContent(html);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to the target website');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 px-6 mx-auto w-full py-4 shadow-sm z-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
          <Globe2 className="w-6 h-6 text-indigo-600" />
          Web Proxy Viewer
        </h1>
        <form onSubmit={fetchUrl} className="w-full md:max-w-2xl flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Link className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
              placeholder="Enter a website URL (e.g., example.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-70 min-w-[100px]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Fetch code'}
          </button>
        </form>
      </header>

      <main className="flex-1 flex flex-col container mx-auto p-4 md:p-6 h-[calc(100vh-80px)]">
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-900 px-6 py-12 rounded-2xl w-full max-w-2xl mx-auto mt-12 flex flex-col items-center justify-center text-center shadow-sm">
            <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-lg font-bold mb-2">Target Unavailable</h2>
            <p className="text-red-700 leading-relaxed font-medium">{error}</p>
          </div>
        ) : htmlContent ? (
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative flex flex-col h-full w-full">
            <iframe
              title="proxy-view"
              srcDoc={htmlContent}
              className="w-full h-full border-none flex-1 bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center max-w-lg mx-auto">
            <div className="bg-slate-100 p-4 rounded-full mb-6 relative">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">Access Content Safely</h2>
            <p className="text-slate-600 mb-8 leading-relaxed">
              This utility fetches raw HTML content securely via our proxy server and renders it isolated in an iframe, useful for inspecting blocked sites or running basic content previews.
            </p>
            
            <div className="text-xs bg-amber-50 text-amber-800 border-l-4 border-amber-500 p-4 rounded text-left shadow-sm">
              <strong className="block mb-1 text-sm">Note on Execution</strong>
              Simple websites and scripts will run. However, highly complex modern webapps that rely heavily on tight CORS restrictions or block cross-origin iframes may display broken formatting or failing network requests.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
