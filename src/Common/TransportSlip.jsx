import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import api from "../Utils/api";
import "./TransportSlip.css";

const COMPANY = {
  name: "Starry Nights Holidays",
  address: "004, Headquarters Starry Nights, Nanded - 431603, Maharashtra",
  phone: "+91 8847755042",
  alternatePhone: "+91 9284137430",
  email: "travelwithstarrynights@gmail.com",
  website: "www.starrynightsindia.in"
};

const PDF_PAGE = {
  width: 794,
  height: 1123
};
const ACCOMMODATION_PER_PAGE = 3;

const display = (value, fallback = "-") => {
  if (value === null || value === undefined || value === "") return fallback;
  return value;
};

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

const normalizeAccommodation = (items = []) =>
  Array.isArray(items)
    ? items.map((item) => ({
        city: display(item.city),
        checkin: formatDate(item.checkin || item.checkIn || item.checkInDate),
        checkout: formatDate(item.checkout || item.checkOut || item.checkOutDate),
        hotel: display(item.hotel || item.hotelName),
        room: display(item.room || item.roomType),
        meal: display(item.meal || item.mealPlan),
        contact: display(item.contact || item.phone)
      }))
    : [];

const chunkAccommodation = (items, size = ACCOMMODATION_PER_PAGE) => {
  if (!items.length) return [[]];

  return Array.from(
    { length: Math.ceil(items.length / size) },
    (_, index) => items.slice(index * size, (index + 1) * size)
  );
};

function PdfFooter({ page, total }) {
  return (
    <footer className="ts-page-footer">
      <div>
        <strong>{COMPANY.name}</strong>
        <span>{COMPANY.phone} | {COMPANY.email}</span>
      </div>
      <div>
        <span>{COMPANY.website}</span>
        <strong>Page {page} of {total}</strong>
      </div>
    </footer>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="ts-info-item">
      <span>{label}</span>
      <strong>{display(value)}</strong>
    </div>
  );
}

