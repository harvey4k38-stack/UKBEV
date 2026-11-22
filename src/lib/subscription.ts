import type { SubscriptionFrequency } from '../types';

export const FREQ_DAYS: Record<SubscriptionFrequency, number> = { weekly: 7, fortnightly: 14, monthly: 30 };

/** Average deliveries in a calendar month for each frequency. */
export const DELIVERIES_PER_MONTH: Record<SubscriptionFrequency, number> = {
  weekly: 52 / 12,
  fortnightly: 26 / 12,
  monthly: 1,
};

export const perMonth = (perDelivery: number, f: SubscriptionFrequency) => perDelivery * DELIVERIES_PER_MONTH[f];
