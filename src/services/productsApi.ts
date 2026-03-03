import type {
  Inquiry,
  InquiryStatus,
  Product,
  ProductStatus,
  Review,
  ReviewStatus,
} from "@/types/admin";
import { FALLBACK_PRODUCT_IMAGE, parseImageUrls } from "@/lib/productImages";

export const PRODUCTS_API_URL = "/api/products";

type JsonRecord = Record<string, unknown>;
type InquiryLocalState = Pick<Inquiry, "status" | "notes"> & { updatedAt: string };

const INQUIRY_OVERRIDES_STORAGE_KEY = "pss_admin_inquiry_overrides_v1";
const API_CACHE_TTL_MS = 20_000;

let productsCache: { value: Product[]; expiresAt: number } | null = null;
let inquiriesCache: { value: Inquiry[]; expiresAt: number } | null = null;
let productsInFlight: Promise<Product[]> | null = null;
let inquiriesInFlight: Promise<Inquiry[]> | null = null;

export interface AddProductPayload {
  name: string;
  category: string;
  price_inr: string;
  mrp_inr?: string;
  description: string;
  status: "Active" | "Inactive";
  featured: "Yes" | "No";
  images: {
    base64: string;
    name: string;
  }[];
}

export interface UpdateProductPayload {
  id: string;
  name: string;
  category: string;
  price_inr: string;
  mrp_inr?: string;
  description: string;
  status: "Active" | "Inactive";
  featured: "Yes" | "No";
  existing_images: string[];
  new_images: {
    base64: string;
    name: string;
  }[];
}

function asRecord(value: unknown): JsonRecord {
  if (value && typeof value === "object") {
    return value as JsonRecord;
  }
  return {};
}

function asError(value: unknown): Error {
  if (value instanceof Error) {
    return value;
  }
  return new Error("Unexpected API error");
}

function getMessage(payload: JsonRecord, fallback: string): string {
  const error = payload.error;
  if (typeof error === "string" && error.trim()) {
    return error;
  }

  const message = payload.message;
  if (typeof message === "string" && message.trim()) {
    return message;
  }

  return fallback;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ["yes", "true", "1", "y"].includes(normalized);
  }
  return false;
}

function normalizeProductStatus(value: unknown): ProductStatus {
  return String(value ?? "").trim().toLowerCase() === "active" ? "active" : "inactive";
}

function normalizeInquiryStatus(value: unknown): InquiryStatus {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (
    normalized === "contacted" ||
    normalized.includes("contact") ||
    normalized.includes("follow") ||
    normalized.includes("progress")
  ) {
    return "contacted";
  }

  if (
    normalized === "closed" ||
    normalized.includes("close") ||
    normalized.includes("resolve") ||
    normalized.includes("done")
  ) {
    return "closed";
  }

  return "new";
}

function normalizeReviewStatus(value: unknown): ReviewStatus {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "replied") return "replied";
  if (normalized === "closed") return "closed";
  return "new";
}

function toStringValue(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

function isCacheValid<T>(cache: { value: T; expiresAt: number } | null): cache is { value: T; expiresAt: number } {
  return Boolean(cache && cache.expiresAt > Date.now());
}

function extractArray(payload: JsonRecord, keys: string[]): unknown[] {
  for (const key of keys) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  const nestedData = asRecord(payload.data);
  for (const key of keys) {
    const value = nestedData[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function hashString(value: string): string {
  let hash = 5381;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }

  return Math.abs(hash >>> 0).toString(36);
}

function getInquiryLocalState(): Record<string, InquiryLocalState> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(INQUIRY_OVERRIDES_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, InquiryLocalState>;
  } catch {
    return {};
  }
}

function setInquiryLocalState(state: Record<string, InquiryLocalState>) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(INQUIRY_OVERRIDES_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage write failures.
  }
}

function saveInquiryLocalOverride(id: string, status: InquiryStatus, notes: string) {
  const current = getInquiryLocalState();
  current[id] = {
    status,
    notes,
    updatedAt: new Date().toISOString(),
  };

  setInquiryLocalState(current);
}

function mergeInquiryLocalOverrides(rows: Inquiry[]): Inquiry[] {
  const overrides = getInquiryLocalState();

  return rows.map((inquiry) => {
    const local = overrides[inquiry.id];
    if (!local) return inquiry;

    return {
      ...inquiry,
      status: local.status,
      notes: local.notes,
    };
  });
}

async function requestJson(url: string, init?: RequestInit): Promise<JsonRecord> {
  const response = await fetch(url, init);
  const payload = (await response.json()) as unknown;
  const data = asRecord(payload);

  if (!response.ok) {
    throw new Error(getMessage(data, `Request failed with status ${response.status}`));
  }

  if (data.success === false) {
    throw new Error(getMessage(data, "Request failed"));
  }

  return data;
}

async function getWithActionFallback(actions: string[]): Promise<JsonRecord> {
  let lastError: Error | null = null;

  for (const action of actions) {
    try {
      return await requestJson(`${PRODUCTS_API_URL}?action=${encodeURIComponent(action)}`);
    } catch (error) {
      lastError = asError(error);
    }
  }

  throw lastError ?? new Error("Request failed");
}

async function postWithActionFallback(actions: string[], body: object): Promise<JsonRecord> {
  let lastError: Error | null = null;

  for (const action of actions) {
    try {
      return await requestJson(PRODUCTS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ...body,
        }),
      });
    } catch (error) {
      lastError = asError(error);
    }
  }

  throw lastError ?? new Error("Request failed");
}

