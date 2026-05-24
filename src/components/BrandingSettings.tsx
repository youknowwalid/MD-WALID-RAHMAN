import React, { useState, useEffect } from 'react';
import { useSiteConfig } from '../context/SiteConfigContext';
import { 
  ArrowLeft, 
  Save, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Palette, 
  Loader2,
  Sparkles
} from 'lucide-react';

interface Toast {
  type: 'success' | 'error' | 'info';
  message: string;
}

export const BrandingSettings: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { config, updateConfig } = useSiteConfig();

  // Local state for color customizer only
  const [primaryColor, setPrimaryColor] = useState('#f45901');
  const [secondaryColor, setSecondaryColor] = useState('#00c6ff');

  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Sync state when database loads the central config record
  useEffect(() => {
    if (config) {
      setPrimaryColor(config.primaryColor || '#f45901');
      setSecondaryColor(config.secondaryColor || '#00c6ff');
      setIsDirty(false);
    }
  }, [config]);

  // Handle toast timeout
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Handle color change and update document style in real-time
  const handleColorChange = (type: 'primary' | 'secondary', value: string) => {
    if (type === 'primary') {
      setPrimaryColor(value);
      document.documentElement.style.setProperty('--color-accent', value);
    } else {
      setSecondaryColor(value);
      document.documentElement.style.setProperty('--color-accent-secondary', value);
    }
    setIsDirty(true);
  };

  // Save colors atomically to Firestore
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await updateConfig({
        primaryColor,
        secondaryColor
      });
      
      setIsDirty(false);
      setToast({
        type: 'success',
        message: 'Brand theme colors successfully loaded and synchronized globally across the frontend!',
      });
    } catch (err: any) {
      console.error(err);
      setToast({
        type: 'error',
        message: err.message || 'Fatal error overwriting brand colors in Firestore.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset colors to brand baseline values
  const handleResetColors = () => {
    setPrimaryColor('#f45901');
    setSecondaryColor('#00c6ff');
    setIsDirty(true);
    
    // Preview dynamically in real-time
    document.documentElement.style.setProperty('--color-accent', '#f45901');
    document.documentElement.style.setProperty('--color-accent-secondary', '#00c6ff');
    
    setToast({
      type: 'info',
      message: 'Color palette reset to original brand presets. Click "Save & Publish" to update globally.'
    });
  };

  // Discard local unsaved draft changes
  const handleDiscard = () => {
    if (window.confirm("Are you sure you want to discard your unsaved modifications?")) {
      if (config) {
        setPrimaryColor(config.primaryColor || '#f45901');
        setSecondaryColor(config.secondaryColor || '#00c6ff');
        
        // Restore document element overrides
        document.documentElement.style.setProperty('--color-accent', config.primaryColor || '#f45901');
        document.documentElement.style.setProperty('--color-accent-secondary', config.secondaryColor || '#00c6ff');
        
        setIsDirty(false);
      }
    }
  };

  return (
    <div className="space-y-8 font-sans bg-neutral-950/20 p-4 md:p-8 rounded-3xl border border-white/5 transition-all duration-300">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-bold transition-all duration-300 animate-slide-in ${
          toast.type === 'success' ? 'bg-emerald-950 text-emerald-200 border-emerald-800' :
          toast.type === 'error' ? 'bg-rose-950 text-rose-200 border-rose-800' :
          'bg-blue-950 text-blue-200 border-blue-800'
        }`}>
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
          {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400" />}
          {toast.type === 'info' && <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Editor Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white cursor-pointer shadow-sm transition-all"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none mb-1">
              Branding Settings Editor
            </h1>
            <p className="text-[10px] font-extrabold tracking-widest text-[#00c6ff]/85 uppercase">
              CMS / FRAMEWORK CONTROLS / STATIC AND LIVE UPDATES
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          {isDirty && (
            <button
              type="button"
              onClick={handleDiscard}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-gray-300 hover:bg-white/5 transition shadow-sm"
            >
              Discard Changes
            </button>
          )}
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 text-xs transition duration-200 shadow-md ${
              isDirty 
                ? 'bg-accent text-white hover:opacity-90' 
                : 'bg-white/10 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save & Publish Branding
          </button>
        </div>
      </div>

      {/* Unsaved changes alert banner */}
      {isDirty && (
        <div className="bg-amber-500/10 rounded-2xl border border-amber-500/20 px-5 py-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between text-amber-200 max-w-7xl">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <span className="text-xs font-medium">
              You have unsaved color scheme modifications. Protect your work by synchronizing.
            </span>
          </div>
          <button 
            type="button" 
            onClick={() => handleSave()}
            className="text-xs font-black underline hover:no-underline text-accent self-end sm:self-auto shrink-0"
          >
            Publish Now
          </button>
        </div>
      )}

      {/* Core Edit Panel */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-7xl">
        
        {/* Main section: Accent & Theme Colors (Width expanded to span more of the grid beautifully) */}
        <div className="lg:col-span-8 bg-bg-card border border-white/5 rounded-3xl p-6 md:p-8 space-y-8">
          
          <div>
            <h2 className="text-xl font-black text-white mb-2 flex items-center gap-2.5">
              <Sparkles className="text-accent w-5 h-5" /> Global Accent & Theme Settings
            </h2>
            <p className="text-xs text-text-muted">Centrally customize and dynamically preview brand palette overrides. Changes apply instantly across all accents, buttons, glowing backgrounds, and states!</p>
          </div>

          <div className="space-y-6">
            
            {/* Colors System (As highlighted in the reference screenshot) */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Primary Color Picker */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col justify-between gap-3">
                  <div>
                    <span className="block text-[11px] font-black uppercase text-slate-400 tracking-wider">FCCA Sovereign Color</span>
                    <span className="text-[10px] text-text-muted">Primary accent buttons, solid glow elements</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-full h-11 rounded-lg border border-white/10 shadow flex items-center justify-center font-mono text-xs text-white bg-cover font-bold relative overflow-hidden transition-all duration-300 hover:scale-[1.02]" 
                      style={{ backgroundColor: primaryColor }}
                    >
                      <span className="bg-black/50 px-2.5 py-1 rounded text-[10px] tracking-tight text-white border border-white/5">
                        {primaryColor}
                      </span>
                      <input 
                        type="color" 
                        value={primaryColor} 
                        onChange={(e) => handleColorChange('primary', e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                        aria-label="FCCA Sovereign Color"
                      />
                    </div>
                  </div>
                </div>

                {/* Secondary Color Picker */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col justify-between gap-3">
                  <div>
                    <span className="block text-[11px] font-black uppercase text-slate-400 tracking-wider">Tactical Accent Color</span>
                    <span className="text-[10px] text-text-muted">Secondary glow elements, hover borders</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-full h-11 rounded-lg border border-white/10 shadow flex items-center justify-center font-mono text-xs text-white bg-cover font-bold relative overflow-hidden transition-all duration-300 hover:scale-[1.02]" 
                      style={{ backgroundColor: secondaryColor }}
                    >
                      <span className="bg-black/50 px-2.5 py-1 rounded text-[10px] tracking-tight text-white border border-white/5">
                        {secondaryColor}
                      </span>
                      <input 
                        type="color" 
                        value={secondaryColor} 
                        onChange={(e) => handleColorChange('secondary', e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                        aria-label="Tactical Accent Color"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Reset trigger */}
              <div className="flex justify-between items-center bg-white/5 px-4.5 py-3 rounded-xl border border-white/5 text-xs text-text-muted">
                <span>Wish to discard palette adjustments?</span>
                <button
                  type="button"
                  onClick={handleResetColors}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-extrabold text-xs px-4 py-2 rounded-lg transition-all"
                >
                  Reset Colors
                </button>
              </div>

            </div>

          </div>
        </div>

        {/* Right Section: Informational State Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-neutral-900 border border-white/5 rounded-3xl p-6 space-y-3.5 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition duration-500">
              <Palette className="w-24 h-24 text-white" />
            </div>
            
            <div className="flex items-center gap-2.5 text-accent">
              <CheckCircle className="w-5 h-5" />
              <h4 className="text-xs font-black tracking-widest uppercase font-sans">
                LIVE INTERACTIVE SYNC
              </h4>
            </div>
            
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Applying changes updates CSS variables <code>--color-accent</code> and <code>--color-accent-secondary</code> globally. Buttons, glows, hover borders, and links will paint instantly across the home section, resume, and footer without code rebuilding or full page reloads!
            </p>
          </div>
        </div>

      </form>
    </div>
  );
};
