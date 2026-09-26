import api, { apiBaseUrl } from "./api";

export const IMAGE_FILE_ACCEPT = ".jpg,.jpeg,.png,.webp,image/jpeg,image/jpg,image/png,image/webp";

const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const SUPPORTED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

export const validateImageFile = (file) => {
  if (!file) return;

  const extension = file.name?.split(".").pop()?.toLowerCase() || "";
  if (!SUPPORTED_IMAGE_TYPES.has(file.type) || !SUPPORTED_IMAGE_EXTENSIONS.has(extension)) {
    throw new Error("Only JPG, JPEG, PNG, and WEBP images are supported.");
  }
};

export const optimizeImageFile = async (file) => {
  validateImageFile(file);

  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const preview = new Image();
      preview.onload = () => resolve(preview);
      preview.onerror = reject;
      preview.src = sourceUrl;
    });
    const maxDimension = 1600;
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));

    if (scale === 1 && file.type === "image/png") {
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);

    const outputType = file.type === "image/png" ? "image/png" : file.type === "image/webp" ? "image/webp" : "image/jpeg";
    const optimized = await new Promise((resolve) => canvas.toBlob(resolve, outputType, 0.86));
    if (!optimized) return file;

    const extension = outputType === "image/jpeg" ? "jpg" : outputType.split("/")[1];
    const baseName = file.name.replace(/\.[^/.]+$/, "") || "image";
    return new File([optimized], `${baseName}.${extension}`, { type: outputType });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
};

export const uploadFile = async (file, folder = "general", { imageOnly = false } = {}) => {
  if (!file || typeof file === "string") {
    return file || "";
  }

  const upload = imageOnly ? await optimizeImageFile(file) : file;

  const data = new FormData();
  data.append("file", upload);
  data.append("folder", folder);
  if (imageOnly) {
    data.append("imageOnly", "true");
  }
  const response = await api.post("/files", data, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.url || "";
};

export const resolveAssetUrl = (url) => {
  if (!url || url.startsWith("http") || url.startsWith("blob:")) {
    return url || "";
  }
  if (url.startsWith("/api/")) {
    return `${apiBaseUrl.replace(/\/api$/, "")}${url}`;
  }
  if (url.startsWith("/uploads/")) {
    return `${apiBaseUrl}${url}`;
  }
  return url;
};
