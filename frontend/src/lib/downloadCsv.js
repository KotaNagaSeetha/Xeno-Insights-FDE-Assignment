/**
 * CSV Download Utility
 * 
 * Fetches a CSV endpoint and triggers browser download.
 * Handles errors and preserves authentication headers.
 * 
 * Usage:
 *   await downloadCsv('/api/export/products?tenantId=123', 'products.csv');
 */

export async function downloadCsv(url, filename) {
  try {
    // Get auth token from cookies if available
    const token = typeof document !== 'undefined' 
      ? document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1]
      : null;

    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'export.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('CSV download error:', error);
    throw error;
  }
}

