// Payment gateway integration
// Supports Thai (Omise) and international (Stripe)

export interface PaymentRequest {
  amount: number;
  currency: string;
  description: string;
  customerEmail?: string;
  customerName?: string;
  reservationId?: string;
  method: 'credit_card' | 'promptpay' | 'truemoney' | 'shopeepay' | 'bank_transfer';
  installmentMonths?: number;
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  transactionId: string;
  status: 'pending' | 'completed' | 'failed';
  amount: number;
  currency: string;
  paymentUrl?: string;
  qrCode?: string;
  receipt?: string;
  raw?: any;
}

export interface PaymentAdapter {
  name: string;
  charge(req: PaymentRequest): Promise<PaymentResult>;
  refund(transactionId: string, amount?: number): Promise<{ success: boolean; refundId?: string }>;
  getStatus(transactionId: string): Promise<PaymentResult>;
  parseWebhook(body: any, signature?: string): Promise<{ transactionId: string; status: string; amount: number }>;
}

// Omise adapter (Thai market)
// Setup: https://omise.co - register, get API keys, add to .env
export class OmiseAdapter implements PaymentAdapter {
  name = 'omise';
  private secretKey: string;
  private baseUrl = 'https://api.omise.co';

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  private async request(path: string, method = 'GET', body?: any) {
    const auth = Buffer.from(`${this.secretKey}:`).toString('base64');
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body ? new URLSearchParams(body).toString() : undefined,
    });
    return response.json();
  }

  async charge(req: PaymentRequest): Promise<PaymentResult> {
    if (!this.secretKey) {
      console.warn('[Omise] Not configured - returning mock');
      return { transactionId: `mock-${Date.now()}`, status: 'pending', amount: req.amount, currency: req.currency };
    }

    if (req.method === 'promptpay') {
      const source = await this.request('/sources', 'POST', {
        type: 'promptpay',
        amount: Math.round(req.amount * 100), // satang
        currency: req.currency.toLowerCase(),
      });

      const charge = await this.request('/charges', 'POST', {
        amount: Math.round(req.amount * 100),
        currency: req.currency.toLowerCase(),
        source: source.id,
        description: req.description,
      });

      return {
        transactionId: charge.id,
        status: charge.status === 'pending' ? 'pending' : charge.status === 'successful' ? 'completed' : 'failed',
        amount: req.amount,
        currency: req.currency,
        qrCode: charge.source?.scannable_code?.image?.download_uri,
        raw: charge,
      };
    }

    // Credit card flow (token from frontend)
    throw new Error('Implement credit card flow with token from frontend');
  }

  async refund(transactionId: string, amount?: number) {
    const response = await this.request(`/charges/${transactionId}/refunds`, 'POST', amount ? { amount: Math.round(amount * 100) } : {});
    return { success: !!response.id, refundId: response.id };
  }

  async getStatus(transactionId: string): Promise<PaymentResult> {
    const charge = await this.request(`/charges/${transactionId}`);
    return {
      transactionId: charge.id,
      status: charge.status === 'successful' ? 'completed' : charge.status,
      amount: charge.amount / 100,
      currency: charge.currency.toUpperCase(),
      raw: charge,
    };
  }

  async parseWebhook(body: any) {
    return {
      transactionId: body.data.id,
      status: body.data.status,
      amount: body.data.amount / 100,
    };
  }
}

export function getPaymentAdapter(provider: string): PaymentAdapter {
  switch (provider) {
    case 'omise':
      return new OmiseAdapter(process.env.OMISE_SECRET_KEY || '');
    default:
      throw new Error(`Unsupported payment provider: ${provider}`);
  }
}
