import "./AddPayment.css";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "../../Common";
import api from "../../Utils/api";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value || 0));

export default function AddPayment() {
  const navigate = useNavigate();
  const [method, setMethod] = useState("CASH");
  const [tourId, setTourId] = useState("");
  const [tour, setTour] = useState(null);
  const [amount, setAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [loadingTour, setLoadingTour] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [result, setResult] = useState(null);

  const configuredExpiry = useMemo(() => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" })
    .format(new Date(Date.now() + 72 * 60 * 60 * 1000)), []);

  const fetchTour = async () => {
    const normalizedTourId = tourId.trim();
    if (!normalizedTourId) {
      setError("Enter a Tour ID first.");
      return;
    }
    setLoadingTour(true);
    setError("");
    setTour(null);
    try {
      setTour(await api.get(`/payments/tour-lookup/${encodeURIComponent(normalizedTourId)}`));
    } catch {
      setError("Tour details could not be found or are unavailable for a payment request.");
    } finally {
      setLoadingTour(false);
    }
  };

  const resetForm = () => {
    setTourId("");
    setTour(null);
    setAmount("");
    setTransactionId("");
    setError("");
    setResult(null);
  };

  const submitCash = async (event) => {
    event.preventDefault();
    if (!tour) {
      setError("Fetch the tour details before adding a cash payment.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const payment = await api.post("/payments", { tourId: tour.tourId, amount, transactionId, mode: "CASH" });
      setResult({ type: "cash", payment });
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to save the cash payment.");
    } finally {
      setSubmitting(false);
    }
  };

  const openRazorpayConfirmation = (event) => {
    event.preventDefault();
    if (!tour) {
      setError("Fetch the tour details before sending a payment request.");
      return;
    }
    if (!tour.customerEmail) {
      setError("This tour has no verified customer email, so a payment request cannot be sent.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError("Enter the exact amount to request.");
      return;
    }
    setConfirmationOpen(true);
  };

  const createRazorpayRequest = async () => {
    setSubmitting(true);
    setError("");
    try {
      const payment = await api.post("/payments/razorpay", { tourId: tour.tourId, amount });
      setResult({ type: "razorpay", payment });
      setConfirmationOpen(false);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to create the Razorpay payment request.");
      setConfirmationOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const switchMethod = (nextMethod) => {
    setMethod(nextMethod);
    setError("");
    setResult(null);
  };

  return (
    <main className="add-payment-wrapper">
      <section className="payment-card">
        <header className="payment-header">
          <div><span className="payment-eyebrow">Payments</span><h2>Add Payment</h2></div>
          <button type="button" className="back-btn" onClick={() => navigate("/admin/payments")}>Back</button>
        </header>

        <div className="payment-method-tabs" role="tablist" aria-label="Payment method">
          <button type="button" role="tab" aria-selected={method === "CASH"} className={method === "CASH" ? "is-active" : ""} onClick={() => switchMethod("CASH")}>By Cash</button>
          <button type="button" role="tab" aria-selected={method === "RAZORPAY"} className={method === "RAZORPAY" ? "is-active" : ""} onClick={() => switchMethod("RAZORPAY")}>By Razorpay</button>
        </div>

        <p className="payment-method-description">
          {method === "CASH" ? "Record a confirmed payment received offline." : "Create one hosted Razorpay Payment Link for the exact requested amount. This does not count as received money until Razorpay verifies payment."}
        </p>

        {error && <div className="payment-form-error" role="alert">{error}</div>}

        <form onSubmit={method === "CASH" ? submitCash : openRazorpayConfirmation}>
          <label htmlFor="payment-tour-id">Tour ID *</label>
          <div className="tour-row">
            <input id="payment-tour-id" value={tourId} onChange={(event) => setTourId(event.target.value)} placeholder="Enter Tour ID" required />
            <button type="button" className="fetch-btn" onClick={fetchTour} disabled={loadingTour}>{loadingTour ? "Fetching…" : "Fetch Details"}</button>
          </div>

          {tour && <section className="tour-details payment-tour-details" aria-label="Authoritative tour details">
            <p><span>Tour / Package</span><b>{tour.packageName || "—"}</b></p>
            <p><span>Travel Date</span><b>{tour.travelDate || "—"}</b></p>
            <p><span>User ID</span><b>{tour.userId || "—"}</b></p>
            <p><span>Customer</span><b>{tour.customerName || "—"}</b></p>
            <p><span>Customer Email</span><b>{tour.customerEmail || "Not available"}</b></p>
            <p><span>Customer Phone</span><b>{tour.customerPhone || "—"}</b></p>
            <p><span>Tour Amount</span><b>{money(tour.tourAmount)}</b></p>
            <p><span>Paid Amount</span><b>{money(tour.paidAmount)}</b></p>
            <p className="payment-tour-details__outstanding"><span>Outstanding Amount</span><b>{money(tour.outstandingAmount)}</b></p>
          </section>}

          <label htmlFor="payment-amount">{method === "CASH" ? "Received Amount" : "Payment Request Amount"} *</label>
          <input id="payment-amount" type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="Enter exact amount" value={amount} required onChange={(event) => setAmount(event.target.value)} />

          {method === "CASH" ? <>
            <label htmlFor="payment-transaction">Transaction ID / Cash Reference</label>
            <input id="payment-transaction" placeholder="Optional reference" value={transactionId} onChange={(event) => setTransactionId(event.target.value)} />
            <button className="submit-btn" disabled={submitting}>{submitting ? "Saving…" : "Submit Cash Payment"}</button>
          </> : <>
            <div className="razorpay-expiry"><span>Configured expiry</span><b>Approximately {configuredExpiry}</b><small>Razorpay’s returned expiry is authoritative.</small></div>
            <button className="submit-btn" disabled={submitting}>{submitting ? "Creating…" : "Send Payment Request"}</button>
          </>}
        </form>
      </section>

      <Modal open={confirmationOpen} title="Send Razorpay payment request?" onClose={() => !submitting && setConfirmationOpen(false)} actions={<><button type="button" className="payment-secondary" disabled={submitting} onClick={() => setConfirmationOpen(false)}>Cancel</button><button type="button" className="submit-btn" disabled={submitting} onClick={createRazorpayRequest}>{submitting ? "Sending…" : "Send Request"}</button></>}>
        <div className="payment-confirmation"><p>A single hosted Razorpay link will be sent from the Starry Nights Payments account.</p><dl><div><dt>Customer</dt><dd>{tour?.customerName}</dd></div><div><dt>Tour ID</dt><dd>{tour?.tourId}</dd></div><div><dt>Email</dt><dd>{tour?.customerEmail}</dd></div><div><dt>Amount</dt><dd>{money(amount)}</dd></div></dl><p className="payment-confirmation__note">Creating or emailing the link does not mark the payment as received.</p></div>
      </Modal>

      <Modal open={Boolean(result)} title={result?.type === "razorpay" ? "Payment request sent" : "Payment added successfully"} onClose={() => setResult(null)} actions={<><button type="button" className="payment-secondary" onClick={resetForm}>Add Another</button><button type="button" className="submit-btn" onClick={() => navigate("/admin/payments")}>Go To Payments</button></>}>
        {result?.type === "razorpay" ? <p className="payment-result">The link is stored as <b>PENDING</b> and emailed to the verified customer address. It will count toward collections only after Razorpay verifies payment.</p> : <p className="payment-result">The cash payment is recorded as <b>PAID</b>.</p>}
      </Modal>
    </main>
  );
}
