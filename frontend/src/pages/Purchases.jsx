import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useDialog } from "../components/ui/dialogContext";
import { purchasesApi } from "../api/admin";
import useBranches from "../hooks/useBranches";
import Modal from "../components/dashboard/Modal";
import StatCard from "../components/dashboard/StatCard";
import StatusNote from "../components/dashboard/StatusNote";
import Select from "../components/ui/Select";
import DatePicker from "../components/ui/DatePicker";
import { addDays } from "../utils/format";
import "./AdminDashboard.css";

const CATEGORIES = ["Cost of goods", "Transport", "Customs & clearing", "Loading & offloading", "Packaging", "Other"];
const today = () => new Date().toISOString().slice(0, 10);
const blank = () => ({ date: today(), category: "Cost of goods", item: "", supplier: "", quantity: "", amount: "", notes: "", branch: "" });
const rwf = (amount) => `${(amount || 0).toLocaleString()} RWF`;

const Purchases = () => {
  const { user } = useAuth();
  const { toast, confirm } = useDialog();
  const { names } = useBranches();
  const isAdmin = user?.role === "admin";
  const [month, setMonth] = useState(today().slice(0, 7));
  const [branch, setBranch] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [formError, setFormError] = useState("");

  const load = () => purchasesApi.list({ month, ...(isAdmin && branch && { branch }) })
    .then(setRows)
    .catch((error) => toast(error.message, "error"))
    .finally(() => setLoading(false));

  useEffect(() => {
    let active = true;
    purchasesApi.list({ month, ...(isAdmin && branch && { branch }) })
      .then((items) => { if (active) setRows(items); })
      .catch((error) => { if (active) toast(error.message, "error"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [month, branch, isAdmin, toast]);

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const setValue = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setFormError("");
    try {
      await purchasesApi.create({
        ...form,
        amount: Number(form.amount),
        quantity: Number(form.quantity) || undefined,
      });
      setOpen(false);
      setForm(blank());
      toast(isAdmin ? "Purchase recorded" : "Sent. Waiting for admin approval before it counts.", isAdmin ? "success" : "info");
      await load();
    } catch (error) {
      setFormError(error.message);
    }
  };

  const resolve = async (purchase, approve) => {
    try {
      await purchasesApi.resolve(purchase._id, approve);
      toast(
        approve ? "Purchase approved. It now counts in the income statement." : "Purchase rejected",
        approve ? "success" : "info"
      );
      await load();
    } catch (error) {
      toast(error.message, "error");
    }
  };

  const remove = async (purchase) => {
    const accepted = await confirm({
      title: "Delete this purchase?",
      message: "It will no longer count in the income statement.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!accepted) return;
    try {
      await purchasesApi.remove(purchase._id);
      toast("Purchase deleted.", "success");
      await load();
    } catch (error) {
      toast(error.message, "error");
    }
  };

  const approvedTotal = rows.filter((row) => row.status === "approved").reduce((sum, row) => sum + row.amount, 0);
  const pending = rows.filter((row) => row.status === "pending");
  const recentCutoff = addDays(today(), -3);
  const recentApproved = rows.filter(
    (row) => !isAdmin && row.status === "approved" && String(row.resolvedAt || "").slice(0, 10) >= recentCutoff
  );

  return (
    <div>
      <div className="db-page-head">
        <div>
          <h1>Purchases</h1>
          <p>What it costs to buy the products you sell, plus related costs like transport and customs. Approved purchases feed the income statement.</p>
        </div>
        <div className="db-actions">
          <button className="db-btn db-btn-primary" onClick={() => { setFormError(""); setOpen(true); }}>+ Record purchase</button>
        </div>
      </div>

      <div className="db-toolbar">
        <DatePicker mode="month" value={month} onChange={setMonth} />
        {isAdmin && <Select value={branch} onChange={setBranch} options={[{ value: "", label: "All branches" }, ...names]} />}
      </div>

      <div className="db-stat-grid">
        <StatCard label="Approved this month" value={rwf(approvedTotal)} />
        <StatCard label="Waiting for approval" value={pending.length} />
      </div>

      {!isAdmin && pending.length > 0 && (
        <StatusNote status="pending">
          {pending.length} purchase(s) are waiting for the admin. Please wait for approval.
        </StatusNote>
      )}
      {recentApproved.map((purchase) => (
        <StatusNote key={purchase._id} status="approved">
          "{purchase.item || purchase.category}" ({rwf(purchase.amount)}) was approved.
        </StatusNote>
      ))}

      <div className="db-panel">
        <div className="db-panel-body">
          {loading ? <div className="db-empty">Loading…</div> : rows.length === 0 ? (
            <div className="db-empty">No purchases in this period.</div>
          ) : (
            <table className="db-table">
              <thead>
                <tr>
                  <th>Date</th>{isAdmin && <th>Branch</th>}<th>Category</th><th>Item</th><th>Supplier</th>
                  <th>Qty</th><th>Amount</th><th>By</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((purchase) => (
                  <tr key={purchase._id}>
                    <td data-label="Date">{new Date(purchase.date).toLocaleDateString()}</td>
                    {isAdmin && <td data-label="Branch">{purchase.branch?.name || "General"}</td>}
                    <td data-label="Category">{purchase.category}</td>
                    <td data-label="Item">{purchase.item || "—"}</td>
                    <td data-label="Supplier">{purchase.supplier || "—"}</td>
                    <td data-label="Qty">{purchase.quantity || "—"}</td>
                    <td data-label="Amount" className="db-num">{purchase.amount.toLocaleString()}</td>
                    <td data-label="By">{purchase.createdBy?.name || "—"}</td>
                    <td data-label="Status">
                      <span className={`db-badge ${purchase.status}`}>
                        {purchase.status === "pending" ? "waiting" : purchase.status}
                      </span>
                    </td>
                    <td data-label="">
                      {isAdmin && (
                        <div style={{ display: "flex", gap: 6 }}>
                          {purchase.status === "pending" && (
                            <>
                              <button className="db-btn db-btn-outline" onClick={() => resolve(purchase, true)}>Approve</button>
                              <button className="db-btn db-btn-ghost" onClick={() => resolve(purchase, false)}>Reject</button>
                            </>
                          )}
                          <button className="db-btn db-btn-ghost" onClick={() => remove(purchase)}>Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {open && (
        <Modal
          title="Record a purchase"
          subtitle={isAdmin ? "Counts in the income statement right away" : "The admin must approve it before it counts"}
          onClose={() => setOpen(false)}
        >
          <form onSubmit={submit}>
            <div className="db-field-row">
              <div className="db-field"><label>Date</label><DatePicker value={form.date} onChange={setValue("date")} /></div>
              <div className="db-field"><label>Category</label><Select value={form.category} onChange={setValue("category")} options={CATEGORIES} /></div>
            </div>
            <div className="db-field-row">
              <div className="db-field"><label>What was bought</label><input value={form.item} onChange={set("item")} placeholder="e.g. 40 used tyres, 205/55R16" /></div>
              <div className="db-field"><label>Supplier</label><input value={form.supplier} onChange={set("supplier")} /></div>
            </div>
            <div className="db-field-row">
              <div className="db-field"><label>Quantity (optional)</label><input type="number" min="0" step="1" value={form.quantity} onChange={set("quantity")} /></div>
              <div className="db-field"><label>Total paid (RWF)</label><input type="number" min="1" required value={form.amount} onChange={set("amount")} /></div>
            </div>
            {isAdmin && (
              <div className="db-field">
                <label>Branch (optional)</label>
                <Select
                  value={form.branch}
                  onChange={setValue("branch")}
                  options={[{ value: "", label: "General (no branch)" }, ...names]}
                />
              </div>
            )}
            <div className="db-field"><label>Notes (optional)</label><textarea rows={2} value={form.notes} onChange={set("notes")} /></div>
            {formError && <p style={{ color: "#a23b2a", fontSize: 13 }}>{formError}</p>}
            <div className="db-modal-foot">
              <button type="button" className="db-btn db-btn-outline" onClick={() => setOpen(false)}>Cancel</button>
              <button className="db-btn db-btn-primary">{isAdmin ? "Save purchase" : "Send for approval"}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Purchases;
