import "./ScheduledBookingsList.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import api from "../../Utils/api";
import Pagination, { usePagination } from "../../Common/Pagination";

function ScheduledBookingsList() {

  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return data;
    return data.filter((booking) => [booking.tourId, booking.id, booking.name, booking.date, booking.pickupDate, booking.contact, booking.status]
      .some((value) => String(value || "").toLowerCase().includes(query)));
  }, [data, search]);
  const { page, pageCount, pageItems, setPage } = usePagination(filteredBookings, 5, search);

  useEffect(() => {
    const loadTours = async () => {
      try {
        const tours = await api.get("/tours");
        setData(Array.isArray(tours) ? tours : []);
      } catch (error) {
        console.error("Failed to load bookings", error);
        setData([]);
      }
    };

    loadTours();
  }, []);

  const removeBooking = async (tourId) => {
    if (!window.confirm("Remove this booking?")) return;
    try {
      await api.delete(`/tours/${tourId}`);
      setData((prev) => prev.filter((item) => (item.tourId || item.id) !== tourId));
    } catch (error) {
      console.error("Failed to remove booking", error);
    }
  };

  return (
    <div className="sb-page">

      <div className="sb-header">
        <h2>Scheduled Bookings</h2>

        <div className="sb-actions">
          <button onClick={() => navigate("/admin/bookings/new")}>
            + Add
          </button>

          <button onClick={() => navigate("/dashboard")}>
            ← Back
          </button>
        </div>
      </div>

      <input
        className="sb-search"
        type="search"
        placeholder="Search by tour ID, name, date, contact, or status..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <div className="sb-table-box">
        <table>
          <thead>
            <tr>
              <th>Tour ID</th>
              <th>Name</th>
              <th>Date</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredBookings.length === 0 ? (
              <tr><td colSpan="6" className="sb-empty">No scheduled bookings found.</td></tr>
            ) : pageItems.map((b, i) => (
              <tr key={i}>
                <td>{b.tourId || b.id}</td>
                <td>{b.name}</td>
                <td>{b.date || b.pickupDate}</td>
                <td>{b.contact}</td>
                <td className={
  b.status === "Confirmed"
    ? "status-confirmed"
    : "status-pending"
}>
  {b.status}
</td>
                <td>
                  <button onClick={() => navigate(`/admin/bookings/edit/${b.tourId || b.id}`)}>Edit</button>
                  <button onClick={() => removeBooking(b.tourId || b.id)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
      <Pagination page={page} pageCount={pageCount} setPage={setPage} itemCount={filteredBookings.length} label="bookings" />

    </div>
  );
}

export default ScheduledBookingsList;
