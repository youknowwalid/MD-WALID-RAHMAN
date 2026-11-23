import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { HtmlReport, inspectHtml } from '../../../lib/discovery';
import { Card, GhostButton, Toaster } from './parts';

interface Row { path: string; status: number | 'error'; type: string; size: number; xrobots: string; first: string; report?: HtmlReport }
const FILES = ['/robots.txt', '/sitemap.xml', '/llms.txt', '/llms-full.txt'];

async function probe(path: string): Promise<Row> {
  try {
    const res = await fetch(path, { cache: 'no-store', redirect: 'follow' });
    const body = await res.text();
    const type = (res.headers.get('content-type') || '').split(';')[0];
    return {
      path, status: res.status, type, size: body.length, xrobots: res.headers.get('x-robots-tag') || '',
      first: type.includes('html') ? '' : body.split('\n').slice(0, 6).join('\n'),
      report: type.includes('html') ? inspectHtml(body) : undefined,
    };
  } catch {
    return { path, status: 'error', type: '', size: 0, xrobots: '', first: '' };
  }
}

/** Fetches your real public addresses right now and shows what a crawler sees. */
export default function LiveCheck({ onToast }: { onToast: Toaster }) {
  const [path, setPath] = useState('/');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [page, setPage] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const clean = '/' + path.trim().replace(/^https?:\/\/[^/]+/i, '').replace(/^\/+/, '');
      const [files, p] = await Promise.all([Promise.all(FILES.map(probe)), probe(clean)]);
      setRows(files); setPage(p);
    } catch { onToast('error', 'The check could not run. Try again.'); }
    finally { setBusy(false); }
  };

  const ok = (r: Row) => r.status === 200;
  return (
    <div className="space-y-6 max-w-4xl">
      <Card title="Live check" hint="Reads your published site the way a search engine does. Your latest changes can take up to five minutes to show here.">
        <div className="flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-[220px]">
            <label htmlFor="lc-path" className="block text-sm text-gray-300 mb-2">Page to inspect</label>
            <input id="lc-path" value={path} onChange={(e) => setPath(e.target.value)} placeholder="/" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-accent outline-none" />
          </div>
          <GhostButton onClick={run} disabled={busy}><span className="inline-flex items-center gap-2"><RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} aria-hidden="true" />{busy ? 'Checking…' : 'Check now'}</span></GhostButton>
        </div>
      </Card>
      {rows && (
        <Card title="Files for crawlers">
          <ul className="divide-y divide-white/5">
            {rows.map((r) => (
              <li key={r.path} className="py-3 space-y-2">
                <p className="flex items-center gap-3 flex-wrap text-sm"><span className={`font-black ${ok(r) ? 'text-emerald-300' : 'text-rose-300'}`}>{r.status}</span><a className="font-mono hover:underline" href={r.path} target="_blank" rel="noreferrer">{r.path}</a><span className="text-gray-400 text-xs">{r.type} · {r.size.toLocaleString()} characters{r.xrobots ? ` · ${r.xrobots}` : ''}</span></p>
                {r.first && <pre className="text-xs bg-black/40 rounded-xl p-3 overflow-x-auto text-gray-300">{r.first}</pre>}
              </li>
            ))}
          </ul>
        </Card>
      )}
      {page && (
        <Card title={`What a crawler reads on ${page.path}`}>
          <p className="text-sm"><span className={`font-black ${ok(page) ? 'text-emerald-300' : page.status === 404 ? 'text-amber-300' : 'text-rose-300'}`}>{page.status}</span> <span className="text-gray-400">{page.status === 404 ? 'Page not found (shown to search engines as missing)' : page.type}</span></p>
          {page.report && (
            <dl className="grid sm:grid-cols-[170px_1fr] gap-x-4 gap-y-2 text-sm">
              {([
                ['Title', page.report.title], ['Description', page.report.description], ['Canonical address', page.report.canonical],
                ['Robots', page.report.robots], ['Share image', page.report.ogImage], ['Main headings (h1)', String(page.report.h1Count)],
                ['Structured data', page.report.jsonLdBlocks ? `${page.report.jsonLdBlocks} block, ${page.report.jsonLdTypes.join(', ') || 'no types'}` : 'none'],
                ['Readable copy in HTML', page.report.hasPageCopy ? 'yes' : 'no'],
              ] as [string, string][]).map(([k, v]) => (
                <React.Fragment key={k}><dt className="text-gray-400">{k}</dt><dd className="break-words">{v || <span className="text-gray-500">(empty)</span>}</dd></React.Fragment>
              ))}
              {page.report.jsonLdErrors.map((e) => <React.Fragment key={e}><dt className="text-rose-300">Problem</dt><dd>{e}</dd></React.Fragment>)}
            </dl>
          )}
        </Card>
      )}
    </div>
  );
}
