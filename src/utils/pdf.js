import { jsPDF } from 'jspdf';

const C = {
  black: [23, 23, 23], body: [63, 63, 70], gray: [115, 115, 115], light: [163, 163, 163],
  rule: [228, 228, 228], red: [220, 38, 38], redBg: [254, 242, 242],
  amber: [180, 83, 9], amberBg: [255, 251, 235], green: [22, 163, 74], greenBg: [240, 253, 244],
  dark: [10, 10, 10], white: [255, 255, 255],
};

const capNames = {
  response_inhibition: "Response Inhibition", emotional_regulation: "Emotional Regulation",
  sustained_attention: "Sustained Attention", task_initiation: "Task Initiation",
  goal_persistence: "Goal-Directed Persistence", planning: "Planning & Prioritization",
  organization: "Organization", time_awareness: "Time Awareness", working_memory: "Working Memory",
  cognitive_flexibility: "Cognitive Flexibility", metacognition: "Metacognition",
};
const leverNames = { training: "Training", environment: "Environment", accountability: "Accountability" };

function scoreColor(r) { return r <= 3 ? C.red : r <= 6 ? C.amber : C.green; }
function scoreBg(r) { return r <= 3 ? C.redBg : r <= 6 ? C.amberBg : C.greenBg; }
function scoreLabel(r) { return r <= 3 ? "Needs attention" : r <= 6 ? "Developing" : "Solid"; }

function chk(doc, y, need, m) {
  if (y + need > doc.internal.pageSize.getHeight() - m - 8) { doc.addPage(); return m + 5; }
  return y;
}

function footer(doc, m) {
  const pw = doc.internal.pageSize.getWidth();
  const fy = doc.internal.pageSize.getHeight() - 10;
  doc.setDrawColor(...C.rule); doc.line(m, fy - 4, pw - m, fy - 4);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...C.light);
  doc.text('Whetstone Advisory LLC  |  hello@whetstoneadmissions.com', m, fy);
  doc.text('Page ' + doc.internal.getNumberOfPages(), pw - m - 12, fy);
}

// Cross-cutting quick-win themes
const themes = [
  { theme: "Weekly Accountability Check-In", desc: "A weekly meeting with a coach, partner, or VA to review wins, losses, learnings, and commitments. The single most powerful habit for preventing long-term collapse.",
    map: { goal_persistence: ["gp_coach","gp_commitment"], planning: ["pl_review","pl_weekly"], organization: ["or_audit","or_checkin"], metacognition: ["mc_debrief","mc_feedback"], time_awareness: ["ta_deadline","ta_shared_cal"] } },
  { theme: "Daily Planning with a Partner", desc: "A 10-minute daily session where every task gets a calendar slot. Dramatically more effective with another person present.",
    map: { task_initiation: ["ti_daily_call","ti_start_time"], planning: ["pl_calendar","pl_daily"], time_awareness: ["ta_estimate","ta_track"] } },
  { theme: "Consistent Sleep (7-9 Hours)", desc: "Fixed wake time, morning light, cool dark room. The highest-leverage biological intervention for executive function.",
    map: { response_inhibition: ["ri_sleep"], emotional_regulation: ["er_sleep"] } },
  { theme: "Body-Doubling & Social Work", desc: "Working alongside other people -- library, co-working, study partner. Social presence creates implicit accountability.",
    map: { response_inhibition: ["ri_body_double"], sustained_attention: ["sa_body_double"] } },
  { theme: "Structured Daily Reflection", desc: "3-10 minutes of written review: what worked, what didn't, what to change. Builds self-awareness and prevents shame accumulation.",
    map: { metacognition: ["mc_reflection","mc_journal","mc_calibration","mc_data"] } },
  { theme: "Regular Exercise (3x per week)", desc: "One of the most robust cognitive enhancers in the literature. Improves working memory, attention, emotional regulation, and mood.",
    map: { emotional_regulation: ["er_exercise"], sustained_attention: ["sa_nature"] } },
];

function analyzeQuickWins(weakIds, status) {
  const wins = [];
  for (const t of themes) {
    const helped = [];
    let missed = 0;
    for (const [cid, ids] of Object.entries(t.map)) {
      if (weakIds.includes(cid)) {
        const unc = ids.filter(id => !status[id]);
        if (unc.length > 0) { helped.push(cid); missed += unc.length; }
      }
    }
    if (helped.length > 0) wins.push({ ...t, helped, missed });
  }
  wins.sort((a, b) => b.helped.length - a.helped.length || b.missed - a.missed);
  return wins.slice(0, 4);
}

