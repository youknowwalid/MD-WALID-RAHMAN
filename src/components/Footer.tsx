
import React from 'react';
import { Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="py-20 px-6 bg-black relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
        <div>
          <div className="text-2xl font-black tracking-tighter mb-4">
            youknowwalid<span className="text-accent">.</span>
          </div>
          <p className="text-gray-500 max-w-sm">
            Crafting premium digital experiences through strategic brand evolution and innovative web solutions.
          </p>
        </div>
        <div className="flex gap-4">
          <a href="https://facebook.com/youknowwalid" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-accent hover:text-black transition-all hover:-translate-y-1">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
          <a href="https://linkedin.com/in/youknowwalid" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-accent hover:text-black transition-all hover:-translate-y-1">
            <Linkedin className="w-5 h-5" />
          </a>
          <a href="https://twitter.com/youknowwalid" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-accent hover:text-black transition-all hover:-translate-y-1">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm1.161 17.52h1.833L7.045 4.126H5.078z"/></svg>
          </a>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 text-center text-xs text-gray-600">
        youknowwalid &copy; 2025 All Rights Reserved by Walid Rahman Swapnil
      </div>
    </footer>
  );
}
