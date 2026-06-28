import AdminLayout from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Phone, ArrowRight, Settings2, Globe, MessageSquare } from "lucide-react";
import { Link } from "wouter";

export default function PagesManagement() {
  const pages = [
    {
      id: "about",
      title: "About Us Page",
      description: "Manage our story, values, and process steps.",
      icon: Globe,
      path: "/admin/pages/about",
      color: "text-green-600",
      bg: "bg-green-50"
    },
    {
      id: "contact",
      title: "Contact Page",
      description: "Update contact info, map, and form settings.",
      icon: Phone,
      path: "/admin/pages/contact",
      color: "text-blue-600",
      bg: "bg-blue-50"
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Pages Management</h2>
          <p className="text-muted-foreground mt-2 text-lg">
            Customize the static pages of your website to keep your customers engaged.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {pages.map((page) => (
            <Card key={page.id} className="group hover:shadow-2xl transition-all duration-300 border-none bg-white rounded-[2rem] overflow-hidden shadow-xl">
              <CardHeader className="pb-4">
                <div className={`w-16 h-16 ${page.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                  <page.icon className={`w-8 h-8 ${page.color}`} />
                </div>
                <CardTitle className="text-2xl font-black text-gray-900">{page.title}</CardTitle>
                <CardDescription className="text-lg font-medium text-gray-500">{page.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 pt-4">
                  <Link href={page.path}>
                    <Button className="bg-gray-900 hover:bg-black text-white px-8 py-6 rounded-2xl font-bold transition-all flex items-center gap-2">
                      Manage Content <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>
                  <Button variant="outline" className="border-2 border-gray-100 hover:border-gray-200 px-8 py-6 rounded-2xl font-bold" asChild>
                    <a href={page.id === 'about' ? '/about' : '/contact'} target="_blank">View Live</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Links Section */}
        <div className="mt-12">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Settings2 className="w-5 h-5 text-gray-400" /> Quick Operations
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/admin/contact-submissions">
              <button className="w-full p-6 bg-white rounded-3xl shadow-sm border-2 border-gray-50 hover:border-green-200 hover:shadow-md transition-all text-left flex items-center gap-4 group">
                <div className="p-3 bg-green-50 rounded-xl group-hover:bg-green-100 transition-colors">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">View Inquiries</p>
                  <p className="text-sm text-gray-500">Check contact form submissions</p>
                </div>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
