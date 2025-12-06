import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { ingestionAPI } from '@/lib/api';

export default function Sync() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState(null);
  const [status, setStatus] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [syncResults, setSyncResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadStatus();
    }
  }, [user, authLoading]);

  const loadStatus = async () => {
    try {
      const res = await ingestionAPI.getStatus();
      setStatus(res.data);
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
  };

  const handleSync = async (type) => {
    setLoading(true);
    setLoadingType(type);
    setSyncResults(null);
    setError(null);
    try {
      let res;
      switch (type) {
        case 'all':
          res = await ingestionAPI.syncAll();
          break;
        case 'customers':
          res = await ingestionAPI.syncCustomers();
          break;
        case 'orders':
          res = await ingestionAPI.syncOrders();
          break;
        case 'products':
          res = await ingestionAPI.syncProducts();
          break;
        default:
          return;
      }
      setSyncResults(res.data);
      await loadStatus();
    } catch (error) {
      console.error('Sync error:', error);
      setError(error.response?.data?.error || error.message || 'Sync failed. Please check your Shopify settings and try again.');
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Data Sync - Xeno Insights</title>
      </Head>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Data Synchronization</h1>
          <p className="mt-2 text-gray-600">
            Sync your Shopify store data with the insights platform
          </p>
        </div>

        {/* Sync Status */}
        {status && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Last Sync Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-blue-700">Customers</div>
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {status.customers.lastSynced
                    ? new Date(status.customers.lastSynced).toLocaleString()
                    : 'Never synced'}
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-green-700">Orders</div>
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {status.orders.lastSynced
                    ? new Date(status.orders.lastSynced).toLocaleString()
                    : 'Never synced'}
                </div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-purple-700">Products</div>
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {status.products.lastSynced
                    ? new Date(status.products.lastSynced).toLocaleString()
                    : 'Never synced'}
                </div>
              </div>
            </div>
          </div>
        )}

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
                <p className="text-sm text-red-700">{error}</p>
                <p className="mt-1 text-xs text-red-600">
                  Make sure your Shopify access token is configured correctly in Settings.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sync Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Sync Actions</h2>
          <p className="text-sm text-gray-600 mb-4">
            Select what data you want to sync from your Shopify store. This may take a few moments depending on your data size.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => handleSync('all')}
              disabled={loading}
              className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-4 py-4 rounded-lg hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 font-medium shadow-md transition-all transform hover:scale-105 disabled:transform-none"
            >
              {loading && loadingType === 'all' ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Syncing...
                </span>
              ) : (
                'Sync All'
              )}
            </button>
            <button
              onClick={() => handleSync('customers')}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-4 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 font-medium shadow-md transition-all transform hover:scale-105 disabled:transform-none"
            >
              {loading && loadingType === 'customers' ? 'Syncing...' : 'Sync Customers'}
            </button>
            <button
              onClick={() => handleSync('orders')}
              disabled={loading}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-4 rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 font-medium shadow-md transition-all transform hover:scale-105 disabled:transform-none"
            >
              {loading && loadingType === 'orders' ? 'Syncing...' : 'Sync Orders'}
            </button>
            <button
              onClick={() => handleSync('products')}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-4 rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 font-medium shadow-md transition-all transform hover:scale-105 disabled:transform-none"
            >
              {loading && loadingType === 'products' ? 'Syncing...' : 'Sync Products'}
            </button>
          </div>
        </div>

        {/* Sync Results */}
        {syncResults && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-green-400 rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-800">Sync Completed Successfully!</h2>
            </div>
            {syncResults.results ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="text-sm font-medium text-gray-500 mb-2">Customers</div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{syncResults.results.customers.total}</div>
                  <div className="text-xs text-gray-500">
                    +{syncResults.results.customers.created} new, {syncResults.results.customers.updated} updated
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="text-sm font-medium text-gray-500 mb-2">Orders</div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{syncResults.results.orders.total}</div>
                  <div className="text-xs text-gray-500">
                    +{syncResults.results.orders.created} new, {syncResults.results.orders.updated} updated
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="text-sm font-medium text-gray-500 mb-2">Products</div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{syncResults.results.products.total}</div>
                  <div className="text-xs text-gray-500">
                    +{syncResults.results.products.created} new, {syncResults.results.products.updated} updated
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-green-700 bg-white p-3 rounded border border-green-200">
                {syncResults.message || 'Sync completed successfully'}
              </div>
            )}
            <div className="mt-4">
              <a
                href="/dashboard"
                className="inline-flex items-center text-sm font-medium text-green-700 hover:text-green-800"
              >
                View Dashboard →
              </a>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 rounded-lg p-5 mt-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">Automatic Sync</h3>
              <p className="text-sm text-blue-800 mb-2">
                Data is automatically synced every hour via a scheduled job. You can also trigger manual syncs using the buttons above.
              </p>
              <p className="text-xs text-blue-700 mt-2">
                <strong>Tip:</strong> Make sure your Shopify access token is configured in Settings before syncing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}


