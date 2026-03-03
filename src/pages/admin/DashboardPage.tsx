import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  CheckCircle,
  XCircle,
  MessageSquare,
  Clock,
  RefreshCw,
  Plus,
  Eye,
  Inbox,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Button } from "@/components/ui/button";
import { fetchInquiries, fetchProducts } from "@/services/productsApi";
import { FALLBACK_PRODUCT_IMAGE } from "@/lib/productImages";
import type { Inquiry, Product } from "@/types/admin";
import { toast } from "sonner";

const DashboardPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const loadDashboard = async () => {
    setLoading(true);

    const [productsResult, inquiriesResult] = await Promise.allSettled([
      fetchProducts(),
      fetchInquiries(),
    ]);

    if (productsResult.status === "fulfilled") {
      setProducts(productsResult.value);
    } else {
      const message =
        productsResult.reason instanceof Error
          ? productsResult.reason.message
          : "Failed to load products";
      toast.error(message);
    }

    if (inquiriesResult.status === "fulfilled") {
      setInquiries(inquiriesResult.value);
    } else {
      const message =
        inquiriesResult.reason instanceof Error
          ? inquiriesResult.reason.message
          : "Failed to load inquiries";
      toast.error(message);
    }

    setLastSync(new Date());
    setLoading(false);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const activeProducts = products.filter((product) => product.status === "active").length;
    const inactiveProducts = products.filter((product) => product.status === "inactive").length;
    const totalInquiries = inquiries.length;
    const newInquiries = inquiries.filter((inquiry) => inquiry.status === "new").length;

    return {
      totalProducts,
      activeProducts,
      inactiveProducts,
      totalInquiries,
      newInquiries,
    };
  }, [products, inquiries]);

  const recentInquiries = useMemo(
    () =>
      [...inquiries]
        .sort(
          (a, b) =>
            new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime(),
        )
        .slice(0, 3),
    [inquiries],
  );

  const recentProducts = useMemo(
    () =>
      [...products]
        .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
        .slice(0, 4),
    [products],
  );

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="Dashboard"
        subtitle="Live business summary from your current sheet data."
      />

      <div className="p-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard title="Total Products" value={stats.totalProducts} icon={Package} variant="default" />
          <StatCard title="Active Products" value={stats.activeProducts} icon={CheckCircle} variant="success" />
          <StatCard title="Inactive Products" value={stats.inactiveProducts} icon={XCircle} variant="warning" />
          <StatCard title="Total Inquiries" value={stats.totalInquiries} icon={MessageSquare} variant="default" />
          <StatCard title="New Inquiries" value={stats.newInquiries} icon={Inbox} variant="primary" />
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card animate-slide-up">
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/products/add">
              <Button variant="default" className="gap-2">
                <Plus className="h-4 w-4" />
                Add New Product
              </Button>
            </Link>
            <Link to="/admin/products">
              <Button variant="secondary" className="gap-2">
                <Eye className="h-4 w-4" />
                View All Products
              </Button>
            </Link>
            <Link to="/admin/inquiries">
              <Button variant="secondary" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                View Inquiries
              </Button>
            </Link>
            <Button variant="outline" className="gap-2" onClick={loadDashboard} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Sync Now
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              Last Sync: {lastSync ? lastSync.toLocaleString() : "Not synced yet"}
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card shadow-card animate-slide-up">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-lg font-semibold text-foreground">Recent Inquiries</h2>
              <Link to="/admin/inquiries">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            <div className="divide-y divide-border">
              {recentInquiries.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">No inquiries available</div>
              ) : (
                recentInquiries.map((inquiry) => (
                  <Link
                    key={inquiry.id}
                    to={`/admin/inquiries/${inquiry.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-sm font-semibold text-primary">
                        {inquiry.name
                          .split(" ")
                          .map((part) => part[0] ?? "")
                          .join("")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{inquiry.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {inquiry.productInterest || "General inquiry"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        inquiry.status === "new"
                          ? "bg-primary/10 text-primary"
                          : inquiry.status === "contacted"
                            ? "bg-warning/10 text-warning"
                            : "bg-success/10 text-success"
                      }`}
                    >
                      {inquiry.status}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-card animate-slide-up">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-lg font-semibold text-foreground">Recent Products</h2>
              <Link to="/admin/products">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            <div className="divide-y divide-border">
              {recentProducts.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">No products available</div>
              ) : (
                recentProducts.map((product) => (
                  <Link
                    key={product.id}
                    to={`/admin/products/edit/${product.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors"
                  >
                    <img
                      src={product.image || FALLBACK_PRODUCT_IMAGE}
                      alt={product.name}
                      className="h-12 w-12 rounded-lg object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        INR {product.price.toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        product.status === "active"
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {product.status}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
