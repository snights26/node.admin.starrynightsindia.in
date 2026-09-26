import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Toast from "../Common/Toast";
import api from "../Utils/api";
import "./ShowCategory.css";
import { FiTrash2 } from "react-icons/fi";

const PACKAGE_PAGE_SIZE = 20;

export default function ShowCategory() {
  const location = useLocation();
  const navigate = useNavigate();
  const { code } = useParams();

  const { categoryName, categoryCode } = location.state || {};
  const resolvedCode = categoryCode || code;

  const [category, setCategory] = useState({ code: resolvedCode, name: categoryName || resolvedCode });
  const [packages, setPackages] = useState([]);
  const [allPackages, setAllPackages] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [selected, setSelected] = useState([]);
  const [packageSearch, setPackageSearch] = useState("");
  const [packagePage, setPackagePage] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2000);
  };

  const loadData = async () => {
    try {
      const [categoryData, categoryPackages, packageData] = await Promise.all([
        api.get(`/categories/${resolvedCode}`),
        api.get(`/categories/${resolvedCode}/packages`),
        api.get("/packages")
      ]);
      setCategory(categoryData || { code: resolvedCode, name: categoryName || resolvedCode });
      setPackages(Array.isArray(categoryPackages) ? categoryPackages : []);
      setAllPackages(Array.isArray(packageData) ? packageData : []);
    } catch (error) {
      console.error("Failed to load category packages", error);
      setPackages([]);
      setAllPackages([]);
    }
  };

  useEffect(() => {
    loadData();
  }, [resolvedCode]);

  const handleRemove = async (packageCode) => {
    try {
      const data = await api.delete(`/categories/${resolvedCode}/packages/${packageCode}`);
      setPackages(Array.isArray(data) ? data : packages.filter((p) => p.packageCode !== packageCode && p.code !== packageCode));
      showToast("Package removed");
    } catch (error) {
      console.error("Failed to remove package", error);
      showToast("Could not remove package");
    }
  };

  const handleSelect = (packageCode) => {
    setSelected((prev) =>
      prev.includes(packageCode) ? prev.filter((s) => s !== packageCode) : [...prev, packageCode]
    );
  };

  const handleAdd = async () => {
    if (selected.length === 0 || isAdding) {
      return;
    }

    setIsAdding(true);
    try {
      let latest = packages;
      for (const packageCode of selected) {
        const data = await api.post(`/categories/${resolvedCode}/packages/${packageCode}`);
        if (Array.isArray(data)) {
          latest = data;
        }
      }
      setPackages(latest);
      setSelected([]);
      setShowModal(false);
      showToast("Package added");
    } catch (error) {
      console.error("Failed to add packages", error);
      showToast("Could not add package");
    } finally {
      setIsAdding(false);
    }
  };

  const openPackageSelector = () => {
    setSelected([]);
    setPackageSearch("");
    setPackagePage(1);
    setShowModal(true);
  };

  const closePackageSelector = () => {
    if (!isAdding) {
      setShowModal(false);
    }
  };

  const existingCodes = useMemo(
    () => new Set(packages.map((p) => p.packageCode || p.code || p.id)),
    [packages]
  );

  const filteredPackages = packages.filter((p) =>
    (p.name || p.title || "").toLowerCase().includes(search.toLowerCase())
  );

  const availablePackages = useMemo(
    () => allPackages.filter((p) => !existingCodes.has(p.packageCode || p.code || p.id)),
    [allPackages, existingCodes]
  );

  const filteredAvailablePackages = useMemo(() => {
    const query = packageSearch.trim().toLowerCase();
    if (!query) {
      return availablePackages;
    }

    return availablePackages.filter((pkg) => {
      const packageCode = pkg.packageCode || pkg.code || pkg.id || "";
      const packageName = pkg.name || pkg.title || "";
      return packageCode.toLowerCase().includes(query) || packageName.toLowerCase().includes(query);
    });
  }, [availablePackages, packageSearch]);

  const totalPackagePages = Math.max(1, Math.ceil(filteredAvailablePackages.length / PACKAGE_PAGE_SIZE));
  const currentPackagePage = Math.min(packagePage, totalPackagePages);
  const currentPagePackages = filteredAvailablePackages.slice(
    (currentPackagePage - 1) * PACKAGE_PAGE_SIZE,
    currentPackagePage * PACKAGE_PAGE_SIZE
  );
  const currentPageCodes = currentPagePackages.map((pkg) => pkg.packageCode || pkg.code || pkg.id);
  const isCurrentPageSelected = currentPageCodes.length > 0 && currentPageCodes.every((code) => selected.includes(code));

  const toggleCurrentPage = () => {
    setSelected((previous) => {
      if (isCurrentPageSelected) {
        return previous.filter((code) => !currentPageCodes.includes(code));
      }
      return [...new Set([...previous, ...currentPageCodes])];
    });
  };

  return (
    <div className="category-page">
      <div className="category-header">
        <div className="left-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            Back
          </button>

          <div>
            <h1>{category.name || category.title}</h1>
            <span className="category-code">{resolvedCode}</span>
          </div>
        </div>

        <button className="add-btn" onClick={openPackageSelector}>
          + Add Packages
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search Package..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-container">
        {filteredPackages.map((p) => {
          const packageCode = p.packageCode || p.code || p.id;
          return (
            <div key={packageCode} className="package-card">
              <div className="package-id">{packageCode}</div>
              <div className="package-name">{p.name || p.title}</div>

              <button className="remove-btn" onClick={() => handleRemove(packageCode)}>
                Remove
              </button>

              <button className="delete-icon" onClick={() => handleRemove(packageCode)}>
                <FiTrash2 />
              </button>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="package-selector-header">
              <div>
                <h3>Select Packages</h3>
                <span>{filteredAvailablePackages.length} available · {selected.length} selected</span>
              </div>
              <button type="button" className="package-selector-close" onClick={closePackageSelector} disabled={isAdding}>
                ×
              </button>
            </div>

            <input
              type="search"
              className="package-selector-search"
              placeholder="Search by package name or code..."
              value={packageSearch}
              onChange={(event) => {
                setPackageSearch(event.target.value);
                setPackagePage(1);
              }}
              autoFocus
            />

            <div className="package-selector-toolbar">
              <span>Page {currentPackagePage} of {totalPackagePages}</span>
              <button
                type="button"
                className="package-selector-page-select"
                onClick={toggleCurrentPage}
                disabled={currentPagePackages.length === 0 || isAdding}
              >
                {isCurrentPageSelected ? "Clear page" : "Select page"}
              </button>
            </div>

            <div className="package-list">
              {currentPagePackages.length === 0 ? (
                <div className="package-list-empty">No available packages match your search.</div>
              ) : currentPagePackages.map((p) => {
                const packageCode = p.packageCode || p.code || p.id;
                return (
                  <label key={packageCode} className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={selected.includes(packageCode)}
                      onChange={() => handleSelect(packageCode)}
                      disabled={isAdding}
                    />
                    <span>{p.name || p.title}</span>
                    <small>{packageCode}</small>
                  </label>
                );
              })}
            </div>

            <div className="package-selector-pagination">
              <button
                type="button"
                onClick={() => setPackagePage((page) => Math.max(1, page - 1))}
                disabled={currentPackagePage === 1 || isAdding}
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPackagePage((page) => Math.min(totalPackagePages, page + 1))}
                disabled={currentPackagePage === totalPackagePages || isAdding}
              >
                Next
              </button>
            </div>

            <div className="modal-actions">
              <button className="submit-btn" onClick={handleAdd} disabled={selected.length === 0 || isAdding}>
                {isAdding ? "Adding..." : `Add ${selected.length || "Selected"} Package${selected.length === 1 ? "" : "s"}`}
              </button>

              <button className="close-btn" onClick={closePackageSelector} disabled={isAdding}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}
