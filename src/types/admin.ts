export type ProductStatus = "active" | "inactive";
export type InquiryStatus = "new" | "contacted" | "closed";
export type ReviewStatus = "new" | "replied" | "closed";

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  status: ProductStatus;
  lastUpdated: string;
  image: string;
  images: string[];
  featured: boolean;
}

export interface Inquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  productInterest: string;
  message: string;
  dateSubmitted: string;
  status: InquiryStatus;
  notes: string;
}

export interface Review {
  id: string;
  name: string;
  phone: string;
  productName: string;
  rating: number;
  message: string;
  createdAt: string;
  status: ReviewStatus;
  adminReply: string;
}
