
import React, { useState, useMemo } from 'react';
import { User, UserRole, Branch, Report, Lead } from '../types';
import { Trash2, Upload, X, Shield, Folder, Calendar, Download, UserPlus, Settings2, UserCheck, Share2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface AdminPanelProps {
  users: User[];
  reports: Report[];
  branches: Branch[];
  leads: Lead[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onLeadsUpload: (leads: Lead[], operatorId?: string) => void;
  onDeleteLeads: (operatorId: string) => void;
  onDistributeLeads: (operatorId: string, count: number) => void;
  onDeleteGeneralPool: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ users, reports, branches, leads, onAddUser, onUpdateUser, onDeleteUser, onLeadsUpload, onDeleteLeads, onDistributeLeads, onDeleteGeneralPool }) => {
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState<User | null>(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [distributeModal, setDistributeModal] = useState({show: false, operatorId: '', operatorName: ''});
  const [distributeCount, setDistributeCount] = useState<number>(50);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>(UserRole.OPERATOR);
  const [newPassword, setNewPassword] = useState('');
  const [newBranchId, setNewBranchId] = useState(branches[0]?.id || '');

  const unassignedLeadsCount = leads.filter(l => !l.assignedTo && l.status === 'new').length;

  const archivedData = useMemo(() => {
    const groups: Record<string, any> = {};
    reports.forEach(report => {
      const date = report.timestamp.split('T')[0];
      const opId = report.operatorId;
      if (!groups[date]) groups[date] = {};
      if (!groups[date][opId]) groups[date][opId] = { operator: users.find(u => u.id === opId), reports: [] };
      groups[date][opId].reports.push(report);
    });
    return groups;
  }, [reports, users]);

  const exportDayToExcel = (date: string) => {
    const dayData = archivedData[date];
    const rows: any[] = [];
    Object.values(dayData).forEach((group: any) => {
      group.reports.forEach((r: any) => {
        rows.push({ "Sana": date, "Hodim": group.operator?.name || r.operatorName, "Mijoz": r.clientName, "Natija": r.visitStatus, "Izoh": r.tasksCompleted });
      });
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Arxiv");
    XLSX.writeFile(wb, `Hisobot_${date}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white rounded-[3rem] p-8 border border-slate-200 shadow-sm space-y-8">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl"><Shield size={32} /></div>
            <div>
              <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Admin Nazorati</h2>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Boshqaruv</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setShowArchiveModal(true)} className="p-5 bg-indigo-600 text-white rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase shadow-xl"><Folder size={20} /> Arxiv</button>
            <button onClick={onDeleteGeneralPool} className="p-5 bg-white border border-slate-200 text-red-500 rounded-2xl shadow-sm hover:bg-red-50 transition-all"><Trash2 size={24} /></button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-slate-50 p-8 rounded-[2.5rem] border"><p className="text-[10px] font-black text-slate-400 uppercase mb-2">Bosh Bazada</p><p className="text-4xl font-black">{unassignedLeadsCount}</p></div>
          <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100"><p className="text-[10px] font-black text-emerald-600 uppercase mb-2">Taqsimlangan</p><p className="text-4xl font-black text-emerald-700">{leads.filter(l => !!l.assignedTo).length}</p></div>
          <div className="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100"><p className="text-[10px] font-black text-indigo-600 uppercase mb-2">Hisobotlar</p><p className="text-4xl font-black text-indigo-700">{reports.length}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {users.map(u => {
          const count = leads.filter(l => l.assignedTo === u.id && l.status === 'new').length;
          return (
            <div key={u.id} className="bg-white rounded-[3rem] p-8 border border-slate-200 shadow-sm relative">
               <div className="flex justify-between mb-8">
                  <div><h3 className="font-black text-slate-900 uppercase text-sm">{u.name}</h3><p className="text-[9px] font-black text-slate-400 uppercase">Parol: {u.password}</p></div>
                  <button onClick={() => onDeleteUser(u.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={18} /></button>
               </div>
               <div className="bg-slate-50 p-6 rounded-[2rem] mb-6 border flex justify-between items-center">
                  <p className="text-3xl font-black text-indigo-600">{count}</p>
                  <button onClick={() => setDistributeModal({show: true, operatorId: u.id, operatorName: u.name})} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[9px] uppercase">Biriktirish</button>
               </div>
            </div>
          );
        })}
      </div>

      {showArchiveModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-xl text-slate-900">
          <div className="bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl flex flex-col h-[90vh]">
            <div className="p-10 border-b flex justify-between items-center bg-slate-50/50">
               <h2 className="text-3xl font-black uppercase">Arxiv</h2>
               <button onClick={() => setShowArchiveModal(false)} className="p-5 bg-white shadow-sm text-slate-400 rounded-2xl"><X size={24} /></button>
            </div>
            <div className="flex-1 flex overflow-hidden">
               <div className="w-1/4 border-r overflow-y-auto p-6 bg-slate-50/30">
                  {Object.keys(archivedData).sort().reverse().map(date => (
                    <button key={date} onClick={() => setActiveDate(date)} className={`w-full p-6 rounded-3xl font-black text-sm mb-3 text-left ${activeDate === date ? 'bg-indigo-600 text-white' : 'bg-white border'}`}>
                       {date}
                    </button>
                  ))}
               </div>
               <div className="flex-1 overflow-y-auto p-10 bg-white">
                  {activeDate && (
                    <div className="space-y-10">
                       <button onClick={() => exportDayToExcel(activeDate)} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2"><Download size={18}/> Excel Yuklash</button>
                       {Object.entries(archivedData[activeDate]).map(([opId, group]: [string, any]) => (
                         <div key={opId} className="border-l-4 border-indigo-600 pl-8 space-y-6 mb-8">
                            <h4 className="font-black uppercase">{group.operator?.name || "Noma'lum"}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               {group.reports.map((r: any) => (
                                 <div key={r.id} className="bg-slate-50 p-5 rounded-2xl border text-sm">
                                    <div className="flex justify-between mb-3 font-black text-[10px]"><span>{r.clientName}</span><span>{r.timestamp.split('T')[1].substr(0, 5)}</span></div>
                                    <p className="italic text-slate-600">"{r.tasksCompleted}"</p>
                                 </div>
                               ))}
                            </div>
                         </div>
                       ))}
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
