
export enum BillingCycle {
  MONTHLY = 'Monthly',
  YEARLY = 'Yearly',
}

export interface Subscription {
  id: string;
  name: string;
  cost: number;
  currency: string;
  billingCycle: BillingCycle;
  nextBillingDate: string; // ISO format
  category?: string;
}

export interface AppState {
  subscriptions: Subscription[];
  isPremium: boolean;
  totalMonthlySpend: number;
}
