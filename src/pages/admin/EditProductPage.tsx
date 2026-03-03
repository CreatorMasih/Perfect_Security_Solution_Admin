import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X, Save } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { categories } from "@/data/catalog";
import { fetchProducts, updateProduct } from "@/services/productsApi";
import type { Product } from "@/types/admin";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type NewImage = { base64: string; name: string };

const EditProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    description: "",
    featured: false,
    status: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const totalImages = existingImages.length + newImages.length;

  const currentImage = useMemo(() => {
    if (activeIndex < existingImages.length) {
      return existingImages[activeIndex];
    }

    return newImages[activeIndex - existingImages.length]?.base64;
  }, [activeIndex, existingImages, newImages]);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        navigate("/admin/products");
        return;
      }

      try {
        setIsFetching(true);
        const products = await fetchProducts();
        const found = products.find((item) => item.id === id);

        if (!found) {
          toast.error("Product not found");
          navigate("/admin/products");
          return;
        }

        setProduct(found);
        setFormData({
          name: found.name,
          category: found.category,
          price: String(found.price),
          description: found.description,
          featured: found.featured,
          status: found.status === "active",
        });
        setExistingImages(found.images || []);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load product";
        toast.error(message);
        navigate("/admin/products");
      } finally {
        setIsFetching(false);
      }
    };

    load();
  }, [id, navigate]);

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Product name is required";
    }
    if (!formData.category) {
      nextErrors.category = "Category is required";
    }
    if (!formData.price || Number(formData.price) <= 0) {
      nextErrors.price = "Valid price is required";
    }
    if (!formData.description.trim()) {
      nextErrors.description = "Description is required";
    }
    if (totalImages === 0) {
      nextErrors.images = "At least 1 image is required";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validFiles = files.filter((file) => {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Each image must be < 2MB");
        return false;
      }

      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        toast.error("Only JPG, PNG, WebP allowed");
        return false;
      }

      return true;
    });

    if (!validFiles.length) return;

    try {
      const encoded = await Promise.all(
        validFiles.map(
          (file) =>
            new Promise<NewImage>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () =>
                resolve({
                  base64: reader.result as string,
                  name: file.name,
                });
              reader.onerror = () => reject(new Error(`Failed to read image: ${file.name}`));
              reader.readAsDataURL(file);
            }),
        ),
      );

      setNewImages((prev) => [...prev, ...encoded]);
      setErrors((prev) => ({ ...prev, images: "" }));
    } catch {
      toast.error("Failed to process selected images");
    }
  };

  const removeActiveImage = () => {
    if (activeIndex < existingImages.length) {
      setExistingImages((prev) => prev.filter((_, idx) => idx !== activeIndex));
    } else {
      const newIndex = activeIndex - existingImages.length;
      setNewImages((prev) => prev.filter((_, idx) => idx !== newIndex));
    }

    setActiveIndex(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsLoading(true);
    try {
      await updateProduct({
        id: product.id,
        name: formData.name,
        category: formData.category,
        price_inr: formData.price,
        description: formData.description,
        status: formData.status ? "Active" : "Inactive",
        featured: formData.featured ? "Yes" : "No",
        existing_images: existingImages,
        new_images: newImages,
      });

      toast.success("Product updated successfully");
      navigate("/admin/products");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update product";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen">
      <AdminHeader title="Edit Product" subtitle={product.name} />

      <div className="p-6">
        <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-6">
            <div className="space-y-2">
              <Label className="text-foreground">
                Product Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className={`bg-secondary/50 border-border ${errors.name ? "border-destructive" : ""}`}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger
                  className={`bg-secondary/50 border-border ${errors.category ? "border-destructive" : ""}`}
                >
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">
                Price (INR) <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                className={`bg-secondary/50 border-border ${errors.price ? "border-destructive" : ""}`}
              />
              {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
                className={`bg-secondary/50 border-border resize-none ${errors.description ? "border-destructive" : ""}`}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Featured Product</Label>
              <Select
                value={formData.featured ? "yes" : "no"}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, featured: value === "yes" }))
                }
              >
                <SelectTrigger className="bg-secondary/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">
                Product Images <span className="text-destructive">*</span>
              </Label>

              {totalImages > 0 ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <img src={currentImage} className="h-40 w-40 rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={removeActiveImage}
                      className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {totalImages > 1 && (
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setActiveIndex((idx) => (idx === 0 ? totalImages - 1 : idx - 1))
                        }
                      >
                        Prev
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {activeIndex + 1} / {totalImages}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setActiveIndex((idx) => (idx === totalImages - 1 ? 0 : idx + 1))
                        }
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No images selected</p>
              )}

              <label className="inline-block cursor-pointer rounded border border-border px-4 py-2 text-sm">
                Add Images
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                />
              </label>
              {errors.images && <p className="text-sm text-destructive">{errors.images}</p>}
            </div>

            <div className="flex items-center justify-between rounded-lg bg-secondary/30 p-4">
              <div>
                <Label className="text-foreground">Product Status</Label>
                <p className="text-sm text-muted-foreground">
                  {formData.status ? "Product is active and visible" : "Product is inactive"}
                </p>
              </div>
              <Switch
                checked={formData.status}
                onCheckedChange={(status) => setFormData((prev) => ({ ...prev, status }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate("/admin/products")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductPage;
