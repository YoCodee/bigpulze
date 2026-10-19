'use client';

import React, { useState, useEffect } from 'react';
import { RoleGuard } from '@/components/role-guard';
import { formatRupiah } from '@/lib/format';
import {
  Store,
  Plus,
  MapPin,
  Target,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  location: string;
  daily_target: number;
  is_active: boolean;
  created_at: string;
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [dailyTarget, setDailyTarget] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);

  useEffect(() => {
    loadBranches();
  }, []);

  async function loadBranches() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/branches');
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message || 'Gagal memuat cabang.');
      }
      setBranches(json.data || []);
    } catch (err) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingBranch(null);
    setName('');
    setLocation('');
    setDailyTarget('0');
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  }

  function openEditModal(branch: Branch) {
    setEditingBranch(branch);
    setName(branch.name);
    setLocation(branch.location);
    setDailyTarget(branch.daily_target.toString());
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const targetVal = parseInt(dailyTarget.replace(/\D/g, ''), 10) || 0;

    try {
      if (editingBranch) {
        // PATCH
        const res = await fetch(`/api/branches/${editingBranch.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            location,
            daily_target: targetVal,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error?.message || 'Gagal memperbarui cabang.');
        }
        setSuccessMsg(`Cabang "${name}" berhasil diperbarui.`);
      } else {
        // POST
        const res = await fetch('/api/branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            location,
            daily_target: targetVal,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error?.message || 'Gagal menambahkan cabang.');
        }
        setSuccessMsg(`Cabang "${name}" berhasil ditambahkan.`);
      }

      setIsModalOpen(false);
      loadBranches();
    } catch (err) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSoftDelete() {
    if (!deletingBranch) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/branches/${deletingBranch.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message || 'Gagal menonaktifkan cabang.');
      }
      setSuccessMsg(`Cabang "${deletingBranch.name}" berhasil dinonaktifkan.`);
      setDeletingBranch(null);
      loadBranches();
    } catch (err) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const activeBranchCount = branches.filter((b) => b.is_active).length;
  const isLimitReached = activeBranchCount >= 5;

  return (
    <RoleGuard allowedRoles={['OWNER']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-slate-900">Kelola Cabang</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isLimitReached ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {activeBranchCount} / 5 Cabang Aktif
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Kelola cabang operasional (maksimal 5 cabang) dan target omzet harian
            </p>
          </div>

          <button
            onClick={openCreateModal}
            disabled={isLimitReached}
            className={`inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition ${
              isLimitReached
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah Cabang
          </button>
        </div>

        {/* Feedback alerts */}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800 text-xs">
              Tutup
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-red-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-600 hover:text-red-800 text-xs">
              Tutup
            </button>
          </div>
        )}

        {/* Main Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 animate-pulse space-y-4">
                <div className="h-6 bg-slate-200 rounded w-1/2" />
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : branches.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
              <Store className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900">Belum Ada Cabang</h2>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Tambahkan cabang pertama Anda atau gunakan akun demo untuk memuat data contoh 3 cabang.
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah Cabang Sekarang
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {branches.map((b) => (
              <div
                key={b.id}
                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">{b.name}</h2>
                      <div className="flex items-center text-xs text-slate-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{b.location}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Aktif
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="flex items-center">
                        <Target className="w-3.5 h-3.5 mr-1 text-blue-500" />
                        Target Omzet Harian
                      </span>
                    </div>
                    <p className="text-base font-extrabold text-blue-600">
                      {formatRupiah(b.daily_target)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => openEditModal(b)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                    title="Ubah Cabang"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingBranch(b)}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                    title="Nonaktifkan Cabang"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Create / Edit */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingBranch ? 'Ubah Data Cabang' : 'Tambah Cabang Baru'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Maksimal 5 cabang aktif per organisasi usaha (PRD FR-1.2)
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Cabang
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Cabang Malioboro"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Alamat / Lokasi
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Contoh: Jl. Malioboro No. 45, Yogyakarta"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Target Penjualan Harian (Rp)
                  </label>
                  <input
                    type="text"
                    required
                    value={dailyTarget}
                    onChange={(e) => setDailyTarget(e.target.value)}
                    placeholder="Contoh: 3000000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Dipakai untuk menghitung persentase capaian di Branch Leaderboard
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition flex items-center disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                    Simpan Cabang
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Konfirmasi Hapus / Soft Delete */}
        {deletingBranch && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-slate-900">Nonaktifkan Cabang?</h3>
                <p className="text-xs text-slate-500">
                  Cabang <strong>&quot;{deletingBranch.name}&quot;</strong> akan dinonaktifkan dan tidak muncul lagi di kasir POS. Riwayat transaksi historis tetap tersimpan aman (PRD D9).
                </p>
              </div>
              <div className="flex items-center justify-center space-x-2 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setDeletingBranch(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSoftDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg shadow-sm transition flex items-center disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                  Ya, Nonaktifkan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
