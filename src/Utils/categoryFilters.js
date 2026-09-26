export const categoryCode = (category = {}) => String(category.code || category.categoryCode || "").trim();

export const parentCategoriesFromTree = (tree = []) => (Array.isArray(tree) ? tree : [])
  .map((category) => ({
    code: categoryCode(category),
    name: category.name || category.categoryName || categoryCode(category),
    children: Array.isArray(category.children) ? category.children : []
  }))
  .filter((category) => category.code);

export const subcategoriesForParent = (parentCategories, parentCode) => {
  if (parentCode) {
    return parentCategories.find((category) => category.code === parentCode)?.children || [];
  }
  return parentCategories.flatMap((category) => category.children || []);
};

export const packageMatchesCategoryFilters = (pkg = {}, parentCode = "", subcategoryCode = "") => {
  const categories = Array.isArray(pkg.categories) ? pkg.categories : [];
  const directCodes = Array.isArray(pkg.categoryCodes) ? pkg.categoryCodes : categories.map(categoryCode);
  const parentCodes = Array.isArray(pkg.parentCategoryCodes)
    ? pkg.parentCategoryCodes
    : categories.map((category) => category.parentCode || categoryCode(category));

  return (!parentCode || parentCodes.includes(parentCode))
    && (!subcategoryCode || directCodes.includes(subcategoryCode));
};

export const categoryNames = (pkg = {}, type) => Array.from(new Set((pkg.categories || [])
  .filter((category) => type === "parent" || category.isSubcategory)
  .map((category) => type === "parent" ? category.parentName : category.name)
  .filter(Boolean))).join(", ") || "Not assigned";
