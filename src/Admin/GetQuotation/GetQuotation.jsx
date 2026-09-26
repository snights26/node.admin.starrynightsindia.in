import { useEffect, useMemo, useState } from "react";
import "./GetQuotation.css";
import html2pdf from "html2pdf.js";
import api from "../../Utils/api";
import BackButton from "../../Common/BackButton";
import { IMAGE_FILE_ACCEPT, optimizeImageFile, resolveAssetUrl, validateImageFile } from "../../Utils/fileUpload";

const COMPANY = {
  name: "Starry Nights Holidays",
  legalName: "Starry Nights Tours and Adventures",
  address: "004, Starry Nights, Nanded - 431603",
  phone: "+91 8847755042",
  alternatePhone: "+91 9284137430",
  email: "travelwithstarrynights@gmail.com",
  website: "www.starrynightsindia.in"
};

const DEFAULT_FORM = {
  locations: "",
  pickup: "",
  rooms: "",
  persons: "",
  meal: "",
  vehicle: "",
  tourStartDate: "",
  currency: "INR",
  travelAdvisory: "",
  classicHotel: "",
  signatureHotel: "",
  eliteHotel: "",
  classicPrice: "",
  signaturePrice: "",
  elitePrice: "",
  overview: "",
  highlights: "",
  includes: "",
  excludes: "",
  firstPageCount: "3",
  otherPageCount: "5",
  itineraryDays: "",
  employeeName: "",
  customerEmail: ""
};

const HOTEL_TIERS = ["classic", "signature", "elite"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MEAL_PLAN_OPTIONS = [
  "EP - Room Only",
  "CPAI - Breakfast Only",
  "MAPAI - Breakfast and Dinner",
  "APAI - All Meals"
];

const today = new Date().toLocaleDateString("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric"
});

const lines = (value = "") => value.split("\n").map((item) => item.trim()).filter(Boolean);

const formatTourDate = (value, offset = 0) => {
  if (!value) return "";
  const [year, month, day] = String(value).split("-").map(Number);
  const date = new Date(year, month - 1, day + offset);
  if (!year || !month || !day || Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  });
};

const itineraryDate = (tourStartDate, day, fallbackIndex) => {
  const dayNumber = Number(day?.day || day?.dayNumber) || fallbackIndex + 1;
  return formatTourDate(tourStartDate, Math.max(0, dayNumber - 1));
};

const formatPrice = (value, currency) => {
  const cleanValue = String(value || "").trim();
  if (!cleanValue) return `${currency} -`;
  return `${currency} ${cleanValue}`;
};

const flattenCategories = (items = [], parent = null) =>
  items.flatMap((item) => {
    const code = item.code || item.categoryCode;
    const node = {
      code,
      parent: parent || item.parent,
      name: item.name || item.categoryName || item.title
    };
    return [node, ...flattenCategories(item.children || [], code)];
  });

const resolveTemplate = (categoryCodes = [], categoryLookup) => {
  const codes = categoryCodes.map((code) => String(code || "").toUpperCase()).filter(Boolean);
  const hasAncestor = (code, target) => {
    let current = code;
    while (current) {
      if (current === target) return true;
      current = categoryLookup.get(current)?.parent?.toUpperCase();
    }
    return false;
  };

  if (codes.some((code) => code === "INT" || code.startsWith("INT-") || hasAncestor(code, "INT"))) {
    return "international";
  }
  return "domestic";
};

const splitItinerary = (itinerary = [], firstCount = 3, otherCount = 5) => {
  if (!Array.isArray(itinerary) || itinerary.length === 0) return [[]];
  const pages = [itinerary.slice(0, firstCount)];
  let remaining = itinerary.slice(firstCount);

  while (remaining.length > 0) {
    pages.push(remaining.slice(0, otherCount));
    remaining = remaining.slice(otherCount);
  }

  return pages;
};

const normalizeItinerary = (items = [], count = 0) => {
  const source = Array.isArray(items) ? items : [];
  const targetCount = Math.max(1, Number(count) || source.length || 1);

  return Array.from({ length: targetCount }, (_, index) => {
    const existing = source[index] || {};
    const day = index + 1;
    return {
      ...existing,
      day,
      dayNumber: day,
      title: existing.title || `Day ${day}`,
      desc: existing.desc || existing.description || "",
      description: existing.description || existing.desc || "",
      // Quotation media belongs only to this browser session; package retrieval
      // deliberately never restores images saved by an earlier quotation.
      imageUrls: []
    };
  });
};

