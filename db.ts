
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, Report, Lead } from '../types';

// Default URL va KEY (Agar foydalanuvchi o'zgartirmasa)
const DEFAULT_URL = "https://bexbgtsstrqdskaltgvh.supabase.co";
const DEFAULT_KEY = "sb_secret_iOFa3u-g-BnaQrbnMTOlag_jvXdskp2";

const SUPABASE_URL = localStorage.getItem('supabase_url') || DEFAULT_URL;
const SUPABASE_KEY = localStorage.getItem('supabase_key') || DEFAULT_KEY;

let supabase: SupabaseClient | null = null;
try {
  if (SUPABASE_URL && SUPABASE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
} catch (e) {
  console.warn("Supabase ulanishida xato, offline rejimda ishlaymiz.");
}

export const dbService = {
  isConnected: () => !!supabase,

  updateConfig(url: string, key: string) {
    localStorage.setItem('supabase_url', url);
    localStorage.setItem('supabase_key', key);
    window.location.reload();
  },

  async fetchUsers(): Promise<User[]> {
    try {
      if (!supabase) throw new Error();
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      return data || [];
    } catch (e) {
      return JSON.parse(localStorage.getItem('nazorat_users') || '[]');
    }
  },

  async saveUser(user: User) {
    const localUsers = JSON.parse(localStorage.getItem('nazorat_users') || '[]');
    const updated = [...localUsers.filter((u: any) => u.id !== user.id), user];
    localStorage.setItem('nazorat_users', JSON.stringify(updated));
    if (supabase) await supabase.from('users').upsert(user);
  },

  async deleteUser(userId: string) {
    const localUsers = JSON.parse(localStorage.getItem('nazorat_users') || '[]');
    localStorage.setItem('nazorat_users', JSON.stringify(localUsers.filter((u: any) => u.id !== userId)));
    if (supabase) await supabase.from('users').delete().eq('id', userId);
  },

  async fetchReports(): Promise<Report[]> {
    try {
      if (!supabase) throw new Error();
      const { data, error } = await supabase.from('reports').select('*').order('timestamp', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      return JSON.parse(localStorage.getItem('nazorat_reports') || '[]');
    }
  },

  async saveReport(report: Report) {
    const localReports = JSON.parse(localStorage.getItem('nazorat_reports') || '[]');
    localStorage.setItem('nazorat_reports', JSON.stringify([report, ...localReports]));
    if (supabase) await supabase.from('reports').insert(report);
  },

  async fetchLeads(): Promise<Lead[]> {
    try {
      if (!supabase) throw new Error();
      const { data, error } = await supabase.from('leads').select('*');
      if (error) throw error;
      return data || [];
    } catch (e) {
      return JSON.parse(localStorage.getItem('nazorat_leads') || '[]');
    }
  },

  async saveLeads(leads: Lead[]) {
    if (supabase) await supabase.from('leads').upsert(leads);
  },

  async updateLead(lead: Lead) {
    if (supabase) await supabase.from('leads').upsert(lead);
  },

  async deleteLeads(condition: (l: Lead) => boolean) {
    const allLeads = await this.fetchLeads();
    const toDelete = allLeads.filter(condition).map(l => l.id);
    if (supabase && toDelete.length > 0) {
      await supabase.from('leads').delete().in('id', toDelete);
    }
  },

  async exportFullBackup() {
    const [users, reports, leads] = await Promise.all([
      this.fetchUsers(),
      this.fetchReports(),
      this.fetchLeads()
    ]);
    return { users, reports, leads, exportDate: new Date().toISOString() };
  }
};
