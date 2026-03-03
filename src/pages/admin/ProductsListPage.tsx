import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Images,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteModal } from "@/components/admin/DeleteModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { categories } from "@/data/catalog";
import { deactivateProduct, fetchProducts } from "@/services/productsApi";
import { FALLBACK_PRODUCT_IMAGE, parseImageUrls } from "@/lib/productImages";
import type { Product } from "@/types/admin";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 20;

const getProductImages = (product: Product): string[] => {
  const images = parseImageUrls([product.image, ...(product.images || [])]);
  return images.length ? images : [FALLBACK_PRODUCT_IMAGE];
};

const ProductsListPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("lastUpdated");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; productId: string | null }>({
    open: false,
    productId: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const [galleryProductId, setGalleryProductId] = useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const sheetProducts = await fetchProducts();
        setProducts(sheetProducts);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load products";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (search) {
      result = result.filter((product) =>
        product.name.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (categoryFilter !== "all") {
      result = result.filter((product) => product.category === categoryFilter);
    }

    result.sort((a, b) => {
      let comparison = 0;

      if (sortBy === "price") {
        comparison = a.price - b.price;
      } else if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "featured") {
        comparison = Number(a.featured) - Number(b.featured);
      } else {
        comparison = new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [products, search, categoryFilter, sortBy, sortOrder]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const galleryProduct = useMemo(
    () => products.find((product) => product.id === galleryProductId) ?? null,
    [products, galleryProductId],
  );

  const galleryImages = useMemo(
    () => (galleryProduct ? getProductImages(galleryProduct) : []),
    [galleryProduct],
  );

  useEffect(() => {
    setGalleryIndex(0);
  }, [galleryProductId]);

  const handleDelete = async () => {
    if (!deleteModal.productId) return;

    setIsDeleting(true);
    try {
      await deactivateProduct(deleteModal.productId);
      setProducts((prev) =>
        prev.map((product) =>
          product.id === deleteModal.productId ? { ...product, status: "inactive" } : product,
        ),
      );
      toast.success("Product deactivated successfully");
      setDeleteModal({ open: false, productId: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to deactivate product";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(field);
    setSortOrder("desc");
  };

  return (
    <div className="min-h-screen">
      <AdminHeader title="Products" subtitle={`${filteredProducts.length} products total`} />

      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-col gap-3 sm:flex-1 sm:flex-row">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-secondary/50 border-border"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-secondary/50 border-border">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Link to="/admin/products/add" className="w-full sm:w-auto">
            <Button className="w-full gap-2 sm:w-auto">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>

        <div className="space-y-4 md:hidden">
          {loading ? (
            <div className="rounded-xl border border-border bg-card px-4 py-10 text-center text-muted-foreground">
              Loading products...
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="rounded-xl border border-border bg-card px-4 py-10 text-center text-muted-foreground">
              No products found
            </div>
          ) : (
            paginatedProducts.map((product) => {
              const images = getProductImages(product);
              return (
                <div key={product.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                  <div className="flex items-start gap-3">
                    <img
                      src={images[0] || FALLBACK_PRODUCT_IMAGE}
                      className="h-14 w-14 rounded-lg object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                      <p className="mt-1 font-medium text-foreground">INR {product.price.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        product.featured ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      Featured: {product.featured ? "Yes" : "No"}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        product.status === "active"
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {product.status}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {new Date(product.lastUpdated).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setGalleryProductId(product.id)}
                        title="View images"
                      >
                        <Images className="h-4 w-4" />
                      </Button>
                      <Link to={`/admin/products/edit/${product.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteModal({ open: true, productId: product.id })}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 md:hidden">
            <p className="text-xs text-muted-foreground">
              Page {currentPage} / {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="hidden md:block rounded-xl border border-border bg-card shadow-card overflow-hidden animate-slide-up">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Image
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    <button
                      onClick={() => toggleSort("name")}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Product Name
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    <button
                      onClick={() => toggleSort("price")}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Price (INR)
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    <button
                      onClick={() => toggleSort("featured")}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Featured
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    <button
                      onClick={() => toggleSort("lastUpdated")}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Last Updated
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                      Loading products...
                    </td>
                  </tr>
                ) : paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                      No products found
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((product) => {
                    const images = getProductImages(product);
                    const thumb = images[0] || FALLBACK_PRODUCT_IMAGE;

                    return (
                      <tr key={product.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setGalleryProductId(product.id)}
                            className="relative h-12 w-12 overflow-hidden rounded-lg border border-border"
                            title="View all images"
                          >
                            <img
                              src={thumb}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                              }}
                              className="h-12 w-12 object-cover"
                            />
                            {images.length > 1 && (
                              <span className="absolute bottom-0 right-0 rounded-tl bg-black/70 px-1 text-[10px] text-white">
                                {images.length}
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{product.name}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-muted-foreground">{product.category}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-foreground">
                            INR {product.price.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              product.featured
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {product.featured ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              product.status === "active"
                                ? "bg-success/10 text-success"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {product.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-muted-foreground">
                            {new Date(product.lastUpdated).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setGalleryProductId(product.id)}
                              title="View images"
                            >
                              <Images className="h-4 w-4" />
                            </Button>
                            <Link to={`/admin/products/edit/${product.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteModal({ open: true, productId: product.id })}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} of{" "}
                {filteredProducts.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <DeleteModal
        open={deleteModal.open}
        onOpenChange={(open) =>
          setDeleteModal({ open, productId: open ? deleteModal.productId : null })
        }
        onConfirm={handleDelete}
        title="Deactivate this product?"
        description="This will mark the product inactive so it no longer appears for customers."
      />

      <Dialog
        open={Boolean(galleryProduct)}
        onOpenChange={(open) => {
          if (!open) setGalleryProductId(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{galleryProduct?.name || "Product Images"}</DialogTitle>
          </DialogHeader>

          {galleryProduct && (
            <div className="space-y-4">
              <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-secondary/30">
                <img
                  src={galleryImages[galleryIndex] || FALLBACK_PRODUCT_IMAGE}
                  alt={`${galleryProduct.name} image ${galleryIndex + 1}`}
                  className="h-full w-full object-contain p-2"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                  }}
                />

                {galleryImages.length > 1 && (
                  <>
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute left-2 top-1/2 -translate-y-1/2"
                      onClick={() =>
                        setGalleryIndex((idx) => (idx === 0 ? galleryImages.length - 1 : idx - 1))
                      }
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() =>
                        setGalleryIndex((idx) => (idx === galleryImages.length - 1 ? 0 : idx + 1))
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>

              {galleryImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {galleryImages.map((image, index) => (
                    <button
                      key={`${galleryProduct.id}-${index}`}
                      type="button"
                      onClick={() => setGalleryIndex(index)}
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 ${
                        galleryIndex === index ? "border-primary" : "border-transparent"
                      }`}
                    >
                      <img
                        src={image}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsListPage;