function TransportSlip() {
  const { tourId } = useParams();
  const navigate = useNavigate();
  const page1Ref = useRef(null);
  const accommodationPageRefs = useRef([]);
  const [data, setData] = useState(null);
  const accommodation = normalizeAccommodation(data?.accommodation);
  const accommodationPages = chunkAccommodation(accommodation);

  useEffect(() => {
    document.title = `Transport Slip - ${tourId}`;
    const loadTour = async () => {
      try {
        const tour = await api.get(`/tours/${tourId}`);
        setData(tour);
      } catch (error) {
        console.error("Failed to load transport slip", error);
        setData(null);
      }
    };

    loadTour();
  }, [tourId]);

  const downloadPDF = async () => {
    const pages = [
      page1Ref.current,
      ...accommodationPages.map((_, index) => accommodationPageRefs.current[index])
    ].filter(Boolean);

    if (!pages.length) return;

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    pages.forEach((page) => page.classList.add("ts-pdf-export"));

    try {
      if (document.fonts?.ready) await document.fonts.ready;
      await new Promise((resolve) => requestAnimationFrame(resolve));

      for (const [index, page] of pages.entries()) {
        if (index > 0) pdf.addPage();

        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          scrollX: 0,
          scrollY: 0,
          width: PDF_PAGE.width,
          height: PDF_PAGE.height,
          windowWidth: PDF_PAGE.width,
          windowHeight: PDF_PAGE.height
        });

        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pageWidth, pageHeight);
      }
    } finally {
      pages.forEach((page) => page.classList.remove("ts-pdf-export"));
    }

    pdf.save(`TransportSlip-${tourId}.pdf`);
  };

  if (!data) return <div className="ts-container">Loading transport slip...</div>;

  const totalPages = accommodationPages.length + 1;
  const guestName = data.fullName || data.name;
  const mobile = data.mobile || data.contact;
  const driverName = data.driverName || data.driver;
  const vehicleCategory = data.vehicleCategory || data.vehicle;
  const issuedOn = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  return (
    <div className="ts-container">
      <div className="ts-actions">
        <button type="button" onClick={() => navigate(-1)}>Back</button>
        <button type="button" onClick={downloadPDF}>Download PDF</button>
      </div>

      <section className="ts-a4" ref={page1Ref}>
        <img src="/Starry Nights Holidays.png" alt="" className="ts-watermark" />

        <header className="ts-page-header">
          <img src="/Starry Nights Holidays.png" alt="Starry Nights Holidays" className="ts-logo" />
          <div className="ts-company">
            <span className="ts-eyebrow">Transport Coordination</span>
            <h1>{COMPANY.name}</h1>
            <p>{COMPANY.address}</p>
            <p>{COMPANY.phone} | {COMPANY.website}</p>
          </div>
          <div className="ts-document-meta">
            <span>Transport Slip</span>
            <strong>{display(data.tourId || tourId)}</strong>
            <small>Issued {issuedOn}</small>
          </div>
        </header>

        <div className="ts-hero">
          <div>
            <span className="ts-kicker">Confirmed movement plan</span>
            <h2>{display(data.travelPackage?.heroTitle || data.packageName || "Guest Transport Details")}</h2>
          </div>
          <div className="ts-status-pill">{display(data.status, "Confirmed")}</div>
        </div>

        <div className="ts-summary-grid">
          <InfoItem label="Guest Name" value={guestName} />
          <InfoItem label="Mobile" value={mobile} />
          <InfoItem label="Passengers" value={`${display(data.adults, 0)} Adults / ${display(data.kids, 0)} Kids`} />
          <InfoItem label="Duration" value={data.duration} />
        </div>

        <div className="ts-two-column">
          <div className="ts-panel">
            <h3>Guest Verification</h3>
            <InfoItem label="ID Type" value={data.idType} />
            <InfoItem label="ID Number" value={data.idNumber || data.idNo} />
            <InfoItem label="Booking Reference" value={data.tourId || tourId} />
          </div>

          <div className="ts-panel">
            <h3>Travel Schedule</h3>
            <InfoItem label="Pickup Date" value={formatDate(data.pickupDate || data.date)} />
            <InfoItem label="Drop Date" value={formatDate(data.dropDate)} />
            <InfoItem label="Pickup Location" value={data.pickupLocation} />
            <InfoItem label="Drop Location" value={data.dropLocation} />
          </div>
        </div>

        <div className="ts-panel ts-vehicle-panel">
          <h3>Vehicle and Driver Assignment</h3>
          <div className="ts-summary-grid ts-summary-grid-compact">
            <InfoItem label="Driver Name" value={driverName} />
            <InfoItem label="Driver Contact" value={data.driverContact} />
            <InfoItem label="Vehicle Category" value={vehicleCategory} />
            <InfoItem label="Vehicle Number" value={data.vehicleNo} />
          </div>
        </div>

        <div className="ts-note">
          Driver and guest must verify pickup time, ID details, and final route before departure.
          Timings may vary because of weather, traffic, local restrictions, or hotel check-in rules.
        </div>

        <PdfFooter page={1} total={totalPages} />
      </section>

      {accommodationPages.map((accommodationPage, pageIndex) => {
        const pageNumber = pageIndex + 2;

        return (
          <section
            className="ts-a4"
            key={`accommodation-page-${pageIndex}`}
            ref={(node) => {
              accommodationPageRefs.current[pageIndex] = node;
            }}
          >
            <img src="/Starry Nights Holidays.png" alt="" className="ts-watermark" />

            <header className="ts-page-header ts-page-header-compact">
              <img src="/Starry Nights Holidays.png" alt="Starry Nights Holidays" className="ts-logo" />
              <div className="ts-company">
                <span className="ts-eyebrow">Accommodation and Support</span>
                <h1>{COMPANY.name}</h1>
                <p>{COMPANY.address}</p>
              </div>
              <div className="ts-document-meta">
                <span>Reference</span>
                <strong>{display(data.tourId || tourId)}</strong>
              </div>
            </header>

            <div className="ts-section-title">
              <span>Stay Plan</span>
              <h2>Accommodation Details</h2>
            </div>

            <table className="ts-table">
              <thead>
                <tr>
                  <th>City</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Hotel and Room</th>
                  <th>Meal</th>
                </tr>
              </thead>
              <tbody>
                {accommodationPage.length ? accommodationPage.map((hotel, index) => (
                  <tr key={`${hotel.hotel}-${pageIndex}-${index}`}>
                    <td>{hotel.city}</td>
                    <td>{hotel.checkin}</td>
                    <td>{hotel.checkout}</td>
                    <td>
                      <strong>{hotel.hotel}</strong>
                      <span>{hotel.room}</span>
                    </td>
                    <td>{hotel.meal}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5">Accommodation details will be shared once confirmed.</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="ts-two-column ts-support-grid">
              <div className="ts-panel">
                <h3>Hotel Contacts</h3>
                {accommodationPage.length ? accommodationPage.map((hotel, index) => (
                  <div className="ts-contact-line" key={`${hotel.contact}-${pageIndex}-${index}`}>
                    <strong>{hotel.hotel}</strong>
                    <span>{hotel.contact}</span>
                  </div>
                )) : (
                  <p className="ts-muted">No hotel contact details available yet.</p>
                )}
              </div>

              <div className="ts-panel ts-emergency-panel">
                <h3>Emergency Support</h3>
                <InfoItem label="Support Desk" value="Starry Nights Support" />
                <InfoItem label="Mobile" value={data.emergencyContact || COMPANY.phone} />
                <InfoItem label="Alternate" value={COMPANY.alternatePhone} />
                <InfoItem label="Email" value={COMPANY.email} />
              </div>
            </div>

            <div className="ts-note ts-note-light">
              This slip is issued for coordination only. Hotel availability, room allocation, and vehicle
              assignment remain subject to operational confirmation and local travel conditions.
            </div>

            <PdfFooter page={pageNumber} total={totalPages} />
          </section>
        );
      })}
    </div>
  );
}

export default TransportSlip;
