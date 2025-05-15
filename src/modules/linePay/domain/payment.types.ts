export interface PaymentEnum {
  type: 'success' | 'error' | 'pending' | null;
  message: string;
}

export interface PaymentFormData {
  amount: string;
}

export interface PaymentResult {
  success: boolean;
  redirectUrl?: string;
  error?: string;
}

export interface UserAssets {
  diamonds: number;
  hearts: number;
  bubbles: number;
  coins: number;
}
