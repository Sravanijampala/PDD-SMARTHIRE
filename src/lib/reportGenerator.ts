/**
 * SmartHire Report Generator
 * Generates comprehensive interview performance reports as PDF.
 */

import type { InterviewResult, EvaluationScore } from './aiInterviewer';

export interface ReportData {
  candidateName: string;
  company: string;
  role: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  result: InterviewResult;
  certificateNumber?: string;
}

// ─────────────────────────────────────────────
//  Color utilities
// ─────────────────────────────────────────────
function scoreColor(score: number): string {
  if (score >= 90) return '#00E676';
  if (score >= 80) return '#00BCD4';
  if (score >= 70) return '#FFD700';
  if (score >= 60) return '#FF9800';
  return '#F44336';
}

function getPerformanceLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Average';
  if (score >= 60) return 'Below Average';
  return 'Needs Improvement';
}

// ─────────────────────────────────────────────
//  Radar chart on canvas
// ─────────────────────────────────────────────
function drawRadarChart(ctx: CanvasRenderingContext2D, scores: EvaluationScore, cx: number, cy: number, r: number): void {
  const dimensions = [
    { label: 'Technical', value: scores.technical },
    { label: 'Communication', value: scores.communication },
    { label: 'Confidence', value: scores.confidence },
    { label: 'Grammar', value: scores.grammar },
    { label: 'Vocabulary', value: scores.vocabulary },
    { label: 'Problem Solving', value: scores.problemSolving },
    { label: 'Leadership', value: scores.leadership },
    { label: 'Behavioral', value: scores.behavioral },
  ];

  const n = dimensions.length;
  const angleStep = (2 * Math.PI) / n;

  // Draw grid rings
  for (let ring = 1; ring <= 5; ring++) {
    const ringR = (r * ring) / 5;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = cx + ringR * Math.cos(angle);
      const y = cy + ringR * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // Draw axes
  dimensions.forEach((_, i) => {
    const angle = i * angleStep - Math.PI / 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    ctx.stroke();
  });

  // Draw data polygon
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, 'rgba(0, 191, 255, 0.35)');
  grad.addColorStop(1, 'rgba(0, 191, 255, 0.05)');
  ctx.fillStyle = grad;
  ctx.strokeStyle = '#00BFFF';
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  dimensions.forEach((dim, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const val = (dim.value / 100) * r;
    const x = cx + val * Math.cos(angle);
    const y = cy + val * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Draw dots and labels
  dimensions.forEach((dim, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const val = (dim.value / 100) * r;
    const x = cx + val * Math.cos(angle);
    const y = cy + val * Math.sin(angle);

    ctx.fillStyle = scoreColor(dim.value);
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();

    // Labels
    const labelR = r + 28;
    const lx = cx + labelR * Math.cos(angle);
    const ly = cy + labelR * Math.sin(angle);

    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(dim.label, lx, ly);
    ctx.fillStyle = scoreColor(dim.value);
    ctx.font = 'bold 11px Arial';
    ctx.fillText(`${dim.value}%`, lx, ly + 14);
  });
}

// ─────────────────────────────────────────────
//  Main report canvas generator
// ─────────────────────────────────────────────
export function generateReportCanvas(data: ReportData): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 1600;
  const ctx = canvas.getContext('2d')!;

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 1600);
  bgGrad.addColorStop(0, '#07101E');
  bgGrad.addColorStop(1, '#0A1628');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1000, 1600);

  const { result } = data;
  let y = 0;

  // ── Header ────────────────────────────────────
  const headerGrad = ctx.createLinearGradient(0, 0, 1000, 0);
  headerGrad.addColorStop(0, '#0D1A35');
  headerGrad.addColorStop(1, '#111E3A');
  ctx.fillStyle = headerGrad;
  ctx.fillRect(0, 0, 1000, 120);
  ctx.strokeStyle = '#00BFFF';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 120); ctx.lineTo(1000, 120); ctx.stroke();

  ctx.fillStyle = '#00BFFF';
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('✦ SMARTHIRE AI PLATFORM', 50, 45);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 30px Arial';
  ctx.fillText('Interview Performance Report', 50, 82);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '13px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(`${data.company} · ${data.role} · ${data.difficulty}`, 950, 60);
  ctx.fillText(new Date().toLocaleDateString('en-US', { dateStyle: 'long' }), 950, 82);
  ctx.fillText(`Candidate: ${data.candidateName}`, 950, 104);

  y = 150;

  // ── Overall score card ────────────────────────
  ctx.fillStyle = '#0D1A35';
  ctx.beginPath();
  roundRect(ctx, 40, y, 920, 120, 16);
  ctx.fill();
  ctx.strokeStyle = scoreColor(result.scores.overall);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '13px Arial';
  ctx.fillText('OVERALL PERFORMANCE', 70, y + 38);
  ctx.fillStyle = scoreColor(result.scores.overall);
  ctx.font = 'bold 60px Arial';
  ctx.fillText(`${result.scores.overall}%`, 70, y + 100);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px Arial';
  ctx.fillText(getPerformanceLabel(result.scores.overall), 200, y + 80);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '14px Arial';
  ctx.fillText(result.summary, 200, y + 105);

  // Score bar
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(70, y + 110, 820, 8);
  const barGrad = ctx.createLinearGradient(70, 0, 890, 0);
  barGrad.addColorStop(0, '#00BFFF');
  barGrad.addColorStop(1, scoreColor(result.scores.overall));
  ctx.fillStyle = barGrad;
  ctx.fillRect(70, y + 110, 820 * result.scores.overall / 100, 8);

  y += 155;

  // ── Radar chart section ───────────────────────
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('Performance Radar', 50, y + 20);

  drawRadarChart(ctx, result.scores, 500, y + 200, 155);
  y += 440;

  // ── Dimension scores grid ─────────────────────
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Detailed Scores', 50, y);
  y += 25;

  const scoreItems = [
    { label: 'Technical Knowledge', value: result.scores.technical },
    { label: 'Communication', value: result.scores.communication },
    { label: 'Confidence', value: result.scores.confidence },
    { label: 'Grammar', value: result.scores.grammar },
    { label: 'Vocabulary', value: result.scores.vocabulary },
    { label: 'Problem Solving', value: result.scores.problemSolving },
    { label: 'Leadership', value: result.scores.leadership },
    { label: 'Behavioral', value: result.scores.behavioral },
    { label: 'Eye Contact', value: result.scores.eyeContact },
    { label: 'Voice Clarity', value: result.scores.voiceClarity },
  ];

  scoreItems.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const ix = 40 + col * 490;
    const iy = y + row * 58;

    ctx.fillStyle = '#0D1A35';
    ctx.beginPath();
    roundRect(ctx, ix, iy, 460, 48, 10);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '13px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(item.label, ix + 15, iy + 20);

    ctx.fillStyle = scoreColor(item.value);
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`${item.value}%`, ix + 445, iy + 20);

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(ix + 15, iy + 30, 430, 6);
    ctx.fillStyle = scoreColor(item.value);
    ctx.fillRect(ix + 15, iy + 30, 430 * item.value / 100, 6);
  });

  y += Math.ceil(scoreItems.length / 2) * 58 + 30;

  // ── Strengths & Weaknesses ────────────────────
  const swY = y;
  // Strengths
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 15px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('✅  Strengths', 50, swY);
  result.strengths.forEach((s, i) => {
    ctx.fillStyle = '#0A2515';
    ctx.beginPath();
    roundRect(ctx, 50, swY + 18 + i * 42, 420, 34, 8);
    ctx.fill();
    ctx.strokeStyle = '#00E67622';
    ctx.stroke();
    ctx.fillStyle = '#00E676';
    ctx.font = '13px Arial';
    ctx.fillText(`• ${s}`, 70, swY + 40 + i * 42);
  });

  // Weaknesses
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 15px Arial';
  ctx.fillText('⚠️  Areas to Improve', 530, swY);
  result.weaknesses.forEach((w, i) => {
    ctx.fillStyle = '#200A08';
    ctx.beginPath();
    roundRect(ctx, 530, swY + 18 + i * 42, 420, 34, 8);
    ctx.fill();
    ctx.strokeStyle = '#FF444422';
    ctx.stroke();
    ctx.fillStyle = '#FF7043';
    ctx.font = '13px Arial';
    ctx.fillText(`• ${w}`, 550, swY + 40 + i * 42);
  });

  const maxSW = Math.max(result.strengths.length, result.weaknesses.length);
  y += 18 + maxSW * 42 + 40;

  // ── Suggestions ───────────────────────────────
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 15px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('💡  Improvement Suggestions', 50, y);
  y += 20;

  result.suggestions.forEach((s, i) => {
    ctx.fillStyle = '#0D1A2E';
    ctx.beginPath();
    roundRect(ctx, 50, y + i * 42, 900, 34, 8);
    ctx.fill();
    ctx.strokeStyle = '#00BFFF22';
    ctx.stroke();
    ctx.fillStyle = '#00BFFF';
    ctx.font = '13px Arial';
    ctx.fillText(`${i + 1}.  ${s}`, 70, y + 22 + i * 42);
  });

  y += result.suggestions.length * 42 + 30;

  // ── Learning Resources ───────────────────────
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 15px Arial';
  ctx.fillText('📚  Recommended Learning Resources', 50, y);
  y += 20;

  result.resources.forEach((r2, i) => {
    ctx.fillStyle = '#0D1728';
    ctx.beginPath();
    roundRect(ctx, 50, y + i * 42, 900, 34, 8);
    ctx.fill();
    ctx.strokeStyle = '#7C3AED22';
    ctx.stroke();
    ctx.fillStyle = '#A78BFA';
    ctx.font = '13px Arial';
    ctx.fillText(`📖  ${r2}`, 70, y + 22 + i * 42);
  });

  y += result.resources.length * 42 + 30;

  // ── Interview summary ─────────────────────────
  ctx.fillStyle = '#0D1A35';
  ctx.beginPath();
  roundRect(ctx, 40, y, 920, 90, 12);
  ctx.fill();
  ctx.strokeStyle = '#00BFFF33';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#00BFFF';
  ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('INTERVIEW SUMMARY', 500, y + 28);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '13px Arial';
  ctx.fillText(`Questions Answered: ${result.questionCount}  ·  Duration: ${Math.round(result.duration / 60)} minutes  ·  Sentiment: ${result.scores.sentiment}`, 500, y + 52);
  if (data.certificateNumber) {
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '11px Arial';
    ctx.fillText(`Certificate: ${data.certificateNumber}`, 500, y + 75);
  }

  y += 110;

  // ── Footer ────────────────────────────────────
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(40, y, 920, 1);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.font = '11px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Generated by SmartHire AI Platform · Confidential · For Candidate Use Only', 500, y + 20);

  return canvas;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─────────────────────────────────────────────
