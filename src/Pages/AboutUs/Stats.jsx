
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Stats.css";

export default function Stats() {
  const navigate = useNavigate();
  const [zoom, setZoom] = useState(false);

  const stats = [
    { count: "8+", label: "Years of Building a Travel Legacy" },
    { count: "98.9%", label: "Trusted by Every Guest" },
    { count: "4.2K+", label: "Stories Across The Destinations" },
    { count: "12K+", label: "Global Happy Travelers" },
    { count: "800+", label: "Verified Hotel & Travel Partners" },
  ];

  useEffect(() => {
    const elements = document.querySelectorAll(".stat-number");

    elements.forEach((el) => {
      const targetText = el.dataset.value;
      const num = parseFloat(targetText);
      const suffix = targetText.replace(/[0-9.]/g, "");

      let start = 0;
      const duration = 1500;
      const step = num / (duration / 20);

      const interval = setInterval(() => {
        start += step;
        if (start >= num) {
          el.innerText = targetText;
          clearInterval(interval);
        } else {
          el.innerText = Math.floor(start) + suffix;
        }
      }, 20);
    });
  }, []);

  const handleClick = () => {
    setZoom(true);
    setTimeout(() => navigate("/about"), 500);
  };

  return (
    <div className={`stats-section ${zoom ? "zoom-effect" : ""}`}>
      <div className="stats-grid">
        {stats.map((s, i) => (
          <div className="stat-circle" key={i}>
            <div className="stat-content">
              <h2 className="stat-number" data-value={s.count}>0</h2>
              <p>{s.label}</p>
            </div>

            {/* Orbit Dot */}
            <span className="dot"></span>
          </div>
        ))}
      </div>

      <button className="about-link-btn" onClick={handleClick}>
        Know More About Us →
      </button>
    </div>
  );
}