import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { Search, Eye, Download } from "lucide-react";
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
import { fetchInquiries } from "@/services/productsApi";
import type { Inquiry } from "@/types/admin";
import { toast } from "sonner";

const InquiriesListPage = () => {
  const [searchParams] = useSearchParams();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam === "new" || statusParam === "contacted" || statusParam === "closed") {
      setStatusFilter(statusParam);
      return;
    }
    setStatusFilter("all");
  }, [searchParams]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchInquiries();
        setInquiries(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load inquiries";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filteredInquiries = useMemo(() => {
    let result = [...inquiries];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (inquiry) =>
          inquiry.name.toLowerCase().includes(q) ||
          inquiry.phone.includes(search) ||
          inquiry.email.toLowerCase().includes(q),
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((inquiry) => inquiry.status === statusFilter);
    }

    result.sort(
      (a, b) =>
        new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime(),
    );

    return result;
  }, [inquiries, search, statusFilter]);

  const handleExport = () => {
    const csv = [
      ["Name", "Phone", "Email", "Product Interest", "Message", "Date", "Status", "Notes"],
      ...filteredInquiries.map((inquiry) => [
        inquiry.name,
        inquiry.phone,
        inquiry.email,
        inquiry.productInterest,
        inquiry.message.replace(/,/g, ";"),
        inquiry.dateSubmitted,
        inquiry.status,
        inquiry.notes.replace(/,/g, ";"),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inquiries-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Inquiries exported successfully");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
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

  return (
    <div className="min-h-screen">
      <AdminHeader title="Customer Inquiries" subtitle={`${filteredInquiries.length} inquiries`} />

      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-col gap-3 sm:flex-1 sm:flex-row">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-secondary/50 border-border"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px] bg-secondary/50 border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="w-full gap-2 sm:w-auto" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <div className="space-y-4 md:hidden">
          {loading ? (
            <div className="rounded-xl border border-border bg-card px-4 py-10 text-center text-muted-foreground">
              Loading inquiries...
            </div>
          ) : filteredInquiries.length === 0 ? (
            <div className="rounded-xl border border-border bg-card px-4 py-10 text-center text-muted-foreground">
              No inquiries found
            </div>
          ) : (
            filteredInquiries.map((inquiry) => (
              <div key={inquiry.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{inquiry.name}</p>
                    <p className="mt-0.5 break-all text-sm text-muted-foreground">{inquiry.email || "-"}</p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusBadge(
                      inquiry.status,
                    )}`}
                  >
                    {inquiry.status}
                  </span>
                </div>

                <div className="space-y-1 text-sm">
                  <p className="text-foreground"><span className="text-muted-foreground">Phone: </span>{inquiry.phone || "-"}</p>
                  <p className="text-foreground"><span className="text-muted-foreground">Product: </span>{inquiry.productInterest || "General"}</p>
                  <p className="text-muted-foreground break-words">{inquiry.message || "-"}</p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(inquiry.dateSubmitted).toLocaleDateString()}
                  </span>
                  <Link to={`/admin/inquiries/${inquiry.id}`}>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="hidden md:block rounded-xl border border-border bg-card shadow-card overflow-hidden animate-slide-up">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Phone</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Product Interest
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Message</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                      Loading inquiries...
                    </td>
                  </tr>
                ) : filteredInquiries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                      No inquiries found
                    </td>
                  </tr>
                ) : (
                  filteredInquiries.map((inquiry) => (
                    <tr key={inquiry.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                            <span className="text-xs font-semibold text-primary">
                              {inquiry.name
                                .split(" ")
                                .map((part) => part[0] ?? "")
                                .join("")}
                            </span>
                          </div>
                          <span className="font-medium text-foreground">{inquiry.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-foreground">{inquiry.phone}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">{inquiry.email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-foreground">
                          {inquiry.productInterest || "General"}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[220px]">
                        <p className="text-sm text-muted-foreground truncate">{inquiry.message}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {new Date(inquiry.dateSubmitted).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusBadge(
                            inquiry.status,
                          )}`}
                        >
                          {inquiry.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end">
                          <Link to={`/admin/inquiries/${inquiry.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
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

export default InquiriesListPage;
