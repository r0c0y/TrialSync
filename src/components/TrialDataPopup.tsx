'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, Sparkles, X, Check, Loader2 } from 'lucide-react';

const DEMO_TRIALS = [
  {
    name: 'UKPDS-RE-EVALUATE: Metformin Dosing Safety in Patients with Structural Renal Impairment (eGFR 30-60)',
    indication: "Type 2 Diabetes Mellitus with Chronic Kidney Disease (Stage 3a/3b)",
  },
  {
    name: 'RECOVERY-2 Extension: Dexamethasone Dosing Ceiling in Mechanically Ventilated COVID-19 Patients',
    indication: 'SARS-CoV-2 (COVID-19) — Severe ARDS',
  },
  {
    name: 'RECORD Trial Re-Analysis: Rosiglitazone Cardiovascular Risk in T2DM Patients with Congestive Heart Failure',
    indication: 'Type 2 Diabetes Mellitus with Cardiovascular Co-morbidity',
  },
  {
    name: 'KEYNOTE-716 Extension: Pembrolizumab Adjuvant Therapy in Resected Stage IIB/IIC Melanoma',
    indication: 'Metastatic Melanoma — Adjuvant Setting',
  },
  {
    name: 'CLARITY-AD 2: Lecanemab Dose Response in Early Alzheimer\'s Disease',
    indication: "Alzheimer's Disease — Mild Cognitive Impairment",
  },
  {
    name: 'PROTECT-CF: Long-term Safety and Efficacy of Trikafta (Elexacaftor/Tezacaftor/Ivacaftor) in Cystic Fibrosis',
    indication: 'Cystic Fibrosis (F508del Mutation)',
  },
];

interface TrialDataPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function TrialDataPopup({ isOpen, onClose, onComplete }: TrialDataPopupProps) {
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  const handlePopulate = async () => {
    setLoading(true);
    try {
      for (const trial of DEMO_TRIALS) {
        await fetch('/api/trials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trial.name, indication: trial.indication }),
        });
      }
      setComplete(true);
      setTimeout(() => {
        onComplete();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to populate trials:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg bg-background border border-border rounded-xl p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center border border-accent/20">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    Welcome to TrialSync!
                  </h2>
                  <p className="text-xs text-muted mt-0.5">Populate your workspace with demo trials</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-md hover:bg-surface text-muted hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-muted mb-5 leading-relaxed">
              Your workspace is ready! Would you like to populate it with <strong className="text-foreground">6 pre-loaded clinical trials</strong> 
              with full evidence briefs, protocol drafts, SAPs, and regulatory conflicts to explore the platform?
            </p>

            <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
              {DEMO_TRIALS.map((t, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-surface/30 border border-border/50">
                  <div className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[9px] font-mono font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground leading-snug line-clamp-1">{t.name}</p>
                    <p className="text-[10px] text-muted mt-0.5">{t.indication}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-muted hover:text-foreground transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handlePopulate}
                disabled={loading || complete}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-foreground hover:bg-accent text-background text-xs font-semibold transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Populating...
                  </>
                ) : complete ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Done!
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Populate Workspace
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
