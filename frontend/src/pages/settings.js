import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { tenantAPI } from '@/lib/api';

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tenant, setTenant] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    accessToken: '',
    apiKey: '',
    apiSecret: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadTenant();
    }
  }, [user, authLoading]);

  const loadTenant = async () => {
    try {
      const res = await tenantAPI.getCurrent();
      setTenant(res.data.tenant);
      setFormData({
        name: res.data.tenant.name || '',
        accessToken: '••••••••', // Don't show actual token
        apiKey: res.data.tenant.apiKey || '',
        apiSecret: '••••••••', // Don't show actual secret
      });
    } catch (error) {
      console.error('Error loading tenant:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await tenantAPI.update(formData);
      alert('Settings updated successfully');
      await loadTenant();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update settings');
    } finally {
      setLoading(false);
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
        <title>Settings - Xeno Insights</title>
      </Head>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-3 rounded-xl shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Settings</h1>
              <p className="mt-1 text-gray-600">Manage your tenant configuration and Shopify integration</p>
            </div>
          </div>
        </div>

        {tenant && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">Tenant Information</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tenant Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Shop Domain
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={tenant.shopDomain}
                    disabled
                    className="w-full pl-10 border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 cursor-not-allowed text-gray-600"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Shop domain cannot be changed. Format: your-store.myshopify.com
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Shopify Access Token <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={formData.accessToken === '••••••••' ? '' : formData.accessToken}
                    onChange={(e) =>
                      setFormData({ ...formData, accessToken: e.target.value })
                    }
                    placeholder="shpat_xxxxxxxxxxxxxxxxxxxxx"
                    className="w-full pl-10 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono text-sm"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  {formData.accessToken === '••••••••' 
                    ? 'Enter your Shopify Admin API access token to update' 
                    : 'Your Shopify Admin API access token (starts with shpat_)'}
                </p>
                <div className="mt-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-900 mb-2">How to get your Access Token:</p>
                      <ol className="text-xs text-blue-800 space-y-1.5 list-decimal list-inside">
                        <li>Go to your Shopify Admin → Apps → Develop apps</li>
                        <li>Create a custom app or select an existing one</li>
                        <li>Configure Admin API scopes: read_customers, read_orders, read_products</li>
                        <li>Install the app and copy the Admin API access token</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key (Optional)
                </label>
                <input
                  type="text"
                  value={formData.apiKey}
                  onChange={(e) =>
                    setFormData({ ...formData, apiKey: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Secret (Optional)
                </label>
                <input
                  type="password"
                  value={formData.apiSecret}
                  onChange={(e) =>
                    setFormData({ ...formData, apiSecret: e.target.value })
                  }
                  placeholder="Enter new secret to update"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Used for webhook verification. Leave blank to keep current secret.
                </p>
              </div>

              <div className="pt-6 flex gap-3 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-semibold transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/sync')}
                  className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 font-semibold transition-all border border-gray-300"
                >
                  Go to Data Sync →
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-l-4 border-amber-400 rounded-xl shadow-md p-6 mt-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="bg-amber-100 p-2 rounded-lg">
                <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="font-bold text-amber-900 mb-2 text-lg">Webhook Configuration (Optional)</h3>
              <p className="text-sm text-amber-800 mb-4">
                For real-time data updates, configure webhooks in your Shopify admin. This is optional - you can also use manual sync.
              </p>
              <div className="bg-white rounded-lg p-4 space-y-3 text-sm border border-amber-200 shadow-sm">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-700 min-w-[80px]">Customers:</span>
                  <code className="bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-mono flex-1">
                    {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/webhooks/customers/create
                  </code>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-700 min-w-[80px]">Orders:</span>
                  <code className="bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-mono flex-1">
                    {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/webhooks/orders/create
                  </code>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-700 min-w-[80px]">Products:</span>
                  <code className="bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-mono flex-1">
                    {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/webhooks/products/create
                  </code>
                </div>
              </div>
              <div className="mt-4 bg-white/60 rounded-lg p-3 border border-amber-200">
                <p className="text-xs text-amber-800">
                  <strong className="font-semibold">Note:</strong> For local development, use a tool like ngrok to expose your local server to the internet.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

