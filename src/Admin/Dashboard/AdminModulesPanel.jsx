import "./AdminModulesPanel.css";
import { useNavigate } from "react-router-dom";
import { isOperationsAdmin } from "../../Utils/auth";

const moduleSections = [
  {
    title: "Management",
    items: [
      "Users",
      "User Package Likes",
      "Package View Analytics",
      "Cache Management",
      "Administrator Accounts",
      "Customer Submissions",
      "Active Enquiry",
      "Payments",
      
      "Notification",
      "Get Quotation"
    ]
  },
  {
    title: "Content",
    items: [
      "Category",
      "Package",
      "Gallery",
      "Hero Sliders",
      "Homepage Statistics",
      "Featured Rows",
      "Occasion Popups"
    ]
  },
  {
    title: "AI Tools",
    items: [
      "Keywords",
      "Unanswered Questions",
      "Chat Analytics"
      
    ]
  }
];

function AdminModulesPanel() {

  const navigate = useNavigate();
  const operationsAdmin = isOperationsAdmin();

  const routes = {
    "Users": "/admin/users",
    "User Package Likes": "/admin/user-liked-packages",
    "Package View Analytics": "/admin/package-views",
    "Cache Management": "/admin/cache-management",
    "Administrator Accounts": "/admin/administrator-accounts",
    "Customer Submissions": "/admin/customer-submissions",
    "Active Enquiry": "/admin/enquiry",
    "Payments": "/admin/payments",
    "Package": "/admin/packages",
    "Get Quotation": "/admin/GetQuotation",
    "Category": "/admin/categories",
    "Gallery": "/admin/gallery",
    "Hero Sliders": "/admin/hero-sliders",
    "Homepage Statistics": "/admin/homepage-statistics",
    "Notification": "/admin/notifications",
    "Keywords": "/admin/keywords",
    "Unanswered Questions": "/admin/unanswered",
    "Chat Analytics": "/admin/chat-analytics",
    "Featured Rows": "/admin/featured-rows",
    "Occasion Popups": "/admin/occasion-popups"
  };

  return (

    <div className="amp-wrapper">

      <div className="amp-header">
        <h3>System Management Suite</h3>
        <span>Configure, control, and optimize your business infrastructure</span>
      </div>

      {moduleSections.map((section, i) => {
        const visibleItems = section.items.filter((item) =>
          !["Administrator Accounts", "Occasion Popups", "Customer Submissions"].includes(item) || !operationsAdmin
        );

        return (

        <div key={i} className="amp-section">

          {/* SECTION TITLE */}
          <div className="amp-section-title">
            {section.title}
          </div>

          {/* ITEMS */}
          <div className="amp-list">

            {visibleItems.map((item, j) => (

              <div
                key={j}
                className="amp-item"
                onClick={() => navigate(routes[item])}
              >
                <span className="amp-dot"></span>
                <span className="amp-item-label">{item}</span>
              </div>

            ))}

          </div>

        </div>

        );
      })}

    </div>

  );
}

export default AdminModulesPanel;
