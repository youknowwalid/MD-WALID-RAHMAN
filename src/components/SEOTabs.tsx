import React from 'react';

export type SeoTabId = 'global' | 'og' | 'twitter' | 'linkedin' | 'facebook';

interface TabOption {
  id: SeoTabId;
  label: string;
}

const TAB_OPTIONS: TabOption[] = [
  { id: 'global', label: 'Global Index (Google)' },
  { id: 'og', label: 'OpenGraph (WhatsApp)' },
  { id: 'twitter', label: 'Twitter / X Preview' },
  { id: 'linkedin', label: 'LinkedIn Post Card' },
  { id: 'facebook', label: 'Facebook Feed Card' },
];

interface SEOTabsProps {
  activeTab: SeoTabId;
  onChange: (id: SeoTabId) => void;
}

export const SEOTabs: React.FC<SEOTabsProps> = ({ activeTab, onChange }) => {
  return (
    <div className="flex flex-wrap gap-2 p-1.5 bg-neutral-100 rounded-2xl w-full border border-neutral-200">
      {TAB_OPTIONS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex-1 min-w-[120px] px-5 py-3 rounded-xl font-sans text-xs sm:text-sm font-bold transition-all duration-300 shadow-sm ${
              isActive
                ? 'bg-[#064e3b] text-white'
                : 'bg-white hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900 border border-neutral-200/50'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
