/**
 * Reports Page
 * 
 * Displays product performance metrics and export functionality.
 * Shows charts and tables with top products by revenue.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import ProductPerformanceChart from '@/components/ProductPerformanceChart';
import ExportButton from '@/components/ExportButton';

export default function Reports() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  // Get tenantId from user.tenant.id (set by auth middleware)
  const tenantId = user?.tenant?.id;

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setError('Please log in to view reports');
      setLoading(false);
      return;
    }

    if (!tenantId) {
      setError('Tenant information not available. Please refresh the page.');
      setLoading(false);
      return;
    }

    fetchProductPerformance();
  }, [user, tenantId, dateRange, authLoading]);

  const fetchProductPerformance = async () => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    try {
      // Get token from cookies
      const token = typeof document !== 'undefined' 
        ? document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] 
        : null;

      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      const params = new URLSearchParams({
        limit: '20',
        ...(dateRange.from && { from: dateRange.from }),
        ...(dateRange.to && { to: dateRange.to })
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/metrics/product-performance?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Failed to fetch: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching product performance:', err);
      setError(err.message || 'Failed to load product performance data');
    } finally {
      setLoading(false);
    }
  };

  const getExportUrl = (type) => {
    if (!tenantId) return '';
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const params = new URLSearchParams();
    if (type === 'orders' && dateRange.from && dateRange.to) {
      params.append('from', dateRange.from);
      params.append('to', dateRange.to);
    }
    const queryString = params.toString();
    return `${baseUrl}/api/export/${type}${queryString ? '?' + queryString : ''}`;
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Product Performance Reports</h1>
          <p className="mt-2 text-sm text-gray-600">
            Analyze top products by revenue, units sold, and order count
          </p>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Date Range Filter</h2>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={fetchProductPerformance}
              disabled={loading}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Apply Filter'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">Error</p>
                <p className="mt-1 text-sm text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md border border-gray-200">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading product performance data...</p>
          </div>
        ) : (
          <>
            {/* Chart */}
            <div className="mb-6">
              <ProductPerformanceChart data={data} />
            </div>

            {/* Export Section */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg shadow-md p-6 mb-6 border border-indigo-200">
              <div className="flex items-center mb-4">
                <svg className="w-6 h-6 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Export Data</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Download your data in CSV format for further analysis
              </p>
              <div className="flex flex-wrap gap-3">
                <ExportButton
                  url={getExportUrl('products')}
                  filename="products.csv"
                  label="Export Products"
                  className="shadow-sm"
                />
                <ExportButton
                  url={getExportUrl('orders')}
                  filename="orders.csv"
                  label="Export Orders"
                  className="shadow-sm"
                />
                <ExportButton
                  url={getExportUrl('customers')}
                  filename="customers.csv"
                  label="Export Customers"
                  className="shadow-sm"
                />
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Products sorted by revenue in descending order
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Units Sold
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Orders
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <p className="text-gray-500 font-medium">No product performance data available</p>
                            <p className="text-sm text-gray-400 mt-1">Sync your Shopify data or run the seed script to see results</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      data.map((product, index) => (
                        <tr key={product.productId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">{product.title}</div>
                            <div className="text-xs text-gray-500">ID: {product.shopId}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{product.unitsSold.toLocaleString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-green-600">${product.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{product.ordersCount}</div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

