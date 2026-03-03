import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  Package,
  MessageSquare,
  Save,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchInquiries, updateInquiry } from "@/services/productsApi";
import type { Inquiry, InquiryStatus } from "@/types/admin";
import { toast } from "sonner";

const InquiryDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [status, setStatus] = useState<InquiryStatus>("new");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        navigate("/admin/inquiries");
        return;
      }

      try {
        setIsFetching(true);
        const inquiries = await fetchInquiries();
        const found = inquiries.find((item) => item.id === id);

        if (!found) {
          toast.error("Inquiry not found");
          navigate("/admin/inquiries");
          return;
        }

        setInquiry(found);
        setStatus(found.status);
        setNotes(found.notes || "");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load inquiry";
        toast.error(message);
        navigate("/admin/inquiries");
      } finally {
        setIsFetching(false);
      }
    };

    load();
  }, [id, navigate]);

  const handleSave = async () => {
    if (!inquiry) return;

    setIsLoading(true);
    try {
      await updateInquiry({
        id: inquiry.id,
        status,
        notes,
      });

      setInquiry((prev) => (prev ? { ...prev, status, notes } : prev));
      toast.success("Inquiry updated successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update inquiry";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = () => {
    if (!inquiry?.phone) return;
    window.open(`tel:${inquiry.phone.replace(/\s/g, "")}`);
  };

  const handleWhatsApp = () => {
    if (!inquiry?.phone) return;

    const phone = inquiry.phone.replace(/\D/g, "");
    const text = [
      `Hi ${inquiry.name},`,
      "Thank you for contacting Perfect Security Solution.",
      `Regarding your inquiry: ${inquiry.productInterest || "General requirement"}`,
      "Please share a convenient time for discussion.",
    ].join("\n");

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const getStatusBadge = (value: string) => {
    switch (value) {
      case "new":
        return "bg-primary/10 text-primary";
      case "contacted":
        return "bg-warning/10 text-warning";
      case "closed":
        return "bg-success/10 text-success";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!inquiry) return null;

  return (
    <div className="min-h-screen">
      <AdminHeader title="Inquiry Details" subtitle={`From: ${inquiry.name}`} />

      <div className="p-4 sm:p-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            className="gap-2 text-muted-foreground"
            onClick={() => navigate("/admin/inquiries")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Inquiries
          </Button>
        </div>

        <div className="mx-auto max-w-4xl space-y-6 animate-slide-up">
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-card">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <span className="text-lg font-bold text-primary">
                    {inquiry.name
                      .split(" ")
                      .map((part) => part[0] ?? "")
                      .join("")}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{inquiry.name}</h2>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusBadge(
                      inquiry.status,
                    )}`}
                  >
                    {inquiry.status}
                  </span>
                </div>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button variant="outline" className="w-full gap-2 sm:w-auto" onClick={handleCall}>
                  <Phone className="h-4 w-4" />
                  Call Now
                </Button>
                <Button variant="default" className="w-full gap-2 sm:w-auto" onClick={handleWhatsApp}>
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp
                </Button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-3 rounded-lg bg-secondary/30 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  {inquiry.phone ? (
                    <a
                      href={`tel:${inquiry.phone.replace(/\s/g, "")}`}
                      className="break-all text-sm font-medium text-foreground hover:text-primary"
                    >
                      {inquiry.phone}
                    </a>
                  ) : (
                    <p className="text-sm font-medium text-foreground">-</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-secondary/30 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  {inquiry.email ? (
                    <a
                      href={`mailto:${inquiry.email}`}
                      className="break-all text-sm font-medium text-foreground hover:text-primary"
                    >
                      {inquiry.email}
                    </a>
                  ) : (
                    <p className="text-sm font-medium text-foreground">-</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-secondary/30 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Product Interest</p>
                  <p className="break-words text-sm font-medium text-foreground">
                    {inquiry.productInterest || "General"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-secondary/30 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date Submitted</p>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(inquiry.dateSubmitted).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-card">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Customer Message</h3>
            <div className="rounded-lg bg-secondary/30 p-4">
              <p className="break-words text-foreground leading-relaxed">{inquiry.message || "No message provided"}</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-card">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Update Inquiry</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as InquiryStatus)}>
                  <SelectTrigger className="w-full bg-secondary/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-foreground">
                  Internal Notes
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this inquiry (only visible to admin)"
                  rows={4}
                  className="bg-secondary/50 border-border resize-none"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isLoading} className="gap-2">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InquiryDetailPage;
