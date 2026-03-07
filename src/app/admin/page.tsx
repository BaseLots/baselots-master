'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Loader2, Users, DollarSign, Download } from "lucide-react";

interface AdminData {
  waitlist: any[];
  investments: any[];
  stats: {
    totalLeads: number;
    totalInvested: number;
  };
}

export default function AdminPage() {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/data?pw=${password}&_t=${Date.now()}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
        setAuthenticated(true);
      } else {
        alert("Invalid password");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated || !data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl">
          <h1 className="text-2xl font-bold text-white mb-6">Admin Access</h1>
          <input
            type="password"
            placeholder="Enter Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-14 bg-black border border-white/10 rounded-xl px-4 text-white mb-4"
          />
          <button
            onClick={fetchAdminData}
            className="w-full h-14 bg-gradient-to-r from-cyan-500 to-orange-500 text-white rounded-xl font-bold hover:opacity-90 transition-all"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" /> : "Access Dashboard"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold">Lead <span className="text-orange-400">Management</span></h1>
          <button onClick={() => window.location.reload()} className="text-white/40 hover:text-white">Logout</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
            <div className="flex items-center gap-4 mb-2 text-white/40">
              <Users size={20} />
              <span className="text-sm font-bold uppercase tracking-widest">Total Leads</span>
            </div>
            <p className="text-5xl font-bold text-cyan-400">{data.stats.totalLeads}</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
            <div className="flex items-center gap-4 mb-2 text-white/40">
              <DollarSign size={20} />
              <span className="text-sm font-bold uppercase tracking-widest">Total Pledged</span>
            </div>
            <p className="text-5xl font-bold text-orange-400">${data.stats.totalInvested.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-xl font-bold">Waitlist Signups</h2>
            <button className="text-xs font-bold uppercase tracking-widest text-cyan-400 hover:text-white flex items-center gap-2">
              <Download size={14} /> Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-white/40 text-xs font-bold uppercase tracking-widest">
                  <th className="p-6">Email</th>
                  <th className="p-6">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.waitlist.map((lead: any) => {
                  const dateStr = lead.signupDate || lead.createdAt;
                  const formattedDate = dateStr
                    ? new Date(dateStr).toLocaleDateString()
                    : 'N/A';
                  return (
                    <tr key={lead._id}>
                      <td className="p-6 font-medium">{lead.email}</td>
                      <td className="p-6 text-white/60">{formattedDate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
