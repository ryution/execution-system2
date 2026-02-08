import { jsPDF } from 'jspdf';

/**
 * Generate a PDF diagnostic report.
 * 
 * @param {object} params
 * @param {string} params.name - User's name
 * @param {object} params.capacityRatings - All 11 capacity ratings { id: number }
 * @param {Array} params.results - The 3 weakest capacities with analysis
 * @param {string} params.recommendation - 'full_system' or 'coach_only'
 * @param {Array} params.allCapacities - Full list of capacity objects
 * @returns {jsPDF} - The PDF document (can be saved or downloaded)
 */
export function generateDiagnosticPDF({ name, capacityRatings, results, recommendation, allCapacities }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Colors
  const black = [23, 23, 23];
  const gray = [115, 115, 115];
  const lightGray = [212, 212, 212];
  const red = [220, 38, 38];
  const amber = [217, 119, 6];
  const green = [22, 163, 74];
  const darkBg = [10, 10, 10];

  // ─── HEADER ────────────────────────────────────────────────
  doc.setFillColor(...darkBg);
  doc.rect(0, 0, pageWidth, 50, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('WHETSTONE  |  THE EXECUTION SYSTEM', margin, 18);

  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('Executive Function Diagnostic', margin, 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(160, 160, 160);
  const subtitle = name ? `Prepared for ${name}` : 'Your Personalized Report';
  doc.text(`${subtitle}  ·  ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 42);

  y = 62;

  // ─── FULL CAPACITY SCORES ──────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...black);
  doc.text('All Capacity Ratings', margin, y);
  y += 8;

  // Sort by rating ascending
  const sorted = allCapacities
    .map(c => ({ ...c, rating: capacityRatings[c.id] || 0 }))
    .sort((a, b) => a.rating - b.rating);

  sorted.forEach((cap) => {
    const isWeak = cap.rating <= 4;
    const barMaxWidth = contentWidth - 50;
    const barWidth = (cap.rating / 10) * barMaxWidth;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...(isWeak ? red : gray));
    doc.text(cap.name, margin, y);

    // Rating number
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`${cap.rating}/10`, pageWidth - margin - 10, y);

    // Bar background
    y += 2;
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(margin, y, barMaxWidth, 3, 1.5, 1.5, 'F');

    // Bar fill
    if (barWidth > 0) {
      const barColor = cap.rating <= 3 ? red : cap.rating <= 6 ? amber : green;
      doc.setFillColor(...barColor);
      doc.roundedRect(margin, y, Math.max(barWidth, 3), 3, 1.5, 1.5, 'F');
    }

    y += 9;
  });

  y += 4;

  // ─── PRIMARY BOTTLENECKS ───────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...black);
  doc.text('Primary Bottlenecks', margin, y);
  y += 3;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text('Your 3 weakest capacities and which support lever is most lacking.', margin, y + 5);
  y += 14;

  const leverNames = { training: 'Training', environment: 'Environment', accountability: 'Accountability' };

  results.forEach((result, i) => {
    // Check if we need a new page
    if (y > 250) {
      doc.addPage();
      y = margin;
    }

    // Capacity header
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(margin, y - 4, contentWidth, 22, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...red);
    doc.text(`${i + 1}. ${result.capacity.name}`, margin + 4, y + 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    doc.text(`Rating: ${result.rating}/10`, margin + 4, y + 11);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...amber);
    doc.text(`Missing lever: ${leverNames[result.missingLever]}`, pageWidth - margin - 45, y + 7);

    y += 26;

    // Lever breakdown
    Object.entries(result.percentages).forEach(([lever, pct]) => {
      const isMissing = lever === result.missingLever;
      const barMax = contentWidth - 55;
      const barW = pct * barMax;

      doc.setFont('helvetica', isMissing ? 'bold' : 'normal');
      doc.setFontSize(9);
      doc.setTextColor(isMissing ? [...red] : [...gray]);
      doc.text(`${leverNames[lever]}`, margin + 4, y);

      doc.setTextColor(...gray);
      doc.text(`${result.implemented[lever]}/${result.total[lever]}`, margin + 45, y);

      // Bar
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(margin + 55, y - 2.5, barMax, 3, 1.5, 1.5, 'F');
      if (barW > 0) {
        doc.setFillColor(...(isMissing ? red : green));
        doc.roundedRect(margin + 55, y - 2.5, Math.max(barW, 3), 3, 1.5, 1.5, 'F');
      }

      y += 8;
    });

    y += 6;
  });

  // ─── RECOMMENDATION ────────────────────────────────────────
  if (y > 235) { doc.addPage(); y = margin; }

  doc.setFillColor(...darkBg);
  doc.roundedRect(margin, y, contentWidth, 48, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('Our Recommendation', margin + 6, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);

  if (recommendation === 'full_system') {
    const recText = doc.splitTextToSize(
      'Based on your results, you have accountability gaps across multiple capacities. The Full Execution System (Tier 2) is designed for exactly this pattern — weekly coaching, a dedicated Executive Assistant for daily planning calls, and formalized failure-mode diagnostics.',
      contentWidth - 12
    );
    doc.text(recText, margin + 6, y + 18);
  } else {
    const recText = doc.splitTextToSize(
      'Your pattern suggests you may benefit from Coached Execution (Tier 1), which focuses on the accountability lever through weekly coaching without daily EA support.',
      contentWidth - 12
    );
    doc.text(recText, margin + 6, y + 18);
  }

  y += 56;

  // ─── NEXT STEPS ────────────────────────────────────────────
  if (y > 250) { doc.addPage(); y = margin; }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...black);
  doc.text('Next Steps', margin, y);
  y += 8;

  const steps = [
    'Schedule a free 30-minute diagnostic call',
    'We\'ll confirm your bottlenecks and assess fit',
    'If it\'s a match, we onboard you within 48 hours',
  ];

  steps.forEach((step, i) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...black);
    doc.text(`${i + 1}.`, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(step, margin + 8, y);
    y += 7;
  });

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...amber);
  doc.text('Book your call: calendly.com/cole-whetstone', margin, y);

  // ─── FOOTER ────────────────────────────────────────────────
  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setDrawColor(230, 230, 230);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text('Whetstone Advisory LLC  ·  The Execution System  ·  whetstoneadmissions.com', margin, footerY);
  doc.text('Confidential — prepared for individual use only', pageWidth - margin - 65, footerY);

  return doc;
}

/**
 * Generate and download the PDF.
 */
export function downloadDiagnosticPDF(params) {
  const doc = generateDiagnosticPDF(params);
  const filename = params.name
    ? `Execution-Diagnostic-${params.name.replace(/\s+/g, '-')}.pdf`
    : 'Execution-Diagnostic-Report.pdf';
  doc.save(filename);
}
