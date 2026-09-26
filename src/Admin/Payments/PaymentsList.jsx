import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../Utils/api";
import { Modal } from "../../Common";
import Pagination, { usePagination } from "../../Common/Pagination";
import BackButton from "../../Common/BackButton";
import { isOperationsAdmin } from "../../Utils/auth";
import "./PaymentsList.css";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value || 0));

export default function PaymentsList() {
  const navigate = useNavigate();
  const readOnly = isOperationsAdmin();
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [working, setWorking] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return payments;
    return payments.filter((payment) => [payment.id, payment.tourId, payment.customerName, payment.name, payment.paymentDate, payment.status, payment.paymentMode, payment.razorpayReferenceId]
      .some((value) => String(value || "").toLowerCase().includes(query)));
  }, [payments, search]);
  const { page, pageCount, pageItems, setPage } = usePagination(filteredPayments, 10, search);

  const loadPayments = useCallback(async () => {
    try {
      setError("");
      const data = await api.get("/payments");
      setPayments(Array.isArray(data) ? data : []);
    } catch {
      setPayments([]);
      setError("Unable to load payment records.");
    }
  }, []);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  const runRazorpayAction = async (action, payment) => {
    setWorking(`${action}-${payment.id}`);
    setError("");
    try {
      const updated = await api.post(`/payments/${payment.id}/razorpay/${action}`);
      setPayments((current) => current.map((item) => item.id === updated.id ? updated : item));
      setConfirmation(null);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to complete the Razorpay action.");
    } finally {
      setWorking("");
    }
  };

  const copyLink = async (payment) => {
    try {
      await navigator.clipboard?.writeText(payment.razorpayShortUrl || "");
    } catch {
      setError("The hosted link could not be copied in this browser.");
    }
  };

  const deleteEntry = async (id) => {
    if (!window.confirm("Permanently delete this payment entry?")) return;
    try {
      await api.delete(`/payments/${id}`);
      setPayments((current) => current.filter((payment) => payment.id !== id));
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to delete the payment.");
    }
  };

  return <main className="payments-page">
    <header className="payments-header"><div><h1>Payments</h1><p>Cash collections and Razorpay Payment Link requests. Pending requests are not received money.</p></div></header>
    <section className="payments-actions">
      <input className="payments-search" type="search" placeholder="Search tour, payment status, or Razorpay reference…" value={search} onChange={(event) => setSearch(event.target.value)} />
      {!readOnly && <button className="add-payment-btn" onClick={() => navigate("/admin/payments/new")}>+ Add Payment</button>}
    </section>
    {error && <div className="payments-error" role="alert">{error}</div>}
    <section className="payments-card"><table className="payments-table"><thead><tr><th>Tour ID</th><th>Date</th><th>Mode</th><th>Status</th><th>Requested</th><th>Received</th><th>Due</th><th>Invoice</th><th>Actions</th></tr></thead>
      <tbody>{pageItems.map((payment) => {
        const received = payment.status === "PAID" ? Number(payment.amount || 0) : 0;
        const dueAmount = Math.max(0, Number(payment.totalAmount || 0) - received);
        const pendingRazorpay = payment.paymentMode === "RAZORPAY" && payment.status === "PENDING";
        return <tr key={payment.id}><td>{payment.tourId}</td><td>{payment.paymentDate}</td><td><span className={`payment-mode payment-mode--${String(payment.paymentMode || "CASH").toLowerCase()}`}>{payment.paymentMode || "CASH"}</span></td><td><span className={`payment-status payment-status--${String(payment.status || "PAID").toLowerCase()}`}>{payment.status || "PAID"}</span></td><td>{money(payment.amount)}</td><td>{money(received)}</td><td>{money(dueAmount)}</td><td><button className="invoice-btn" onClick={() => navigate(`/admin/payments/invoice/${payment.tourId}`)}>View</button></td><td className="payments-table__actions">
          {pendingRazorpay && !readOnly && <><button type="button" onClick={() => copyLink(payment)}>Copy Link</button><button type="button" disabled={working === `resend-${payment.id}`} onClick={() => runRazorpayAction("resend", payment)}>{working === `resend-${payment.id}` ? "Sending…" : "Resend"}</button><button type="button" disabled={working === `refresh-${payment.id}`} onClick={() => runRazorpayAction("refresh", payment)}>{working === `refresh-${payment.id}` ? "Refreshing…" : "Refresh"}</button><button type="button" className="delete-btn" onClick={() => setConfirmation(payment)}>Cancel Link</button></>}
          {!readOnly && payment.paymentMode !== "RAZORPAY" && <button className="delete-btn" onClick={() => deleteEntry(payment.id)}>Delete</button>}
          {payment.paymentMode === "RAZORPAY" && payment.status === "PAID" && <span className="payment-provider-detail">Gateway verified</span>}
        </td></tr>;
      })}</tbody></table></section>
    <Pagination page={page} pageCount={pageCount} setPage={setPage} itemCount={filteredPayments.length} label="payments" />
    <div className="payments-topbar"><BackButton /></div>
    <Modal open={Boolean(confirmation)} title="Cancel Razorpay payment request?" onClose={() => !working && setConfirmation(null)} actions={<><button type="button" className="payment-list-secondary" disabled={Boolean(working)} onClick={() => setConfirmation(null)}>Keep active</button><button type="button" className="delete-btn" disabled={Boolean(working)} onClick={() => runRazorpayAction("cancel", confirmation)}>{working ? "Cancelling…" : "Cancel payment link"}</button></>}><p>This cancels the hosted Razorpay link. It does not delete the payment record or change an already paid transaction.</p></Modal>
  </main>;
}
