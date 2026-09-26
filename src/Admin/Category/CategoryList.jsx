import "./CategoryList.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../Utils/api";
import Pagination, { usePagination } from "../../Common/Pagination";
import BackButton from "../../Common/BackButton";

const isSubcategory = (category) => Boolean(category.isSub || category.isSubcategory);

const categoryCode = (category) => category.code || category.categoryCode || "";

const categoryName = (category) => category.name || category.categoryName || category.title || "";

function CategoryList() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [parentFilter, setParentFilter] = useState("");
  const [subcategoryFilter, setSubcategoryFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await api.get("/categories");
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load categories", error);
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  const removeCategory = async (code) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await api.delete(`/categories/${code}`);
      setCategories((prev) => prev.filter((item) => item.code !== code));
    } catch (error) {
      console.error("Failed to delete category", error);
    }
  };

  const parentCategories = useMemo(
    () => categories.filter((category) => !isSubcategory(category)),
    [categories]
  );

  const parentNamesByCode = useMemo(
    () => new Map(parentCategories.map((category) => [categoryCode(category), categoryName(category)])),
    [parentCategories]
  );

  const subcategoryOptions = useMemo(
    () => categories.filter((category) => (
      isSubcategory(category)
      && (!parentFilter || category.parent === parentFilter)
    )),
    [categories, parentFilter]
  );

  const filteredCategories = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return categories.filter((category) => {
      const code = categoryCode(category);
      const subcategory = isSubcategory(category);
      const parentName = subcategory
        ? parentNamesByCode.get(category.parent) || ""
        : categoryName(category);
      const subcategoryName = subcategory ? categoryName(category) : "";
      const matchesParent = !parentFilter || (subcategory && category.parent === parentFilter);
      const matchesSubcategory = !subcategoryFilter || code === subcategoryFilter;
      const matchesSearch = !searchTerm || [parentName, subcategoryName]
        .some((name) => name.toLowerCase().includes(searchTerm));

      return matchesParent && matchesSubcategory && matchesSearch;
    });
  }, [categories, parentFilter, parentNamesByCode, search, subcategoryFilter]);

  const clearFilters = () => {
    setParentFilter("");
    setSubcategoryFilter("");
    setSearch("");
  };
  const { page, pageCount, pageItems, setPage } = usePagination(filteredCategories);

  return (
    <div className="category-list-page">
      <div className="category-list-header">
        <div>
          <div className="category-list-title">Category Management</div>
          <div className="category-list-subtitle">Manage all your categories and subcategories</div>
        </div>

        <div className="category-list-header-actions">
          <BackButton className="category-list-back-btn" />
          <button className="category-list-add-btn" onClick={() => navigate("/admin/categories/add")}>
            + Add Category
          </button>
        </div>
      </div>

      <div className="category-list-filters" aria-label="Category filters">
        <label className="category-filter-field">
          <span>Parent Category</span>
          <select
            value={parentFilter}
            onChange={(event) => {
              setParentFilter(event.target.value);
              setSubcategoryFilter("");
            }}
          >
            <option value="">All Parent Categories</option>
            {parentCategories.map((category) => (
              <option key={categoryCode(category)} value={categoryCode(category)}>
                {categoryName(category)}
              </option>
            ))}
          </select>
        </label>

        <label className="category-filter-field">
          <span>Sub Category</span>
          <select value={subcategoryFilter} onChange={(event) => setSubcategoryFilter(event.target.value)}>
            <option value="">All Subcategories</option>
            {subcategoryOptions.map((category) => (
              <option key={categoryCode(category)} value={categoryCode(category)}>
                {categoryName(category)}
              </option>
            ))}
          </select>
        </label>

        <label className="category-filter-field category-search-field">
          <span>Search Categories</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search parent or subcategory..."
          />
        </label>

        <button
          type="button"
          className="category-filter-clear"
          onClick={clearFilters}
          disabled={!parentFilter && !subcategoryFilter && !search}
        >
          Clear Filters
        </button>
      </div>

      <div className="category-list-table-wrapper">
        <table className="category-list-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Type</th>
              <th>Parent</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan="5" className="category-list-empty">No categories found</td>
              </tr>
            ) : pageItems.map((c) => (
              <tr key={c.code}>
                <td className="code">{c.code}</td>
                <td className="name">{c.name}</td>
                <td>
                  <span className={c.isSub || c.isSubcategory ? "badge sub" : "badge main"}>
                    {c.isSub || c.isSubcategory ? "Subcategory" : "Main"}
                  </span>
                </td>
                <td>{c.parent}</td>
                <td>
                  <div className="category-list-actions">
                    <button className="edit-btn" onClick={() => navigate(`/admin/categories/edit/${c.code}`)}>
                      Edit
                    </button>
                    <button className="delete-btn" onClick={() => removeCategory(c.code)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageCount={pageCount} setPage={setPage} itemCount={filteredCategories.length} label="categories" />

    </div>
  );
}

export default CategoryList;
