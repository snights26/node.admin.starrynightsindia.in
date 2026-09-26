import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./BackButton.css";

export default function BackButton({ to = "/dashboard", className = "" }) {
  const navigate = useNavigate();
  return (
    <button type="button" className={`admin-back-button ${className}`.trim()} onClick={() => navigate(to)}>
      <FaArrowLeft aria-hidden="true" />
      <span>Back</span>
    </button>
  );
}
