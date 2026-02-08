import { CONFIG } from '../config.js';

/**
 * Submit data to Google Sheets via a Google Apps Script web app.
 * 
 * Supports two types of submissions:
 * - 'playbook': Email capture from the Playbook modal
 * - 'diagnostic': Full diagnostic results with name, email, and scores
 * 
 * @param {string} type - 'playbook' or 'diagnostic'
 * @param {object} data - The data to submit
 * @returns {Promise<boolean>} - Whether the submission succeeded
 */
export async function submitToSheets(type, data) {
  const url = CONFIG.sheetsWebhookUrl;

  if (!url) {
    console.warn('[Sheets] No webhook URL configured. Set CONFIG.sheetsWebhookUrl in src/config.js');
    console.log('[Sheets] Would have submitted:', { type, ...data });
    // Return true so the UI flow continues during development
    return true;
  }

  try {
    const payload = {
      type,
      timestamp: new Date().toISOString(),
      ...data,
    };

    const response = await fetch(url, {
      method: 'POST',
      mode: 'no-cors', // Google Apps Script requires this
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // With no-cors, we can't read the response, but if it didn't throw, it likely worked
    return true;
  } catch (error) {
    console.error('[Sheets] Submission failed:', error);
    return false;
  }
}

/**
 * Submit a Playbook email capture.
 * @param {string} email 
 */
export async function submitPlaybookEmail(email) {
  return submitToSheets('playbook', { email });
}

/**
 * Submit diagnostic results.
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.email
 * @param {object} params.capacityRatings - { capacity_id: rating }
 * @param {string} params.recommendation - 'full_system' or 'coach_only'
 * @param {Array} params.weakestCapacities - names of weakest capacities
 * @param {Array} params.missingLevers - which levers are missing
 */
export async function submitDiagnosticResults({ name, email, capacityRatings, recommendation, weakestCapacities, missingLevers }) {
  return submitToSheets('diagnostic', {
    name,
    email,
    capacityRatings: JSON.stringify(capacityRatings),
    recommendation,
    weakestCapacities: weakestCapacities.join(', '),
    missingLevers: missingLevers.join(', '),
  });
}
