
import React, { useState, useMemo } from 'react';
import { Report, Branch, User, Lead } from '../types';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Sparkles, Users, UserPlus, UserCheck, X, Phone, Upload } from 'lucide-react';
import { analyzeDailyReports } from '../services/gemini';
import * as XLSX from 'xlsx';

interface ManagerDashboardProps {
  reports: Report[];
  branches: Branch[];
  leads: Lead[];
  users: User[];
  onDistributeLeads: (operatorId: string, count: number) => void;
  onLeadsUpload: (leads: Lead[], operatorId?: string) => void;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ reports, branches, leads, users, onDistributeLeads, onLeadsUpload }) => {
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showGeneralAddModal, setShowGeneralAddModal] = useState(false);
  const [distributeModal, setDistributeModal] = useState({show: false, operatorId: '', operatorName: ''});
  const [distributeCount, setDistributeCount] = useState<number>(10);
  const [manualLead, setManualLead] = useState({ name: '', surname: '', phone: '' });

  const filteredReports = reports.filter(r => selectedBranch === 'all' || r.branchId === selectedBranch);
  const filteredOperators = users.filter(u => selectedBranch === 'all' || u.branchId === selectedBranch);

  const stats = useMemo(() => {
    const total = filteredReports.length;
    const willCome = filteredReports.filter(r => r.visitStatus === 'will_come').length;
    const thinking = filteredReports.filter(r => r.visitStatus === 'thinking').length;
    const wontCome = filteredReports.filter(r => r.visitStatus === 'wont_come').length;
    return { total, willCome, thinking, wontCome, conversion: total > 0 ? Math.round((willCome / total) * 100) : 0 };
  }, [filteredReports]);

  const pieData = [
    { name: 'Keladi', value: stats.willCome, color: '#10b981' },
    { name: 'O\'ylayapti', value: stats.thinking, color: '#f59e0b' },
    { name: 'Kelmaydi', value: stats.wontCome, color: '#ef4444' },
  ];

  const unassignedLeadsCount = leads.filter(l => !l.assignedTo && l.status === 'new').length;

  const runAiAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzeDailyReports(filteredReports);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      const results: Lead[] = jsonData.slice(1).map(row => ({
        id: Math.random().toString(36).substr(2, 9),
        name: String(row[0] || 'Noma\'lum'),
        surname: String(row[1] || ''),
        school: '',
        phone: String(row[2] || ''),
        status: 'new'
      }));
      onLeadsUpload(results);
      alert(`${results.length} ta mijoz yuklandi!`);
    } catch (err) { alert("Xato!"); }
    e.target.value = '';
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase">Menejer Boshqaruvi</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mijozlarni taqsimlash</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} className="text-xs font-black border-2 border-slate-50 text-indigo-600 bg-indigo-50 px-6 py-3 rounded-2xl uppercase">
            <option value="all">Barcha Filiallar</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <input type="file" accept=".xlsx, .xls" id="mgr-ex-up" className="hidden" onChange={handleFileSelect} />
          <label htmlFor="mgr-ex-up" className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 cursor-pointer shadow-lg"><Upload size={14} /> Excel Yuklash</label>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50">
          <p className="text-[10px] text-slate-400 font-black uppercase mb-2">Konversiya</p>
          <p className="text-4xl font-black text-indigo-600">{stats.conversion}%</p>
        </div>
        <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100">
          <p className="text-[10px] text-emerald-600 font-black uppercase mb-2">Keladiganlar</p>
          <p className="text-4xl font-black text-emerald-700">{stats.willCome}</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50">
          <p className="text-[10px] text-slate-400 font-black uppercase mb-2">Jami Suhbat</p>
          <p className="text-4xl font-black text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
          <p className="text-[10px] opacity-40 font-black uppercase mb-2">Bosh Bazada</p>
          <p className="text-4xl font-black">{unassignedLeadsCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOperators.map(op => {
          const count = leads.filter(l => l.assignedTo === op.id && l.status === 'new').length;
          return (
            <div key={op.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
              <h4 className="font-black text-slate-900 uppercase text-sm mb-6">{op.name}</h4>
              <div className="flex justify-between items-center bg-slate-50 p-5 rounded-2xl mb-8 border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase">Mijozlar:</span>
                <span className="text-2xl font-black text-indigo-600">{count}</span>
              </div>
              <button onClick={() => setDistributeModal({show: true, operatorId: op.id, operatorName: op.name})} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[9px] uppercase shadow-lg">Biriktirish</button>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-slate-800 mb-8 uppercase">Natijalar (Kelish holati)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-indigo-600 p-10 rounded-[3rem] text-white flex flex-col justify-between">
          <h3 className="text-2xl font-black mb-4 uppercase"><Sparkles className="text-yellow-400 inline" /> AI Tahlil</h3>
          <div className="bg-white/10 p-6 rounded-3xl border border-white/20 h-48 overflow-y-auto text-sm italic">
            {aiAnalysis || "Tahlil olish uchun tugmani bosing."}
          </div>
          <button onClick={runAiAnalysis} disabled={isAnalyzing || stats.total === 0} className="mt-6 bg-white text-indigo-600 py-6 rounded-[2rem] font-black uppercase text-xs">
            {isAnalyzing ? "Tahlil qilinmoqda..." : "AI Tahlilini Boshlash"}
          </button>
        </div>
      </div>

      {distributeModal.show && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-12 shadow-2xl text-center">
            <h2 className="text-xl font-black mb-2 text-slate-800 uppercase">Taqsimlash</h2>
            <p className="text-[10px] font-black text-indigo-600 mb-10 uppercase">{distributeModal.operatorName}</p>
            <input type="number" value={distributeCount} onChange={e => setDistributeCount(parseInt(e.target.value) || 0)} className="w-full px-8 py-8 rounded-[2rem] bg-slate-50 text-center font-black text-5xl" />
            <button onClick={() => { onDistributeLeads(distributeModal.operatorId, distributeCount); setDistributeModal({show: false, operatorId: '', operatorName: ''}); }} className="w-full bg-slate-900 text-white font-black py-7 rounded-[2.5rem] uppercase mt-8">TASDIQLASH</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
