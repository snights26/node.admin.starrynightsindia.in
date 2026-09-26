import "./Addpackageform.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import api from "../../Utils/api";
import { IMAGE_FILE_ACCEPT, resolveAssetUrl, uploadFile } from "../../Utils/fileUpload";
import Pagination, { usePagination } from "../../Common/Pagination";

const categoryCode = (category = {}) => category.code || category.categoryCode || category.id || "";

const categoryName = (category = {}) => category.name || category.categoryName || category.title || "";

const parentCodeOf = (category = {}) => category.parent && category.parent !== "-" ? category.parent : "";

const isSubcategory = (category = {}) => Boolean(category.isSub || category.isSubcategory || parentCodeOf(category));

function AddPackageForm({ mode = "add", data = {}, onSubmit }) {
  const navigate = useNavigate();

  const initialState = {
    id: "",
    heroTitle: "",
    shortTitle: "",
    brandName: "",
    selectedCategories: {},
    days: 1,
    highlights: "",
    overview: "",
    avgCost: "",
    pickup: "",
    bestTime: "",
    climate: "",
    suitable: "",
    itinerary: [{ day: 1, title: "", desc: "" }],
    note: "",
    includes: "",
    excludes: "",
    heroImages: [null, null, null, null],
    thumbnail: null
  };

  const [form, setForm] = useState(initialState);
  const [categories, setCategories] = useState([]);
  const [selectedParentCode, setSelectedParentCode] = useState("");

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const items = await api.get("/categories");
        setCategories(Array.isArray(items) ? items : []);
      } catch (error) {
        console.error("Failed to load categories", error);
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    if (mode === "edit" && data) {
      const packageInfo = data.info || {};
      setForm({
        ...initialState,
        ...data,
        id: data.packageCode || data.code || data.id || "",
        avgCost: data.avgCost || packageInfo.cost || "",
        pickup: data.pickup || packageInfo.pickup || "",
        bestTime: data.bestTime || data.bestTimeToVisit || packageInfo.bestTime || "",
        climate: data.climate || packageInfo.climate || "",
        suitable: data.suitable || packageInfo.suitable || "",
        note: data.note || packageInfo.note || "",
        includes: Array.isArray(data.inclusions) ? data.inclusions.join("\n") : data.includes || "",
        excludes: Array.isArray(data.exclusions) ? data.exclusions.join("\n") : data.excludes || "",
        heroImages: data.images?.length ? [...data.images, null, null, null, null].slice(0, 4) : [null, null, null, null],
        thumbnail: data.thumbnailUrl || null,
        itinerary: data.itinerary?.length ? data.itinerary.map((item) => ({
          day: item.day,
          title: item.title,
          desc: item.desc || item.description || ""
        })) : [{ day: 1, title: "", desc: "" }]
      });
    }
  }, [data, mode]);

  useEffect(() => {
    if (mode !== "edit" || !data?.categoryCodes?.length || !categories.length) return;
    const grouped = {};
    let firstParentCode = "";

    data.categoryCodes.forEach((code) => {
      const category = categories.find((cat) => categoryCode(cat) === code);
      const parentCode = parentCodeOf(category) || code;
      grouped[parentCode] = grouped[parentCode] || [];
      grouped[parentCode].push(code);
      if (!firstParentCode && categories.some((cat) => categoryCode(cat) === parentCode && !isSubcategory(cat))) {
        firstParentCode = parentCode;
      }
    });

    setForm((prev) => ({ ...prev, selectedCategories: grouped }));
    setSelectedParentCode(firstParentCode);
  }, [categories, data, mode]);

  useEffect(() => {
    setForm((prev) => {
      const days = Number(prev.days || 1);
      let itinerary = [...prev.itinerary];
      if (days > itinerary.length) {
        for (let i = itinerary.length + 1; i <= days; i += 1) {
          itinerary.push({ day: i, title: "", desc: "" });
        }
      } else {
        itinerary = itinerary.slice(0, days);
      }
      return { ...prev, itinerary };
    });
  }, [form.days]);

  const groupedCategories = useMemo(() => {
    const groups = {};
    categories.forEach((cat) => {
      const code = categoryCode(cat);
      const parent = parentCodeOf(cat);
      const isSub = isSubcategory(cat);
      if (!isSub) {
        groups[code] = groups[code] || { parent: cat, children: [] };
        groups[code].parent = cat;
      } else if (parent) {
        groups[parent] = groups[parent] || { parent: null, children: [] };
        groups[parent].children.push(cat);
      }
    });
    return groups;
  }, [categories]);

  const parentOptions = useMemo(
    () => Object.entries(groupedCategories)
      .filter(([, group]) => group.parent)
      .map(([value, group]) => ({ value, label: `${categoryName(group.parent)} - ${value}` })),
    [groupedCategories]
  );

  const selectedParentOption = parentOptions.find((option) => option.value === selectedParentCode) || null;

  const subcategoryOptions = useMemo(
    () => (groupedCategories[selectedParentCode]?.children || []).map((category) => ({
      value: categoryCode(category),
      label: `${categoryName(category)} - ${categoryCode(category)}`
    })),
    [groupedCategories, selectedParentCode]
  );

  const activeSelectedSubcategoryOptions = useMemo(() => {
    const selectedCodes = new Set(form.selectedCategories[selectedParentCode] || []);
    return subcategoryOptions.filter((option) => selectedCodes.has(option.value));
  }, [form.selectedCategories, selectedParentCode, subcategoryOptions]);

  const allSelectedSubcategories = useMemo(() => {
    const seenCodes = new Set();

    return Object.entries(form.selectedCategories).flatMap(([parentCode, selectedCodes]) => {
      const parent = groupedCategories[parentCode]?.parent;
      const parentName = categoryName(parent) || parentCode;

      return (selectedCodes || []).flatMap((code) => {
        if (seenCodes.has(code)) return [];
        seenCodes.add(code);
        const category = categories.find((item) => categoryCode(item) === code);
        if (!category) return [];

        return [{
          code,
          parentCode,
          parentName,
          label: `${categoryName(category)} - ${code}`
        }];
      });
    });
  }, [categories, form.selectedCategories, groupedCategories]);
  const selectedSubcategoryPagination = usePagination(allSelectedSubcategories, 3);

  const brandOptions = ["Holidays", "Adventures", "GroupTour"];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleParentChange = (option) => {
    setSelectedParentCode(option?.value || "");
  };

  const handleSubcategoryChange = (options) => {
    if (!selectedParentCode) return;

    const selectedCodes = Array.from(new Set((options || []).map((option) => option.value)));
    setForm((prev) => {
      return {
        ...prev,
        selectedCategories: {
          ...prev.selectedCategories,
          [selectedParentCode]: selectedCodes
        }
      };
    });
  };

  const removeSelectedSubcategory = (parentCode, childCode) => {
    setForm((prev) => ({
      ...prev,
      selectedCategories: {
        ...prev.selectedCategories,
        [parentCode]: (prev.selectedCategories[parentCode] || [])
          .filter((code) => code !== childCode)
      }
    }));
  };

  const handleHeroImageChange = (index, file) => {
    const updated = [...form.heroImages];
    updated[index] = file;
    setForm({ ...form, heroImages: updated });
  };

  const handleItineraryChange = (index, field, value) => {
    const updated = [...form.itinerary];
    updated[index][field] = value;
    setForm({ ...form, itinerary: updated });
  };

  const getImageSrc = (img) => {
    if (!img) return "";
    if (typeof img === "string") return resolveAssetUrl(img);
    return URL.createObjectURL(img);
  };

  const handleSubmit = async () => {
    const categoryCodes = Array.from(new Set(Object.values(form.selectedCategories).flat()));
    const heroImages = await Promise.all(
      form.heroImages.filter(Boolean).map((img) => uploadFile(img, "packages"))
    );
    const thumbnailUrl = await uploadFile(form.thumbnail, "packages", { imageOnly: true });
    const itinerary = form.itinerary.map(({ day, title, desc }) => ({ day, title, desc }));

    const payload = {
      packageCode: form.id,
      heroTitle: form.heroTitle,
      shortTitle: form.shortTitle,
      brandName: form.brandName,
      days: form.days,
      highlights: form.highlights,
      overview: form.overview,
      avgCost: form.avgCost,
      pickup: form.pickup,
      bestTime: form.bestTime,
      climate: form.climate,
      suitable: form.suitable,
      itinerary,
      note: form.note,
      includes: form.includes,
      excludes: form.excludes,
      categoryCodes,
      heroImages,
      thumbnailUrl
    };

    try {
      if (onSubmit) {
        await onSubmit(payload);
      } else if (mode === "edit") {
        await api.put(`/packages/${form.id}`, payload);
      } else {
        await api.post("/packages", payload);
      }
      navigate("/admin/packages");
    } catch (error) {
      console.error("Failed to save package", error);
      alert("Unable to save package");
    }
  };

  return (
    <div className="pkg-form">
      <div className="form-section">
        <h3>Main Details</h3>
        <div className="grid-2">
          <input name="id" value={form.id} disabled={mode === "edit"} onChange={handleChange} placeholder="Package Code" />
          <input name="heroTitle" value={form.heroTitle} onChange={handleChange} placeholder="Hero Title" />
          <input name="shortTitle" value={form.shortTitle} onChange={handleChange} placeholder="Short Title" />
          <select name="brandName" value={form.brandName} onChange={handleChange}>
            <option value="">Select Brand</option>
            {brandOptions.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
          </select>
          <input type="number" name="days" value={form.days} onChange={handleChange} />
          <input name="avgCost" value={form.avgCost} onChange={handleChange} placeholder="Cost" />
          <input name="pickup" value={form.pickup} onChange={handleChange} placeholder="Pickup" />
          <input name="bestTime" value={form.bestTime} onChange={handleChange} placeholder="Best Time to Visit" />
          <input name="climate" value={form.climate} onChange={handleChange} placeholder="Climate" />
          <input name="suitable" value={form.suitable} onChange={handleChange} placeholder="Suitable For" />
        </div>
      </div>

      <div className="form-section">
        <h3>Categories</h3>
        <p className="category-help">
          Build the package taxonomy in three steps. You can switch parent categories at any time without losing earlier selections.
        </p>
        <div className="package-category-selector">
          <label className="package-category-field">
            <span className="package-category-label"><b>01</b> Parent Category</span>
            <small>Choose where to browse</small>
            <Select
              options={parentOptions}
              value={selectedParentOption}
              onChange={handleParentChange}
              placeholder="Search parent categories"
              isClearable
              isSearchable
              classNamePrefix="react-select"
            />
          </label>

          <label className="package-category-field">
            <span className="package-category-label"><b>02</b> Subcategories</span>
            <small>Choose one or more matches</small>
            <Select
              options={subcategoryOptions}
              value={activeSelectedSubcategoryOptions}
              onChange={handleSubcategoryChange}
              placeholder={selectedParentCode ? "Search subcategories" : "Select a parent category first"}
              isDisabled={!selectedParentCode}
              isMulti
              isSearchable
              closeMenuOnSelect={false}
              controlShouldRenderValue={false}
              noOptionsMessage={() => selectedParentCode ? "No subcategories available" : "Select a parent category first"}
              classNamePrefix="react-select"
            />
          </label>

          <div className="selected-subcategories-panel">
            <div className="selected-subcategories-heading">
              <span className="selected-subcategories-title"><b>03</b> Selected Subcategories</span>
              <span className="selected-subcategories-count" aria-live="polite">{allSelectedSubcategories.length}</span>
            </div>
            {allSelectedSubcategories.length > 0 ? (
              <div className="selected-subcategories-content">
                <div className="selected-subcategories-list">
                  {selectedSubcategoryPagination.pageItems.map((option) => (
                    <span key={option.code} className="selected-subcategory-chip">
                      <span className="selected-subcategory-parent">{option.parentName}</span>
                      <span>{option.label}</span>
                      <button
                        type="button"
                        onClick={() => removeSelectedSubcategory(option.parentCode, option.code)}
                        aria-label={`Remove ${option.label}`}
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
                <Pagination {...selectedSubcategoryPagination} itemCount={allSelectedSubcategories.length} label="selected subcategories" />
              </div>
            ) : (
              <p className="selected-subcategories-empty">
                Your selected subcategories will appear here.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Description</h3>
        <div className="grid-2">
          <textarea className="full-width" name="highlights" value={form.highlights} onChange={handleChange} placeholder="Highlights" />
          <textarea className="full-width" name="overview" value={form.overview} onChange={handleChange} placeholder="Overview" />
          <textarea name="includes" value={form.includes} onChange={handleChange} placeholder="Includes" />
          <textarea name="excludes" value={form.excludes} onChange={handleChange} placeholder="Excludes" />
          <textarea name="note" value={form.note} onChange={handleChange} placeholder="Note" />
        </div>
      </div>

      <div className="form-section">
        <h3>Itinerary</h3>
        {form.itinerary.map((day, i) => (
          <div key={i} className="day-box">
            <h4>Day {day.day}</h4>
            <input value={day.title} onChange={(e) => handleItineraryChange(i, "title", e.target.value)} />
            <textarea value={day.desc} onChange={(e) => handleItineraryChange(i, "desc", e.target.value)} />
          </div>
        ))}
      </div>

      <div className="form-section">
        <h3>Media</h3>
        <div className="image-grid">
          {form.heroImages.map((img, i) => (
            <div key={i} className="image-slot">
              {getImageSrc(img) ? <img src={getImageSrc(img)} alt="" /> : <span>Upload</span>}
              <input type="file" onChange={(e) => handleHeroImageChange(i, e.target.files[0])} />
            </div>
          ))}
        </div>

        <div className="thumbnail-slot">
          {getImageSrc(form.thumbnail) ? <img src={getImageSrc(form.thumbnail)} alt="" /> : <span>Upload Thumbnail</span>}
          <input
            type="file"
            accept={IMAGE_FILE_ACCEPT}
            onChange={(e) => setForm({ ...form, thumbnail: e.target.files[0] })}
          />
        </div>
      </div>

      <button className="submit-btn" onClick={handleSubmit}>
        {mode === "add" ? "Add Package" : "Update Package"}
      </button>
    </div>
  );
}

export default AddPackageForm;