function mapProduct(raw: unknown): Product {
  const p = asRecord(raw);
  const images = parseImageUrls([p.image_urls, p.image_url, p.image, p.images]);

  return {
    id: toStringValue(p.id, crypto.randomUUID()),
    name: toStringValue(p.name),
    category: toStringValue(p.category),
    description: toStringValue(p.description),
    price: Number(p.price_inr ?? p.price ?? 0),
    status: normalizeProductStatus(p.status),
    lastUpdated: toStringValue(p.updated_at ?? p.lastUpdated ?? p.created_at, new Date().toISOString()),
    image: images[0] || FALLBACK_PRODUCT_IMAGE,
    images,
    featured: toBoolean(p.featured ?? p.is_featured ?? p.isFeatured ?? p.Featured),
  };
}

function mapInquiry(raw: unknown): Inquiry {
  const i = asRecord(raw);
  const name = toStringValue(i.name ?? i.customer_name ?? i.customerName);
  const phone = toStringValue(i.phone ?? i.mobile ?? i.whatsapp);
  const email = toStringValue(
    i.email ?? i.mail ?? i.email_address ?? i.emailAddress ?? i.email_id ?? i.emailId ?? i.Email,
  );
  const createdAt = toStringValue(i.dateSubmitted ?? i.created_at ?? i.date ?? i.submitted_at);
  const message = toStringValue(i.message);
  const rawId = toStringValue(
    i.id ??
      i.inquiry_id ??
      i.inquiryId ??
      i.row_id ??
      i.rowId ??
      i.row_no ??
      i.rowNo ??
      i.sr_no ??
      i.srNo ??
      i.serial_no ??
      i.serialNo,
  );
  const fallbackSeed = `${name}|${phone}|${email}|${createdAt}|${message}`;
  const inquiryId = rawId || `inq_${hashString(fallbackSeed || crypto.randomUUID())}`;

  return {
    id: inquiryId,
    name,
    phone,
    email,
    productInterest: toStringValue(
      i.productInterest ?? i.product_interest ?? i.product ?? i.product_name ?? i.productName,
    ),
    message,
    dateSubmitted: createdAt || new Date().toISOString(),
    status: normalizeInquiryStatus(i.status ?? i.inquiry_status ?? i.inquiryStatus),
    notes: toStringValue(i.notes ?? i.note ?? i.admin_notes ?? i.adminNotes ?? i.remarks ?? i.comment),
  };
}

function mapReview(raw: unknown): Review {
  const r = asRecord(raw);

  return {
    id: toStringValue(r.id, crypto.randomUUID()),
    name: toStringValue(r.name ?? r.customer_name ?? r.user_name),
    phone: toStringValue(r.phone ?? r.mobile ?? r.whatsapp ?? r.contact),
    productName: toStringValue(r.productName ?? r.product_name ?? r.product),
    rating: Number(r.rating ?? 0),
    message: toStringValue(r.message ?? r.review ?? r.comment ?? r.feedback),
    createdAt: toStringValue(r.createdAt ?? r.created_at ?? r.date ?? r.timestamp, new Date().toISOString()),
    status: normalizeReviewStatus(r.status),
    adminReply: toStringValue(r.adminReply ?? r.admin_reply ?? r.reply),
  };
}

