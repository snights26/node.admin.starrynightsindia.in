import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import { useNavigate } from "react-router-dom";
import api from "../../Utils/api";
import "react-calendar/dist/Calendar.css";
import "./ScheduledBookings.css";
import Pagination, { usePagination } from "../../Common/Pagination";

function ScheduledBookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchBookings, setSearchBookings] = useState("");

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const data = await api.get("/tours");
        setBookings(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load bookings", error);
        setBookings([]);
      }
    };

    loadBookings();
  }, []);

  const formatDate = (date) => date.toLocaleDateString("en-CA");

  let filteredBookings = bookings;

  if (selectedDate) {
    filteredBookings = filteredBookings.filter((b) => b.date === formatDate(selectedDate));
  }

  if (searchBookings.trim() !== "") {
    const query = searchBookings.trim().toLowerCase();
    filteredBookings = filteredBookings.filter((booking) =>
      [booking.tourId, booking.id, booking.name, booking.packageName, booking.date, booking.pickupDate, booking.contact, booking.mobile, booking.status]
        .some((value) => String(value || "").toLowerCase().includes(query))
    );
  }
  const { page, pageCount, pageItems, setPage } = usePagination(filteredBookings, 5, searchBookings);

  return (
    <div className="schedule-container">
      <div className="schedule-table">
        <div className="schedule-header">
          <h3>Scheduled Bookings</h3>

          <div className="schedule-actions">
            <button className="admin-view-btn" onClick={() => navigate("/admin/bookings")}>
              Manage Bookings
            </button>
            <input
              type="text"
              type="search"
              placeholder="Search bookings..."
              className="tour-search"
              value={searchBookings}
              onChange={(e) => setSearchBookings(e.target.value)}
            />
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Tour ID</th>
              <th>Name</th>
              <th>Date</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Transport Slip</th>
            </tr>
          </thead>

          <tbody>
            {filteredBookings.length > 0 ? (
              pageItems.map((b) => (
                <tr key={b.tourId || b.id}>
                  <td>{b.tourId || b.id}</td>
                  <td>{b.name || b.packageName}</td>
                  <td>{b.date || b.pickupDate}</td>
                  <td>{b.contact || b.mobile}</td>
                  <td className={b.status === "Confirmed" ? "status-ok" : "status-pending"}>
                    {b.status}
                  </td>
                  <td>
                    <button
                      className="view-btn"
                      onClick={() => navigate(`/transport-slip/${b.tourId || b.id}`)}
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>
                  No bookings found
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination page={page} pageCount={pageCount} setPage={setPage} itemCount={filteredBookings.length} label="bookings" />
      </div>

      <div className="calendar-box">
        <h3>Tour Calendar</h3>
        <div className="calendar-scroll">
          <Calendar onChange={(date) => setSelectedDate(date)} value={selectedDate} />
        </div>
      </div>
    </div>
  );
}

export default ScheduledBookings;
