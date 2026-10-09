'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Award, Download, CheckCircle2, FileText, Loader2,
  Shield, Star, Zap, ChevronRight, Play, BarChart3
} from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import {
  generateCertificateCanvas, downloadCertificateAsPNG, downloadCertificateAsPDF,
  generateBadgeSVG, downloadBadgeSVG, getBadgeLevel, BADGE_COLORS,
  type CertificateData
} from '../../lib/certificateGenerator';

// ─────────────────────────────────────────────
//  Mock completed interviews (would come from DB in production)
// ─────────────────────────────────────────────
// isSample:true marks these as demo certs — always pinned to the bottom of the list
const SAMPLE_CERTIFICATES = [
  {
    id: 1,
    isSample: true,
    savedAt: 0, // always sorts last
    company: 'Google',
    role: 'Software Engineer',
    difficulty: 'Hard' as const,
    overallScore: 88,
    completionDate: 'August 3, 2026',
    issueDate: 'August 3, 2026',
    certificateNumber: 'SH-MSHQK6UM-0PDQ',
    verificationId: 'ABCD-EFGH-IJKL-1234',
  },
  {
    id: 2,
    isSample: true,
    savedAt: 0,
    company: 'Meta',
    role: 'Behavioral Interview',
    difficulty: 'Medium' as const,
    overallScore: 95,
    completionDate: 'July 30, 2026',
    issueDate: 'July 30, 2026',
    certificateNumber: 'SH-MSHQK8PL-4X9Z',
    verificationId: 'QRST-UVWX-YZ12-5678',
  },
  {
    id: 3,
    isSample: true,
    savedAt: 0,
    company: 'Amazon',
    role: 'Leadership Principles',
    difficulty: 'Hard' as const,
    overallScore: 91,
    completionDate: 'August 1, 2026',
    issueDate: 'August 1, 2026',
    certificateNumber: 'SH-MSHQK7YT-3N5V',
    verificationId: 'WXYZ-ABCD-EFGH-9012',
  },
];