// ═══════════════════════════════════════════════════════════════
//  GENERATE PDF
// ═══════════════════════════════════════════════════════════════
export function generateDiagnosticPDF({ name, capacityRatings, results, recommendation, allCapacities, interventionStatus, interventions }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const m = 18;
  const cw = pw - m * 2;
  let y = 0;
  const status = interventionStatus || {};

  const sorted = allCapacities
    .map(c => ({ ...c, rating: capacityRatings[c.id] || 0 }))
    .sort((a, b) => a.rating - b.rating);

  const avg = allCapacities.length > 0
    ? (allCapacities.reduce((s, c) => s + (capacityRatings[c.id] || 0), 0) / allCapacities.length).toFixed(1) : '--';

  // ═══════════════════════════════════════════════════════════
  //  PAGE 1: COVER
  // ═══════════════════════════════════════════════════════════
  doc.setFillColor(...C.dark); doc.rect(0, 0, pw, ph, 'F');

  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(180, 180, 180);
  doc.text('WHETSTONE', m, 30);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100);
  doc.text('  |  The Execution System', m + 30, 30);

  doc.setDrawColor(180, 130, 30); doc.setLineWidth(0.8); doc.line(m, 40, m + 50, 40);

  doc.setFont('helvetica', 'bold'); doc.setFontSize(34); doc.setTextColor(...C.white);
  doc.text('Executive Function', m, 70); doc.text('Profile', m, 82);

  if (name) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(16); doc.setTextColor(180, 180, 180);
    doc.text('Prepared for ' + name, m, 100);
  }
  doc.setFontSize(11); doc.setTextColor(120, 120, 120);
  doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), m, name ? 110 : 100);

  // Average score box
  doc.setFillColor(30, 30, 30); doc.roundedRect(m, 130, cw, 38, 3, 3, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(36); doc.setTextColor(180, 130, 30);
  doc.text(String(avg), m + 12, 154);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(160, 160, 160);
  doc.text('/10 average across 11 executive capacities', m + 35, 147);
  doc.setFontSize(9); doc.setTextColor(120, 120, 120);
  doc.text("This score reflects your self-assessment. It's a starting point, not a verdict.", m + 35, 157);

  // Capacity bars on cover
  doc.setFontSize(9); doc.setTextColor(100, 100, 100);
  doc.text('YOUR CAPACITIES AT A GLANCE', m, 188);
  let by = 195;
  sorted.forEach(cap => {
    const maxB = cw - 40; const bW = (cap.rating / 10) * maxB; const col = scoreColor(cap.rating);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(160, 160, 160);
    doc.text(cap.name, m, by);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...col);
    doc.text(String(cap.rating), pw - m - 5, by);
    by += 1.5;
    doc.setFillColor(40, 40, 40); doc.roundedRect(m, by, maxB, 2.5, 1, 1, 'F');
    if (bW > 0) { doc.setFillColor(...col); doc.roundedRect(m, by, Math.max(bW, 2), 2.5, 1, 1, 'F'); }
    by += 7;
  });

  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(80, 80, 80);
  doc.text('Whetstone Advisory LLC  |  hello@whetstoneadmissions.com  |  Confidential', m, ph - 10);

  // ═══════════════════════════════════════════════════════════
  //  PAGE 2: TOP 3 GROWTH AREAS
  // ═══════════════════════════════════════════════════════════
  doc.addPage(); y = m;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...C.amber);
  doc.text('YOUR TOP GROWTH AREAS', m, y); y += 4;
  doc.setDrawColor(...C.amber); doc.setLineWidth(0.5); doc.line(m, y, m + 40, y); y += 8;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(...C.black);
  doc.text('Where to Focus First', m, y); y += 6;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...C.gray);
  const intro = doc.splitTextToSize("These are the capacities where you scored lowest and have the most room to grow. For each one, we've identified what you're already doing and what's missing -- along with the lever that will make the biggest difference.", cw);
  doc.text(intro, m, y); y += intro.length * 4.5 + 8;

  results.forEach((res, i) => {
    y = chk(doc, y, 60, m);
    const bg = scoreBg(res.rating); const fg = scoreColor(res.rating);

    doc.setFillColor(...bg); doc.roundedRect(m, y, cw, 14, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...C.black);
    doc.text((i + 1) + '. ' + res.capacity.name, m + 4, y + 6);
    doc.setFontSize(16); doc.setTextColor(...fg);
    doc.text(res.rating + '/10', pw - m - 14, y + 7);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...C.gray);
    doc.text(scoreLabel(res.rating), pw - m - 14, y + 12);
    y += 18;

    // Lever bars
    Object.entries(res.percentages).forEach(([lev, pct]) => {
      const miss = lev === res.missingLever;
      doc.setFont('helvetica', miss ? 'bold' : 'normal'); doc.setFontSize(8.5);
      doc.setTextColor(...(miss ? fg : C.gray));
      doc.text(leverNames[lev], m + 2, y);
      doc.text(res.implemented[lev] + '/' + res.total[lev], m + 38, y);
      const bMax = cw - 60; const bX = m + 50;
      doc.setFillColor(240, 240, 240); doc.roundedRect(bX, y - 2.5, bMax, 3, 1.5, 1.5, 'F');
      if (pct > 0) { doc.setFillColor(...(miss ? fg : C.green)); doc.roundedRect(bX, y - 2.5, Math.max(pct * bMax, 2), 3, 1.5, 1.5, 'F'); }
      if (miss) { doc.setFontSize(7); doc.setTextColor(...C.amber); doc.text('<-- biggest opportunity', bX + pct * bMax + 3, y); }
      y += 7;
    });

    // Missing interventions
    if (interventions) {
      const capInt = interventions[res.capacity.id];
      if (capInt) {
        const missing = [];
        ['training', 'environment', 'accountability'].forEach(lev => {
          capInt[lev].forEach(item => { if (!status[item.id]) missing.push({ lev, text: item.text }); });
        });
        if (missing.length > 0) {
          y += 2;
          doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...C.amber);
          doc.text('Not yet implemented:', m + 2, y); y += 5;
          missing.forEach(item => {
            y = chk(doc, y, 10, m);
            const short = item.text.length > 95 ? item.text.substring(0, 92) + '...' : item.text;
            doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...C.body);
            doc.text('  -  ' + short, m + 4, y);
            doc.setFontSize(6.5); doc.setTextColor(...C.light);
            doc.text('(' + leverNames[item.lev] + ')', pw - m - 22, y);
            y += 5;
          });
        }
      }
    }
    y += 8;
  });
  footer(doc, m);

  // ═══════════════════════════════════════════════════════════
  //  PAGE 3: QUICK-WIN ACTION PLAN
  // ═══════════════════════════════════════════════════════════
  doc.addPage(); y = m;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(22, 163, 74);
  doc.text('YOUR QUICK-WIN ACTION PLAN', m, y); y += 4;
  doc.setDrawColor(22, 163, 74); doc.setLineWidth(0.5); doc.line(m, y, m + 45, y); y += 8;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(...C.black);
  doc.text('Maximum Impact, Minimum Changes', m, y); y += 6;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...C.gray);
  const qi = doc.splitTextToSize("You don't need to change everything. These are the highest-leverage moves available to you right now -- single habits that improve multiple capacities simultaneously.", cw);
  doc.text(qi, m, y); y += qi.length * 4.5 + 10;

  const weakIds = results.map(r => r.capacity.id);
  const qw = analyzeQuickWins(weakIds, status);

  if (qw.length > 0) {
    qw.forEach((w, i) => {
      y = chk(doc, y, 30, m);
      doc.setFillColor(...C.greenBg); doc.roundedRect(m, y - 2, cw, 1.5, 0, 0, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...C.black);
      doc.text((i + 1) + '. ' + w.theme, m, y + 5); y += 10;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...C.body);
      const dl = doc.splitTextToSize(w.desc, cw - 4);
      doc.text(dl, m + 2, y); y += dl.length * 4 + 4;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(22, 163, 74);
      doc.text('Predicted to improve: ' + w.helped.map(id => capNames[id] || id).join(', '), m + 2, y);
      y += 12;
    });
  } else {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...C.gray);
    doc.text("You're already implementing many cross-cutting practices. Nice work.", m, y); y += 10;
  }

  // Bottom line box
  y = chk(doc, y, 35, m); y += 5;
  doc.setFillColor(250, 250, 249); doc.setDrawColor(...C.rule);
  doc.roundedRect(m, y, cw, 30, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...C.black);
  doc.text('The Bottom Line', m + 5, y + 8);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...C.body);
  const bl = doc.splitTextToSize(
    qw.length > 0
      ? 'By adopting just ' + Math.min(qw.length, 3) + ' new habit' + (qw.length > 1 ? 's' : '') + ', you can meaningfully improve ' + weakIds.length + " of your weakest capacities. You don't need a complete overhaul -- you need the right " + (qw.length > 1 ? 'few moves' : 'move') + '.'
      : 'Your interventions are well-distributed. The next step is ensuring consistency and adding accountability structures.', cw - 10);
  doc.text(bl, m + 5, y + 15);
  footer(doc, m);

  // ═══════════════════════════════════════════════════════════
  //  PAGE 4: FULL SCORES + RECOMMENDATION
  // ═══════════════════════════════════════════════════════════
  doc.addPage(); y = m;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...C.body);
  doc.text('COMPLETE RESULTS', m, y); y += 4;
  doc.setDrawColor(...C.rule); doc.setLineWidth(0.3); doc.line(m, y, m + 30, y); y += 8;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(...C.black);
  doc.text('All 11 Capacities', m, y); y += 10;

  sorted.forEach((cap, i) => {
    y = chk(doc, y, 12, m);
    const col = scoreColor(cap.rating);
    if (i % 2 === 1) { doc.setFillColor(250, 250, 249); doc.rect(m, y - 4, cw, 10, 'F'); }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...C.black);
    doc.text(cap.name, m + 2, y);
    doc.setFillColor(...scoreBg(cap.rating));
    doc.roundedRect(pw - m - 26, y - 3.5, 24, 7, 3, 3, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...col);
    doc.text(cap.rating + '/10', pw - m - 22, y + 1);
    const bMax = cw - 80; const bX = m + 55;
    doc.setFillColor(235, 235, 235); doc.roundedRect(bX, y - 2, bMax, 3.5, 1.5, 1.5, 'F');
    if (cap.rating > 0) { doc.setFillColor(...col); doc.roundedRect(bX, y - 2, Math.max((cap.rating / 10) * bMax, 2), 3.5, 1.5, 1.5, 'F'); }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...C.light);
    doc.text(scoreLabel(cap.rating), bX + (cap.rating / 10) * bMax + 3, y);
    y += 10;
  });

  y += 10; y = chk(doc, y, 55, m);

  // Recommendation
  doc.setFillColor(...C.dark); doc.roundedRect(m, y, cw, 48, 3, 3, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(180, 130, 30);
  doc.text('Our Recommendation', m + 6, y + 10);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(210, 210, 210);
  const recT = doc.splitTextToSize(
    recommendation === 'full_system'
      ? 'Based on your profile, you have accountability gaps across multiple capacities. The Full Execution System is designed for exactly this: weekly 1:1 coaching, a dedicated EA for daily planning, and structured failure-mode diagnostics.'
      : 'Your profile suggests the Coached Execution tier, focused on the accountability lever through weekly coaching.', cw - 12);
  doc.text(recT, m + 6, y + 18);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(180, 130, 30);
  doc.text('Book a free 30-min call: calendly.com/cole-whetstone', m + 6, y + 38);
  y += 56;

  // Next steps
  y = chk(doc, y, 30, m);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...C.black);
  doc.text('What Happens Next', m, y); y += 8;
  ["Schedule a free 30-minute call -- we'll walk through your profile together.",
   "We'll confirm your bottlenecks, identify the right tier, and assess fit.",
   "If it's a match, we onboard you within 48 hours."].forEach((s, i) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...C.amber);
    doc.text((i + 1) + '.', m, y);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.body);
    doc.text(s, m + 6, y); y += 7;
  });
  footer(doc, m);

  return doc;
}

