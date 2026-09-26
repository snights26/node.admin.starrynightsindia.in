import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import api from "../../Utils/api";
import "./Invoice.css";

const COMPANY = {
  name: "Starry Nights Holidays",
  legalName: "Starry Nights Tours and Adventures",
  address: "104 Anusaya Society, HUDCO, New Nanded - 431603",
  phone: "+91 8847755042",
  email: "travelwithstarrynights@gmail.com",
  website: "www.starrynightsindia.in",
  gstin: "27XXXXXXXXXXXXX"
};

const amount = (value) => Number(value || 0);

const formatMoney = (value) => `INR ${amount(value).toLocaleString("en-IN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
})}`;

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

export default function Invoice() {
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const invoiceRef = useRef();
  const [data, setData] = useState(null);

  useEffect(() => {
    const loadInvoice = async () => {
      try {
        const invoice = await api.get(`/payments/invoice/${bookingId}`);
        setData(invoice);
      } catch (error) {
        console.error("Failed to load invoice", error);
        setData(null);
      }
    };

    loadInvoice();
  }, [bookingId]);

  const downloadPDF = async () => {
    const element = invoiceRef.current;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      scrollX: 0,
      scrollY: 0,
      windowWidth: element.scrollWidth
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pageWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`Invoice-${bookingId}.pdf`);
  };

  if (!data) {
    return <div className="invoice-wrapper">Loading invoice...</div>;
  }

  const payments = Array.isArray(data.payments) ? data.payments : [];
  const totalCost = amount(data.totalCost);
  const totalPaid = payments.reduce((sum, payment) => sum + amount(payment.amount || payment.paidAmount), 0);
  const dueAmount = data.dueAmount === undefined || data.dueAmount === null
    ? totalCost - totalPaid
    : amount(data.dueAmount);

  return (
    <div className="invoice-wrapper">
      <section ref={invoiceRef} className="invoice-container">
        <img src="/Starry Nights Holidays.png" alt="" className="invoice-watermark" />

        <header className="invoice-top">
          <div className="company-details">
            <img src="/Starry Nights Holidays.png" alt="Starry Nights Holidays" className="invoice-logo" />
            <div>
              <span className="invoice-eyebrow">Payment Receipt</span>
              <h1>{COMPANY.name}</h1>
              <p>{COMPANY.address}</p>
              <p>{COMPANY.phone} | {COMPANY.website}</p>
              <p>{COMPANY.email}</p>
            </div>
          </div>

          <div className="invoice-meta-card">
            <span>Invoice No.</span>
            <strong>{data.invoiceNo || bookingId}</strong>
            <small>Date: {formatDate(data.date)}</small>
            <small>GSTIN: {COMPANY.gstin}</small>
          </div>
        </header>

        <div className="invoice-band">
          <div>
            <span>Bill To</span>
            <strong>{data.billTo || "-"}</strong>
            <small>Booking reference: {data.invoiceNo || bookingId}</small>
          </div>
          <div>
            <span>Package</span>
            <strong>{data.tourType || "-"}</strong>
            <small>Pax: {data.pax || 0}</small>
          </div>
        </div>

        <div className="invoice-stats">
          <div>
            <span>Total Package Cost</span>
            <strong>{formatMoney(totalCost)}</strong>
          </div>
          <div>
            <span>Amount Received</span>
            <strong>{formatMoney(totalPaid || data.paidAmount)}</strong>
          </div>
          <div>
            <span>Balance Due</span>
            <strong className={dueAmount > 0 ? "invoice-danger" : "invoice-success"}>
              {formatMoney(dueAmount)}
            </strong>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="invoice-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>Package Cost</td>
                <td>{formatDate(data.date)}</td>
                <td>{formatMoney(totalCost)}</td>
                <td>-</td>
                <td>Booked</td>
              </tr>

              {payments.map((payment, index) => (
                <tr key={payment.id || index}>
                  <td>{index === 0 ? "Booking Amount" : `Instalment ${index + 1}`}</td>
                  <td>{formatDate(payment.paymentDate)}</td>
                  <td>{formatMoney(payment.amount || payment.paidAmount)}</td>
                  <td>{payment.mode || "-"}</td>
                  <td>Received</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="invoice-total-row">
          <div>
            <span>Notes</span>
            <p>This invoice is generated against payment records available in Starry Nights booking system.</p>
          </div>
          <div className="invoice-total-card">
            <p><span>Grand Total</span><strong>{formatMoney(totalCost)}</strong></p>
            <p><span>Paid</span><strong>{formatMoney(totalPaid || data.paidAmount)}</strong></p>
            <p><span>Due</span><strong>{formatMoney(dueAmount)}</strong></p>
          </div>
        </div>

        <footer className="invoice-footer">
          <div>
            <strong>{COMPANY.legalName}</strong>
            <span>{COMPANY.phone} | {COMPANY.email}</span>
          </div>
          <div>
            <strong>Finance Manager</strong>
            <span>Page 1 of 1</span>
          </div>
        </footer>
      </section>

      <div className="invoice-actions">
        <button className="back-btn" type="button" onClick={() => navigate("/admin/payments")}>
          Go To Payments
        </button>

        <button onClick={downloadPDF} className="download-btn" type="button">
          Download Invoice
        </button>
      </div>
    </div>
  );
}
