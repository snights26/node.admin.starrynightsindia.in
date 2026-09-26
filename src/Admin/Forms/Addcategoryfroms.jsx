import "./Addcategoryfroms.css";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../Utils/api";
import { IMAGE_FILE_ACCEPT, resolveAssetUrl, uploadFile } from "../../Utils/fileUpload";

function Addcategoryfroms({ mode }) {
  const navigate = useNavigate();
  const { code } = useParams();

  const [form, setForm] = useState({
    categoryCode: "",
    categoryName: "",
    isSub: false,
    parentCategory: "",
    thumbnail: null
  });

  const [categories, setCategories] = useState([]);
  const [showPopup, setShowPopup] = useState(false);

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

  useEffect(() => {
    if (mode !== "edit" || !code) return;
    const loadCategory = async () => {
      try {
        const category = await api.get(`/categories/${code}`);
        setForm({
          categoryCode: category.code || category.categoryCode || "",
          categoryName: category.name || category.categoryName || "",
          isSub: category.isSub || category.isSubcategory || false,
          parentCategory: category.parent === "-" ? "" : category.parent || "",
          thumbnail: category.thumbnailUrl || category.image || null
        });
      } catch (error) {
        console.error("Failed to load category", error);
      }
    };

    loadCategory();
  }, [mode, code]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : type === "file" ? files[0] : value
    });
  };

  const handleSubmit = async () => {
    try {
      const thumbnailUrl = await uploadFile(form.thumbnail, "categories", { imageOnly: true });
      const payload = {
        categoryCode: form.categoryCode,
        categoryName: form.categoryName,
        isSub: form.isSub,
        parentCategory: form.parentCategory,
        thumbnailUrl
      };

      if (mode === "edit") {
        await api.put(`/categories/${code}`, payload);
      } else {
        await api.post("/categories", payload);
      }

      setShowPopup(true);
      setTimeout(() => navigate("/admin/categories"), 1000);
    } catch (error) {
      console.error("Failed to save category", error);
      alert("Unable to save category");
    }
  };

  const parentCategories = categories.filter((c) => !(c.isSub || c.isSubcategory));
  const thumbnailPreview = form.thumbnail ? resolveAssetUrl(typeof form.thumbnail === "string" ? form.thumbnail : URL.createObjectURL(form.thumbnail)) : "";

  return (
    <div className="category-form-page">
      <div className="category-form-card">
        <div className="category-form-title">
          {mode === "add" ? "Add Category" : "Edit Category"}
        </div>

        <input
          className="category-form-input"
          name="categoryCode"
          placeholder="Category Code"
          value={form.categoryCode}
          onChange={handleChange}
          disabled={mode === "edit"}
        />

        <input
          className="category-form-input"
          name="categoryName"
          placeholder="Category Name"
          value={form.categoryName}
          onChange={handleChange}
        />

        <input
          type="file"
          name="thumbnail"
          accept={IMAGE_FILE_ACCEPT}
          className="category-form-input"
          onChange={handleChange}
        />

        {thumbnailPreview && (
          <img src={thumbnailPreview} alt="preview" className="category-thumbnail-preview" />
        )}

        <div className="category-form-checkbox">
          <span>Is Subcategory</span>
          <label className="toggle-switch">
            <input type="checkbox" name="isSub" checked={form.isSub} onChange={handleChange} />
            <span className="slider"></span>
          </label>
        </div>

        <select
          className="category-form-select"
          name="parentCategory"
          value={form.parentCategory}
          onChange={handleChange}
          disabled={!form.isSub}
        >
          <option value="">Select Parent</option>
          {parentCategories.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>

        <div className="category-form-actions">
          <button className="category-form-submit" onClick={handleSubmit}>Submit</button>
          <button className="category-form-back" onClick={() => navigate(-1)}>Back</button>
        </div>
      </div>

      {showPopup && <div className="category-form-popup">Saved Successfully</div>}
    </div>
  );
}

export default Addcategoryfroms;
