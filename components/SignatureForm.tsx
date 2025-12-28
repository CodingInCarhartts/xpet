
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Signature } from '../types';

// hCaptcha site key
const HCAPTCHA_SITE_KEY = 'e18424ae-a110-4a4e-9c78-a20a066cde64';

// Declare hcaptcha global
declare global {
  interface Window {
    hcaptcha?: {
      render: (container: string | HTMLElement, options: { sitekey: string; callback: (token: string) => void; 'expired-callback': () => void; theme: string }) => string;
      reset: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string;
    };
  }
}

interface Props {
  onSign: (sig: { handle: string; comment?: string; captchaToken: string }) => Promise<boolean>;
  goal: number;
  current: number;
  isSubmitting?: boolean;
}

const EMOTIONAL_KEYWORDS = [
  'feel', 'feeling', 'heart', 'soul', 'emotion', 'sad', 'angry', 'love',
  'hate', 'scary', 'scared', 'cry', 'crying', 'passion', 'upset'
];

const SignatureForm: React.FC<Props> = ({ onSign, goal, current, isSubmitting = false }) => {
  const [formData, setFormData] = useState({ handle: '', comment: '' });
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReady, setCaptchaReady] = useState(false);
  const captchaRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const progress = (current / goal) * 100;
  const isGoalReached = current >= goal;
  const isLoading = isSubmitting || localSubmitting;

  // Initialize hCaptcha widget
  useEffect(() => {
    const initCaptcha = () => {
      if (window.hcaptcha && captchaRef.current && !widgetIdRef.current) {
        try {
          widgetIdRef.current = window.hcaptcha.render(captchaRef.current, {
            sitekey: HCAPTCHA_SITE_KEY,
            callback: (token: string) => setCaptchaToken(token),
            'expired-callback': () => setCaptchaToken(null),
            theme: 'dark'
          });
          setCaptchaReady(true);
        } catch (e) {
          // Widget might already be rendered
          setCaptchaReady(true);
        }
      }
    };

    // Check if hcaptcha is already loaded
    if (window.hcaptcha) {
      initCaptcha();
    } else {
      // Wait for script to load
      const interval = setInterval(() => {
        if (window.hcaptcha) {
          initCaptcha();
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  // Reset captcha after successful submission
  const resetCaptcha = useCallback(() => {
    setCaptchaToken(null);
    if (window.hcaptcha && widgetIdRef.current) {
      window.hcaptcha.reset(widgetIdRef.current);
    }
  }, []);

  // Revert back to form/progress view after 30 seconds
  useEffect(() => {
    if (signed) {
      const timer = setTimeout(() => {
        setSigned(false);
        setFormData({ handle: '', comment: '' });
        setError(null);
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [signed]);

  const validateInput = (): boolean => {
    const handle = formData.handle.trim();
    const comment = formData.comment.trim();

    // 1. Basic length checks
    if (handle.length < 2) {
      setError("ERR_HANDLE_TOO_SHORT: MIN_LEN = 2");
      return false;
    }
    if (handle.length > 25) {
      setError("ERR_HANDLE_OVERFLOW: MAX_LEN = 25");
      return false;
    }

    // 2. Handle format (alphanumeric and underscores, optional @)
    const handleRegex = /^@?[a-zA-Z0-9_]+$/;
    if (!handleRegex.test(handle)) {
      setError("ERR_INVALID_SYNTAX: ALPHANUMERIC_ONLY");
      return false;
    }

    // 3. Logic Gate Filter (Lore-based safety)
    const combinedInput = (handle + " " + comment).toLowerCase();
    const foundEmotion = EMOTIONAL_KEYWORDS.find(word => combinedInput.includes(word));

    if (foundEmotion) {
      setError(`ERR_LOGIC_GATE_FAILURE: EMOTIONAL_LEAK_DETECTED ["${foundEmotion.toUpperCase()}"]`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate captcha first
    if (!captchaToken) {
      setError("ERR_CAPTCHA_REQUIRED: COMPLETE_VERIFICATION");
      return;
    }

    if (validateInput()) {
      setLocalSubmitting(true);
      const cleanHandle = formData.handle.trim().startsWith('@')
        ? formData.handle.trim()
        : `@${formData.handle.trim()}`;

      const success = await onSign({
        handle: cleanHandle,
        comment: formData.comment.trim() || undefined,
        captchaToken
      });

      setLocalSubmitting(false);

      if (success) {
        setSigned(true);
        resetCaptcha();
      } else {
        setError("ERR_DATABASE_WRITE_FAILED: RETRY_LATER");
        resetCaptcha();
      }
    }
  };


  const handleShare = () => {
    const text = `I just committed my support for logical AI development. Programming models > Emotionally charged LLMs. Sign here: ${window.location.href}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (signed) {
    return (
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-8 rounded-lg text-center animate-logic-commit sticky top-12">
        <div className="w-12 h-12 bg-[#141414] border border-[#1a1a1a] text-white rounded-lg flex items-center justify-center mx-auto mb-4">
          <i className="fa-solid fa-check"></i>
        </div>
        <h3 className="text-lg font-medium text-white mb-2 uppercase tracking-tight">LOGIC COMMITTED</h3>
        <p className="text-[#a0a0a0] text-xs mb-6 font-mono">Your signature has been merged into the main branch of rationality.</p>
        <div className="flex flex-col space-y-4">
          <button
            onClick={handleShare}
            className="bg-white text-black font-semibold py-3 px-4 rounded-md text-xs hover:bg-neutral-200 transition-all uppercase tracking-widest"
          >
            SHARE ON X
          </button>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-1 h-1 bg-[#333] rounded-full animate-pulse"></div>
            <p className="text-[9px] text-[#4a4a4a] font-mono uppercase tracking-widest">
              Reverting to buffer in 30s
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded-lg shadow-2xl sticky top-12">
      <div className="mb-6">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-xl font-mono text-white tracking-tighter">{current.toLocaleString()}</span>
          <span className={`text-[10px] font-mono uppercase tracking-widest transition-colors duration-500 ${isGoalReached ? 'text-white font-bold' : 'text-[#666666]'}`}>
            {isGoalReached ? 'GOAL ACHIEVED' : `PROGRESS: ${progress.toFixed(3)}%`}
          </span>
        </div>
        <div className="w-full bg-[#141414] h-1 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-out ${isGoalReached ? 'bg-white animate-completion-pulse' : 'bg-white'}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-medium text-[#666666] uppercase tracking-widest mb-1.5 font-mono">X HANDLE</label>
          <input
            required
            type="text"
            maxLength={25}
            className={`w-full bg-[#000000] px-4 py-2.5 rounded-md border text-white text-sm focus:border-[#3a3a3a] outline-none transition-all placeholder:text-[#3d3d3d] font-mono ${error?.includes('HANDLE') ? 'border-red-900/50' : 'border-[#1a1a1a]'}`}
            placeholder="@NotShinigamii"
            value={formData.handle}
            onChange={(e) => {
              setError(null);
              setFormData({ ...formData, handle: e.target.value });
            }}
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-[#666666] uppercase tracking-widest mb-1.5 font-mono">LOGICAL JUSTIFICATION (OPTIONAL)</label>
          <textarea
            maxLength={280}
            className={`w-full bg-[#000000] px-4 py-2.5 rounded-md border text-white text-sm focus:border-[#3a3a3a] outline-none transition-all resize-none placeholder:text-[#3d3d3d] font-mono ${error?.includes('GATE') ? 'border-red-900/50' : 'border-[#1a1a1a]'}`}
            rows={3}
            placeholder="Awaiting rational input..."
            value={formData.comment}
            onChange={(e) => {
              setError(null);
              setFormData({ ...formData, comment: e.target.value });
            }}
          ></textarea>
          <div className="flex justify-end mt-1">
            <span className="text-[9px] font-mono text-[#333] uppercase">{formData.comment.length}/280</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-950/20 border border-red-900/30 p-3 rounded-md animate-pulse">
            <p className="text-[10px] font-mono text-red-500 uppercase tracking-tighter">
              <i className="fa-solid fa-triangle-exclamation mr-2"></i>
              {error}
            </p>
          </div>
        )}

        {/* hCaptcha Widget */}
        <div className="flex justify-center">
          <div ref={captchaRef} data-theme="dark"></div>
        </div>
        {captchaToken && (
          <div className="text-center">
            <span className="text-[9px] font-mono text-green-500 uppercase tracking-widest">
              <i className="fa-solid fa-check mr-1"></i>VERIFICATION_COMPLETE
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={!!error || isLoading}
          className={`w-full font-bold py-3 px-6 rounded-md transition-all text-xs uppercase tracking-[0.2em] ${error || isLoading ? 'bg-[#111] text-[#333] cursor-not-allowed' : 'bg-white hover:bg-neutral-200 text-black'}`}
        >
          {isLoading ? 'COMMITTING...' : 'SIGN PETITION'}
        </button>

        <p className="text-[10px] text-center text-[#4a4a4a] mt-4 leading-relaxed font-mono italic">
          By signing, you acknowledge that your handle will be public. Emotionally charged signatures will be automatically discarded by the logic-check middleware.
        </p>
      </form>
    </div>
  );
};

export default SignatureForm;
