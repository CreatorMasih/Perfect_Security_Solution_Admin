import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, X, Save } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categories } from "@/data/catalog";
import { addProduct } from "@/services/productsApi";
import { toast } from "sonner";

const AddProductPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [imageFileNames, setImageFileNames] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    description: "",
    featured: false,
    status: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.name.trim()) nextErrors.name = "Product name is required";
    if (!formData.category) nextErrors.category = "Category is required";
    if (!formData.price || Number(formData.price) <= 0) nextErrors.price = "Valid price is required";
    if (!formData.description.trim()) nextErrors.description = "Description is required";
    if (imagePreviews.length === 0) nextErrors.image = "At least 1 image is required";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const readImageAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.readAsDataURL(file);
    });

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
        validFiles.map(async (file) => ({
          base64: await readImageAsBase64(file),
          name: file.name,
        })),
      );

      setImagePreviews(encoded.map((item) => item.base64));
      setImageFileNames(encoded.map((item) => item.name));
      setErrors((prev) => ({ ...prev, image: "" }));
    } catch {
      toast.error("Failed to process selected images");
    }
  };

  const removeImage = (index: number) => {
    const nextPreviews = imagePreviews.filter((_, i) => i !== index);
    const nextNames = imageFileNames.filter((_, i) => i !== index);

    setImagePreviews(nextPreviews);
    setImageFileNames(nextNames);

    if (currentImageIndex >= nextPreviews.length) {
      setCurrentImageIndex(Math.max(0, nextPreviews.length - 1));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsLoading(true);
    try {
      await addProduct({
        name: formData.name,
        category: formData.category,
        price_inr: formData.price,
        mrp_inr: "",
        description: formData.description,
        status: formData.status ? "Active" : "Inactive",
        featured: formData.featured ? "Yes" : "No",
        images: imagePreviews.map((base64, i) => ({
          base64,
          name: imageFileNames[i],
        })),
      });

      toast.success("Product created successfully!");
      navigate("/admin/products");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create product";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <AdminHeader title="Add New Product" subtitle="Create a new product listing" />

      <div className="p-6">
        <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6 animate-slide-up">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                Product Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter product name"
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
              <Label htmlFor="price" className="text-foreground">
                Price (INR) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="Enter price in INR"
                className={`bg-secondary/50 border-border ${errors.price ? "border-destructive" : ""}`}
              />
              {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Enter product description"
                rows={4}
                className={`bg-secondary/50 border-border resize-none ${errors.description ? "border-destructive" : ""}`}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Featured Product</Label>
              <Select
                value={formData.featured ? "yes" : "no"}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, featured: value === "yes" }))}
              >
                <SelectTrigger className="bg-secondary/50 border-border">
                  <SelectValue placeholder="Select featured status" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">
                Product Image <span className="text-destructive">*</span>
              </Label>

              {imagePreviews.length > 0 ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <img src={imagePreviews[currentImageIndex]} className="h-40 w-40 rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(currentImageIndex)}
                      className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {imagePreviews.length > 1 && (
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setCurrentImageIndex((idx) =>
                            idx === 0 ? imagePreviews.length - 1 : idx - 1,
                          )
                        }
                      >
                        Prev
                      </Button>

                      <span className="text-sm text-muted-foreground">
                        {currentImageIndex + 1} / {imagePreviews.length}
                      </span>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setCurrentImageIndex((idx) =>
                            idx === imagePreviews.length - 1 ? 0 : idx + 1,
                          )
                        }
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <label className="flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-secondary/30">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Click to upload images</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG, WebP (max 2MB)</p>

                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}

              {errors.image && <p className="text-sm text-destructive">{errors.image}</p>}
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
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, status: checked }))}
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
                  Save Product
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductPage;
