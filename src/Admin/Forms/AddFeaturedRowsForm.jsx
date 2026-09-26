import "./AddFeaturedRowsForm.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../Utils/api";

function AddFeaturedRowsForm({ mode }) {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    rowId: "",
    title: "",
    type: "package",
    visibleOn: "home"
  });
  const [packages, setPackages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [packageMode, setPackageMode] = useState("name");
  const [categoryMatchOperator, setCategoryMatchOperator] = useState("OR");
  const [selectedItems, setSelectedItems] = useState([]);
  const [dropdown, setDropdown] = useState("");

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [packageData, categoryData] = await Promise.all([api.get("/packages"), api.get("/categories")]);
        setPackages(Array.isArray(packageData) ? packageData : []);
        setCategories(Array.isArray(categoryData) ? categoryData : []);
      } catch (error) {
        console.error("Failed to load featured row options", error);
      }
    };

    loadOptions();
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !id) return;
    const loadRow = async () => {
      try {
        const rows = await api.get("/featured-rows");
        const row = rows.find((item) => item.rowId === id || item.id === id);
        if (!row) return;
        setForm({
          rowId: row.rowId || row.id,
          title: row.title || row.rowTitle || "",
          type: row.type || row.rowType || "package",
          visibleOn: row.visibleOn || "home"
        });
        setPackageMode(row.packageMode || "name");
        setCategoryMatchOperator(row.categoryMatchOperator === "AND" ? "AND" : "OR");
        setSelectedItems((row.items || []).map((item) => ({
          id: item.id || item.code,
          title: item.title,
          type: item.type || row.type
        })));
      } catch (error) {
        console.error("Failed to load featured row", error);
      }
    };

    loadRow();
  }, [mode, id]);

  const subcategories = useMemo(
    () => categories.filter((cat) => cat.isSub || cat.isSubcategory),
    [categories]
  );
  const parentCategories = useMemo(
    () => categories.filter((cat) => !(cat.isSub || cat.isSubcategory)),
    [categories]
  );

  const isPackageRow = form.type === "package" || form.type === "top10";
  const isSubcategorySelection = form.type === "package" && packageMode === "subcategory";
  const categoryFilteringApplies = isSubcategorySelection;
  const currentList = isPackageRow
    ? isSubcategorySelection ? subcategories : packages
    : parentCategories;

  const codeOf = (item) => item.packageCode || item.code || item.categoryCode || item.id;
  const titleOf = (item) => item.title || item.name || item.categoryName || item.packageName;

  const handleAdd = () => {
    const item = currentList.find((entry) => codeOf(entry) === dropdown);
    if (!item) return;
    const itemCode = codeOf(item);
    if (selectedItems.some((selected) => selected.id === itemCode)) return;
    setSelectedItems([...selectedItems, {
      id: itemCode,
      title: titleOf(item),
      type: form.type === "category" || packageMode === "subcategory" ? "category" : "package"
    }]);
    setDropdown("");
  };

  const handleRemove = (itemCode) => {
    setSelectedItems(selectedItems.filter((item) => item.id !== itemCode));
  };

  const handleSubmit = async () => {
    const payload = {
      rowId: form.rowId,
      title: form.title,
      type: form.type,
      visibleOn: form.visibleOn,
      packageMode,
      categoryMatchOperator,
      items: selectedItems.map((item) => ({
        id: item.id,
        title: item.title,
        type: item.type
      }))
    };

    try {
      if (mode === "edit") {
        await api.put(`/featured-rows/${id}`, payload);
      } else {
        await api.post("/featured-rows", payload);
      }
      navigate("/admin/featured-rows");
    } catch (error) {
      console.error("Failed to save featured row", error);
      alert("Unable to save featured row");
    }
  };

  return (
    <div className="frf-page">
      <div className="frf-card">
        <div className="frf-title">{mode === "add" ? "Create Row" : "Edit Row"} <span>*</span></div>

        <input
          className="frf-input"
          placeholder="Row ID"
          value={form.rowId}
          disabled={mode === "edit"}
          onChange={(e) => setForm({ ...form, rowId: e.target.value })}
        />
        <input
          className="frf-input"
          placeholder="Row Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <select
          className="frf-input"
          value={form.type}
          onChange={(e) => {
            const type = e.target.value;
            setForm({ ...form, type });
            setPackageMode(type === "category" ? "children" : "name");
            setSelectedItems([]);
            setDropdown("");
          }}
        >
          <option value="package">Package Row</option>
          <option value="top10">Top 10 Package Row</option>
          <option value="category">Category Row</option>
        </select>

        {form.type === "package" && (
          <select
            className="frf-input"
            value={packageMode}
            onChange={(e) => { setPackageMode(e.target.value); setSelectedItems([]); setDropdown(""); }}
          >
            <option value="name">Add by Package Name</option>
            <option value="subcategory">Add by Subcategory</option>
          </select>
        )}

        {form.type === "category" && (
          <select
            className="frf-input"
            value={packageMode}
            onChange={(e) => { setPackageMode(e.target.value); setSelectedItems([]); setDropdown(""); }}
          >
            <option value="children">Store selected parent’s subcategories</option>
            <option value="parent">Show selected parent categories directly</option>
          </select>
        )}

        {categoryFilteringApplies && (
          <fieldset className="frf-match-logic">
            <legend>Category Match Logic</legend>
            <div className="frf-match-options">
              <label>
                <input
                  type="radio"
                  name="categoryMatchOperator"
                  value="OR"
                  checked={categoryMatchOperator === "OR"}
                  onChange={(e) => setCategoryMatchOperator(e.target.value)}
                />
                <span>Match Any (OR)</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="categoryMatchOperator"
                  value="AND"
                  checked={categoryMatchOperator === "AND"}
                  onChange={(e) => setCategoryMatchOperator(e.target.value)}
                />
                <span>Match All (AND)</span>
              </label>
            </div>
            <p>
              {categoryMatchOperator === "AND"
                ? "Show only packages matching all selected categories."
                : "Show packages matching any selected category."}
            </p>
          </fieldset>
        )}

        <select className="frf-input" value={form.visibleOn} onChange={(e) => setForm({ ...form, visibleOn: e.target.value })}>
          <option value="home">Home Page</option>
          <option value="trending">Trending Page</option>
          <option value="both">Both</option>
        </select>

        <div className="frf-add-section">
          <select className="frf-select" value={dropdown} onChange={(e) => setDropdown(e.target.value)}>
            <option value="">
              {isPackageRow ? isSubcategorySelection ? "Select Subcategory" : "Select Package" : "Select Category"}
            </option>
            {currentList
              .filter((item) => !selectedItems.some((selected) => selected.id === codeOf(item)))
              .map((item) => (
                <option key={codeOf(item)} value={codeOf(item)}>{titleOf(item)}</option>
              ))}
          </select>

          <button className="frf-add-btn" onClick={handleAdd}>+ Add</button>
        </div>

        <div className="frf-list">
          {selectedItems.length === 0 ? (
            <div className="frf-empty">No items selected</div>
          ) : (
            selectedItems.map((item) => (
              <div key={item.id} className="frf-chip">
                <span>{item.title}</span>
                <button onClick={() => handleRemove(item.id)}>x</button>
              </div>
            ))
          )}
        </div>

        <div className="frf-actions">
          <button className="frf-submit" onClick={handleSubmit}>Save Row</button>
          <button className="frf-back" onClick={() => navigate(-1)}>Back</button>
        </div>
      </div>
    </div>
  );
}

export default AddFeaturedRowsForm;
