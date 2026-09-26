import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaWhatsapp, FaInstagram, FaLinkedin } from "react-icons/fa";
import "./Footer.css";
import { useNavigate } from "react-router-dom";

export default function Footer() {
  const [showTerms, setShowTerms] = useState(false);
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  const openModal = () => {
    setShowTerms(true);
  };

  const closeModal = () => {
    setShowTerms(false);
  };

  // Stop background scroll + ESC close
  useEffect(() => {
    if (showTerms) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    const handleEsc = (e) => {
      if (e.key === "Escape") closeModal();
    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [showTerms]);

  return (
    <>
      <footer className="footer">

<div className="snf-brands-strip">
  <p className="snf-brands-title">Our Brands</p>

  <div className="snf-brands-row">

    {/* 🔥 HOLIDAYS */}
    <div
      className="snf-brand"
      onClick={() =>
        navigate("/all-packages", {
          state: {
            title: "Starry Nights Holidays",
            categoryCode: "HOLIDAYS"
          }
        })
      }
    >
      <img src="/Starry-Nights-Holidays.png" alt="Starry Nights Holidays" />
       <span className="snf-brand-name">
    Starry Nights Holidays
  </span>
      <div className="snf-brand-info">
        <h5>Starry Nights Holidays</h5>
        <p>
          Expertly curated premium tours covering leisure travel, weekend getaways,
          and customized holiday experiences designed for comfort and memorable journeys.
        </p>
      </div>
    </div>

    {/* 🔥 ADVENTURES */}
    <div
      className="snf-brand"
      onClick={() =>
        navigate("/all-packages", {
          state: {
            title: "Starry Nights Adventures",
            categoryCode: "ADVENTURE"
          }
        })
      }
    >
      <img src="/Starry-Nights-Adventures.png" alt="Starry Nights Adventures" />
      <span className="snf-brand-name">
  Starry Nights Adventures
</span>
      <div className="snf-brand-info">
        <h5>Starry Nights Adventures</h5>
        <p>
          High-energy adventure experiences including trekking, camping, hiking,
          and outdoor expeditions crafted for thrill seekers and nature lovers.
        </p>
      </div>
    </div>

    {/* 🔥 PAULKHUNA */}
    <div
      className="snf-brand"
      onClick={() =>
        navigate("/all-packages", {
          state: {
            title: "पाऊलखुणा",
            categoryCode: "GROUP"
          }
        })
      }
    >
      <img src="/Paulkhuna-By-Starry-Nights.png" alt="Paulkhuna by Starry Nights" />
      <span className="snf-brand-name">
  पाऊलखुणा Group Tours <br/>By<br/> Starry Nights
</span>
      <div className="snf-brand-info">
        <h5>पाऊलखुणा</h5>
        <p>
          A specialized unit focused on group tours, cultural journeys,
          and exclusive batch experiences that bring people together through travel.
        </p>
      </div>
    </div>

  </div>
</div>
        <div className="footer-container">

          {/* Brand */}
          <div className="footer-col">
            <img
              src="/Starry Nights Holidays.png"
              alt="Starry Nights Holidays"
              className="footer-logo"
            />
            <p className="footer-description">
              Curated travel experiences. Premium weekend escapes crafted for unforgettable memories.
            </p>
          </div>

          {/* Explore */}
          <div className="footer-col">
            <h4>Explore</h4>
            <Link to="/">Home</Link>
            <Link to="/all-packages">Packages</Link>
            <Link to="/all-categories">Categories</Link>
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact</Link>
          </div>

          {/* Support */}
          <div className="footer-col">
            <h4>Support</h4>
            <a onClick={openModal}>Booking Terms</a>
            <a onClick={openModal}>Cancellation Policy</a>
          </div>

          {/* Contact */}
          <div className="footer-col footer-contact">
            <h4>Contact</h4>

            <a href="tel:+918847755042">+91 884 7755 042</a>
            <a href="tel:+919284137430">+91 928 4137 430</a>

            <a href="mailto:travelwithstarrynights@gmail.com">
              travelwithstarrynights@gmail.com
            </a>

            <a
              href="https://maps.app.goo.gl/XdpxF664BZL1MYHx6"
              target="_blank"
              rel="noopener noreferrer"
            >
              Head Office: 004, Headquarters Starry Nights, HUDCO Nanded.
              
            </a>

            <a
              href="https://maps.app.goo.gl/XdpxF664BZL1MYHx6"
              target="_blank"
              rel="noopener noreferrer"
            >
              Branch Office: Pune Bangalore Highway, Chandani Chowk, Pune
            </a>

            <div className="footer-social">
              <a
                href="https://wa.me/message/UTCOF3APCTTKP1"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaWhatsapp className="social-icon" />
              </a>

              <a
                href="https://www.instagram.com/starrynights.india"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaInstagram className="social-icon" />
              </a>

              <a
                href="https://www.linkedin.com/in/darshan-shinde-831410327/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaLinkedin className="social-icon" />
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          © {currentYear} Starry Nights Holidays. Explore Beyond Limits.
        </div>
      </footer>

      {/* Modal */}
      {showTerms && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-btn" onClick={closeModal}>
              ×
            </button>

            <h2>Booking Terms & Cancellation Policy</h2>

            <p>
              Any changes in applicable tax structure as per Government notifications will be levied accordingly.
            </p>

            <h4>Important Notes</h4>
            <ul>
              <li>Hotel check-in/check-out as per hotel policy.</li>
              <li>Base category room if not selected.</li>
              <li>Meals timings must be followed.</li>
              <li>Natural calamities expenses borne by client.</li>
              <li>Valid ID proof mandatory.</li>
              <li>Extra bed means extra mattress.</li>
            </ul>

            <h4>Cancellation Policy</h4>
            <ul>
              <li>30+ days: Advance non-refundable.</li>
              <li>30–15 days: 50% of total cost.</li>
              <li>14–7 days: 75% of total cost.</li>
              <li>7–1 days: 100% of total cost.</li>
              <li>No refund for No Shows.</li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}