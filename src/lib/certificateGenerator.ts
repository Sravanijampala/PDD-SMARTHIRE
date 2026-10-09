/**
 * SmartHire Certificate & Badge Generator
 * Generates beautiful certificates and badges using HTML5 Canvas.
 * Downloads as PNG or PDF (via jsPDF).
 */

import type { InterviewResult } from './aiInterviewer';

export type BadgeLevel = 'Bronze' | 'Silver' | 'Gold' | 'Diamond' | 'Elite' | 'Master';

export interface CertificateData {
  candidateName: string;
  company: string;
  role: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  overallScore: number;
  completionDate: string;
  issueDate: string;
  certificateNumber: string;
  verificationId: string;
  result?: InterviewResult;
}

// ─────────────────────────────────────────────
//  Badge level determination
// ─────────────────────────────────────────────
export function getBadgeLevel(score: number): BadgeLevel {
  if (score >= 100) return 'Master';
  if (score >= 98) return 'Elite';
  if (score >= 95) return 'Diamond';
  if (score >= 90) return 'Gold';
  if (score >= 80) return 'Silver';
  return 'Bronze';
}

export const BADGE_COLORS: Record<BadgeLevel, { primary: string; secondary: string; glow: string; emoji: string }> = {
  Bronze:  { primary: '#CD7F32', secondary: '#8B5E1A', glow: '#CD7F3244', emoji: '🥉' },
  Silver:  { primary: '#C0C0C0', secondary: '#808080', glow: '#C0C0C044', emoji: '🥈' },
  Gold:    { primary: '#FFD700', secondary: '#B8860B', glow: '#FFD70044', emoji: '🥇' },
  Diamond: { primary: '#B9F2FF', secondary: '#00B4D8', glow: '#B9F2FF55', emoji: '💎' },
  Elite:   { primary: '#DA70D6', secondary: '#9B59B6', glow: '#DA70D655', emoji: '⭐' },
  Master:  { primary: '#FF4500', secondary: '#FF6347', glow: '#FF450055', emoji: '🏆' },
};

// ─────────────────────────────────────────────
//  ID & verification generators
// ─────────────────────────────────────────────
export function generateCertificateNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `SH-${timestamp}-${random}`;
}

export function generateVerificationId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) id += '-';
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// ─────────────────────────────────────────────
//  QR Code painter (simple matrix QR)
// ─────────────────────────────────────────────
function drawQRCode(ctx: CanvasRenderingContext2D, data: string, x: number, y: number, size: number): void {
  const moduleSize = Math.floor(size / 21);
  const padding = Math.floor((size - moduleSize * 21) / 2);

  // Simplified QR-like pattern for visual representation
  ctx.fillStyle = '#000000';
  const pattern = generateQRPattern(data);

  for (let row = 0; row < 21; row++) {
    for (let col = 0; col < 21; col++) {
      if (pattern[row][col]) {
        ctx.fillRect(
          x + padding + col * moduleSize,
          y + padding + row * moduleSize,
          moduleSize,
          moduleSize,
        );
      }
    }
  }
}

function generateQRPattern(data: string): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: 21 }, () => Array(21).fill(false));
  
  // Finder patterns (corners)
  const finderPositions = [[0, 0], [0, 14], [14, 0]];
  for (const [r, c] of finderPositions) {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        const border = i === 0 || i === 6 || j === 0 || j === 6;
        const center = i >= 2 && i <= 4 && j >= 2 && j <= 4;
        matrix[r + i][c + j] = border || center;
      }
    }
  }

  // Timing patterns
  for (let i = 8; i < 13; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Data modules (deterministic from string hash)
  let hash = 0;
  for (const char of data) { hash = (hash * 31 + char.charCodeAt(0)) & 0xFFFFFFFF; }
  
  for (let r = 9; r < 21; r++) {
    for (let c = 9; c < 21; c++) {
      if (!matrix[r][c]) {
        hash = (hash * 1664525 + 1013904223) & 0xFFFFFFFF;
        matrix[r][c] = (hash & 1) === 1;
      }
    }
  }

  return matrix;
}

