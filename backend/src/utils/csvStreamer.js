/**
 * CSV Streaming Utility
 * 
 * Lightweight helper for streaming CSV data to HTTP responses.
 * Handles header row writing and row-by-row streaming to avoid loading all data into memory.
 * 
 * Usage:
 *   const streamer = new CsvStreamer(res, filename);
 *   await streamer.writeHeader(['col1', 'col2']);
 *   await streamer.writeRow(['value1', 'value2']);
 *   await streamer.end();
 */

export class CsvStreamer {
  constructor(res, filename = 'export.csv') {
    this.res = res;
    this.filename = filename;
    this.headerWritten = false;
    
    // Set response headers
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  }

  /**
   * Escape CSV field value
   */
  escapeField(value) {
    if (value === null || value === undefined) {
      return '';
    }
    const str = String(value);
    // If contains comma, quote, or newline, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  /**
   * Write header row
   */
  async writeHeader(columns) {
    if (this.headerWritten) {
      throw new Error('Header already written');
    }
    const headerRow = columns.map(col => this.escapeField(col)).join(',') + '\n';
    this.res.write(headerRow);
    this.headerWritten = true;
  }

  /**
   * Write a data row
   */
  async writeRow(values) {
    if (!this.headerWritten) {
      throw new Error('Header must be written first');
    }
    const row = values.map(val => this.escapeField(val)).join(',') + '\n';
    this.res.write(row);
  }

  /**
   * End the stream
   */
  async end() {
    this.res.end();
  }
}

