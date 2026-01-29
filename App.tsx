
import React, { useState, useEffect } from "react";
import { UserRole, User, Report, Branch, Lead } from "./types";
import OperatorPanel from "./components/OperatorPanel";
import ManagerDashboard from "./components/ManagerDashboard";
import AdminPanel from "./components/AdminPanel";
import Login from "./components/Login";
import { dbService } from "./services/db";
import { Cloud, CloudOff, RefreshCw, Database, Download, X, Loader2 } from "lucide-react";

const INITIAL_BRANCHES: Branch[] = [
  { id: "main", name: "Bosh Ofis", location: "Toshkent shahri" },
  { id: "and", name: "Andijon Filiali", location: "Andijon" },
  { id: "bux", name: "Buxoro Filiali", location: "Buxoro" },
  { id: "fer", name: "Farg'ona Filiali", location: "Farg'ona" },
  { id: "jiz", name: "Jizzax Filiali", location: "Jizzax" },
  { id: "nam", name: "Namangan Filiali", location: "Namangan" },
  { id: "nav", name: "Navoiy Filiali", location: "Navoiy" },
  { id: "qash", name: "Qashqadaryo Filiali", location: "Qarshi" },
  { id: "qor", name: "Qoraqalpog'iston Filiali", location: "Nukus" },
  { id: "sam", name: "Samarqand Filiali", location: "Samarqand" },
  { id: "sir", name: "Sirdaryo Filiali", location: "Guliston" },
  { id: "sur", name: "Surxondaryo Filiali", location: "Termiz" },
  { id: "xor", name: "Xorazm Filiali", location: "Urganch" },
  { id: "tosh_v", name: "Toshkent Viloyat Filiali", location: "Nurafshon" },
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCloud, setIsCloud] = useState(false);
  const [showDbSettings, setShowDbSettings] = useState(false);
  const [dbUrl, setDbUrl] = useState(localStorage.getItem('supabase_url') || "");
  const [dbKey, setDbKey] = useState(localStorage.getItem('supabase_key') || "");

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [dbUsers, dbReports, dbLeads] = await Promise.all([
        dbService.fetchUsers(),
        dbService.fetchReports(),
        dbService.fetchLeads()
      ]);
      const ADMIN_PASS = "HAYOT-YO'LI.1234.";
      let finalUsers = dbUsers;
      if (!finalUsers.find(u => u.role === UserRole.ADMIN)) {
        const admin: User = { id: "admin1", name: "Admin", role: UserRole.ADMIN, password: ADMIN_PASS, isApproved: true, createdAt: new Date().toISOString() };
        await dbService.saveUser(admin);
        finalUsers = [admin, ...finalUsers];
      }
      setUsers(finalUsers);
      setReports(dbReports);
      setLeads(dbLeads);
      setIsCloud(dbService.isConnected());
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { setBranches(INITIAL_BRANCHES); loadAllData(); }, []);

  const handleLogin = (userData: User) => setUser(userData);
  const handleLogout = () => setUser(null);

  const handleDbSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dbService.updateConfig(dbUrl, dbKey);
    setShowDbSettings(false);
    window.location.reload();
  };

  const addReport = async (newReport: Report) => {
    await dbService.saveReport(newReport);
    setReports(prev => [newReport, ...prev]);
    if (newReport.leadId) setLeads(prev => prev.map(l => l.id === newReport.leadId ? { ...l, status: "called" } : l));
  };

  const handleLeadsUpload = async (newLeads: Lead[], operatorId?: string) => {
    const assignedLeads = newLeads.map(l => ({ ...l, assignedTo: operatorId, status: "new" as const }));
    await dbService.saveLeads(assignedLeads);
    setLeads(prev => [...prev, ...assignedLeads]);
  };

  const handleDistributeLeads = async (operatorId: string, count: number) => {
    const unassigned = leads.filter(l => !l.assignedTo && l.status === "new");
    if (unassigned.length < count) { alert(`Bazda faqat ${unassigned.length} ta mijoz bor.`); return; }
    const toAssign = unassigned.slice(0, count).map(l => l.id);
    const updated = leads.map(l => toAssign.includes(l.id) ? { ...l, assignedTo: operatorId } : l);
    for (const lId of toAssign) {
      const leadToUpdate = updated.find(l => l.id === lId);
      if (leadToUpdate) await dbService.updateLead(leadToUpdate);
    }
    setLeads(updated);
  };

  const deleteUser = async (userId: string) => {
    if (confirm("O'chirilsinmi?")) {
      await dbService.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
      <Loader2 className="animate-spin mb-6 text-indigo-400" size={64} />
      <h2 className="text-2xl font-black uppercase">NazoratHub</h2>
    </div>
  );

  if (!user) return <Login onLogin={handleLogin} branches={branches} allUsers={users} />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b px-8 py-4 sticky top-0 z-[100] flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black">N</div>
          <h1 className="text-sm font-black text-slate-900">NazoratHub</h1>
          <div className={`px-2 py-0.5 rounded-full flex items-center gap-1 border ${isCloud ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {isCloud ? <Cloud size={10} /> : <CloudOff size={10} />}
            <span className="text-[7px] font-black uppercase">{isCloud ? 'ONLINE' : 'LOCAL'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user.role === UserRole.ADMIN && (
            <button onClick={() => setShowDbSettings(true)} className="p-2.5 bg-slate-900 text-white rounded-xl"><Database size={18} /></button>
          )}
          <button onClick={loadAllData} className="p-2.5 bg-slate-100 rounded-xl"><RefreshCw size={18} /></button>
          <button onClick={handleLogout} className="text-[9px] font-black uppercase text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">Chiqish</button>
        </div>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto p-8">
        {showDbSettings && (
          <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative text-slate-900">
              <button onClick={() => setShowDbSettings(false)} className="absolute top-8 right-8 text-slate-300"><X size={24} /></button>
              <h2 className="text-xl font-black mb-6 uppercase">Baza Sozlamalari</h2>
              <form onSubmit={handleDbSettingsSubmit} className="space-y-4">
                <input required value={dbUrl} onChange={e => setDbUrl(e.target.value)} type="text" placeholder="Supabase URL" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 font-bold text-sm" />
                <input required value={dbKey} onChange={e => setDbKey(e.target.value)} type="password" placeholder="Anon Key" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 font-bold text-sm" />
                <button type="submit" className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl uppercase text-[10px]">SAQLASH</button>
              </form>
            </div>
          </div>
        )}
        {user.role === UserRole.OPERATOR && <OperatorPanel user={user} branch={branches.find(b => b.id === user.branchId) || branches[0]} leads={leads.filter(l => l.assignedTo === user.id && l.status === "new")} onReportSubmit={addReport} />}
        {user.role === UserRole.MANAGER && <ManagerDashboard reports={reports} branches={branches} leads={leads} users={users.filter(u => u.role === UserRole.OPERATOR)} onDistributeLeads={handleDistributeLeads} onLeadsUpload={handleLeadsUpload} />}
        {user.role === UserRole.ADMIN && <AdminPanel users={users.filter(u => u.role !== UserRole.ADMIN)} reports={reports} branches={branches} leads={leads} onAddUser={u => { dbService.saveUser(u); setUsers(p => [...p, u]); }} onUpdateUser={u => { dbService.saveUser(u); setUsers(p => p.map(x => x.id === u.id ? u : x)); }} onDeleteUser={deleteUser} onLeadsUpload={handleLeadsUpload} onDeleteLeads={() => {}} onDistributeLeads={handleDistributeLeads} onDeleteGeneralPool={() => { dbService.deleteLeads(l => !l.assignedTo); setLeads(p => p.filter(l => !!l.assignedTo)); }} />}
      </main>
    </div>
  );
};

export default App;
