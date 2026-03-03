import { useEffect, useMemo, useState } from "react";
import { MessageSquare, Search, Send, Star } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchReviews, updateReviewReply } from "@/services/productsApi";
import type { Review } from "@/types/admin";
import { toast } from "sonner";

function buildReplyMessage(review: Review): string {
  return [
    `Hi ${review.name},`,
    "Thank you for your valuable review for Perfect Security Solution.",
    review.productName ? `Product: ${review.productName}` : "",
    "We appreciate your feedback and support.",
  ]
    .filter(Boolean)
    .join("\n");
}

function getReviewStatusBadge(status: string): string {
  switch (status) {
    case "new":
      return "bg-primary/10 text-primary";
    case "replied":
      return "bg-success/10 text-success";
    case "closed":
      return "bg-warning/10 text-warning";
    default:
      return "bg-muted text-muted-foreground";
  }
}

const ReviewsListPage = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchReviews();
        setReviews(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load reviews";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filteredReviews = useMemo(() => {
    let result = [...reviews];
    const q = search.trim().toLowerCase();

    if (q) {
      result = result.filter(
        (review) =>
          review.name.toLowerCase().includes(q) ||
          review.productName.toLowerCase().includes(q) ||
          review.message.toLowerCase().includes(q) ||
          review.phone.includes(search),
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((review) => review.status === statusFilter);
    }

    result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return result;
  }, [reviews, search, statusFilter]);

  const handleWhatsappReply = async (review: Review) => {
    if (!review.phone) {
      toast.error("Phone/WhatsApp number not available for this review");
      return;
    }

    const phone = review.phone.replace(/\D/g, "");
    const replyText = review.adminReply || buildReplyMessage(review);

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(replyText)}`, "_blank");

    setReplyingId(review.id);
    try {
      await updateReviewReply({
        id: review.id,
        status: "replied",
        adminReply: replyText,
      });

      setReviews((prev) =>
        prev.map((item) =>
          item.id === review.id
            ? {
                ...item,
                status: "replied",
                adminReply: replyText,
              }
            : item,
        ),
      );
    } catch {
      toast.error("WhatsApp opened, but review status update failed");
    } finally {
      setReplyingId(null);
    }
  };

  return (
    <div className="min-h-screen">
      <AdminHeader title="Customer Reviews" subtitle={`${filteredReviews.length} reviews`} />

      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search reviews..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-secondary/50 border-border"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] bg-secondary/50 border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden animate-slide-up">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Customer</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Product</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Rating</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Review</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      Loading reviews...
                    </td>
                  </tr>
                ) : filteredReviews.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      No reviews found
                    </td>
                  </tr>
                ) : (
                  filteredReviews.map((review) => (
                    <tr key={review.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{review.name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{review.phone || "No phone"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-foreground">{review.productName || "-"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star
                              key={`${review.id}-${idx}`}
                              className={`h-4 w-4 ${
                                idx < Math.max(0, Math.min(5, review.rating))
                                  ? "text-yellow-500 fill-yellow-500"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[260px]">
                        <p className="text-sm text-muted-foreground line-clamp-2">{review.message || "-"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getReviewStatusBadge(
                            review.status,
                          )}`}
                        >
                          {review.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => handleWhatsappReply(review)}
                            disabled={replyingId === review.id}
                          >
                            {replyingId === review.id ? (
                              <>
                                <div className="h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send className="h-3.5 w-3.5" />
                                WhatsApp
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigator.clipboard.writeText(buildReplyMessage(review))}
                            title="Copy reply text"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewsListPage;
