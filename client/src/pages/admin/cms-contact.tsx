import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/admin-layout";
import { ArrowLeft, Phone, Mail, MapPin, Clock } from "lucide-react";

export default function CMSContactPage() {
  const [, setLocation] = useLocation();
  const [contact, setContact] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const response = await fetch("/api/cms/contact");
        const data = await response.json();
        setContact(data || { title: "Contact Us", subtitle: "", phone: "", email: "", address: "", businessHours: "" });
      } catch (error) {
        console.error("Error fetching contact data:", error);
        toast({ description: "Error loading contact data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchContact();
  }, []);

  const handleSave = async () => {
    if (!contact.title.trim() || !contact.phone.trim()) {
      toast({ description: "Title and phone are required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/cms/contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contact),
      });
      if (response.ok) {
        toast({ description: "✅ Contact info updated successfully" });
      } else {
        toast({ description: "Error updating contact info", variant: "destructive" });
      }
    } catch (error) {
      toast({ description: "Error updating contact info", variant: "destructive" });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8 text-center">
          <div className="inline-block animate-spin">⏳</div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/admin/cms")}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">📞 Contact Information</h1>
            <p className="text-gray-600 text-sm mt-1">Manage contact details and business hours</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b">
                <CardTitle>Contact Settings</CardTitle>
              </CardHeader>
              <CardContent className="pt-8 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Page Title</label>
                  <Input
                    value={contact.title || ""}
                    onChange={(e) => setContact({ ...contact, title: e.target.value })}
                    placeholder="Contact Us"
                    className="text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Subtitle</label>
                  <Input
                    value={contact.subtitle || ""}
                    onChange={(e) => setContact({ ...contact, subtitle: e.target.value })}
                    placeholder="We'd love to hear from you"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">📱 Phone</label>
                    <Input
                      value={contact.phone || ""}
                      onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                      placeholder="+91 XXXXX XXXXX"
                      type="tel"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">📧 Email</label>
                    <Input
                      value={contact.email || ""}
                      onChange={(e) => setContact({ ...contact, email: e.target.value })}
                      placeholder="contact@gauranitai.com"
                      type="email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">📍 Address</label>
                  <Textarea
                    value={contact.address || ""}
                    onChange={(e) => setContact({ ...contact, address: e.target.value })}
                    rows={3}
                    placeholder="Enter full address..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">⏰ Business Hours</label>
                  <Textarea
                    value={contact.businessHours || ""}
                    onChange={(e) => setContact({ ...contact, businessHours: e.target.value })}
                    rows={3}
                    placeholder="Mon-Fri: 9AM-6PM&#10;Sat: 10AM-4PM&#10;Sun: Closed"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white px-6">
                    {saving ? "Saving..." : "💾 Save Changes"}
                  </Button>
                  <Button variant="outline" onClick={() => setLocation("/admin/cms")} className="px-6">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Reference */}
          <div className="space-y-4">
            <Card className="border-0 shadow-lg bg-green-50">
              <CardHeader className="border-b">
                <CardTitle className="text-base">📋 Quick Reference</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4 text-sm">
                <div className="flex gap-3">
                  <Phone className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Phone</p>
                    <p className="text-gray-600 text-xs">Primary contact number</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Mail className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Email</p>
                    <p className="text-gray-600 text-xs">Support email address</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MapPin className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Address</p>
                    <p className="text-gray-600 text-xs">Full office location</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-gray-900">Hours</p>
                    <p className="text-gray-600 text-xs">Operating hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
