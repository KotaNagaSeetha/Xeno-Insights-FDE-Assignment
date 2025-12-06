# Safe Changelog

## 2025-01-27 - Reports & Export Features

**Timestamp**: 2025-01-27T00:00:00Z

**Added Files**:
- `backend/src/controllers/productPerformanceController.js` - Product performance metrics controller
- `backend/src/routes/productPerformance.js` - Product performance API routes
- `backend/src/utils/csvStreamer.js` - CSV streaming utility
- `backend/src/controllers/exportController.js` - CSV export controller
- `backend/src/routes/export.js` - CSV export routes
- `backend/src/routes/smoke.js` - Dev-only smoke check endpoint
- `backend/scripts/seedRealistic.js` - Realistic seed data generator
- `frontend/src/components/ProductPerformanceChart.jsx` - Product performance chart component
- `frontend/src/components/ExportButton.jsx` - CSV export button component
- `frontend/src/lib/downloadCsv.js` - CSV download utility
- `frontend/src/pages/reports.jsx` - Reports page

**Modified Files**:
- `backend/src/server.js` - Added routes for product-performance, export, and smoke-check
- `backend/package.json` - Added `db:seed:real` script
- `frontend/src/components/Layout.js` - Added Reports link to navbar
- `frontend/src/lib/api.js` - Added product performance and export API methods
- `LOCAL_SETUP.md` - Added seed command and reports notes
- `QUICKSTART.md` - Added seed command and reports notes

