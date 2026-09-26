import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaChevronLeft, FaChevronRight, FaHeart, FaSearch, FaUsers } from "react-icons/fa";
import api from "../../Utils/api";
import { resolveAssetUrl } from "../../Utils/fileUpload";
import { categoryCode, packageMatchesCategoryFilters, parentCategoriesFromTree, subcategoriesForParent } from "../../Utils/categoryFilters";
import "./UserLikedPackages.css";

const DEFAULT_PAGE_SIZE = 6;

function packageImage(pkg = {}) {
  return resolveAssetUrl(pkg.image || pkg.thumbnailUrl || "");
}

function packageLabel(pkg = {}) {
  return pkg.title || pkg.name || pkg.packageCode || pkg.code || "Travel Package";
}

async function loadLikedPackageReport() {
  const directReport = await api.get("/users/liked-packages/report").catch(() => []);
  if (Array.isArray(directReport) && directReport.some((user) => Array.isArray(user.likedPackages) && user.likedPackages.length > 0)) {
    return directReport;
  }

  const users = await api.get("/users").catch(() => []);
  if (!Array.isArray(users) || users.length === 0) {
    return Array.isArray(directReport) ? directReport : [];
  }

  const detailedUsers = await Promise.all(
    users.map(async (user) => {
      const id = user.id || user.userId || user.email;
      if (!id) return user;

      const detail = await api.get(`/users/${encodeURIComponent(id)}`).catch(() => user);
      return {
        ...user,
        ...detail,
        likedPackages: Array.isArray(detail?.likedPackages)
          ? detail.likedPackages
          : Array.isArray(user.likedPackages)
            ? user.likedPackages
            : []
      };
    })
  );

  return detailedUsers;
}

