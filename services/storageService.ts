
import { Subscription } from '../types';

const STORAGE_KEY = 'subsave_data';

export const storageService = {
  saveSubscriptions: (subs: Subscription[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
  },

  loadSubscriptions: (): Subscription[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  savePremiumStatus: (isPremium: boolean) => {
    localStorage.setItem('subsave_premium', JSON.stringify(isPremium));
  },

  loadPremiumStatus: (): boolean => {
    const data = localStorage.getItem('subsave_premium');
    return data ? JSON.parse(data) : false;
  }
};