// ═══════════════════════════════════════════════════════════════
//  DOWNLOAD — triple fallback: save(), blob anchor, data URI
// ═══════════════════════════════════════════════════════════════
export function downloadDiagnosticPDF(params) {
  let doc;
  const fn = params.name
    ? 'Execution-Profile-' + params.name.replace(/\s+/g, '-') + '.pdf'
    : 'Execution-Profile.pdf';

  // Step 1: Generate the PDF
  try {
    doc = generateDiagnosticPDF(params);
  } catch (genErr) {
    console.error('PDF generation failed:', genErr);
    alert('Error generating your report: ' + genErr.message);
    return false;
  }

  // Step 2: Try jsPDF's built-in save (uses FileSaver internally)
  try {
    doc.save(fn);
    console.log('PDF download: doc.save() succeeded');
    return true;
  } catch (e1) {
    console.warn('doc.save() failed:', e1);
  }

  // Step 3: Try manual blob + anchor
  try {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fn;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
    console.log('PDF download: blob anchor succeeded');
    return true;
  } catch (e2) {
    console.warn('Blob anchor failed:', e2);
  }

  // Step 4: Try opening data URI in new tab
  try {
    const uri = doc.output('datauristring');
    const w = window.open(uri, '_blank');
    if (w) {
      console.log('PDF download: data URI new tab succeeded');
      return true;
    }
  } catch (e3) {
    console.warn('Data URI failed:', e3);
  }

  // Step 5: Last resort — offer base64 download link
  try {
    const base64 = doc.output('datauristring');
    const link = document.createElement('a');
    link.href = base64;
    link.download = fn;
    link.click();
    console.log('PDF download: base64 link succeeded');
    return true;
  } catch (e4) {
    console.error('All download methods failed');
    alert('Your browser is blocking the download. Please try:\n1. Allow popups for this site\n2. Try a different browser\n3. Contact hello@whetstoneadmissions.com for your report');
    return false;
  }
}