function QuoteImagePicker({ image, label, onSelect, onRemove }) {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!image) {
      setPreviewUrl("");
      return undefined;
    }
    if (typeof image === "string") {
      setPreviewUrl(resolveAssetUrl(image));
      return undefined;
    }

    const objectUrl = URL.createObjectURL(image);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  const handleSelection = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      validateImageFile(file);
      onSelect(await optimizeImageFile(file));
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="quote-image-picker">
      {previewUrl ? <img src={previewUrl} alt={label} /> : <span>{label}</span>}
      <input type="file" accept={IMAGE_FILE_ACCEPT} aria-label={`Upload ${label}`} onChange={handleSelection} />
      {previewUrl && <button type="button" onClick={onRemove} aria-label={`Remove ${label}`}>x</button>}
    </div>
  );
}

function QuotePdfImage({ image, alt }) {
  const [source, setSource] = useState("");

  useEffect(() => {
    if (!image) {
      setSource("");
      return undefined;
    }
    if (typeof image === "string") {
      setSource(resolveAssetUrl(image));
      return undefined;
    }

    const objectUrl = URL.createObjectURL(image);
    setSource(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  return source ? <img src={source} alt={alt} crossOrigin="anonymous" /> : null;
}

function QuoteFooter({ page, total }) {
  return (
    <footer className="quote-footer">
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

function QuoteHeader({ template, title }) {
  return (
    <header className="quote-header">
      <img src="/Starry Nights Holidays.png" className="quote-logo" alt="Starry Nights Holidays" />
      <div>
        <span className="quote-eyebrow">
          {template === "international" ? "International Tour Quotation" : "Domestic Tour Quotation"}
        </span>
        <h1>{COMPANY.name}</h1>
        <p>{COMPANY.address}</p>
        <p>{COMPANY.phone} | {COMPANY.website}</p>
      </div>
      <div className="quote-doc-card">
        <span>Prepared On</span>
        <strong>{today}</strong>
        <small>{title}</small>
      </div>
    </header>
  );
}

function InfoGrid({ data, form }) {
  return (
    <div className="quote-info-grid">
      <p><span>Tour</span><strong>{data.heroTitle}</strong></p>
      <p><span>Travel</span><strong>{form.locations || "-"} - {form.currency || "-"}</strong></p>
      <p><span>Pickup - Drop</span><strong>{form.pickup || "-"}</strong></p>
      <p><span>Rooms</span><strong>{form.rooms || "-"}</strong></p>
      <p><span>Total Persons</span><strong>{form.persons || "-"}</strong></p>
      <p><span>Meal Plan</span><strong>{form.meal || "-"}</strong></p>
      <p><span>Vehicle</span><strong>{form.vehicle || "-"}</strong></p>
      <p><span>Duration</span><strong>{data.days ? `${data.days} Days` : "-"}</strong></p>
    </div>
  );
}

function HotelListInput({ value, onChange, placeholder }) {
  const [draft, setDraft] = useState("");
  const hotels = lines(value);

  const addHotel = () => {
    const hotel = draft.trim();
    if (!hotel) return;

    const exists = hotels.some((item) => item.localeCompare(hotel, undefined, { sensitivity: "accent" }) === 0);
    if (!exists) {
      onChange([...hotels, hotel].join("\n"));
    }
    setDraft("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addHotel();
    } else if (event.key === "Backspace" && !draft && hotels.length) {
      onChange(hotels.slice(0, -1).join("\n"));
    }
  };

  return (
    <div className="quote-hotel-entry" onClick={(event) => event.currentTarget.querySelector("input")?.focus()}>
      {hotels.map((hotel, index) => (
        <span className="quote-hotel-chip" key={`${hotel}-${index}`}>
          {hotel}
          <button
            type="button"
            aria-label={`Remove ${hotel}`}
            onClick={(event) => {
              event.stopPropagation();
              onChange(hotels.filter((_, hotelIndex) => hotelIndex !== index).join("\n"));
            }}
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addHotel}
        placeholder={placeholder}
      />
    </div>
  );
}

function PricingBlock({ form, isInternational }) {
  const label = isInternational ? "International Collection" : "Domestic Collection";
  return (
    <div className="quote-pricing-grid">
      <div>
        <span>Classic {label}</span>
        <strong>{formatPrice(form.classicPrice, form.currency)}</strong>
      </div>
      <div>
        <span>Signature {label}</span>
        <strong>{formatPrice(form.signaturePrice, form.currency)}</strong>
      </div>
      <div>
        <span>Elite {label}</span>
        <strong>{formatPrice(form.elitePrice, form.currency)}</strong>
      </div>
    </div>
  );
}

export default function GetQuotation() {
  const [pkgId, setPkgId] = useState("");
  const [data, setData] = useState(null);
  const [categoryTree, setCategoryTree] = useState([]);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [quoteItinerary, setQuoteItinerary] = useState([]);
  const [emailStatus, setEmailStatus] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    api.get("/categories/tree").then(setCategoryTree).catch(() => setCategoryTree([]));
  }, []);

  const categoryLookup = useMemo(() => {
    return new Map(flattenCategories(categoryTree).map((item) => [String(item.code || "").toUpperCase(), item]));
  }, [categoryTree]);

  const fetchPackage = async () => {
    try {
      const json = await api.get(`/packages/${pkgId}`);
      const categoryCodes = Array.isArray(json.categoryCodes) ? json.categoryCodes : [];
      const template = resolveTemplate(categoryCodes, categoryLookup);
      const includes = Array.isArray(json.inclusions) ? json.inclusions.join("\n") : json.includes || "";
      const excludes = Array.isArray(json.exclusions) ? json.exclusions.join("\n") : json.excludes || "";
      const defaultCurrency = template === "international" ? "USD" : "INR";
      const sourceItinerary = Array.isArray(json.itinerary) ? json.itinerary : [];
      const dayCount = Number(json.days) || sourceItinerary.length || 1;
      const editableItinerary = normalizeItinerary(sourceItinerary, dayCount);

      setData({
        packageCode: json.packageCode || json.code || pkgId,
        heroTitle: json.heroTitle || json.title || json.name || pkgId,
        overview: json.overview || "",
        highlights: json.highlights || "",
        itinerary: editableItinerary,
        categoryCodes,
        template,
        days: dayCount,
        info: json.info || {}
      });
      setQuoteItinerary(editableItinerary);
      setEmailStatus(null);

      setForm((prev) => ({
        ...prev,
        currency: prev.currency && prev.currency !== DEFAULT_FORM.currency ? prev.currency : defaultCurrency,
        locations: prev.locations || json.region || json.info?.pickup || "",
        pickup: prev.pickup || json.info?.pickup || "",
        vehicle: prev.vehicle || json.info?.vehicle || "",
        itineraryDays: String(dayCount),
        overview: json.overview || "",
        highlights: json.highlights || "",
        includes,
        excludes,
        travelAdvisory: prev.travelAdvisory || "Passport, visa, insurance, airline baggage, and destination entry rules are subject to official updates."
      }));
    } catch (err) {
      alert("Package not found");
    }
  };

  const updateItineraryCount = (value) => {
    setForm((prev) => ({ ...prev, itineraryDays: value }));
    const count = Number(value);
    if (!Number.isInteger(count) || count < 1) return;
    setQuoteItinerary((prev) => normalizeItinerary(prev, count));
  };

  const updateItineraryDay = (index, field, value) => {
    setQuoteItinerary((prev) => prev.map((day, itemIndex) => {
      if (itemIndex !== index) {
        return day;
      }
      const updated = { ...day, [field]: value };
      if (field === "desc") {
        updated.description = value;
      }
      if (field === "description") {
        updated.desc = value;
      }
      return updated;
    }));
  };

  const updateItineraryImage = (dayIndex, imageIndex, image) => {
    setQuoteItinerary((prev) => prev.map((day, index) => {
      if (index !== dayIndex) return day;
      const imageUrls = [...(day.imageUrls || [])];
      imageUrls[imageIndex] = image;
      return { ...day, imageUrls };
    }));
  };

  const removeItineraryImage = (dayIndex, imageIndex) => {
    setQuoteItinerary((prev) => prev.map((day, index) => {
      if (index !== dayIndex) return day;
      const imageUrls = [...(day.imageUrls || [])];
      imageUrls.splice(imageIndex, 1);
      return { ...day, imageUrls };
    }));
  };

  const itineraryPages = data
    ? splitItinerary(
        quoteItinerary,
        Number(form.firstPageCount) || 3,
        Number(form.otherPageCount) || 5
      )
    : [];

  const isInternational = data?.template === "international";
  // The introduction has its own A4 page, so overview/highlights never push
  // the detailed itinerary below the printable page boundary.
  const totalPages = data ? itineraryPages.length + (isInternational ? 6 : 5) : 0;

  const buildQuotationPdf = async () => {
    const element = document.getElementById("pdf-content");
    if (!element) {
      throw new Error("Generate a quotation before creating the PDF.");
    }

    // Allow file-preview effects to mount their object URLs before collecting PDF images.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await Promise.all([...element.querySelectorAll("img")].map((image) => {
      if (image.complete) return Promise.resolve();
      return new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      });
    }));

    const quotePages = [...element.querySelectorAll(":scope > .page")];
    if (!quotePages.length) {
      throw new Error("Quotation pages are unavailable.");
    }

    const pdfOptions = {
      margin: 0,
      image: { type: "jpeg", quality: 1 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: 794,
        height: 1123,
        windowWidth: 794,
        windowHeight: 1123
      },
      jsPDF: {
        unit: "px",
        format: [794, 1123],
        orientation: "portrait"
      }
    };

    // Each quotation section is already a complete A4 page. Rendering the pages separately
    // avoids html2pdf combining CSS page breaks with its own canvas slicing, which caused
    // an empty page between itinerary pages.
    quotePages.forEach((quotePage) => quotePage.classList.add("is-exporting"));
    try {
      let pdf;

      for (const [pageIndex, quotePage] of quotePages.entries()) {
        const worker = html2pdf().set(pdfOptions).from(quotePage).toCanvas();
        const canvas = await worker.get("canvas");

        if (pageIndex === 0) {
          await worker.toPdf();
          pdf = await worker.get("pdf");
          continue;
        }

        pdf.addPage([794, 1123], "portrait");
        pdf.addImage(
          canvas.toDataURL("image/jpeg", 1),
          "JPEG",
          0,
          0,
          794,
          1123,
          undefined,
          "FAST"
        );
      }

      return {
        pdf,
        filename: `${data?.packageCode || "quotation"}-${data?.template || "tour"}-quotation.pdf`
      };
    } finally {
      quotePages.forEach((quotePage) => quotePage.classList.remove("is-exporting"));
    }
  };

  const downloadPDF = async () => {
    try {
      const { pdf, filename } = await buildQuotationPdf();
      pdf.save(filename);
    } catch (error) {
      setEmailStatus({ type: "error", message: error.message || "Unable to generate the quotation PDF." });
    }
  };

  const buildQuotationEmailBody = () => {
    const list = (value, fallback) => {
      const items = lines(value);
      return items.length ? items.map((item) => `• ${item}`).join("\n") : fallback;
    };
    const itinerary = quoteItinerary.map((day, index) => {
      const dayNumber = day.day || day.dayNumber || index + 1;
      const date = itineraryDate(form.tourStartDate, day, index);
      return [
        `Day ${dayNumber}${date ? ` - ${date}` : ""}: ${day.title || "Planned Experience"}`,
        day.desc || day.description || "Details will be shared by the operations team."
      ].join("\n");
    }).join("\n\n") || "Detailed itinerary will be shared by the operations team.";
    const hotels = HOTEL_TIERS.map((tier) => {
      const title = `${tier.charAt(0).toUpperCase()}${tier.slice(1)} Hotels`;
      return `${title}\n${list(form[`${tier}Hotel`], "To be confirmed")}`;
    }).join("\n\n");

    return [
      "TRAVEL DETAILS",
      `Tour: ${data?.heroTitle || data?.packageCode || "Travel Package"}`,
      `Travel: ${form.locations || "-"} - ${form.currency || "-"}`,
      `Pickup - Drop: ${form.pickup || "-"}`,
      `Rooms: ${form.rooms || "-"} | Guests: ${form.persons || "-"}`,
      `Meal Plan: ${form.meal || "-"} | Vehicle: ${form.vehicle || "-"}`,
      form.overview ? `OVERVIEW\n${form.overview}` : "",
      `HIGHLIGHTS\n${list(form.highlights, "To be confirmed")}`,
      `DETAILED ITINERARY\n${itinerary}`,
      `HOTELS\n${hotels}`,
      "PRICING",
      `Classic: ${formatPrice(form.classicPrice, form.currency)}`,
      `Signature: ${formatPrice(form.signaturePrice, form.currency)}`,
      `Elite: ${formatPrice(form.elitePrice, form.currency)}`,
      `INCLUSIONS\n${list(form.includes, "To be confirmed")}`,
      `EXCLUSIONS\n${list(form.excludes, "To be confirmed")}`,
      isInternational && form.travelAdvisory ? `TRAVEL ADVISORY\n${form.travelAdvisory}` : "",
      "Please refer to the attached PDF for the complete formatted quotation, booking terms, and cancellation policy."
    ].filter(Boolean).join("\n\n");
  };

  const sendQuotationEmail = async () => {
    const customerEmail = String(form.customerEmail || "").trim();
    if (!EMAIL_PATTERN.test(customerEmail)) {
      setEmailStatus({ type: "error", message: "Enter a valid customer email address before sending the quotation." });
      return;
    }

    setSendingEmail(true);
    setEmailStatus(null);
    try {
      const { pdf, filename } = await buildQuotationPdf();
      const formData = new FormData();
      formData.append("customerEmail", customerEmail);
      formData.append("packageName", data?.heroTitle || data?.packageCode || "Travel Package");
      formData.append("packageCode", data?.packageCode || pkgId || "quotation");
      formData.append("quotationBody", buildQuotationEmailBody());
      formData.append("quotation", pdf.output("blob"), filename);
      // Leave the multipart header to the browser/Axios so its required boundary is present.
      await api.post("/quotations/email", formData);
      setEmailStatus({ type: "success", message: `Quotation sent to ${customerEmail}.` });
    } catch (error) {
      setEmailStatus({
        type: "error",
        message: error.response?.data?.message || "Unable to send the quotation email. You can still download the PDF."
      });
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="quotation-container">
      <div className="top-form">
        <div className="quote-form-heading">
          <div>
            <span>Admin PDF Workspace</span>
            <h3>Quotation Builder</h3>
          </div>
          <div className="quote-form-heading-actions">
            {data && (
              <strong className={`quote-template-pill ${isInternational ? "international" : "domestic"}`}>
                {isInternational ? "International Template" : "Domestic Template"}
              </strong>
            )}
            <BackButton />
          </div>
        </div>

        <h4>Employee Details</h4>
        <input
          placeholder="Employee Name"
          value={form.employeeName}
          onChange={(event) => setForm({ ...form, employeeName: event.target.value })}
        />

        <h4>Customer Details</h4>
        <input
          type="email"
          placeholder="Customer Email"
          value={form.customerEmail}
          onChange={(event) => setForm({ ...form, customerEmail: event.target.value })}
        />

        <h4>Package</h4>
        <div className="form-row two">
          <input
            placeholder="Package ID"
            value={pkgId}
            onChange={(event) => setPkgId(event.target.value)}
          />
          <input
            placeholder="Currency"
            value={form.currency}
            onChange={(event) => setForm({ ...form, currency: event.target.value.toUpperCase() })}
          />
        </div>

        <div className="btn-row">
          <button className="fetch-btn" onClick={fetchPackage}>Fetch Package</button>
          <button className="print-btn" onClick={downloadPDF} disabled={!data}>Download PDF</button>
          <button className="quote-email-btn" onClick={sendQuotationEmail} disabled={!data || sendingEmail}>
            {sendingEmail ? "Sending Email..." : "Send by Email"}
          </button>
        </div>
        {emailStatus && (
          <p className={`quote-email-status ${emailStatus.type}`} role={emailStatus.type === "error" ? "alert" : "status"}>
            {emailStatus.message}
          </p>
        )}

        <h4>Basic Details</h4>
        <div className="form-row">
          <input placeholder="Locations" value={form.locations} onChange={(event) => setForm({ ...form, locations: event.target.value })} />
          <input placeholder="Pickup - Drop" value={form.pickup} onChange={(event) => setForm({ ...form, pickup: event.target.value })} />
          <input placeholder="Rooms" value={form.rooms} onChange={(event) => setForm({ ...form, rooms: event.target.value })} />
        </div>
        <div className="form-row">
          <input placeholder="Total Persons" value={form.persons} onChange={(event) => setForm({ ...form, persons: event.target.value })} />
          <select
            className="quote-meal-select"
            aria-label="Meal Plan"
            value={form.meal}
            onChange={(event) => setForm({ ...form, meal: event.target.value })}
          >
            <option value="">Select Meal Plan</option>
            {MEAL_PLAN_OPTIONS.map((plan) => <option key={plan} value={plan}>{plan}</option>)}
          </select>
          <input placeholder="Vehicle" value={form.vehicle} onChange={(event) => setForm({ ...form, vehicle: event.target.value })} />
        </div>

        <h4>Tour Starting Date</h4>
        <label className="quote-date-field">
          <span>Select the date for itinerary day 1</span>
          <input
            type="date"
            aria-label="Tour Starting Date"
            value={form.tourStartDate}
            onChange={(event) => setForm({ ...form, tourStartDate: event.target.value })}
          />
        </label>

        <h4>Package Summary</h4>
        <textarea placeholder="Overview" value={form.overview} onChange={(event) => setForm({ ...form, overview: event.target.value })} />
        <textarea placeholder="Highlights (one per line)" value={form.highlights} onChange={(event) => setForm({ ...form, highlights: event.target.value })} />

        <h4>Editable Itinerary</h4>
        <div className="form-row two">
          <input
            placeholder="First Page Days"
            value={form.firstPageCount}
            onChange={(event) => setForm({ ...form, firstPageCount: event.target.value })}
          />
          <input
            placeholder="Other Page Days"
            value={form.otherPageCount}
            onChange={(event) => setForm({ ...form, otherPageCount: event.target.value })}
          />
        </div>

        {data && (
          <div className="itinerary-editor">
            <div className="itinerary-editor-header">
              <h4>Day-wise Details</h4>
              <input
                type="number"
                min="1"
                max="60"
                placeholder="No. of days"
                value={form.itineraryDays}
                onChange={(event) => updateItineraryCount(event.target.value)}
              />
            </div>
            <p className="quotation-media-help">
              Images are included in this quotation preview and downloaded PDF only; they do not change the package.
            </p>

            <div className="itinerary-editor-list">
              {quoteItinerary.map((day, index) => (
                <div className="itinerary-editor-day" key={`quote-day-${index}`}>
                  <div className="itinerary-editor-day-heading">
                    <strong>Day {day.day || day.dayNumber || index + 1}</strong>
                    {itineraryDate(form.tourStartDate, day, index) && (
                      <time dateTime={form.tourStartDate}>{itineraryDate(form.tourStartDate, day, index)}</time>
                    )}
                  </div>
                  <input
                    value={day.title || ""}
                    onChange={(event) => updateItineraryDay(index, "title", event.target.value)}
                    placeholder="Day title"
                  />
                  <textarea
                    value={day.desc || day.description || ""}
                    onChange={(event) => updateItineraryDay(index, "desc", event.target.value)}
                    placeholder="Day description"
                  />
                  <div className="quote-editor-image-grid">
                    {[0, 1, 2].map((imageIndex) => (
                      <QuoteImagePicker
                        key={imageIndex}
                        image={day.imageUrls?.[imageIndex]}
                        label={`Day ${index + 1} image ${imageIndex + 1}`}
                        onSelect={(image) => updateItineraryImage(index, imageIndex, image)}
                        onRemove={() => removeItineraryImage(index, imageIndex)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <h4>Hotel Details</h4>
        <div className="quote-hotel-fields">
          <label>
            <span>Classic Hotels</span>
            <HotelListInput
              value={form.classicHotel}
              onChange={(value) => setForm((previous) => ({ ...previous, classicHotel: value }))}
              placeholder="Type a hotel name and press Enter"
            />
          </label>
          <label>
            <span>Signature Hotels</span>
            <HotelListInput
              value={form.signatureHotel}
              onChange={(value) => setForm((previous) => ({ ...previous, signatureHotel: value }))}
              placeholder="Type a hotel name and press Enter"
            />
          </label>
          <label>
            <span>Elite Hotels</span>
            <HotelListInput
              value={form.eliteHotel}
              onChange={(value) => setForm((previous) => ({ ...previous, eliteHotel: value }))}
              placeholder="Type a hotel name and press Enter"
            />
          </label>
        </div>

        <h4>Pricing</h4>
        <div className="form-row">
          <input placeholder="Classic Price" value={form.classicPrice} onChange={(event) => setForm({ ...form, classicPrice: event.target.value })} />
          <input placeholder="Signature Price" value={form.signaturePrice} onChange={(event) => setForm({ ...form, signaturePrice: event.target.value })} />
          <input placeholder="Elite Price" value={form.elitePrice} onChange={(event) => setForm({ ...form, elitePrice: event.target.value })} />
        </div>

        <h4>Inclusions / Exclusions</h4>
        <textarea placeholder="Includes (one per line)" value={form.includes} onChange={(event) => setForm({ ...form, includes: event.target.value })} />
        <textarea placeholder="Excludes (one per line)" value={form.excludes} onChange={(event) => setForm({ ...form, excludes: event.target.value })} />

        <h4>International Travel Advisory</h4>
        <textarea placeholder="Visa and travel advisory" value={form.travelAdvisory} onChange={(event) => setForm({ ...form, travelAdvisory: event.target.value })} />
      </div>

      {data && (
        <div className={`pdf-wrapper ${isInternational ? "quote-international" : "quote-domestic"}`} id="pdf-content">
          <div className="page">
            <img src="/Starry Nights Holidays.png" className="quote-watermark" alt="" />
            <QuoteHeader template={data.template} title={data.heroTitle} />
            <section className="quote-hero">
              <span>{isInternational ? "Premium International Journey" : "Curated Indian Journey"}</span>
              <h2>{data.heroTitle}</h2>
              <p>
                {isInternational
                  ? "A polished overseas travel proposal with stay, transfers, inclusions, advisory notes, and multi-currency costing."
                  : "A thoughtfully planned domestic travel proposal with stays, transfers, inclusions, and clear INR costing."}
              </p>
            </section>
            <p className="quote-greeting">
              Dear Guest, greetings from Starry Nights Holidays. Thank you for allowing us to design
              your travel experience. Please find the curated itinerary and commercial details below.
            </p>
            <InfoGrid data={{ ...data, days: quoteItinerary.length || data.days }} form={form} />
            <section className="quote-package-summary">
              <h3 className="section-title">Overview</h3>
              <p className="quote-overview-copy">{form.overview || "Package overview will be confirmed by the sales team."}</p>
              <h3 className="section-title">Highlights</h3>
              {lines(form.highlights).length ? (
                <ul className="quote-highlights-list">
                  {lines(form.highlights).map((highlight) => <li key={highlight}>{highlight}</li>)}
                </ul>
              ) : <p className="quote-overview-copy">Package highlights will be confirmed by the sales team.</p>}
            </section>
            <QuoteFooter page={1} total={totalPages} />
          </div>

          {itineraryPages.map((pageDays, pageIndex) => (
            <div className="page" key={pageIndex}>
              <img src="/Starry Nights Holidays.png" className="quote-watermark" alt="" />
              <QuoteHeader template={data.template} title={data.heroTitle} />
              <h3 className="section-title">Detailed Itinerary</h3>
              {pageDays.length ? pageDays.map((day, index) => (
                <div key={`${day.day || index}-${day.title}`} className="day-box">
                  <div className="day-box-heading">
                    <span className="day-box-label">Day {day.day || day.dayNumber || index + 1}</span>
                    {itineraryDate(form.tourStartDate, day, index) && (
                      <time className="day-box-date" dateTime={form.tourStartDate}>
                        {itineraryDate(form.tourStartDate, day, index)}
                      </time>
                    )}
                    <h4>{day.title || "Planned Experience"}</h4>
                  </div>
                  <p>{day.desc || day.description || "Details will be shared by the operations team."}</p>
                  {(day.imageUrls || []).filter(Boolean).length > 0 && (
                    <div className="quote-day-image-grid">
                      {(day.imageUrls || []).filter(Boolean).slice(0, 3).map((image, imageIndex) => (
                        <QuotePdfImage
                          key={`${day.day || index}-image-${imageIndex}`}
                          alt={`Day ${day.day || index + 1}`}
                          image={image}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )) : (
                <div className="day-box">
                  <h4>Itinerary Under Preparation</h4>
                  <p>The detailed day-wise plan will be added once the package itinerary is available.</p>
                </div>
              )}

              <QuoteFooter page={pageIndex + 2} total={totalPages} />
            </div>
          ))}

          <div className="page">
            <img src="/Starry Nights Holidays.png" className="quote-watermark" alt="" />
            <QuoteHeader template={data.template} title={data.heroTitle} />
            <h3 className="section-title">Hotels, Transfers and Costing</h3>
            <div className="hotel-grid">
              {HOTEL_TIERS.map((tier) => (
                <div key={tier}>
                  <strong>{tier}</strong>
                  {lines(form[`${tier}Hotel`]).length ? (
                    <ul className="quote-hotel-list">
                      {lines(form[`${tier}Hotel`]).map((hotel) => <li key={hotel}>{hotel}</li>)}
                    </ul>
                  ) : <p>Hotel details to be confirmed.</p>}
                </div>
              ))}
            </div>
            <PricingBlock form={form} isInternational={isInternational} />
            <div className="quote-note">
              Prices are subject to hotel availability, seasonal changes, transport availability, taxes,
              and final travel dates. Final booking confirmation is subject to payment realization.
            </div>
            <QuoteFooter page={itineraryPages.length + 2} total={totalPages} />
          </div>

          <div className="page">
            <img src="/Starry Nights Holidays.png" className="quote-watermark" alt="" />
            <QuoteHeader template={data.template} title={data.heroTitle} />
            <h3 className="section-title">Package Inclusions</h3>
            <ul className="quote-list">
              {lines(form.includes).length ? lines(form.includes).map((item) => <li key={item}>{item}</li>) : <li>Inclusions will be updated by the sales team.</li>}
            </ul>
            <h3 className="section-title">Package Exclusions</h3>
            <ul className="quote-list">
              {lines(form.excludes).length ? lines(form.excludes).map((item) => <li key={item}>{item}</li>) : <li>Exclusions will be updated by the sales team.</li>}
            </ul>
            <QuoteFooter page={itineraryPages.length + 3} total={totalPages} />
          </div>

          {isInternational && (
            <div className="page">
              <img src="/Starry Nights Holidays.png" className="quote-watermark" alt="" />
              <QuoteHeader template={data.template} title={data.heroTitle} />
              <h3 className="section-title">Visa and Travel Advisory</h3>
              <div className="advisory-grid">
                <div>
                  <strong>Passport and Visa</strong>
                  <p>Passport validity, visa rules, and immigration approval remain subject to destination policy.</p>
                </div>
                <div>
                  <strong>Travel Insurance</strong>
                  <p>International medical and travel insurance is strongly recommended for every traveler.</p>
                </div>
                <div>
                  <strong>Currency and Forex</strong>
                  <p>Package costing may be shown in {form.currency}. INR conversion can vary by bank and payment date.</p>
                </div>
                <div>
                  <strong>Airline and Baggage</strong>
                  <p>Airline schedules, baggage rules, and seat allocation remain subject to airline policy.</p>
                </div>
              </div>
              <p className="quote-note">{form.travelAdvisory}</p>
              <QuoteFooter page={itineraryPages.length + 4} total={totalPages} />
            </div>
          )}

          <div className="page">
            <img src="/Starry Nights Holidays.png" className="quote-watermark" alt="" />
            <QuoteHeader template={data.template} title={data.heroTitle} />
            <h3 className="section-title">Booking Terms</h3>
            <div className="terms-block">
              <p><strong>Note:</strong> Any changes to the presently applicable tax structure in future, as per Government notifications, will be levied accordingly.</p>
              <p><strong>Important Note:</strong> Expenses incurred due to factors beyond our control, including natural calamities, heavy snowfall, landslides, political insurgencies, strikes, or similar events, are not included. Travel insurance and rescue costs are not included in the package cost.</p>
              <p><strong>Booking Confirmation:</strong> To confirm the package, a 50% payment must be deposited into the company account given below, after which the booking voucher will be issued. The guest must complete 100% payment at least 30 days before arrival; otherwise, the booking will be considered cancelled. Please email a screenshot of the advance-payment mode.</p>
              <p>The package may be altered or changed according to the customer’s requirements or interests where possible, subject to availability. Hotel check-out time is 10:00 hrs and check-in time is 12:00 noon; early check-in is subject to availability.</p>
              <p>We may reschedule sightseeing days subject to weather conditions and to ensure smooth tour execution. We are not responsible for cancellation of cabs or buses due to bad weather and are not liable for it. While Himachal has experienced substantial tourist growth, its available facilities may not match those of cities and other developed destinations.</p>
            </div>
            <QuoteFooter page={itineraryPages.length + (isInternational ? 5 : 4)} total={totalPages} />
          </div>

          <div className="page">
            <img src="/Starry Nights Holidays.png" className="quote-watermark" alt="" />
            <QuoteHeader template={data.template} title={data.heroTitle} />
            <h3 className="section-title">Cancellation Policy and Account Details</h3>
            <div className="terms-block">
              <p><strong>Cancellations:</strong> If the client wishes to amend or cancel a booking for any reason, including death, accident, illness, personal reasons, or non-payment of the balance payment, the Company is entitled to recover cancellation charges from the client.</p>
              <p>All cancellations must be communicated in writing. The advance amount is non-refundable, in addition to forfeiture of the tour deposit. Cancellation charges are: 30 or more days before departure — advance amount; 30 to 15 days before departure — 50% of total tour cost; 14 to 7 days before departure — 75% of total tour cost; and 7 to 1 days before departure — 100% of total tour cost. There is no refund for no-shows.</p>
              <p>If an amendment request results in cancellation of one or more services, the Company may recover the applicable cancellation charges stated above. Any amendment to the original booking must be submitted in writing and will be processed only after it is received by the Company. These cancellation charges apply to the main tour and optional tours published by Starry Nights Holidays, Maharashtra, India.</p>
              <p>For air or train tickets and other third-party products, cancellation charges will apply according to the respective airline, railway, or third-party provider terms. The Company may also recover applicable service charges for booking and cancelling such services for the client.</p>
            </div>
            <div className="account-box">
              <strong>Starry Nights Tours and Adventures</strong>
              <span>Bank: State Bank of India</span>
              <span>Account No: 43878937591</span>
              <span>Branch: Dhanegaon, MIDC, Nanded (MH)</span>
              <span>IFSC: SBIN0020425</span>
            </div>
            <div className="regards-section">
              <img src="/Starry Nights Holidays.png" className="regards-logo" alt="Starry Nights Holidays" />
              <p><strong>Warm Regards,</strong></p>
              <h3>{form.employeeName || "Starry Nights Team"}</h3>
              <p>{COMPANY.legalName}</p>
              <p>{COMPANY.phone} | {COMPANY.email}</p>
            </div>
            <QuoteFooter page={totalPages} total={totalPages} />
          </div>
        </div>
      )}

    </div>
  );
}