//  Download helpers
// ─────────────────────────────────────────────
export async function downloadReportAsPDF(data: ReportData): Promise<void> {
  const canvas = generateReportCanvas(data);

  try {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height],
    });
    const imgData = canvas.toDataURL('image/png', 1.0);
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`SmartHire_Report_${data.candidateName.replace(/ /g, '_')}.pdf`);
  } catch {
    // Fallback to PNG
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SmartHire_Report_${data.candidateName.replace(/ /g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  }
}

export function downloadTranscriptAsTXT(result: InterviewResult, candidateName: string): void {
  const lines = [
    'SMARTHIRE AI INTERVIEW TRANSCRIPT',
    '==================================',
    `Candidate: ${candidateName}`,
    `Date: ${new Date().toLocaleString()}`,
    `Duration: ${Math.round(result.duration / 60)} minutes`,
    `Overall Score: ${result.scores.overall}%`,
    '',
    'CONVERSATION',
    '─────────────',
    '',
    ...result.transcript.map(m => {
      const speaker = m.role === 'assistant' ? '🤖 Interviewer (Alex)' : '👤 Candidate';
      return `${speaker}:\n${m.content}\n`;
    }),
    '',
    'END OF TRANSCRIPT',
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SmartHire_Transcript_${candidateName.replace(/ /g, '_')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
