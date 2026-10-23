import { API_BASE_URL } from '@/config/apiConfig';

declare global {
    interface Window {
        Cashfree?: (config: { mode: 'sandbox' | 'production' }) => {
            checkout: (options: {
                paymentSessionId: string;
                redirectTarget?: '_modal' | '_self' | '_blank';
                returnUrl?: string;
            }) => Promise<{
                error?: { message: string; code?: string };
                redirect?: boolean;
                paymentDetails?: any;
            }>;
        };
    }
}

/**
 * Dynamically loads the Cashfree Payments Web SDK v3 script.
 */
export function loadCashfreeSDK(): Promise<any> {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
            return reject(new Error('Cashfree SDK can only be loaded in browser environment.'));
        }

        if (window.Cashfree) {
            return resolve(window.Cashfree);
        }

        const scriptId = 'cashfree-js-sdk-v3';
        const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

        if (existingScript) {
            if (window.Cashfree) {
                return resolve(window.Cashfree);
            }
            existingScript.addEventListener('load', () => resolve(window.Cashfree));
            existingScript.addEventListener('error', (err) => reject(err));
            return;
        }

        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
        script.async = true;
        script.onload = () => {
            if (window.Cashfree) {
                resolve(window.Cashfree);
            } else {
                reject(new Error('Cashfree SDK loaded but window.Cashfree is not defined.'));
            }
        };
        script.onerror = () => {
            reject(new Error('Failed to load Cashfree Payments SDK script from cashfree.com.'));
        };

        document.body.appendChild(script);
    });
}

/**
 * Launch Cashfree Checkout modal or redirect.
 */
export async function launchCashfreeCheckout({
    paymentSessionId,
    mode = 'SANDBOX',
    redirectTarget = '_modal',
}: {
    paymentSessionId: string;
    mode?: 'SANDBOX' | 'PRODUCTION';
    redirectTarget?: '_modal' | '_self' | '_blank';
}): Promise<{
    success: boolean;
    error?: string;
    raw?: any;
}> {
    const CashfreeConstructor = await loadCashfreeSDK();
    const sdkMode = mode === 'PRODUCTION' ? 'production' : 'sandbox';
    const cashfree = CashfreeConstructor({ mode: sdkMode });

    try {
        const result = await cashfree.checkout({
            paymentSessionId,
            redirectTarget,
        });

        if (result?.error) {
            return {
                success: false,
                error: result.error.message || 'Payment was cancelled or failed.',
                raw: result,
            };
        }

        return {
            success: true,
            raw: result,
        };
    } catch (err: any) {
        return {
            success: false,
            error: err.message || 'An unexpected error occurred during Cashfree checkout.',
            raw: err,
        };
    }
}

/**
 * Verify payment with backend Cashfree verification endpoint.
 */
export async function verifyCashfreePayment(orderId: string): Promise<{
    success: boolean;
    is_paid: boolean;
    order_id: string;
    payment_status?: string;
    order_status?: string;
    error?: string;
}> {
    const res = await fetch(`${API_BASE_URL}/payments/cashfree/verify/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order_id: orderId }),
    });

    const data = await res.json();
    return data;
}