export async function fetchProducts(): Promise<Product[]> {
  if (isCacheValid(productsCache)) {
    return productsCache.value;
  }

  if (productsInFlight) {
    return productsInFlight;
  }

  productsInFlight = (async () => {
    const payload = await getWithActionFallback(["getProducts"]);
    const rows = extractArray(payload, ["products", "items", "rows", "data"]);
    const mapped = rows.map(mapProduct);
    productsCache = {
      value: mapped,
      expiresAt: Date.now() + API_CACHE_TTL_MS,
    };
    return mapped;
  })();

  try {
    return await productsInFlight;
  } finally {
    productsInFlight = null;
  }
}

export async function addProduct(payload: AddProductPayload): Promise<JsonRecord> {
  return postWithActionFallback(["addProduct", "createProduct"], payload);
}

export async function updateProduct(payload: UpdateProductPayload): Promise<JsonRecord> {
  return postWithActionFallback(["updateProduct", "editProduct"], payload);
}

export async function deactivateProduct(id: string): Promise<JsonRecord> {
  return postWithActionFallback(
    ["deactivateProduct", "deleteProduct", "updateProductStatus"],
    { id, status: "Inactive" },
  );
}

export async function fetchInquiries(): Promise<Inquiry[]> {
  if (isCacheValid(inquiriesCache)) {
    return mergeInquiryLocalOverrides(inquiriesCache.value);
  }

  if (inquiriesInFlight) {
    return inquiriesInFlight;
  }

  inquiriesInFlight = (async () => {
    const payload = await getWithActionFallback(["getInquiries", "listInquiries", "getAllInquiries"]);
    const rows = extractArray(payload, ["inquiries", "items", "rows", "data"]);
    const mapped = mergeInquiryLocalOverrides(rows.map(mapInquiry));
    inquiriesCache = {
      value: mapped,
      expiresAt: Date.now() + API_CACHE_TTL_MS,
    };
    return mapped;
  })();

  try {
    return await inquiriesInFlight;
  } finally {
    inquiriesInFlight = null;
  }
}

export async function updateInquiry(payload: {
  id: string;
  status: InquiryStatus;
  notes: string;
}): Promise<JsonRecord> {
  const statusLabelMap: Record<InquiryStatus, string> = {
    new: "New",
    contacted: "Contacted",
    closed: "Closed",
  };
  const statusLabel = statusLabelMap[payload.status];

  return postWithActionFallback(
    ["updateInquiry", "updateInquiryStatus", "saveInquiry"],
    {
      id: payload.id,
      inquiry_id: payload.id,
      inquiryId: payload.id,
      status: payload.status,
      inquiry_status: payload.status,
      inquiryStatus: payload.status,
      status_label: statusLabel,
      statusLabel,
      notes: payload.notes,
      note: payload.notes,
      admin_notes: payload.notes,
      adminNotes: payload.notes,
      remarks: payload.notes,
    },
  ).then((result) => {
    saveInquiryLocalOverride(payload.id, payload.status, payload.notes);
    if (inquiriesCache) {
      inquiriesCache = {
        value: inquiriesCache.value.map((inquiry) =>
          inquiry.id === payload.id
            ? {
                ...inquiry,
                status: payload.status,
                notes: payload.notes,
              }
            : inquiry,
        ),
        expiresAt: Date.now() + API_CACHE_TTL_MS,
      };
    }
    return result;
  });
}

export async function fetchReviews(): Promise<Review[]> {
  const payload = await getWithActionFallback(["getReviews", "listReviews", "getAllReviews"]);
  const rows = extractArray(payload, ["reviews", "items", "rows", "data"]);
  return rows.map(mapReview);
}

export async function updateReviewReply(payload: {
  id: string;
  status: ReviewStatus;
  adminReply: string;
}): Promise<JsonRecord> {
  return postWithActionFallback(
    ["updateReview", "replyReview", "updateReviewReply"],
    {
      id: payload.id,
      status: payload.status,
      admin_reply: payload.adminReply,
      adminReply: payload.adminReply,
    },
  );
}
