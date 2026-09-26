import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../Utils/api";
import "./CategoriesGrid.css";
import Pagination, { usePagination } from "../../Common/Pagination";

const categoryName = (category) => category?.title || category?.name || "";
const categoryInitial = (category) => categoryName(category).trim().charAt(0).toUpperCase() || "?";

export default function CategoriesGrid() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedParentCode, setSelectedParentCode] = useState(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await api.get("/categories/tree");
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load categories", error);
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  const selectedParent = useMemo(
    () => categories.find((category) => category.code === selectedParentCode) || null,
    [categories, selectedParentCode]
  );

  const visibleCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    const source = selectedParent
      ? (Array.isArray(selectedParent.children) ? selectedParent.children : [])
      : categories;

    if (!query) {
      return source;
    }

    return source.filter((category) => categoryName(category).toLowerCase().includes(query));
  }, [categories, search, selectedParent]);

  const openSubcategory = (category) => {
    navigate(`/admin/category/${category.code}`, {
      state: {
        categoryName: categoryName(category),
        categoryCode: category.code
      }
    });
  };

  const selectParent = (category) => {
    setSelectedParentCode(category.code);
    setSearch("");
  };

  const returnToParents = () => {
    setSelectedParentCode(null);
    setSearch("");
  };

  const isSubcategoryView = Boolean(selectedParent);
  const title = isSubcategoryView
    ? `${categoryName(selectedParent)} Subcategories`
    : "Category Management";
  const { page, pageCount, pageItems, setPage } = usePagination(visibleCategories, 5, search);

  return (
    <div className="admin-grid-container">
      <div className="grid-header">
        <div className="grid-heading">
          <span className="grid-eyebrow">{isSubcategoryView ? "Category Directory" : "Travel Catalogue"}</span>
          <div className="grid-title-row">
            <h2 className="grid-title">{title}</h2>
            <span className="grid-item-count">{visibleCategories.length}</span>
          </div>
          {isSubcategoryView && (
            <button type="button" className="category-table-back" onClick={returnToParents}>
              ← All Parent Categories
            </button>
          )}
        </div>

        <input
          type="text"
          placeholder={isSubcategoryView ? "Search subcategory..." : "Search parent category..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="grid-search"
        />
      </div>

      <div className="category-table-wrapper">
        <table className="category-dashboard-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>{isSubcategoryView ? "Subcategory" : "Parent Category"}</th>
              <th>{isSubcategoryView ? "Package Management" : "Subcategories"}</th>
            </tr>
          </thead>
          <tbody>
            {visibleCategories.length === 0 ? (
              <tr>
                <td colSpan="3" className="category-table-empty">
                  {isSubcategoryView ? "No subcategories found" : "No parent categories found"}
                </td>
              </tr>
            ) : pageItems.map((category) => {
              const children = Array.isArray(category.children) ? category.children : [];
              return (
                <tr key={category.code} className={isSubcategoryView ? "category-dashboard-row" : ""}>
                  <td className="category-table-code">
                    <span className="category-code-badge">{category.code}</span>
                  </td>
                  <td>
                    {isSubcategoryView ? (
                      <button
                        type="button"
                        className="subcategory-name-link"
                        onClick={() => openSubcategory(category)}
                      >
                        <span className="category-name-avatar">{categoryInitial(category)}</span>
                        {categoryName(category)}
                      </button>
                    ) : (
                      <span className="category-table-name">
                        <span className="category-name-avatar">{categoryInitial(category)}</span>
                        {categoryName(category)}
                      </span>
                    )}
                  </td>
                  <td>
                    {isSubcategoryView ? (
                      <span className="category-package-hint">Click subcategory name to manage packages</span>
                    ) : (
                      <button
                        type="button"
                        className="subcategory-count-button"
                        onClick={() => selectParent(category)}
                        disabled={children.length === 0}
                        aria-label={`View ${children.length} subcategories for ${categoryName(category)}`}
                      >
                        <span>{children.length}</span>
                        <span className="subcategory-count-arrow" aria-hidden="true">›</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageCount={pageCount} setPage={setPage} itemCount={visibleCategories.length} label={isSubcategoryView ? "subcategories" : "parent categories"} />
    </div>
  );
}
