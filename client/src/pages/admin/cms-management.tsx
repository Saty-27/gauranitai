import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/layout/admin-layout";
import CMSAboutPage from "./cms-about";
import CMSContactPage from "./cms-contact";
import CMSTermsPage from "./cms-terms";
import CMSPrivacyPage from "./cms-privacy";

export default function CMSManagementPage() {
  const [location, setLocation] = useLocation();

  // Determine which page to show
  if (location === "/admin/cms/about") {
    return <CMSAboutPage />;
  } else if (location === "/admin/cms/contact") {
    return <CMSContactPage />;
  } else if (location === "/admin/cms/terms") {
    return <CMSTermsPage />;
  } else if (location === "/admin/cms/privacy") {
    return <CMSPrivacyPage />;
  }

  // Main CMS dashboard with navigation - wrapped in AdminLayout
  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">CMS Management</h1>
          <p className="text-gray-600 mt-2 text-lg">Manage website content and pages</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* About Us */}
          <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-0" onClick={() => setLocation("/admin/cms/about")}>
            <CardHeader className="bg-gradient-to-br from-blue-50 to-blue-100">
              <CardTitle className="text-lg text-blue-900">📄 About Us</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 mb-4">Manage company mission, vision, and values</p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Manage Page</Button>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-0" onClick={() => setLocation("/admin/cms/contact")}>
            <CardHeader className="bg-gradient-to-br from-green-50 to-green-100">
              <CardTitle className="text-lg text-green-900">📞 Contact</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 mb-4">Update contact information and details</p>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white">Manage Page</Button>
            </CardContent>
          </Card>

          {/* Terms of Service */}
          <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-0" onClick={() => setLocation("/admin/cms/terms")}>
            <CardHeader className="bg-gradient-to-br from-purple-50 to-purple-100">
              <CardTitle className="text-lg text-purple-900">⚖️ Terms of Service</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 mb-4">Edit terms and conditions</p>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">Manage Page</Button>
            </CardContent>
          </Card>

          {/* Privacy Policy */}
          <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-0" onClick={() => setLocation("/admin/cms/privacy")}>
            <CardHeader className="bg-gradient-to-br from-orange-50 to-orange-100">
              <CardTitle className="text-lg text-orange-900">🔒 Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 mb-4">Manage privacy policy content</p>
              <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">Manage Page</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
