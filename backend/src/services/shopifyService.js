import axios from 'axios';

/**
 * Shopify API Service
 * Handles all interactions with Shopify Admin API
 */
class ShopifyService {
  constructor(shopDomain, accessToken) {
    this.shopDomain = shopDomain;
    this.accessToken = accessToken;
    this.baseURL = `https://${shopDomain}/admin/api/2024-01`;
    
    // Sanitize access token to remove any invalid characters
    const sanitizedToken = String(accessToken || '').trim().replace(/[\r\n]/g, '');
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'X-Shopify-Access-Token': sanitizedToken,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Generic method to fetch paginated data from Shopify
   */
  async fetchPaginated(endpoint, limit = 250) {
    const allItems = [];
    let hasNextPage = true;
    let pageInfo = null;

    while (hasNextPage) {
      try {
        const params = { limit };
        if (pageInfo) {
          params.page_info = pageInfo;
        }

        const response = await this.client.get(endpoint, { params });
        const items = response.data[endpoint.split('/').pop()] || response.data;
        
        if (Array.isArray(items)) {
          allItems.push(...items);
        } else if (items) {
          allItems.push(items);
        }

        // Check for pagination
        const linkHeader = response.headers['link'];
        if (linkHeader && linkHeader.includes('rel="next"')) {
          const nextMatch = linkHeader.match(/<[^>]+page_info=([^&>]+)/);
          pageInfo = nextMatch ? decodeURIComponent(nextMatch[1]) : null;
          hasNextPage = !!pageInfo;
        } else {
          hasNextPage = false;
        }
      } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error.message);
        throw error;
      }
    }

    return allItems;
  }

  /**
   * Fetch all customers
   */
  async getCustomers(limit = 250) {
    return this.fetchPaginated('/customers.json', limit);
  }

  /**
   * Fetch all orders
   */
  async getOrders(limit = 250, status = 'any', createdAfter = null) {
    const params = { limit, status };
    if (createdAfter) {
      params.created_at_min = createdAfter;
    }
    
    const orders = [];
    let hasNextPage = true;
    let pageInfo = null;

    while (hasNextPage) {
      try {
        if (pageInfo) {
          params.page_info = pageInfo;
        }

        const response = await this.client.get('/orders.json', { params });
        const fetchedOrders = response.data.orders || [];
        orders.push(...fetchedOrders);

        const linkHeader = response.headers['link'];
        if (linkHeader && linkHeader.includes('rel="next"')) {
          const nextMatch = linkHeader.match(/<[^>]+page_info=([^&>]+)/);
          pageInfo = nextMatch ? decodeURIComponent(nextMatch[1]) : null;
          hasNextPage = !!pageInfo;
        } else {
          hasNextPage = false;
        }
      } catch (error) {
        console.error('Error fetching orders:', error.message);
        throw error;
      }
    }

    return orders;
  }

  /**
   * Fetch all products
   */
  async getProducts(limit = 250) {
    return this.fetchPaginated('/products.json', limit);
  }

  /**
   * Verify connection to Shopify
   */
  async verifyConnection() {
    try {
      const response = await this.client.get('/shop.json');
      return {
        success: true,
        shop: response.data.shop
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get shop information
   */
  async getShop() {
    try {
      const response = await this.client.get('/shop.json');
      return response.data.shop;
    } catch (error) {
      throw new Error(`Failed to fetch shop info: ${error.message}`);
    }
  }
}

export default ShopifyService;