// ─────────────────────────────────────────────
//  Main Certificate Canvas Generator
// ─────────────────────────────────────────────
export function generateCertificateCanvas(data: CertificateData): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 850;
  const ctx = canvas.getContext('2d')!;

  const badge = getBadgeLevel(data.overallScore);
  const badgeColors = BADGE_COLORS[badge];

  // ── Background gradient ──────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, 1200, 850);
  bgGrad.addColorStop(0, '#0A0F1E');
  bgGrad.addColorStop(0.5, '#0D1530');
  bgGrad.addColorStop(1, '#0A0F1E');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1200, 850);

  // ── Decorative circles ──────────────────────
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = badgeColors.primary;
  ctx.beginPath();
  ctx.arc(100, 100, 200, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(1100, 750, 220, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.04;
  ctx.fillStyle = '#00BFFF';
  ctx.beginPath();
  ctx.arc(600, 425, 350, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── Outer border ────────────────────────────
  const borderGrad = ctx.createLinearGradient(0, 0, 1200, 850);
  borderGrad.addColorStop(0, badgeColors.primary);
  borderGrad.addColorStop(0.5, '#00BFFF');
  borderGrad.addColorStop(1, badgeColors.secondary);
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, 1160, 810);

  // ── Inner border ────────────────────────────
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.strokeRect(35, 35, 1130, 780);

  // ── Header section ──────────────────────────
  // SmartHire logo area
  ctx.fillStyle = badgeColors.primary;
  ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('✦ SMARTHIRE AI PLATFORM ✦', 600, 72);

  // Certificate title
  const titleGrad = ctx.createLinearGradient(300, 0, 900, 0);
  titleGrad.addColorStop(0, '#00BFFF');
  titleGrad.addColorStop(0.5, '#FFFFFF');
  titleGrad.addColorStop(1, badgeColors.primary);
  ctx.fillStyle = titleGrad;
  ctx.font = 'bold 46px Georgia, serif';
  ctx.fillText('Certificate of Achievement', 600, 145);

  // Subtitle line
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '16px Arial';
  ctx.fillText('This is to certify that the following candidate has successfully completed', 600, 178);

  // ── Horizontal divider ──────────────────────
  const divGrad = ctx.createLinearGradient(60, 0, 1140, 0);
  divGrad.addColorStop(0, 'transparent');
  divGrad.addColorStop(0.3, badgeColors.primary);
  divGrad.addColorStop(0.7, '#00BFFF');
  divGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(60, 195);
  ctx.lineTo(1140, 195);
  ctx.stroke();

  // ── Candidate name ──────────────────────────
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 52px Georgia, serif';
  ctx.fillText(data.candidateName, 600, 265);

  // Underline for name
  const nameWidth = ctx.measureText(data.candidateName).width;
  ctx.strokeStyle = badgeColors.primary;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(600 - nameWidth / 2, 278);
  ctx.lineTo(600 + nameWidth / 2, 278);
  ctx.stroke();

  // ── Interview details ────────────────────────
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '18px Arial';
  ctx.fillText('has successfully completed an AI-powered interview for the position of', 600, 320);

  ctx.fillStyle = '#00BFFF';
  ctx.font = 'bold 30px Arial';
  ctx.fillText(data.role, 600, 360);

  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '18px Arial';
  ctx.fillText(`at ${data.company}`, 600, 392);

  // ── Score section ────────────────────────────
  // Score circle
  const scoreX = 600, scoreY = 490;
  const scoreRadius = 70;

  // Outer glow
  ctx.save();
  ctx.shadowColor = badgeColors.primary;
  ctx.shadowBlur = 30;
  const circleGrad = ctx.createRadialGradient(scoreX, scoreY, 10, scoreX, scoreY, scoreRadius);
  circleGrad.addColorStop(0, badgeColors.secondary + '88');
  circleGrad.addColorStop(1, badgeColors.primary + '22');
  ctx.fillStyle = circleGrad;
  ctx.beginPath();
  ctx.arc(scoreX, scoreY, scoreRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Score arc
  ctx.strokeStyle = badgeColors.primary;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(scoreX, scoreY, scoreRadius - 5, -Math.PI / 2, (-Math.PI / 2) + (Math.PI * 2 * data.overallScore / 100));
  ctx.stroke();

  // Score text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 38px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${data.overallScore}%`, scoreX, scoreY + 13);

  ctx.fillStyle = badgeColors.primary;
  ctx.font = 'bold 12px Arial';
  ctx.fillText('OVERALL SCORE', scoreX, scoreY + 35);

  // Badge display
  ctx.font = '50px Arial';
  ctx.fillText(badgeColors.emoji, 490, 510);
  ctx.font = '50px Arial';
  ctx.fillText(badgeColors.emoji, 710, 510);

  ctx.fillStyle = badgeColors.primary;
  ctx.font = 'bold 22px Arial';
  ctx.fillText(`${badge} Achievement`, 600, 590);

  // ── Difficulty & Date ────────────────────────
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '15px Arial';
  ctx.fillText(`Difficulty Level: ${data.difficulty}   •   Completed: ${data.completionDate}   •   Issued: ${data.issueDate}`, 600, 630);

  // ── Bottom section ───────────────────────────
  const divGrad2 = ctx.createLinearGradient(60, 0, 1140, 0);
  divGrad2.addColorStop(0, 'transparent');
  divGrad2.addColorStop(0.3, 'rgba(255,255,255,0.15)');
  divGrad2.addColorStop(0.7, 'rgba(255,255,255,0.15)');
  divGrad2.addColorStop(1, 'transparent');
  ctx.strokeStyle = divGrad2;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, 650);
  ctx.lineTo(1140, 650);
  ctx.stroke();

  // ── QR Code ──────────────────────────────────
  ctx.fillStyle = '#FFFFFF';
  const qrSize = 90;
  const qrX = 80, qrY = 670;
  ctx.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);
  drawQRCode(ctx, data.verificationId, qrX, qrY, qrSize);

  // QR label
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '10px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Scan to Verify', qrX + 2, qrY + qrSize + 18);

  // ── Certificate number & verification ────────
  ctx.textAlign = 'center';

  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = 'bold 13px Arial';
  ctx.fillText('CERTIFICATE NUMBER', 600, 675);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 18px Courier New, monospace';
  ctx.fillText(data.certificateNumber, 600, 698);

  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '12px Arial';
  ctx.fillText('VERIFICATION ID', 600, 722);
  ctx.fillStyle = badgeColors.primary;
  ctx.font = '13px Courier New, monospace';
  ctx.fillText(data.verificationId, 600, 742);

  // ── Signatures section ───────────────────────
  // AI Signature left
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '11px Arial';
  ctx.fillText('AI INTERVIEWER', 250, 775);
  ctx.fillStyle = badgeColors.primary;
  ctx.font = 'italic bold 20px Georgia, serif';
  ctx.fillText('Alex SmartHire', 230, 798);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(220, 806, 180, 1);

  // SmartHire seal center
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.beginPath();
  ctx.arc(600, 785, 45, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = badgeColors.primary;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(600, 785, 42, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = badgeColors.primary;
  ctx.font = 'bold 11px Arial';
  ctx.fillText('VERIFIED', 600, 782);
  ctx.font = '9px Arial';
  ctx.fillText('SMARTHIRE AI', 600, 796);

  // Platform signature right
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '11px Arial';
  ctx.fillText('PLATFORM DIRECTOR', 950, 775);
  ctx.fillStyle = badgeColors.primary;
  ctx.font = 'italic bold 20px Georgia, serif';
  ctx.fillText('SmartHire Platform', 970, 798);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(800, 806, 180, 1);

  // ── Footer ────────────────────────────────────
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.font = '11px Arial';
  ctx.fillText('verify.smarthire.ai | This certificate is digitally issued by SmartHire AI Platform', 600, 828);

  return canvas;
}

// ─────────────────────────────────────────────
//  Download helpers
// ─────────────────────────────────────────────
export function downloadCertificateAsPNG(canvas: HTMLCanvasElement, filename: string): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png', 1.0);
}

