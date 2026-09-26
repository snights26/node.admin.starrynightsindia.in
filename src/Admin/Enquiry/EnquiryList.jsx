import { useEffect, useState } from "react";
import api from "../../Utils/api";
import Pagination, { usePagination } from "../../Common/Pagination";
import BackButton from "../../Common/BackButton";
import "./EnquiryList.css";

function EnquiryList() {

  const [enquiries, setEnquiries] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [showVendorMsg, setShowVendorMsg] = useState(false);

  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadEnquiries = async () => {
      try {
        const data = await api.get("/enquiries");
        setEnquiries(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load enquiries", error);
        setEnquiries([]);
      }
    };

    loadEnquiries();
  }, []);

  /* 🚫 SCROLL LOCK */
  useEffect(() => {
    if (showMessage || showVendorMsg || showConfirm) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showMessage, showVendorMsg, showConfirm]);

  /* DATE FORMAT */
  const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    if (isNaN(d)) return "-";

    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  /* DURATION */
  const getDuration = (start, end) => {
    if (!start || !end) return "-";
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24));
    return `${diff}N_${diff + 1}D`;
  };

  const formatRooms = (rooms) => {
    const count = Number(rooms);
    if (!Number.isInteger(count) || count < 1) return "Not specified";
    return `${count} ${count === 1 ? "Room" : "Rooms"}`;
  };

  /* SEARCH + SORT */
  const filteredEnquiries = enquiries
    .filter(e =>
      (e.name || "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => new Date(b.created) - new Date(a.created));
  const { page, pageCount, pageItems, setPage } = usePagination(filteredEnquiries);

  /* VIEW */
  const viewMessage = (item) => {
    setSelected(item);
    setShowMessage(true);
  };

  const viewVendor = (item) => {
    setSelected(item);
    setShowVendorMsg(true);
  };

  /* MESSAGE FORMAT */
  const formatMessage = (e) => {
    return `#${e.inquiryId}

*${e.destination} Tour*

*Customer* :- ${e.name}
*Contact* :- ${e.contact}
*Email* :- ${e.email}

*Pickup City* :- ${e.pickupCity}
*Travel Type* :- ${e.purpose}

*Duration* :- ${getDuration(e.startDate, e.endDate)}
*Travel Dates* :- ${formatDate(e.startDate)} to ${formatDate(e.endDate)}

*Total Pax* :- ${e.persons} (${e.adult} Adult, ${e.child} Child)
*No. of Rooms* :- ${formatRooms(e.rooms)}

*Meal Plan* :- ${e.mealplan}
*Hotel* :- ${e.hotel}
*Vehicle* :- ${e.transport}

*Status* :- ${e.status}
*Created* :- ${formatDate(e.created)}

*Note* :-
${e.message}`;
  };

  const formatVendorMessage = (e) => {
    return `#${e.inquiryId}

*${e.destination} Tour*

*Pickup City* :- ${e.pickupCity}
*Travel Type* :- ${e.purpose}

*Duration* :- ${getDuration(e.startDate, e.endDate)}
*Travel Dates* :- ${formatDate(e.startDate)} to ${formatDate(e.endDate)}

*Total Pax* :- ${e.persons} (${e.adult} Adult, ${e.child} Child)
*No. of Rooms* :- ${formatRooms(e.rooms)}

*Meal Plan* :- ${e.mealplan}
*Hotel* :- ${e.hotel}
*Vehicle* :- ${e.transport}

*Status* :- ${e.status}
*Created* :- ${formatDate(e.created)}

*Note* :-
${e.message}`;
  };

  /* COPY */
  const copyFull = () => navigator.clipboard.writeText(formatMessage(selected));
  const copyVendor = () => navigator.clipboard.writeText(formatVendorMessage(selected));

  /* DELETE */
  const confirmDelete = (item) => {
    setSelected(item);
    setShowConfirm(true);
  };

  const deleteEnquiry = async () => {
    try {
      await api.delete(`/enquiries/${selected.inquiryId}`);
      setEnquiries(enquiries.filter(e => e.inquiryId !== selected.inquiryId));
    } catch (error) {
      console.error("Failed to delete enquiry", error);
    } finally {
      setShowConfirm(false);
    }
  };

  return (
    <div className="enquiry-container">

      {/* HEADER */}
      <div className="enquiry-header">
        <div className="header-left">
          <BackButton />
          <h1>Enquiry List</h1>
        </div>

        <input
          type="text"
          placeholder="Search by name..."
          className="search-box"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <table className="enquiry-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
           
            <th>Tour</th>
          
          
           
            <th>Created</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {pageItems.map((e) => (
            <tr key={e.inquiryId}>
              <td>{e.inquiryId}</td>
              <td>{e.name}</td>
             
              <td>{e.destination}</td>
             
             
              
              <td>{formatDate(e.created)}</td>

              <td className="action-btns">
                <button className="view-btn" onClick={() => viewMessage(e)}>View</button>
                <button className="view-btn" onClick={() => viewVendor(e)}>Vendor</button>
                <button className="delete-btn" onClick={() => confirmDelete(e)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} pageCount={pageCount} setPage={setPage} itemCount={filteredEnquiries.length} label="enquiries" />

      {/* FULL POPUP */}
      {showMessage && selected && (
        <div className="popup-overlay" onClick={() => setShowMessage(false)}>
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            <h2>Enquiry Message</h2>
            <pre className="message-format">{formatMessage(selected)}</pre>
            <div className="popup-actions">
              <button onClick={copyFull}>Copy</button>
              <button onClick={() => setShowMessage(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* VENDOR POPUP */}
      {showVendorMsg && selected && (
        <div className="popup-overlay" onClick={() => setShowVendorMsg(false)}>
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            <h2>Vendor Message</h2>
            <pre className="message-format">{formatVendorMessage(selected)}</pre>
            <div className="popup-actions">
              <button onClick={copyVendor}>Copy</button>
              <button onClick={() => setShowVendorMsg(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE POPUP */}
      {showConfirm && selected && (
        <div className="popup-overlay" onClick={() => setShowConfirm(false)}>
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            <h2>Delete Enquiry?</h2>
            <p>{selected.inquiryId}</p>
            <div className="popup-actions">
              <button onClick={() => setShowConfirm(false)}>Cancel</button>
              <button onClick={deleteEnquiry}>Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default EnquiryList;
