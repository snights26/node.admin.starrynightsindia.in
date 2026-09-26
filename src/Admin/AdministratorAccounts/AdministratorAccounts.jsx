import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaKey, FaPlus, FaTrashAlt, FaUserShield } from "react-icons/fa";
import { Modal } from "../../Common";
import api from "../../Utils/api";
import { getAdminUser } from "../../Utils/auth";
import "./AdministratorAccounts.css";

const EMPTY_CREATE_FORM = {
  userId: "",
  name: "",
  email: "",
  password: "",
  role: "ADMIN"
};

const errorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.response?.data?.error || fallback;

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function AdministratorAccounts() {
  const navigate = useNavigate();
  const currentAdminId = getAdminUser()?.id;
  const [accounts, setAccounts] = useState([]);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [passwordTarget, setPasswordTarget] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadAccounts = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/admin-accounts");
      setAccounts(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setAccounts([]);
      setError(errorMessage(requestError, "Unable to load administrator accounts."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAccounts(); }, []);

  const createAccount = async (event) => {
    event.preventDefault();
    setPending("create");
    setError("");
    setNotice("");
    try {
      await api.post("/admin-accounts", createForm);
      setCreateForm(EMPTY_CREATE_FORM);
      setNotice("Administrator account created. Share its credentials only through an approved secure channel.");
      await loadAccounts();
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to create the administrator account."));
    } finally {
      // Never retain a typed administrator password after a submission attempt.
      setCreateForm((previous) => ({ ...previous, password: "" }));
      setPending("");
    }
  };

  const updateRole = async (account, role) => {
    if (account.id === currentAdminId || role === account.role) return;
    setPending(`role-${account.id}`);
    setError("");
    setNotice("");
    try {
      await api.put(`/admin-accounts/${account.id}/role`, { role });
      setNotice(`Role updated for ${account.name}. Existing sessions for that account were revoked.`);
      await loadAccounts();
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to update the administrator role."));
    } finally {
      setPending("");
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    if (!passwordTarget) return;
    setPending("password");
    setError("");
    setNotice("");
    try {
      await api.put(`/admin-accounts/${passwordTarget.id}/password`, { password: newPassword });
      setPasswordTarget(null);
      setNewPassword("");
      setNotice(`Password reset for ${passwordTarget.name}. Existing sessions for that account were revoked.`);
      await loadAccounts();
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to reset the administrator password."));
    } finally {
      // A retry must require the operator to type the password again.
      setNewPassword("");
      setPending("");
    }
  };

  const deleteAccount = async () => {
    if (!deleteTarget) return;
    setPending("delete");
    setError("");
    setNotice("");
    try {
      await api.delete(`/admin-accounts/${deleteTarget.id}`);
      setDeleteTarget(null);
      setNotice(`Administrator account disabled for ${deleteTarget.name}.`);
      await loadAccounts();
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to disable the administrator account."));
    } finally {
      setPending("");
    }
  };

  const updateCreateField = (field, value) => setCreateForm((previous) => ({ ...previous, [field]: value }));
  const closePasswordReset = () => {
    if (pending) return;
    setPasswordTarget(null);
    setNewPassword("");
  };

  return (
    <main className="administrator-accounts-page">
      <header className="administrator-accounts-header">
        <div>
          <span>System Management Suite</span>
          <h1>Administrator Accounts</h1>
          <p>Super Admin-only control for administrator access. Customer accounts are not managed here.</p>
        </div>
        <button type="button" className="administrator-accounts-back" onClick={() => navigate("/dashboard")}><FaArrowLeft /> Back</button>
      </header>

      {error && <div className="administrator-accounts-feedback administrator-accounts-feedback--error" role="alert">{error}</div>}
      {notice && <div className="administrator-accounts-feedback administrator-accounts-feedback--success" role="status">{notice}</div>}

      <section className="administrator-accounts-create">
        <div className="administrator-accounts-section-heading"><FaUserShield /><div><span>New administrator</span><h2>Create a local Admin or Super Admin</h2></div></div>
        <form onSubmit={createAccount} className="administrator-accounts-form">
          <label>User ID<input required maxLength="40" value={createForm.userId} onChange={(event) => updateCreateField("userId", event.target.value)} /></label>
          <label>Name<input required maxLength="120" value={createForm.name} onChange={(event) => updateCreateField("name", event.target.value)} /></label>
          <label>Email<input required type="email" maxLength="255" value={createForm.email} onChange={(event) => updateCreateField("email", event.target.value)} /></label>
          <label>Temporary password<input required type="password" minLength="8" maxLength="120" value={createForm.password} onChange={(event) => updateCreateField("password", event.target.value)} /></label>
          <label>Role<select value={createForm.role} onChange={(event) => updateCreateField("role", event.target.value)}><option value="ADMIN">Operations Admin</option><option value="SUPER_ADMIN">Super Admin</option></select></label>
          <button type="submit" className="administrator-accounts-primary" disabled={Boolean(pending)}><FaPlus /> {pending === "create" ? "Creating…" : "Create administrator"}</button>
        </form>
      </section>

      <section className="administrator-accounts-list-section">
        <div className="administrator-accounts-section-heading"><FaUserShield /><div><span>Active administrator accounts</span><h2>{accounts.length} account{accounts.length === 1 ? "" : "s"}</h2></div></div>
        {loading ? <div className="administrator-accounts-loading">Loading protected administrator accounts…</div> : <div className="administrator-accounts-table-wrap"><table>
          <thead><tr><th>Administrator</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            {accounts.length === 0 && <tr><td colSpan="5" className="administrator-accounts-empty">No active administrator accounts found.</td></tr>}
            {accounts.map((account) => {
              const isCurrentAccount = account.id === currentAdminId;
              return <tr key={account.id}>
                <td><strong>{account.name}</strong><span>{account.userId}</span><small>{account.email}</small></td>
                <td><select aria-label={`Role for ${account.name}`} value={account.role} disabled={isCurrentAccount || Boolean(pending)} onChange={(event) => updateRole(account, event.target.value)}><option value="ADMIN">Operations Admin</option><option value="SUPER_ADMIN">Super Admin</option></select></td>
                <td><span className="administrator-accounts-status">{account.enabled ? "Active" : "Disabled"}</span></td>
                <td>{formatDate(account.createdAt)}</td>
                <td className="administrator-accounts-actions"><button type="button" disabled={Boolean(pending)} onClick={() => { setPasswordTarget(account); setNewPassword(""); }}><FaKey /> Reset password</button><button type="button" className="administrator-accounts-delete" disabled={isCurrentAccount || Boolean(pending)} title={isCurrentAccount ? "You cannot disable your own administrator account" : "Disable administrator account"} onClick={() => setDeleteTarget(account)}><FaTrashAlt /> Disable</button></td>
              </tr>;
            })}
          </tbody>
        </table></div>}
      </section>

      <Modal open={Boolean(passwordTarget)} title="Reset administrator password" onClose={closePasswordReset} actions={<><button type="button" className="administrator-accounts-secondary" disabled={Boolean(pending)} onClick={closePasswordReset}>Cancel</button><button type="submit" form="administrator-password-reset-form" className="administrator-accounts-primary" disabled={Boolean(pending)}>{pending === "password" ? "Resetting…" : "Reset password"}</button></>}>
        <form id="administrator-password-reset-form" onSubmit={resetPassword} className="administrator-accounts-modal-form"><p>Set a new password for <strong>{passwordTarget?.name}</strong>. Their existing sessions will be revoked.</p><label>New password<input required type="password" minLength="8" maxLength="120" autoFocus value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label></form>
      </Modal>

      <Modal open={Boolean(deleteTarget)} title="Disable administrator account?" onClose={() => !pending && setDeleteTarget(null)} actions={<><button type="button" className="administrator-accounts-secondary" disabled={Boolean(pending)} onClick={() => setDeleteTarget(null)}>Cancel</button><button type="button" className="administrator-accounts-danger" disabled={Boolean(pending)} onClick={deleteAccount}>{pending === "delete" ? "Disabling…" : "Disable account"}</button></>}>
        <p>This disables <strong>{deleteTarget?.name}</strong>, revokes their active refresh sessions, and retains the account record for safety. It does not delete customer or business data.</p>
      </Modal>
    </main>
  );
}
