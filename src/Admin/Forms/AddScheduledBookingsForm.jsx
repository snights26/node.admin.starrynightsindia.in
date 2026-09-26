import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import Select from "react-select";
import api from "../../Utils/api";
import "react-datepicker/dist/react-datepicker.css";
import "./AddScheduledBookingsForm.css";

export default function AddScheduledBookingsForm({ mode }) {

  const navigate = useNavigate();
  const { id } = useParams();
  const [documents, setDocuments] = useState([]);
  const [form, setForm] = useState({
    userId: "",
    packageId: "",
    fullName: "",
    mobile: "",
    adults: "",
    kids: "",
    pickupLocation: "",
    dropLocation: "",
    driverName: "",
    driverContact: "",
    vehicleCategory: "",
    vehicleNo: "",
    idType: "",
    idNumber: "",
    emergencyContact: "",
    advanceAmount: "",
    bookingTransactionId: "",
    bookingPaymentMode: "Booking Amount",
    totalCost: "",
    paymentStatus: ""
  });

  const [packages, setPackages] = useState([]);
  const [rows, setRows] = useState([]);

  const [pickupDate, setPickupDate] = useState(null);
  const [dropDate, setDropDate] = useState(null);
  const [duration, setDuration] = useState("");
  const [dateError, setDateError] = useState("");
  const [accommodationError, setAccommodationError] = useState("");

  const [popup, setPopup] = useState(false);

  useEffect(() => {
    const loadPackages = async () => {
      try {
        const data = await api.get("/packages");
        setPackages(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load packages", error);
        setPackages([]);
      }
    };

    loadPackages();

  }, []);

  useEffect(() => {
    if (mode !== "edit" || !id) return;

    const loadTour = async () => {
      try {
        const tour = await api.get(`/tours/${id}`);
        setForm((prev) => ({
          ...prev,
          userId: tour.userId || "",
          packageId: tour.packageCode || "",
          fullName: tour.fullName || tour.name || "",
          mobile: tour.mobile || tour.contact || "",
          adults: tour.adults || "",
          kids: tour.kids || "",
          pickupLocation: tour.pickupLocation || "",
          dropLocation: tour.dropLocation || "",
          driverName: tour.driverName || tour.driver || "",
          driverContact: tour.driverContact || "",
          vehicleCategory: tour.vehicleCategory || tour.vehicle || "",
          vehicleNo: tour.vehicleNo || "",
          idType: tour.idType || "",
          idNumber: tour.idNumber || "",
          emergencyContact: tour.emergencyContact || "",
          advanceAmount: tour.advanceAmount || "",
          bookingTransactionId: "",
          bookingPaymentMode: "Booking Amount",
          totalCost: tour.totalCost || "",
          paymentStatus: tour.paymentStatus || ""
        }));
        setPickupDate(tour.pickupDate ? new Date(tour.pickupDate) : null);
        setDropDate(tour.dropDate ? new Date(tour.dropDate) : null);
        setDuration(tour.duration || "");
        setRows(Array.isArray(tour.accommodation) ? tour.accommodation : []);
      } catch (error) {
        console.error("Failed to load tour", error);
      }
    };

    loadTour();
  }, [mode, id]);

  const packageOptions = packages.map(p => ({
    value: p.packageCode || p.code || p.id,
    label: `${p.packageCode || p.code || p.id} - ${p.name || p.title}`
  }));

  const handleUserFetch = async () => {
    if (!form.userId) return;
    try {
      const user = await api.get(`/users/${form.userId}`);
      setForm(prev => ({
        ...prev,
        fullName: user.name || "",
        mobile: user.contact || user.mobile || "",
        idType: user.idType || "",
        idNumber: user.idNumber || ""
      }));
    } catch (error) {
      console.error("Failed to fetch user", error);
      alert("User not found");
    }
  };
  const handleFileUpload = (e) => {
  const files = Array.from(e.target.files);

  const newDocs = files.map(file => ({
    name: file.name,
    file: file,
    preview: null,
    progress: 0,
    type: file.type,
    uploaded: false   // ✅ NEW FLAG
  }));

  setDocuments(prev => [...prev, ...newDocs]);

  newDocs.forEach((doc, index) => {
    let prog = 0;

    const interval = setInterval(() => {
      prog += 10;

      setDocuments(prev => {
        const updated = [...prev];
        const targetIndex = prev.length - newDocs.length + index;

        if (updated[targetIndex]) {
          updated[targetIndex].progress = prog;

          if (prog >= 100) {
            updated[targetIndex].preview = URL.createObjectURL(doc.file);
            updated[targetIndex].uploaded = true; // ✅ SHOW TICK
          }
        }

        return updated;
      });

      if (prog >= 100) clearInterval(interval);
    }, 200);
  });
};

const removeFile = (index) => {
  const updated = [...documents];
  updated.splice(index, 1);
  setDocuments(updated);
};

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toDateString = (value) => value ? value.toLocaleDateString("en-CA") : "";
  const pickupDateValue = toDateString(pickupDate);
  const dropDateValue = toDateString(dropDate);
  const hasValidTravelRange = Boolean(pickupDateValue && dropDateValue && pickupDateValue <= dropDateValue);

  const validateAccommodation = (accommodation, range = { pickup: pickupDateValue, drop: dropDateValue }) => {
    const activeRows = accommodation
      .map((row, index) => ({ ...row, index }))
      .filter((row) => [row.city, row.checkin, row.checkout, row.hotel, row.contact]
        .some((value) => String(value || "").trim()));

    if (!activeRows.length) return "";
    if (!range.pickup || !range.drop || range.pickup > range.drop) {
      return "Set a valid pickup and drop date before adding accommodation dates.";
    }

    let previousCheckout = "";
    for (const row of activeRows) {
      const label = `Accommodation row ${row.index + 1}`;
      if (!row.checkin || !row.checkout) return `${label} needs both check-in and checkout dates.`;
      if (row.checkin < range.pickup || row.checkout > range.drop) {
        return `${label} must stay within the pickup and drop date range.`;
      }
      if (row.checkout <= row.checkin) return `${label} checkout must be after its check-in date.`;
      if (previousCheckout && row.checkin < previousCheckout) {
        return `${label} check-in cannot be before the previous hotel checkout.`;
      }
      previousCheckout = row.checkout;
    }
    return "";
  };

  /* HOTEL */
  const addRow = () => {
    if (!hasValidTravelRange) {
      setAccommodationError("Set a valid pickup and drop date before adding accommodation.");
      return;
    }
    if (rows.length && !rows.at(-1).checkout) {
      setAccommodationError("Set the previous hotel checkout date before adding the next accommodation.");
      return;
    }
    const previousCheckout = rows.at(-1)?.checkout || pickupDateValue;
    const updated = [...rows, { city: "", checkin: previousCheckout, checkout: "", hotel: "", contact: "" }];
    setRows(updated);
    setAccommodationError(validateAccommodation(updated));
  };

  const handleRowChange = (i, field, value) => {
    const updated = rows.map((row, index) => index === i ? { ...row, [field]: value } : { ...row });
    if (field === "checkout" && updated[i + 1] && value) {
      updated[i + 1].checkin = value;
      if (updated[i + 1].checkout && updated[i + 1].checkout <= value) {
        updated[i + 1].checkout = "";
      }
    }
    setRows(updated);
    setAccommodationError(validateAccommodation(updated));
  };

  const removeRow = (index) => {
    const updated = rows.filter((_, rowIndex) => rowIndex !== index);
    const nextRow = updated[index];

    if (nextRow) {
      const precedingCheckout = index > 0 ? updated[index - 1]?.checkout : pickupDateValue;
      nextRow.checkin = precedingCheckout || "";
      if (nextRow.checkout && (!nextRow.checkin || nextRow.checkout <= nextRow.checkin)) {
        nextRow.checkout = "";
      }
    }

    setRows(updated);
    setAccommodationError(validateAccommodation(updated));
  };

  /* DATE */
  const calculateDuration = (start, end) => {

    if (!start || !end) return setDuration("");

    if (end < start) {
      setDateError("Invalid Dates ❌");
      return setDuration("");
    }

    setDateError("");

    const days = (end - start) / (1000 * 60 * 60 * 24) + 1;
    setDuration(`${days - 1}N/${days}D`);
  };

  const handlePickup = (d) => {
    setPickupDate(d);
    calculateDuration(d, dropDate);
    setAccommodationError(validateAccommodation(rows, { pickup: toDateString(d), drop: dropDateValue }));
  };

  const handleDrop = (d) => {
    setDropDate(d);
    calculateDuration(pickupDate, d);
    setAccommodationError(validateAccommodation(rows, { pickup: pickupDateValue, drop: toDateString(d) }));
  };

  /* SUBMIT */
  const handleSubmit = async () => {

    if (dateError) return;
    const currentAccommodationError = validateAccommodation(rows);
    if (currentAccommodationError) {
      setAccommodationError(currentAccommodationError);
      return;
    }

    const payload = {
      ...form,
      pickupDate: toDateString(pickupDate),
      dropDate: toDateString(dropDate),
      duration,
      accommodation: rows
    };

    try {
      if (mode === "edit") {
        await api.put(`/tours/${id}`, payload);
      } else {
        await api.post("/tours", payload);
      }
      setPopup(true);
    } catch (error) {
      console.error("Failed to save booking", error);
      alert("Unable to save booking");
    }
  };

  return (
    <div className="sbf-page">

      <div className="sbf-card">

        <div className="sbf-header">
          <h2>{mode === "add" ? "Add Booking" : "Edit Booking"}</h2>
          <button onClick={() => navigate(-1)}>← Back</button>
        </div>

        {/* USER */}
        <div className="sbf-section">
          <label>User ID</label>

          <div className="sbf-user-row">
            <input name="userId" value={form.userId} onChange={handleChange}/>
            <button onClick={handleUserFetch}>Fetch</button>
          </div>
        </div>

        {/* PACKAGE */}
        <div className="sbf-section">
          <label>Package</label>

          <Select
            options={packageOptions}
            value={packageOptions.find(opt => opt.value === form.packageId) || null}
            onChange={(selected) =>
              setForm({ ...form, packageId: selected?.value || "" })
            }
            placeholder="Search Package..."
            classNamePrefix="rs"
          />
        </div>

        {/* GUEST */}
        <div className="sbf-section">
          <h3>Guest Info</h3>

          <div className="sbf-grid-2">
            <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Full Name"/>
            <input name="mobile" value={form.mobile} onChange={handleChange} placeholder="Mobile"/>
            <input name="adults" value={form.adults} onChange={handleChange} placeholder="Adults"/>
            <input name="kids" value={form.kids} onChange={handleChange} placeholder="Kids"/>
          </div>
        </div>

        {/* TRAVEL */}
        <div className="sbf-section">
          <h3>Travel Info</h3>

          <div className="sbf-grid-2">

            <DatePicker
              selected={pickupDate}
              onChange={handlePickup}
              placeholderText="Pickup Date"
              popperPlacement="bottom-start"
              maxDate={dropDate || undefined}
            />

            <DatePicker
              selected={dropDate}
              onChange={handleDrop}
              placeholderText="Drop Date"
              popperPlacement="bottom-start"
              minDate={pickupDate || undefined}
            />

            <input value={duration} readOnly placeholder="Duration"/>

            <input name="pickupLocation" value={form.pickupLocation} onChange={handleChange} placeholder="Pickup Location"/>
            <input name="dropLocation" value={form.dropLocation} onChange={handleChange} placeholder="Drop Location"/>

          </div>

          {dateError && <p className="sbf-error">{dateError}</p>}
          {accommodationError && <p className="sbf-error">{accommodationError}</p>}
        </div>

        {/* VEHICLE */}
        <div className="sbf-section">
          <h3>Vehicle Info</h3>

          <div className="sbf-grid-2">
            <input name="driverName" value={form.driverName} onChange={handleChange} placeholder="Driver Name"/>
            <input name="driverContact" value={form.driverContact} onChange={handleChange} placeholder="Contact"/>
            <input name="vehicleCategory" value={form.vehicleCategory} onChange={handleChange} placeholder="Category"/>
            <input name="vehicleNo" value={form.vehicleNo} onChange={handleChange} placeholder="Vehicle No"/>
          </div>
        </div>

        {/* PAYMENT */}
        <div className="sbf-section">
          <h3>Payment</h3>

          <div className="sbf-grid-2">
            <input name="advanceAmount" value={form.advanceAmount} onChange={handleChange} placeholder="Booking Amount"/>
            <input name="totalCost" value={form.totalCost} onChange={handleChange} placeholder="Total Cost"/>
            <input name="bookingTransactionId" value={form.bookingTransactionId} onChange={handleChange} placeholder="Booking Transaction ID"/>
            <input name="bookingPaymentMode" value={form.bookingPaymentMode} onChange={handleChange} placeholder="Booking Payment Mode"/>

            <select name="paymentStatus" value={form.paymentStatus} onChange={handleChange}>
              <option value="">Status</option>
              <option>Pending</option>
              <option>Partial</option>
              <option>Paid</option>
            </select>
          </div>
        </div>

        {/* ID */}
        <div className="sbf-section">
          <h3>ID & Emergency</h3>
          

          <div className="sbf-grid-2">
            <input name="idType" value={form.idType} onChange={handleChange} placeholder="ID Type"/>
            <input name="idNumber" value={form.idNumber} onChange={handleChange} placeholder="ID No"/>
            <input name="emergencyContact" value={form.emergencyContact} onChange={handleChange} placeholder="Emergency Contact"/>
          </div>
          {/* DOCUMENT UPLOAD */}
<div className="sbf-section">
  <h3>Upload Documents</h3>

  <input
    type="file"
    multiple
    onChange={handleFileUpload}
  />

  <div className="sbf-doc-list">
  {documents.map((doc, i) => (
    <div key={i} className="sbf-doc-item">

      {/* LEFT */}
      <div className="sbf-doc-left">

  {/* ⛔ Uploading state */}
  {doc.progress < 100 ? (
    <div className="uploading-box">Uploading...</div>
  ) : (
    <>
      {doc.type.startsWith("image") ? (
        <img src={doc.preview} alt="preview" />
      ) : doc.type === "application/pdf" ? (
        <iframe src={doc.preview} title="pdf" />
      ) : (
        <span className="file-icon">📄</span>
      )}
    </>
  )}

</div>

      {/* CENTER */}
      <div className="sbf-doc-center">
        <p>{doc.name}</p>

        {/* PROGRESS BAR */}
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${doc.progress}%` }}
          ></div>
        </div>
      </div>

      {/* RIGHT */}
<div className="sbf-doc-actions">

  {/* ✅ SUCCESS TICK */}
  {doc.uploaded && (
    <div className="success-tick">✔</div>
  )}

  <button onClick={() => removeFile(i)}>❌</button>

</div>
    </div>
  ))}
</div>
</div>
        </div>

        {/* HOTEL */}
        <div className="sbf-section">
          <div className="sbf-row-header">
            <h3>Accommodation</h3>
            <button onClick={addRow}>+ Add Row</button>
          </div>

          <div className="sbf-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>City</th>
                  <th>Checkin</th>
                  <th>Checkout</th>
                  <th>Hotel</th>
                  <th>Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td><input value={r.city || ""} onChange={(e)=>handleRowChange(i,"city",e.target.value)}/></td>
                    <td><input type="date" value={r.checkin || ""} onChange={(e)=>handleRowChange(i,"checkin",e.target.value)} min={i > 0 ? rows[i - 1]?.checkout || pickupDateValue : pickupDateValue} max={dropDateValue} disabled={!hasValidTravelRange}/></td>
                    <td><input type="date" value={r.checkout || ""} onChange={(e)=>handleRowChange(i,"checkout",e.target.value)} min={r.checkin || pickupDateValue} max={dropDateValue} disabled={!hasValidTravelRange}/></td>
                    <td><input value={r.hotel || ""} onChange={(e)=>handleRowChange(i,"hotel",e.target.value)}/></td>
                    <td><input value={r.contact || ""} onChange={(e)=>handleRowChange(i,"contact",e.target.value)}/></td>
                    <td>
                      <button type="button" className="sbf-remove-row" onClick={() => removeRow(i)}>
                        Delete row
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <button className="sbf-submit" onClick={handleSubmit}>
          Submit Booking
        </button>

      </div>

      {popup && (
        <div className="sbf-popup">
          <div className="sbf-popup-box">
            <h3>Booking Saved ✅</h3>
            <p>User ID: <strong>{form.userId}</strong></p>
            <button onClick={()=>navigate("/admin/bookings")}>OK</button>
          </div>
        </div>
      )}

    </div>
  );
}
