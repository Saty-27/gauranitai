import { useLocation } from "wouter";
import AdminDashboard from "./dashboard";
import OrdersAdmin from "./orders";
import SubscriptionsAdmin from "./subscriptions";
import CategoriesAdmin from "./categories";
import ProductsAdmin from "./products";
import CustomersAdmin from "./customers";
import CustomerDetailPage from "./customer-detail";
import AdminBillingPage from "./billing";
import AdminBillingDetailPage from "./billing-detail";
import DeliveryPartnersPage from "./delivery-partners";
import AdminBannersPage from "./banners";
import HomepageCMS from "./homepage-cms";
import CMSManagementPage from "./cms-management";
import BrandSettings from "./brand-settings";
import AdminBlogsPage from "./blogs";
import AdminVideoBlogsPage from "./video-blogs";
import AdminImageGalleryPage from "./image-gallery";
import AdminVideoGalleryPage from "./video-gallery";
import VendorsPage from "./vendors";
import StockHistoryPage from "./stock-history";
import UsersAdmin from "./users";
import PasswordRequestsAdmin from "./password-requests";
import ChatsAdmin from "./chats";

export default function AdminPage() {
  const [location] = useLocation();
  const normalizedPath = location.endsWith("/") && location.length > 1 
    ? location.slice(0, -1) 
    : location;

  console.log("DEBUG: AdminPage location:", location, "normalizedPath:", normalizedPath);

  if (normalizedPath === "/admin" || normalizedPath === "/admin/dashboard") {
    return <AdminDashboard />;
  } else if (normalizedPath === "/admin/orders") {
    return <OrdersAdmin />;
  } else if (normalizedPath === "/admin/subscriptions") {
    return <SubscriptionsAdmin />;
  } else if (normalizedPath === "/admin/categories") {
    return <CategoriesAdmin />;
  } else if (normalizedPath === "/admin/products" || normalizedPath === "/admin/inventory") {
    return <ProductsAdmin />;
  } else if (normalizedPath === "/admin/customers") {
    return <CustomersAdmin />;
  } else if (normalizedPath === "/admin/users") {
    return <UsersAdmin />;
  } else if (normalizedPath === "/admin/password-requests") {
    return <PasswordRequestsAdmin />;
  } else if (normalizedPath === "/admin/chats") {
    return <ChatsAdmin />;
  } else if (normalizedPath?.startsWith("/admin/customers/")) {
    return <CustomerDetailPage />;
  } else if (normalizedPath === "/admin/billing") {
    return <AdminBillingPage />;
  } else if (normalizedPath?.startsWith("/admin/billing/")) {
    return <AdminBillingDetailPage />;
  } else if (normalizedPath === "/admin/delivery" || normalizedPath === "/admin/delivery-partners") {
    return <DeliveryPartnersPage />;
  } else if (normalizedPath === "/admin/vendors") {
    return <VendorsPage />;
  } else if (normalizedPath === "/admin/stock-history") {
    return <StockHistoryPage />;
  } else if (normalizedPath === "/admin/banners") {
    return <AdminBannersPage />;
  } else if (normalizedPath === "/admin/homepage") {
    return <HomepageCMS />;
  } else if (normalizedPath?.startsWith("/admin/cms")) {
    return <CMSManagementPage />;
  } else if (normalizedPath === "/admin/brand") {
    return <BrandSettings />;
  } else if (normalizedPath === "/admin/blogs") {
    return <AdminBlogsPage />;
  } else if (normalizedPath === "/admin/video-blogs") {
    return <AdminVideoBlogsPage />;
  } else if (normalizedPath === "/admin/image-gallery") {
    return <AdminImageGalleryPage />;
  } else if (normalizedPath === "/admin/video-gallery") {
    return <AdminVideoGalleryPage />;
  }

  return <AdminDashboard />;
}

