import MarketingNav from "@/components/marketing/Navbar";
import MarketingFooter from "@/components/marketing/Footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </>
  );
}
