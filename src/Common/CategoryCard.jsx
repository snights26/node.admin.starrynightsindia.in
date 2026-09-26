import { useState } from "react";
import "./CategoryCard.css";
import { resolveAssetUrl } from "../Utils/fileUpload";

export default function CategoryCard({ title, image, onClick }) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasImage = Boolean(image) && !imageFailed;
  const initials = (title || "?").trim().charAt(0).toUpperCase();

  return (
    <div
      className={`dashboard-category-card ${hasImage ? "" : "is-placeholder"}`}
      onClick={onClick}
    >
      <div className="dashboard-category-image-wrapper">
        <img
          src="/Starry Nights Holidays.png"
          alt="Starry Nights Holidays"
          className="dashboard-category-corner-logo"
        />

        {hasImage ? (
          <img
            src={resolveAssetUrl(image)}
            alt={title}
            className="dashboard-category-image"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="dashboard-category-placeholder">
            <span>{initials}</span>
          </div>
        )}
      </div>

      <div className="dashboard-category-title">{title}</div>
    </div>
  );
}
