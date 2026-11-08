import { useEffect, useState, useCallback } from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { LayoutDashboard, Users, Home, Crown, Receipt, TrendingUp } from "lucide-react";
import { supabase, PLATFORM_DOMAIN, BUCKET } from "../lib/supabase";
import DashboardLayout from "../components/ui/Sidebar";
import { Spinner } from "../components/ui/Field";
import AdminOverview from "../components/admin/AdminOverview";
import AdminUsers from "../components/admin/AdminUsers";
import AdminSubscriptions from "../components/admin/AdminSubscriptions";
import AdminPurchases from "../components/admin/AdminPurchases";
import AdminGrowth from "../components/admin/AdminGrowth";
import SubscriptionAdminModal from "../components/admin/SubscriptionAdminModal";
import DeleteAccountModal from "../components/admin/DeleteAccountModal";
import AccountProfilePage from "./AccountProfilePage";
import AccountSecurityPage from "./AccountSecurityPage";
import { ThemeIconButton } from "../components/ui/ThemeToggle";
import { useConfirm } from "../components/ui/ConfirmModal";

const links = [
  { to: "/admin", label: "Ringkasan", icon: LayoutDashboard, end: true },
  { to: "/admin/pengguna", label: "Pengguna", icon: Users },
  { to: "/admin/langganan", label: "Status Paket", icon: Crown },
  { to: "/admin/pembelian", label: "Pembelian Paket", icon: Receipt },
  { to: "/admin/pertumbuhan", label: "Grafik Pendaftar", icon: TrendingUp },
];

// Animasi halus yang sama gayanya dengan landing page
const adminCss = `
@keyframes ad-fade-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes ad-drift { 0%, 100% { transform: translate(-50%, 0) scale(1); } 50% { transform: translate(-46%, 18px) scale(1.08); } }
@keyframes ad-pop { from { opacity: 0; transform: translateY(14px) scale(.97); } to { opacity: 1; transform: none; } }
.ad-fade-up { animation: ad-fade-up .55s cubic-bezier(.2,.7,.2,1) both; }
.ad-drift { animation: ad-drift 12s ease-in-out infinite; }
.ad-pop { animation: ad-pop .28s cubic-bezier(.2,.7,.2,1) both; }
@keyframes ad-page-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
.ad-page-in { animation: ad-page-in .35s cubic-bezier(.2,.7,.2,1) both; }

/* Elemen halaman muncul berurutan: header -> kartu statistik -> grafik -> tabel */
.ad-stagger > div > *:not(.grid) { animation: ad-fade-up .6s cubic-bezier(.2,.7,.2,1) both; }
.ad-stagger > div > *:nth-child(2) { animation-delay: 70ms; }
.ad-stagger > div > *:nth-child(3) { animation-delay: 140ms; }
.ad-stagger > div > *:nth-child(4) { animation-delay: 210ms; }
.ad-stagger > div > *:nth-child(5) { animation-delay: 280ms; }
.ad-stagger > div > *:nth-child(n+6) { animation-delay: 350ms; }
.ad-stagger > div > .grid > * { animation: ad-fade-up .6s cubic-bezier(.2,.7,.2,1) both; animation-delay: 100ms; }
.ad-stagger > div > .grid > *:nth-child(2) { animation-delay: 160ms; }
.ad-stagger > div > .grid > *:nth-child(3) { animation-delay: 220ms; }
.ad-stagger > div > .grid > *:nth-child(n+4) { animation-delay: 280ms; }

/* Sentuhan halus pada kartu & tabel */
.ad-scope .card { transition: box-shadow .25s ease, border-color .25s ease; }
.ad-scope .card:hover { box-shadow: 0 14px 34px -16px rgba(2, 6, 23, .28); }
.ad-scope thead th { font-weight: 600; letter-spacing: .05em; }
.ad-scope tbody tr { transition: background-color .15s ease; }

@media (prefers-reduced-motion: reduce) {
  .ad-fade-up, .ad-drift, .ad-pop, .ad-page-in,
  .ad-stagger > div > *, .ad-stagger > div > .grid > * { animation: none !important; }
}
`;