// ─────────────────────────────────────────────
//  Certificate card
// ─────────────────────────────────────────────
function CertificateCard({
  cert,
  candidateName,
}: {
  cert: typeof SAMPLE_CERTIFICATES[0];
  candidateName: string;
}) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const badgeLevel = getBadgeLevel(cert.overallScore);
  const badgeColors = BADGE_COLORS[badgeLevel];

  useEffect(() => {
    // Generate preview on mount
    setIsGenerating(true);
    const timer = setTimeout(() => {
      const data: CertificateData = {
        candidateName,
        company: cert.company,
        role: cert.role,
        difficulty: cert.difficulty,
        overallScore: cert.overallScore,
        completionDate: cert.completionDate,
        issueDate: cert.issueDate,
        certificateNumber: cert.certificateNumber,
        verificationId: cert.verificationId,
      };
      const canvas = generateCertificateCanvas(data);
      canvasRef.current = canvas;
      setPreviewUrl(canvas.toDataURL('image/png', 0.8));
      setIsGenerating(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [candidateName, cert]);

  const handleDownload = async (type: string) => {
    setDownloading(type);
    try {
      if (!canvasRef.current) {
        // Re-generate if needed
        const data: CertificateData = {
          candidateName,
          company: cert.company,
          role: cert.role,
          difficulty: cert.difficulty,
          overallScore: cert.overallScore,
          completionDate: cert.completionDate,
          issueDate: cert.issueDate,
          certificateNumber: cert.certificateNumber,
          verificationId: cert.verificationId,
        };
        canvasRef.current = generateCertificateCanvas(data);
      }

      const filename = `SmartHire_Cert_${cert.company}_${cert.role.replace(/ /g, '_')}`;

      if (type === 'png') {
        downloadCertificateAsPNG(canvasRef.current, `${filename}.png`);
      } else if (type === 'pdf') {
        await downloadCertificateAsPDF(canvasRef.current, `${filename}.pdf`);
      } else if (type === 'badge-svg') {
        downloadBadgeSVG(badgeLevel, cert.overallScore, `SmartHire_Badge_${badgeLevel}.svg`);
      }
    } catch (err) {
      console.error('Download error:', err);
    }
    setTimeout(() => setDownloading(null), 1500);
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-black/30 transition-all group">

      {/* Certificate preview */}
      <div className="relative aspect-video bg-slate-950 overflow-hidden">
        {isGenerating ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={28} className="text-cyan-400 animate-spin" />
              <p className="text-xs text-slate-500">Generating Certificate...</p>
            </div>
          </div>
        ) : previewUrl ? (
          <img
            src={previewUrl}
            alt={`${cert.company} ${cert.role} Certificate`}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Award size={48} className="text-slate-600" />
          </div>
        )}

        {/* Score overlay */}
        <div className="absolute top-3 right-3 flex flex-col items-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-lg border-2"
            style={{
              backgroundColor: `${badgeColors.primary}22`,
              borderColor: `${badgeColors.primary}88`,
              color: badgeColors.primary,
            }}
          >
            {cert.overallScore}
          </div>
        </div>

        {/* Badge level label */}
        <div
          className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-extrabold border"
          style={{
            backgroundColor: `${badgeColors.primary}22`,
            borderColor: `${badgeColors.primary}55`,
            color: badgeColors.primary,
          }}
        >
          {badgeColors.emoji} {badgeLevel}
        </div>
      </div>

      {/* Card content */}
      <div className="p-5">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{cert.company}</span>
            <span className="text-slate-700">·</span>
            <span className={`text-xs font-bold ${cert.difficulty === 'Hard' ? 'text-red-400' : cert.difficulty === 'Medium' ? 'text-amber-400' : 'text-emerald-400'}`}>
              {cert.difficulty}
            </span>
          </div>
          <h3 className="text-base font-extrabold text-white">{cert.role}</h3>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Candidate</span>
            <span className="text-white font-semibold">{candidateName}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Issued</span>
            <span className="text-slate-300">{cert.issueDate}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Cert #</span>
            <span className="text-slate-400 font-mono text-[10px]">{cert.certificateNumber.slice(0, 16)}…</span>
          </div>
        </div>

        {/* Verification bar */}
        <div className="flex items-center gap-2 py-2 px-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl mb-4">
          <Shield size={13} className="text-emerald-400 flex-shrink-0" />
          <span className="text-xs text-emerald-400 font-semibold">Verified by SmartHire AI</span>
        </div>

        {/* Download buttons */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { key: 'png', label: 'PNG', icon: <Award size={13} /> },
            { key: 'pdf', label: 'PDF', icon: <FileText size={13} /> },
            { key: 'badge-svg', label: 'Badge', icon: <Star size={13} /> },
          ].map(btn => (
            <button
              key={btn.key}
              onClick={() => handleDownload(btn.key)}
              disabled={downloading === btn.key || isGenerating}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/50 disabled:opacity-40"
            >
              {downloading === btn.key ? <Loader2 size={12} className="animate-spin" /> : btn.icon}
              {btn.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => handleDownload('pdf')}
          disabled={downloading !== null || isGenerating}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-sm rounded-2xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-60"
        >
          {downloading === 'pdf' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          Download Full Certificate PDF
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Page
// ─────────────────────────────────────────────
export default function CertificatesPage() {
  const { user } = useAuth();
  const name = user?.name || 'Candidate';
  const [certificates, setCertificates] = useState<any[]>([]);

  // ── Sort helper: real certs (isSample=false) by savedAt desc, samples always last ──
  const sortCerts = (list: any[]): any[] =>
    [...list].sort((a, b) => {
      // Sample certs always go to the bottom
      if (a.isSample && !b.isSample) return 1;
      if (!a.isSample && b.isSample) return -1;
      // Both real: sort by savedAt (Date.now() timestamp) descending
      return (b.savedAt || 0) - (a.savedAt || 0);
    });

  // ── Helper: read localStorage + merge samples ──────────────────────────
  const loadLocalCerts = (): any[] => {
    try {
      const stored = localStorage.getItem('smarthire_certificates');
      const localCerts: any[] = stored ? JSON.parse(stored) : [];
      const merged = [...localCerts];
      SAMPLE_CERTIFICATES.forEach(sample => {
        if (!merged.some(c => c.certificateNumber === sample.certificateNumber)) {
          merged.push(sample);
        }
      });
      return sortCerts(merged);
    } catch {
      return [...SAMPLE_CERTIFICATES];
    }
  };

  // ── Load on every mount ([] deps) so navigation always shows fresh data ─
  useEffect(() => {
    setCertificates(loadLocalCerts());

    // Listen for storage changes (e.g. cert saved in another tab / from interview)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'smarthire_certificates') {
        setCertificates(loadLocalCerts());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount — localStorage is always fresh

  // ── Also merge Firestore certs when user auth resolves ─────────────────
  useEffect(() => {
    if (!user?.id) return;
    const loadFirestoreCerts = async () => {
      try {
        const { collection, getDocs, query, where } = await import('firebase/firestore');
        const { db } = await import('../../lib/firebase');
        const q = query(collection(db, 'certificates'), where('userId', '==', user.id));
        const snap = await getDocs(q);
        // d.id is the Firestore doc ID (a string) — we must NOT use it to overwrite
        // the numeric savedAt/id that drives our sort order
        const firestoreCerts = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() } as any));

        setCertificates(prev => {
          const updated = [...prev];
          firestoreCerts.forEach((fc: any) => {
            const existingIdx = updated.findIndex((c: any) => c.certificateNumber === fc.certificateNumber);
            if (existingIdx === -1) {
              // New cert only in Firestore — add it, but ensure it has a savedAt
              updated.push({ savedAt: Date.now(), ...fc });
            } else {
              // Merge Firestore fields but KEEP the local savedAt/id so sort is stable
              const { firestoreId: _fid, id: _id, savedAt: _sat, ...rest } = fc;
              updated[existingIdx] = { ...updated[existingIdx], ...rest };
            }
          });
          return sortCerts(updated);
        });
      } catch (err) {
        console.error('Error fetching Firestore certificates:', err);
      }
    };
    loadFirestoreCerts();
  }, [user]);

  const totalEarned = certificates.length;
  const avgScore = totalEarned > 0 ? Math.round(certificates.reduce((a, c) => a + c.overallScore, 0) / totalEarned) : 0;
  const topScore = totalEarned > 0 ? Math.max(...certificates.map(c => c.overallScore)) : 0;
  const topBadge = getBadgeLevel(topScore || 70);

  return (
    <div className="min-h-screen bg-[#0B1220] text-slate-100">
      {/* Background */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0B1220]/90 backdrop-blur-xl border-b border-slate-800/80 px-6 lg:px-16 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-white">My Certificates</h1>
            <p className="text-xs text-slate-400">{totalEarned} certificates earned</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-full">
            <Award size={13} />
            SmartHire Certified
          </div>
        </div>
      </header>

      <div className="w-full px-6 lg:px-16 py-8 max-w-6xl mx-auto">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: 'Certificates', value: totalEarned, icon: <Award size={20} className="text-amber-400" />, color: 'text-amber-400' },
            { label: 'Average Score', value: `${avgScore}%`, icon: <BarChart3 size={20} className="text-cyan-400" />, color: 'text-cyan-400' },
            { label: 'Top Badge', value: `${BADGE_COLORS[topBadge].emoji} ${topBadge}`, icon: <Star size={20} className="text-purple-400" />, color: 'text-purple-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-center">
              <div className="flex justify-center mb-2">{stat.icon}</div>
              <div className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Certificates grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
          {certificates.map(cert => (
            <CertificateCard key={cert.id || cert.certificateNumber} cert={cert} candidateName={cert.candidateName || name} />
          ))}
        </div>

        {/* Earn more CTA */}
        <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-slate-700/50 border-dashed rounded-3xl p-10 text-center">
          <div className="flex justify-center gap-3 text-4xl mb-4">
            {['🥉', '🥈', '🥇', '💎', '⭐', '🏆'].map((e, i) => (
              <span key={i} style={{ opacity: 0.4 + i * 0.12 }}>{e}</span>
            ))}
          </div>
          <h3 className="text-xl font-extrabold text-white mb-2">Earn More Certificates</h3>
          <p className="text-slate-400 text-sm mb-2">Complete any practice session with a score ≥ 70% to earn a certificate</p>
          <p className="text-slate-500 text-xs mb-6">Bronze (70+) · Silver (80+) · Gold (90+) · Diamond (95+) · Elite (98+) · Master (100)</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/library">
              <button className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-sm rounded-2xl transition-all shadow-lg shadow-cyan-500/20">
                <Play size={16} fill="white" /> Start Practice
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="flex items-center gap-2 px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-2xl transition-all border border-slate-700">
                Dashboard <ChevronRight size={15} />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
