import "./PackagesList.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../Utils/api";
import Pagination, { usePagination } from "../../Common/Pagination";
import BackButton from "../../Common/BackButton";

function PackagesList() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [search, setSearch] = useState("");
  const filteredPackages = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return packages;
    return packages.filter((pkg) => [pkg.packageCode, pkg.code, pkg.id, pkg.title, pkg.name, pkg.heroTitle, pkg.brandName]
      .some((value) => String(value || "").toLowerCase().includes(query)));
  }, [packages, search]);
  const { page, pageCount, pageItems, setPage } = usePagination(filteredPackages, 5, search);

  const loadPackages = async () => {
    try {
      const data = await api.get("/packages");
      setPackages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load packages", error);
      setPackages([]);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const removePackage = async (code) => {
    if (!window.confirm("Remove this package?")) return;
    try {
      await api.delete(`/packages/${code}`);
      setPackages((prev) => prev.filter((pkg) => (pkg.packageCode || pkg.code || pkg.id) !== code));
    } catch (error) {
      console.error("Failed to remove package", error);
    }
  };

  return (
    <div className="pkg-list-container">
      <div className="pkg-header">
        <div className="header-left">
          <BackButton />
          <h2>Packages</h2>
        </div>

        <button onClick={() => navigate("/admin/packages/new")}>+ Add Package</button>
      </div>

      <input
        className="pkg-search"
        type="search"
        placeholder="Search by package ID, title, or brand..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <table className="pkg-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {pageItems.map((pkg) => {
            const code = pkg.packageCode || pkg.code || pkg.id;
            return (
              <tr key={code}>
                <td>{code}</td>
                <td>{pkg.title || pkg.name}</td>
                <td>
                  <button onClick={() => navigate(`/admin/packages/edit/${code}`)}>Edit</button>
                  <button className="delete-btn" onClick={() => removePackage(code)}>
                    Remove
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Pagination page={page} pageCount={pageCount} setPage={setPage} itemCount={filteredPackages.length} label="packages" />
    </div>
  );
}

export default PackagesList;
