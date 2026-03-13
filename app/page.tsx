"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Mail, Send, RefreshCw, Sparkles, MessageSquare, CheckCircle2, AlertCircle, Inbox } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = "https://hafeezaqsa01-email-agent.hf.space/api";

export default function EmailDashboard() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const isSyncing = useRef<boolean>(false);

  const syncEmails = async (showLoad: boolean = false) => {
    if (isSyncing.current) return;
    if (showLoad) setLoading(true);
    isSyncing.current = true;

    try {
      const res = await axios.get(`${API_BASE_URL}/process`);
      if (res.data.status === "success") {
        setEmails(res.data.data);
      }
    } catch (e) {
      console.error("Sync failed");
    } finally {
      setLoading(false);
      isSyncing.current = false;
    }
  };

  const handleApproveAndSend = async (emailId: string) => {
    try {
      showStatus('loading', "Sending AI generated reply...");
      const res = await axios.post(`${API_BASE_URL}/approve-and-send`, { email_id: emailId });

      if (res.data.status === "success") {
        showStatus('success', "Reply sent successfully!");
        setEmails((prev) => prev.map(e => e.id === emailId ? { ...e, is_sent: true } : e));
      }
    } catch (error) {
      showStatus('error', "Failed to send the message.");
    }
  };

  const showStatus = (type: string, text: string) => {
    setStatusMsg({ type, text });
    if (type !== 'loading') setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
  };

  useEffect(() => {
    syncEmails(true);
    // AUTO REFRESH: Every 10 seconds
    const interval = setInterval(() => syncEmails(false), 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto">
        
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Sparkles className="text-blue-600 fill-blue-600" /> Smart Email Agent
            </h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
              Automated Monitoring Active
            </p>
          </div>
          <button onClick={() => syncEmails(true)} className="p-3 hover:bg-slate-50 rounded-2xl transition-all">
            <RefreshCw size={20} className={loading ? "animate-spin text-blue-600" : "text-slate-400"} />
          </button>
        </header>

        {statusMsg.text && (
          <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 shadow-lg ${
            statusMsg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-slate-900 text-white'
          }`}>
            {statusMsg.type === 'loading' ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
            <span className="text-sm font-bold">{statusMsg.text}</span>
          </div>
        )}

        <div className="space-y-6">
          {emails.length === 0 && !loading ? (
            <div className="bg-white rounded-[2.5rem] p-24 text-center border-2 border-dashed border-slate-200">
              <Inbox className="mx-auto text-slate-100 mb-4" size={64} />
              <p className="text-slate-400 font-bold text-lg">Your inbox is clear.</p>
            </div>
          ) : (
            emails.map((email) => (
              <div key={email.id} className={`bg-white rounded-[2.5rem] p-8 border-2 transition-all duration-300 ${
                email.is_sent ? 'border-green-50 opacity-60' : 'border-white shadow-xl shadow-slate-200/40'
              }`}>
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">{email.subject}</h3>
                    <p className="text-blue-500 font-bold text-sm">{email.sender}</p>
                  </div>
                  {email.is_sent && <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase">Delivered</span>}
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100 text-sm text-slate-500 italic">
                  "{email.snippet}"
                </div>

                {!email.is_sent && email.ai_draft && (
                  <div className="bg-blue-50/40 rounded-3xl p-6 border border-blue-100 mb-6">
                    <div className="flex items-center gap-2 mb-3 text-blue-600 text-[10px] font-black uppercase tracking-widest">
                      <MessageSquare size={16} /> AI Suggested Response
                    </div>
                    <p className="text-sm text-slate-700 font-medium whitespace-pre-line">{email.ai_draft}</p>
                  </div>
                )}

                {!email.is_sent && (
                  <div className="flex justify-end">
                    <button 
                      onClick={() => handleApproveAndSend(email.id)} 
                      className="bg-slate-900 hover:bg-black text-white px-10 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95"
                    >
                      <Send size={18} /> Approve & Send
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}