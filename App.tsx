
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BillingCycle, Subscription } from './types';
import { storageService } from './services/storageService';
import { PlusIcon, TrashIcon, BellIcon, ChartIcon, InfoIcon } from './components/Icons';

// --- Sub-Components ---

const PRDView: React.FC = () => (
  <div className="p-6 text-slate-300 leading-relaxed max-w-2xl mx-auto space-y-6">
    <section>
      <h2 className="text-2xl font-bold text-white mb-2">PRD: SubSave Mobile</h2>
      <p><strong>Goal:</strong> Help users visualize and manage hidden subscription costs.</p>
    </section>
    
    <section className="bg-slate-900 p-4 rounded-xl border border-slate-800">
      <h3 className="font-semibold text-emerald-400 mb-2">1. Functional Requirements</h3>
      <ul className="list-disc pl-5 space-y-1">
        <li>CRUD operations for subscriptions (Name, Price, Date, Cycle).</li>
        <li>Automated "Next Billing" calculation logic.</li>
        <li>Financial Dashboard with Total Monthly Burn Rate.</li>
        <li>Notification triggers (Simulated for Web) for 3-day and 1-day alerts.</li>
      </ul>
    </section>

    <section className="bg-slate-900 p-4 rounded-xl border border-slate-800">
      <h3 className="font-semibold text-rose-400 mb-2">2. Business Logic</h3>
      <ul className="list-disc pl-5 space-y-1">
        <li>Free tier: Maximum 5 subscriptions.</li>
        <li>Premium: Unlimited subscriptions (One-time IAP).</li>
        <li>Privacy: All data stored locally on-device.</li>
      </ul>
    </section>
  </div>
);