export default function AdminDashboard() {
  const location = useLocation();
  const [stores, setStores] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [savingSubscription, setSavingSubscription] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [askConfirm, confirmDialog] = useConfirm();

  const load = useCallback(async () => {
    const [s, u] = await Promise.all([
      supabase.from("stores").select("*, profiles(full_name,email)").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id,full_name,email,phone,avatar_url,role,created_at").order("created_at", { ascending: false }),
    ]);
    if (s.error || u.error) toast.error(`Gagal memuat data: ${(s.error || u.error).message}`);
    setStores(s.data || []);
    setUsers(u.data || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleActive = async (s) => {
    const { error } = await supabase.from("stores").update({ is_active: !s.is_active }).eq("id", s.id);
    if (error) return toast.error(error.message);
    toast.success(s.is_active ? "Toko dinonaktifkan" : "Toko diaktifkan");
    load();
  };

  const remove = async (s) => {
    const ok = await askConfirm({
      title: "Hapus toko?",
      message: `Toko “${s.name}” beserta seluruh datanya akan dihapus.`,
      detail: "Tindakan ini tidak bisa dibatalkan.",
      confirmLabel: "Hapus toko",
      tone: "danger",
    });
    if (!ok) return;
    const { error } = await supabase.from("stores").delete().eq("id", s.id);
    if (error) return toast.error(error.message);
    toast.success("Toko dihapus");
    load();
  };

  const changeRole = async (profile) => {
    const nextRole = profile.role === "admin" ? "umkm" : "admin";
    if (nextRole === "admin" && stores.some((item) => item.owner_id === profile.id)) {
      return toast.error("Pengguna ini masih memiliki toko. Hapus tokonya terlebih dahulu karena admin tidak dapat memiliki website.");
    }
    const name = profile.full_name || profile.email;
    const ok = await askConfirm(
      nextRole === "admin"
        ? {
            title: "Jadikan admin platform?",
            message: `“${name}” akan menjadi admin platform.`,
            detail: "Admin dapat melihat dan mengubah semua toko.",
            confirmLabel: "Jadikan admin",
            tone: "warning",
          }
        : {
            title: "Cabut akses admin?",
            message: `Akses admin dari “${name}” akan dicabut.`,
            detail: "Pengguna ini akan kembali menjadi pengguna biasa.",
            confirmLabel: "Cabut akses",
            tone: "danger",
          },
    );
    if (!ok) return;
    const { error } = await supabase.from("profiles").update({ role: nextRole }).eq("id", profile.id);
    if (error) return toast.error(error.message);
    setUsers((current) => current.map((item) => (item.id === profile.id ? { ...item, role: nextRole } : item)));
    toast.success(nextRole === "admin" ? "Pengguna dijadikan admin" : "Akses admin dicabut");
  };

  // Hapus akun: file gambar di Storage -> akun login (cascade: profil, toko, produk, transaksi, keuangan)
  const deleteAccount = async (profile) => {
    if (deletingAccount) return;
    setDeletingAccount(true);
    try {
      // Fungsi ini juga memvalidasi (bukan akun sendiri / bukan admin) sebelum ada yang dihapus
      const { data: files, error: listError } = await supabase.rpc("admin_list_user_files", { target: profile.id });
      if (listError) throw listError;

      const paths = files || [];
      for (let i = 0; i < paths.length; i += 100) {
        const chunk = paths.slice(i, i + 100);
        const { data: removed, error: removeError } = await supabase.storage.from(BUCKET).remove(chunk);
        if (removeError) throw removeError;
        if ((removed?.length || 0) < chunk.length) {
          throw new Error("Sebagian file gambar tidak dapat dihapus. Pastikan migrasi SQL hapus akun sudah dijalankan.");
        }
      }

      const { error } = await supabase.rpc("admin_delete_user", { target: profile.id });
      if (error) throw error;

      setUsers((current) => current.filter((item) => item.id !== profile.id));
      setStores((current) => current.filter((item) => item.owner_id !== profile.id));
      setAccountToDelete(null);
      toast.success(`Akun ${profile.full_name || profile.email} beserta datanya telah dihapus`);
    } catch (error) {
      toast.error(`Akun gagal dihapus: ${error.message}`);
    } finally {
      setDeletingAccount(false);
    }
  };

  const saveSubscription = async ({ store, plan, renewalDate }) => {
    if (savingSubscription) return;
    setSavingSubscription(true);
    const previous = store.theme?.subscription || {};
    const isPaidPlan = ["basic", "bisnis", "pro"].includes(plan);
    const nextSubscription = {
      ...previous,
      plan,
      status: "active",
      billingMode: isPaidPlan ? "complimentary" : "trial",
      activatedAt: isPaidPlan ? previous.activatedAt || new Date().toISOString() : null,
      renewsAt: isPaidPlan && renewalDate ? new Date(`${renewalDate}T23:59:59+07:00`).toISOString() : null,
      trialEndsAt: null,
      paymentMethod: null,
    };
    const nextTheme = { ...(store.theme || {}), subscription: nextSubscription };

    try {
      const { data, error } = await supabase.from("stores").update({ theme: nextTheme }).eq("id", store.id).select("id, theme").single();
      if (error) throw error;
      setStores((current) => current.map((item) => (item.id === store.id ? { ...item, theme: data.theme } : item)));
      setSelectedStore(null);
      toast.success(`Akses paket ${plan === "basic" ? "Basic" : plan === "pro" ? "Pro" : "Bisnis"} diperbarui.`);
    } catch (error) {
      toast.error(`Paket gagal disimpan: ${error.message}`);
    } finally {
      setSavingSubscription(false);
    }
  };

  return (
    <DashboardLayout
      title="Admin Platform"
      subtitle={PLATFORM_DOMAIN}
      links={links}
      headerRight={
        <div className="flex items-center gap-2">
          <ThemeIconButton className="btn-secondary !rounded-full" />
          <Link to="/" className="btn-secondary !rounded-full">
            <Home size={16} />
            <span className="hidden sm:inline">Beranda</span>
          </Link>
        </div>
      }
    >
      <style>{adminCss}</style>

      {/* Latar konten: pola titik tipis + cahaya hijau lembut, sama seperti hero landing page */}
      <div className="ad-scope relative isolate min-h-full">
        <div className="pointer-events-none absolute inset-0 -z-10 [background-image:radial-gradient(rgba(148,163,184,0.22)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:linear-gradient(to_bottom,black,transparent_55%)]" />
        <div className="ad-drift pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-brand-500/10 blur-3xl" />

        {!stores ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <Spinner />
          </div>
        ) : (
          // key = path, jadi tiap pindah menu konten muncul dengan animasi halus
          <div key={location.pathname} className="ad-stagger ad-page-in">
            <Routes>
              <Route index element={<AdminOverview stores={stores} users={users} />} />
              <Route
                path="pengguna"
                element={
                  <AdminUsers
                    users={users}
                    stores={stores}
                    onChangeRole={changeRole}
                    toggleActive={toggleActive}
                    remove={remove}
                    onManageSubscription={setSelectedStore}
                    onDeleteAccount={setAccountToDelete}
                  />
                }
              />
              <Route path="langganan" element={<AdminSubscriptions stores={stores} onManageSubscription={setSelectedStore} />} />
              <Route path="pembelian" element={<AdminPurchases stores={stores} />} />
              <Route path="pertumbuhan" element={<AdminGrowth users={users} stores={stores} />} />
              <Route path="profil" element={<AccountProfilePage />} />
              <Route path="pengaturan" element={<AccountSecurityPage />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </div>
        )}
      </div>

      {selectedStore && (
        <SubscriptionAdminModal
          store={selectedStore}
          saving={savingSubscription}
          onClose={() => !savingSubscription && setSelectedStore(null)}
          onSave={(details) => saveSubscription({ store: selectedStore, ...details })}
        />
      )}
      {accountToDelete && (
        <DeleteAccountModal
          profile={accountToDelete}
          stores={stores.filter((item) => item.owner_id === accountToDelete.id)}
          deleting={deletingAccount}
          onClose={() => !deletingAccount && setAccountToDelete(null)}
          onConfirm={() => deleteAccount(accountToDelete)}
        />
      )}
      {confirmDialog}
    </DashboardLayout>
  );
}