export async function downloadCertificateAsPDF(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  try {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [canvas.width, canvas.height],
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(filename);
  } catch (err) {
    console.error('PDF generation failed:', err);
    // Fallback: download as PNG
    downloadCertificateAsPNG(canvas, filename.replace('.pdf', '.png'));
  }
}

// ─────────────────────────────────────────────
//  Badge Generator (SVG string)
// ─────────────────────────────────────────────
export function generateBadgeSVG(level: BadgeLevel, score: number): string {
  const colors = BADGE_COLORS[level];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${colors.secondary}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${colors.primary}" stop-opacity="0.05"/>
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  
  <!-- Background -->
  <circle cx="100" cy="100" r="96" fill="url(#bg)" stroke="${colors.primary}" stroke-width="3" filter="url(#glow)"/>
  <circle cx="100" cy="100" r="85" fill="none" stroke="${colors.primary}" stroke-width="1" opacity="0.5"/>
  
  <!-- Score arc -->
  <circle cx="100" cy="100" r="70" fill="none" stroke="${colors.secondary}" stroke-width="8" opacity="0.3"/>
  <circle cx="100" cy="100" r="70" fill="none" stroke="${colors.primary}" stroke-width="8" 
    stroke-dasharray="${2 * Math.PI * 70 * score / 100} ${2 * Math.PI * 70}" 
    stroke-dashoffset="${2 * Math.PI * 70 * 0.25}"
    stroke-linecap="round" filter="url(#glow)"/>
  
  <!-- Badge emoji -->
  <text x="100" y="90" text-anchor="middle" font-size="36">${colors.emoji}</text>
  
  <!-- Score -->
  <text x="100" y="118" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white">${score}%</text>
  
  <!-- Level -->
  <text x="100" y="142" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="${colors.primary}">${level.toUpperCase()}</text>
  
  <!-- SmartHire text -->
  <text x="100" y="165" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="rgba(255,255,255,0.4)">SMARTHIRE AI</text>
</svg>`;
}

export function downloadBadgeSVG(level: BadgeLevel, score: number, filename: string): void {
  const svg = generateBadgeSVG(level, score);
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────
//  Full certificate generation from interview result
// ─────────────────────────────────────────────
export function generateFromResult(
  candidateName: string,
  result: InterviewResult,
  company: string,
  role: string,
  difficulty: 'Easy' | 'Medium' | 'Hard',
): { canvas: HTMLCanvasElement; data: CertificateData } {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const data: CertificateData = {
    candidateName,
    company,
    role,
    difficulty,
    overallScore: result.scores.overall,
    completionDate: dateStr,
    issueDate: dateStr,
    certificateNumber: generateCertificateNumber(),
    verificationId: generateVerificationId(),
    result,
  };

  const canvas = generateCertificateCanvas(data);
  return { canvas, data };
}