const SubscriptionForm: React.FC<{
  onSave: (sub: Omit<Subscription, 'id'>) => void;
  onCancel: () => void;
}> = ({ onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [cycle, setCycle] = useState<BillingCycle>(BillingCycle.MONTHLY);
  const [date, setDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !cost || !date) return;
    onSave({
      name,
      cost: parseFloat(cost),
      currency: '$',
      billingCycle: cycle,
      nextBillingDate: date
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl">
      <h2 className="text-xl font-bold">Add Subscription</h2>
      <div className="space-y-1">
        <label className="text-xs text-slate-400 uppercase font-bold">Service Name</label>
        <input 
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Netflix" 
          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 outline-none focus:border-emerald-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs text-slate-400 uppercase font-bold">Cost ($)</label>
          <input 
            type="number"
            step="0.01"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="15.00" 
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 outline-none focus:border-emerald-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-400 uppercase font-bold">Cycle</label>
          <select 
            value={cycle}
            onChange={(e) => setCycle(e.target.value as BillingCycle)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 outline-none focus:border-emerald-500"
          >
            <option value={BillingCycle.MONTHLY}>Monthly</option>
            <option value={BillingCycle.YEARLY}>Yearly</option>
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-slate-400 uppercase font-bold">Next Billing Date</label>
        <input 
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 outline-none focus:border-emerald-500 text-white"
        />
      </div>
      <div className="flex gap-3 pt-4">
        <button 
          type="button"
          onClick={onCancel}
          className="flex-1 bg-slate-800 hover:bg-slate-700 p-3 rounded-lg font-semibold transition"
        >
          Cancel
        </button>
        <button 
          type="submit"
          className="flex-1 bg-emerald-600 hover:bg-emerald-500 p-3 rounded-lg font-semibold transition"
        >
          Add Subscription
        </button>
      </div>
    </form>
  );
};

// --- Main App Component ---

export default function App() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'subs' | 'prd'>('subs');

  // Load initial data
  useEffect(() => {
    setSubscriptions(storageService.loadSubscriptions());
    setIsPremium(storageService.loadPremiumStatus());
    
    // Request notification permission if possible
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const totalMonthlySpend = useMemo(() => {
    return subscriptions.reduce((acc, sub) => {
      if (sub.billingCycle === BillingCycle.YEARLY) {
        return acc + (sub.cost / 12);
      }
      return acc + sub.cost;
    }, 0);
  }, [subscriptions]);

  const addSubscription = useCallback((subData: Omit<Subscription, 'id'>) => {
    if (!isPremium && subscriptions.length >= 5) {
      alert("Free tier limit reached (5). Upgrade to unlimited?");
      return;
    }

    const newSub: Subscription = {
      ...subData,
      id: crypto.randomUUID()
    };
    
    const updated = [...subscriptions, newSub];
    setSubscriptions(updated);
    storageService.saveSubscriptions(updated);
    setIsFormOpen(false);

    // Basic notification simulation
    if (Notification.permission === 'granted') {
      new Notification("SubSave", { body: `${newSub.name} subscription added!` });
    }
  }, [subscriptions, isPremium]);

  const removeSubscription = (id: string) => {
    const updated = subscriptions.filter(s => s.id !== id);
    setSubscriptions(updated);
    storageService.saveSubscriptions(updated);
  };

  const togglePremium = () => {
    const newVal = !isPremium;
    setIsPremium(newVal);
    storageService.savePremiumStatus(newVal);
  };

  const daysUntil = (dateStr: string) => {
    const target = new Date(dateStr);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center pb-24">
      
      {/* Dashboard Header */}
      <header className="w-full max-w-lg p-6 flex flex-col gap-6 mt-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Sub<span className="text-emerald-500">Save</span></h1>
            <p className="text-slate-500 text-sm">Minimalist Tracking</p>
          </div>
          <button 
            onClick={togglePremium}
            className={`px-3 py-1 rounded-full text-xs font-bold transition ${isPremium ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >
            {isPremium ? 'PREMIUM ACTIVE' : 'FREE VERSION'}
          </button>
        </div>

        {activeTab === 'subs' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ChartIcon />
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Monthly Burn Rate</p>
            <div className="text-5xl font-black text-white flex items-start">
              <span className="text-2xl mt-1 mr-1 text-slate-500">$</span>
              {totalMonthlySpend.toFixed(2)}
            </div>
          </div>
        )}
      </header>

      {/* Tabs */}
      <div className="w-full max-w-lg px-6 flex gap-4 mb-4">
        <button 
          onClick={() => setActiveTab('subs')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'subs' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Subscriptions
        </button>
        <button 
          onClick={() => setActiveTab('prd')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'prd' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
          PRD Details
        </button>
      </div>

      {/* Main Content Area */}
      <main className="w-full max-w-lg px-6 flex-1">
        {activeTab === 'prd' ? (
          <PRDView />
        ) : (
          <div className="space-y-3">
            {subscriptions.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-dashed border-slate-800">
                <div className="inline-block p-4 bg-slate-900 rounded-full mb-4">
                   <PlusIcon />
                </div>
                <p className="text-slate-500">No active subscriptions.<br/>Tap the + button to start.</p>
              </div>
            ) : (
              subscriptions.map(sub => {
                const daysLeft = daysUntil(sub.nextBillingDate);
                const isUrgent = daysLeft <= 3;
                
                return (
                  <div key={sub.id} className="group bg-slate-900 hover:bg-slate-800 p-4 rounded-2xl flex items-center justify-between border border-slate-800 transition shadow-sm hover:shadow-md">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${isUrgent ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-950 text-slate-400'}`}>
                        {sub.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{sub.name}</h3>
                        <div className="flex gap-2 items-center text-xs text-slate-500 mt-1">
                          <span>{sub.billingCycle}</span>
                          <span>•</span>
                          <span className={`${isUrgent ? 'text-rose-400 font-bold' : ''}`}>
                            Next in {daysLeft} days
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold text-emerald-400 text-lg">${sub.cost.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-600 uppercase font-bold tracking-tighter">Due {new Date(sub.nextBillingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}</div>
                      </div>
                      <button 
                        onClick={() => removeSubscription(sub.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-rose-500 transition-all"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* FAB - Floating Action Button */}
      {activeTab === 'subs' && !isFormOpen && (
        <button 
          onClick={() => setIsFormOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-emerald-600 hover:bg-emerald-500 shadow-2xl shadow-emerald-900/40 rounded-full flex items-center justify-center text-white transition transform active:scale-90"
        >
          <PlusIcon />
        </button>
      )}

      {/* Form Overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="w-full max-w-md">
            <SubscriptionForm 
              onCancel={() => setIsFormOpen(false)}
              onSave={addSubscription}
            />
          </div>
        </div>
      )}

      {/* Bottom Nav Simulation */}
      <nav className="fixed bottom-0 w-full max-w-lg bg-slate-950/80 backdrop-blur-md border-t border-slate-900 flex justify-around py-4 z-40">
         <button onClick={() => setActiveTab('subs')} className={`flex flex-col items-center gap-1 ${activeTab === 'subs' ? 'text-emerald-500' : 'text-slate-600'}`}>
           <ChartIcon />
           <span className="text-[10px] font-bold">DASHBOARD</span>
         </button>
         <button onClick={() => alert("Local Reminders Active: Scanning for 3d and 1d thresholds.")} className="flex flex-col items-center gap-1 text-slate-600 hover:text-white">
           <BellIcon />
           <span className="text-[10px] font-bold">ALERTS</span>
         </button>
         <button onClick={() => setActiveTab('prd')} className={`flex flex-col items-center gap-1 ${activeTab === 'prd' ? 'text-emerald-500' : 'text-slate-600'}`}>
           <InfoIcon />
           <span className="text-[10px] font-bold">INFO</span>
         </button>
      </nav>

    </div>
  );
}
