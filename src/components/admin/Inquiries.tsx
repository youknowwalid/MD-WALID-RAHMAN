import React, { useState } from 'react';
import { Mail, Trash2 } from 'lucide-react';
import { ContactSubmission } from '../../types';

interface Props {
  items: ContactSubmission[];
  onMarkRead: (id: string, read: boolean) => void;
  onDelete: (id: string) => void;
}

export default function Inquiries({ items, onMarkRead, onDelete }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  if (items.length === 0) {
    return <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl"><p className="text-gray-400">No messages yet. Messages from the contact form appear here.</p></div>;
  }
  return (
    <ul className="grid gap-4">
      {items.map((m) => {
        const isOpen = open === m.id;
        return (
          <li key={m.id} className={`bg-bg-card rounded-2xl border p-5 sm:p-6 ${m.isRead ? 'border-white/5' : 'border-accent/40'}`}>
            <div className="flex items-start gap-4 flex-wrap">
              <button
                type="button"
                className="flex-1 min-w-0 text-left"
                aria-expanded={isOpen}
                onClick={() => { setOpen(isOpen ? null : m.id); if (!m.isRead) onMarkRead(m.id, true); }}
              >
                <span className="flex items-center gap-2 mb-1">
                  {!m.isRead && <span className="text-[10px] font-black uppercase bg-accent text-white rounded px-2 py-0.5">New</span>}
                  <span className="text-lg font-bold text-white truncate">{m.name}</span>
                  <span className="text-sm text-gray-400 truncate">({m.email})</span>
                </span>
                <span className="block text-accent text-sm font-bold truncate">{m.subject || 'No subject'}</span>
                <span className={`block text-gray-300 text-sm mt-1 ${isOpen ? 'whitespace-pre-wrap break-words' : 'truncate'}`}>{m.message}</span>
                <span className="block text-xs text-gray-500 mt-2">{new Date(m.createdAt).toLocaleString()}</span>
              </button>
              <div className="flex gap-2 shrink-0">
                <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + (m.subject || 'Your message'))}`} className="p-3 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 hover:text-white" aria-label={`Reply to ${m.name}`}><Mail className="w-5 h-5" aria-hidden="true" /></a>
                <button type="button" onClick={() => onMarkRead(m.id, !m.isRead)} className="px-3 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold text-gray-300">{m.isRead ? 'Mark unread' : 'Mark read'}</button>
                <button type="button" onClick={() => onDelete(m.id)} className="p-3 rounded-xl border border-white/10 hover:bg-red-400/10 text-gray-300 hover:text-red-300" aria-label={`Delete message from ${m.name}`}><Trash2 className="w-5 h-5" aria-hidden="true" /></button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
