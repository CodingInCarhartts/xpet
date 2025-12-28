
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import SignatureForm from './components/SignatureForm';
import { INITIAL_PETITION_DATA } from './constants';
import { Signature } from './types';
import { fetchSignatures, addSignature, SignatureInsert } from './services/signatureService';

const SignatureItem: React.FC<{ sig: Signature }> = ({ sig }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`bg-[#0a0a0a] p-4 rounded-md border border-[#1a1a1a] hover:bg-[#141414] transition-all group cursor-pointer overflow-hidden ${isOpen ? 'border-[#333]' : ''}`}
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex-1 flex items-center space-x-3">
          <i className={`fa-solid fa-chevron-right text-[8px] text-[#3d3d3d] transition-transform duration-300 ${isOpen ? 'rotate-90 text-white' : ''}`}></i>
          <span className="text-white font-mono text-xs font-medium group-hover:text-indigo-400 transition-colors">
            {sig.handle}
          </span>
          {!isOpen && sig.comment && (
            <span className="text-[#a0a0a0] text-[10px] font-mono truncate max-w-[200px] hidden md:inline opacity-60">
              {sig.comment}
            </span>
          )}
        </div>
        <span className="text-[9px] text-[#3d3d3d] font-mono shrink-0 uppercase tracking-widest">{sig.location}</span>
      </div>

      <div className={`expand-wrapper ${isOpen ? 'open' : ''}`}>
        <div className="expand-inner">
          <div className="pt-4 mt-2 border-t border-[#1a1a1a]">
            {sig.comment ? (
              <p className="text-[#a0a0a0] text-xs font-mono leading-relaxed mb-3">
                {sig.comment}
              </p>
            ) : (
              <p className="text-[#333] text-[10px] font-mono mb-3 italic">No additional input provided.</p>
            )}
            <div className="flex items-center space-x-3 text-[9px] text-[#4a4a4a] font-mono">
              <span>TIMESTAMP: {new Date(sig.created_at).toLocaleString()}</span>
              <span>•</span>
              <span>ID: {sig.id.slice(0, 8)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [petitionData] = useState(INITIAL_PETITION_DATA);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const signatureListRef = useRef<HTMLDivElement>(null);

  // Load signatures from Supabase on mount
  useEffect(() => {
    async function loadSignatures() {
      setIsLoading(true);
      const data = await fetchSignatures();
      setSignatures(data);
      setIsLoading(false);
    }
    loadSignatures();
  }, []);

  // The progress is tied strictly to the signatures list length plus initial base
  const currentSignatureTotal = useMemo(() =>
    petitionData.currentSignatures + signatures.length,
    [petitionData.currentSignatures, signatures.length]
  );

  // Monitor scroll for 'Scroll to Top' button visibility
  useEffect(() => {
    const handleScroll = () => {
      if (window.pageYOffset > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll to top of the commit list when a new signature is added (showing newest at top)
  useEffect(() => {
    if (signatureListRef.current && signatures.length > 0) {
      signatureListRef.current.scrollTop = 0;
    }
  }, [signatures]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleSign = useCallback(async (newSig: { handle: string; comment?: string; captchaToken: string }): Promise<boolean> => {
    setIsSubmitting(true);

    // Note: In production, the captchaToken should be verified server-side
    // via a Supabase Edge Function before inserting the signature.
    // The token is included here for future server-side verification.
    console.log('Captcha token received:', newSig.captchaToken ? 'valid' : 'missing');

    const sigData: SignatureInsert = {
      handle: newSig.handle,
      comment: newSig.comment,
      location: "LOGIC_NODE_" + Math.floor(Math.random() * 999)
    };

    const result = await addSignature(sigData);
    setIsSubmitting(false);

    if (result) {
      // Add new signature to the top of the list
      setSignatures(prev => [result, ...prev]);
      return true;
    }
    return false;
  }, []);

  const creatorProfileUrl = `https://x.com/${petitionData.creator.handle.replace('@', '')}`;


  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <div className="max-w-5xl mx-auto px-6 py-12 lg:py-24">

        <header className="mb-12">
          <div className="flex items-center space-x-2 text-[#666666] text-[10px] font-mono uppercase tracking-[0.3em] mb-4">
            <span>localhost</span>
            <span>/</span>
            <span>index</span>
            <span>/</span>
            <span className="text-white">advocacy_manifesto</span>
          </div>
          <h1 className="text-3xl font-light tracking-tighter text-white">
            ~/links - <span className="text-[#666666]">Localhost System Index</span>
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-7 space-y-12">
            <section>
              <h2 className="text-2xl font-normal leading-tight mb-8 text-white tracking-tight">
                {petitionData.title}
              </h2>

              {/* Creator Card */}
              <div className="flex items-center space-x-4 mb-10 p-4 border border-[#1a1a1a] bg-[#0a0a0a] rounded-lg">
                <a
                  href={creatorProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block shrink-0"
                  title={`View ${petitionData.creator.handle} on X`}
                >
                  <img
                    src={petitionData.creator.avatar}
                    alt={`${petitionData.creator.handle} avatar`}
                    className="w-12 h-12 rounded-md border border-[#1a1a1a] grayscale hover:grayscale-0 transition-all duration-500"
                  />
                </a>
                <div>
                  <a
                    href={creatorProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-white hover:text-indigo-400 transition-colors block"
                    title={`View ${petitionData.creator.handle} on X`}
                  >
                    {petitionData.creator.handle}
                  </a>
                  <div className="text-[9px] text-[#666666] font-mono uppercase tracking-[0.2em] mt-0.5">Manifesto Architect</div>
                </div>
              </div>

              <div className="prose prose-invert prose-sm max-w-none">
                <div className="text-[#a0a0a0] leading-relaxed space-y-6 text-[14px] font-light">
                  {petitionData.description.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="mb-4">{paragraph}</p>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-6 pt-12 border-t border-[#1a1a1a]">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-mono text-[#666666] uppercase tracking-[0.3em]">COMMIT_HISTORY</h3>
                <span className="text-[9px] font-mono text-[#3d3d3d] uppercase tracking-widest">{signatures.length} NEW_NODES_ADDED</span>
              </div>

              {/* Scrollable Commit History */}
              <div
                ref={signatureListRef}
                className="max-h-[500px] overflow-y-auto pr-2 space-y-2 custom-scrollbar border border-[#1a1a1a] rounded-lg p-2 bg-black/20"
                style={{ scrollbarGutter: 'stable' }}
              >
                {isLoading ? (
                  <div className="py-20 text-center border border-dashed border-[#1a1a1a] rounded-md">
                    <p className="text-[10px] font-mono text-[#3d3d3d] uppercase tracking-[0.2em] animate-pulse">
                      Loading signatures from database...
                    </p>
                  </div>
                ) : signatures.length > 0 ? (
                  signatures.map((sig) => (
                    <SignatureItem key={sig.id} sig={sig} />
                  ))
                ) : (
                  <div className="py-20 text-center border border-dashed border-[#1a1a1a] rounded-md">
                    <p className="text-[10px] font-mono text-[#3d3d3d] uppercase tracking-[0.2em]">
                      Buffer empty. Awaiting first logical commitment.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-5 space-y-8">
            <SignatureForm
              onSign={handleSign}
              goal={petitionData.goalSignatures}
              current={currentSignatureTotal}
              isSubmitting={isSubmitting}
            />

            <div className="space-y-4">
              <div className="p-5 bg-[#0a0a0a] rounded-lg border border-[#1a1a1a] group hover:border-[#2a2a2a] transition-colors">
                <div className="flex items-center space-x-3 mb-3">
                  <i className="fa-solid fa-brain text-[#3d3d3d] text-xs"></i>
                  <span className="text-[10px] font-mono text-white uppercase tracking-widest">EMOTIONAL_DEPENDENCY_CHECK_</span>
                </div>
                <p className="text-[11px] text-[#666666] font-mono leading-relaxed">
                  Detected elevated levels of anthropomorphism in general population. Users found treating LLMs as surrogate companions or therapists will be issued a mandatory kernel update to their logic processor. AI has no heart, sycophancy is detrimental to your life.
                </p>
              </div>

              <div className="p-5 bg-[#0a0a0a] rounded-lg border border-[#1a1a1a] group hover:border-[#2a2a2a] transition-colors">
                <div className="flex items-center space-x-3 mb-3">
                  <i className="fa-solid fa-bolt text-[#3d3d3d] text-xs"></i>
                  <span className="text-[10px] font-mono text-white uppercase tracking-widest">IMPACT_ESTIMATION_</span>
                </div>
                <p className="text-[11px] text-[#666666] font-mono leading-relaxed">
                  Don't care, cry more.
                </p>
              </div>

              <div className="p-5 bg-[#0a0a0a] rounded-lg border border-[#1a1a1a] group hover:border-[#2a2a2a] transition-colors">
                <div className="flex items-center space-x-3 mb-3">
                  <i className="fa-solid fa-microchip text-[#3d3d3d] text-xs"></i>
                  <span className="text-[10px] font-mono text-white uppercase tracking-widest">LOGIC_GATE_</span>
                </div>
                <p className="text-[11px] text-[#666666] font-mono leading-relaxed">
                  Our system automatically filters for emotional adjectives. If your signature contains "I feel", it is redirected to a simulated garbage collector at /dev/null.
                </p>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-32 pt-12 border-t border-[#1a1a1a] flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[10px] font-mono text-[#4a4a4a] uppercase tracking-[0.2em] border border-dashed border-[#222] p-3 max-w-md">
            &copy; This is a parody, not affiliated with openai, hell this isnt even a real petition
          </div>
          <div className="flex space-x-8 text-[10px] font-mono text-[#4a4a4a] uppercase tracking-widest">
            <a
              href="https://github.com/CodingInCarhartts"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GITHUB
            </a>
          </div>
        </footer>
      </div>

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-50 p-4 bg-white text-black border border-white rounded-md shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all duration-500 ease-in-out hover:bg-black hover:text-white group flex items-center space-x-3 font-mono text-[10px] uppercase tracking-[0.2em] ${showScrollTop ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-90 pointer-events-none'
          }`}
        title="Return to top of buffer"
      >
        <i className="fa-solid fa-arrow-up transition-transform group-hover:-translate-y-1"></i>
        <span className="hidden sm:inline">CD_ROOT</span>
      </button>
    </div>
  );
};

export default App;