function Pagination({ page, pageSize, totalItems, onPageChange, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const first = totalItems === 0 ? 0 : page * pageSize + 1;
  const last = Math.min((page + 1) * pageSize, totalItems);

  return (
    <nav className="ulp-pagination" aria-label="Liked package users pagination">
      <span>{first}-{last} of {totalItems} users</span>
      <label>
        Rows
        <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
          {[6, 12, 24, 48].map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
      </label>
      <button type="button" disabled={page === 0} onClick={() => onPageChange(page - 1)}><FaChevronLeft /> Previous</button>
      <span>Page {page + 1} of {totalPages}</span>
      <button type="button" disabled={page + 1 >= totalPages} onClick={() => onPageChange(page + 1)}>Next <FaChevronRight /></button>
    </nav>
  );
}

export default function UserLikedPackages() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryTree, setCategoryTree] = useState([]);
  const [parentCode, setParentCode] = useState("");
  const [subcategoryCode, setSubcategoryCode] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([loadLikedPackageReport(), api.get("/categories/tree").catch(() => [])])
      .then(([data, tree]) => {
        if (!active) return;
        setRows(Array.isArray(data) ? data : []);
        setCategoryTree(Array.isArray(tree) ? tree : []);
      })
      .catch(() => {
        if (!active) return;
        setRows([]);
        setError("Unable to load user liked packages. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const parentCategories = useMemo(() => parentCategoriesFromTree(categoryTree), [categoryTree]);
  const subcategories = useMemo(() => subcategoriesForParent(parentCategories, parentCode), [parentCategories, parentCode]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.map((user) => {
      const likedPackages = (user.likedPackages || []).filter((pkg) => packageMatchesCategoryFilters(pkg, parentCode, subcategoryCode));
      const haystack = [
        user.userId,
        user.name,
        user.email,
        ...likedPackages.flatMap((pkg) => [pkg.packageCode, pkg.title, pkg.name])
      ].filter(Boolean).join(" ").toLowerCase();

      return { ...user, likedPackages, matchesSearch: !query || haystack.includes(query) };
    }).filter((user) => user.matchesSearch && user.likedPackages.length > 0);
  }, [parentCode, rows, search, subcategoryCode]);

  const totalLikedPackages = useMemo(
    () => filteredRows.reduce((total, user) => total + user.likedPackages.length, 0),
    [filteredRows]
  );
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const visiblePage = Math.min(page, totalPages - 1);
  const pageRows = useMemo(
    () => filteredRows.slice(visiblePage * pageSize, (visiblePage + 1) * pageSize),
    [filteredRows, pageSize, visiblePage]
  );

  const resetFilters = () => {
    setSearch("");
    setParentCode("");
    setSubcategoryCode("");
    setPage(0);
  };

  return (
    <main className="ulp-page">
      <header className="ulp-header">
        <div>
          <span>User Preference Report</span>
          <h1>User Liked Packages</h1>
          <p>Review saved travel preferences and quickly open the associated package for follow-up.</p>
        </div>
        <button type="button" className="ulp-back" onClick={() => navigate("/dashboard")}><FaArrowLeft /> Back</button>
      </header>

      <section className="ulp-toolbar" aria-label="Liked package filters">
        <label className="ulp-search-field">
          <span><FaSearch /> Search users or packages</span>
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Name, user ID, email, package, or code" />
        </label>
        <label>
          <span>Parent category</span>
          <select value={parentCode} onChange={(event) => {
            setParentCode(event.target.value);
            setSubcategoryCode("");
            setPage(0);
          }}>
            <option value="">All parent categories</option>
            {parentCategories.map((category) => <option key={category.code} value={category.code}>{category.name}</option>)}
          </select>
        </label>
        <label>
          <span>Subcategory</span>
          <select value={subcategoryCode} onChange={(event) => { setSubcategoryCode(event.target.value); setPage(0); }}>
            <option value="">All subcategories</option>
            {subcategories.map((category) => {
              const code = categoryCode(category);
              return <option key={code} value={code}>{category.name || category.categoryName || code}</option>;
            })}
          </select>
        </label>
        <button type="button" className="ulp-reset" onClick={resetFilters}>Reset filters</button>
      </section>

      <section className="ulp-insights" aria-label="Liked package summary">
        <div><FaUsers /><span>Users with likes</span><strong>{filteredRows.length}</strong></div>
        <div><FaHeart /><span>Liked packages</span><strong>{totalLikedPackages}</strong></div>
        <p>Showing users with one or more matching saved packages.</p>
      </section>

      <section className="ulp-list" aria-live="polite">
        {loading && <div className="ulp-empty">Loading user package preferences...</div>}
        {!loading && error && <div className="ulp-error" role="alert">{error}</div>}
        {!loading && !error && filteredRows.length === 0 && <div className="ulp-empty">No liked packages found for the selected filters.</div>}

        {!loading && !error && pageRows.map((user) => {
          const likedPackages = Array.isArray(user.likedPackages) ? user.likedPackages : [];
          const userKey = user.id || user.userId || user.email;

          return (
            <article className="ulp-user-card" key={userKey}>
              <header className="ulp-user-summary">
                <div className="ulp-avatar" aria-hidden="true">{(user.name || user.userId || "U").charAt(0).toUpperCase()}</div>
                <div className="ulp-user-identity">
                  <h2>{user.name || "Unnamed User"}</h2>
                  <div><strong>{user.userId || "User ID unavailable"}</strong>{user.email && <span>{user.email}</span>}</div>
                  {user.contact && <small>{user.contact}</small>}
                </div>
                <span className="ulp-count"><FaHeart /> {likedPackages.length} {likedPackages.length === 1 ? "package" : "packages"}</span>
              </header>

              <div className="ulp-package-row">
                {likedPackages.map((pkg) => {
                  const code = pkg.packageCode || pkg.code || pkg.id;
                  const image = packageImage(pkg);

                  return (
                    <button
                      type="button"
                      className="ulp-package-card"
                      key={code}
                      onClick={() => navigate(`/admin/packages/edit/${code}`)}
                      aria-label={`Open ${packageLabel(pkg)} for editing`}
                    >
                      <div className="ulp-package-media">
                        {image ? <img src={image} alt="" /> : <span>{packageLabel(pkg).charAt(0).toUpperCase()}</span>}
                      </div>
                      <div className="ulp-package-details">
                        <strong>{packageLabel(pkg)}</strong>
                        <span>{code || "Package ID unavailable"}</span>
                        <small>{pkg.duration || (pkg.days ? `${pkg.days} Days` : "Duration pending")}</small>
                      </div>
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}
      </section>

      {!loading && !error && filteredRows.length > 0 && <Pagination page={visiblePage} pageSize={pageSize} totalItems={filteredRows.length} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(0); }} />}
    </main>
  );
}
