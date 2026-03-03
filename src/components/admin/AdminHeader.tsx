import { Bell, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { fetchInquiries } from "@/services/productsApi";
import type { Inquiry } from "@/types/admin";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
}

export const AdminHeader = ({ title, subtitle }: AdminHeaderProps) => {
  const { adminName, logout } = useAuth();
  const [newInquiryCount, setNewInquiryCount] = useState(0);
  const [latestNewInquiries, setLatestNewInquiries] = useState<Inquiry[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  const isInquiryPage = useMemo(
    () => location.pathname.startsWith("/admin/inquiries"),
    [location.pathname],
  );

  useEffect(() => {
    let mounted = true;

    const loadCounts = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const inquiries = await fetchInquiries();
        const onlyNew = inquiries.filter((inquiry) => inquiry.status === "new");
        const count = onlyNew.length;
        const latest = [...onlyNew]
          .sort(
            (a, b) =>
              new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime(),
          )
          .slice(0, 5);

        if (mounted) {
          setNewInquiryCount(count);
          setLatestNewInquiries(latest);
        }
      } catch {
        // Silent fail for header polling.
      }
    };

    loadCounts();
    const timer = window.setInterval(loadCounts, 45000);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const openNewInquiries = (replace = false) => {
    if (isInquiryPage) {
      navigate("/admin/inquiries?status=new", { replace: true });
      return;
    }
    navigate("/admin/inquiries?status=new", { replace });
  };

  const openInquiryDetail = (id: string) => {
    navigate(`/admin/inquiries/${id}`);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-4 sm:px-6">
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold text-foreground sm:text-xl">{title}</h1>
        {subtitle && <p className="hidden truncate text-sm text-muted-foreground sm:block">{subtitle}</p>}
      </div>
      
      <div className="flex items-center gap-1.5 sm:gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground"
          onClick={() => navigate("/admin/inquiries")}
          title="Open inquiries"
        >
          <Search className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground"
              title={newInquiryCount > 0 ? `${newInquiryCount} new inquiries` : "No new inquiries"}
            >
              <Bell className="h-5 w-5" />
              {newInquiryCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {newInquiryCount > 99 ? "99+" : newInquiryCount}
                </span>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[min(20rem,calc(100vw-2rem))]">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>New Inquiries</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {newInquiryCount}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {latestNewInquiries.length === 0 ? (
              <DropdownMenuItem disabled>No new inquiries</DropdownMenuItem>
            ) : (
              latestNewInquiries.map((inquiry) => (
                <DropdownMenuItem
                  key={inquiry.id}
                  className="py-2"
                  onSelect={() => openInquiryDetail(inquiry.id)}
                >
                  <div className="flex w-full flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">{inquiry.name || "Unknown"}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {inquiry.productInterest || "General inquiry"}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => openNewInquiries(true)}>
              View all new inquiries
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="ml-2 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
            <span className="text-sm font-semibold text-primary">
              {adminName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-foreground">{adminName}</p>
            <button
              onClick={logout}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
