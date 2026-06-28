import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Leaf, Heart, Users, Recycle, Package, MapPin, Calendar, HelpCircle, Mail, Globe, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/admin-layout";

const iconOptions = ["Leaf", "Heart", "Users", "Recycle", "Package", "MapPin", "Calendar", "Star", "Shield", "Truck"];

const IconComponent = ({ name }: { name: string }) => {
  switch (name) {
    case "Leaf": return <Leaf className="w-5 h-5" />;
    case "Heart": return <Heart className="w-5 h-5" />;
    case "Users": return <Users className="w-5 h-5" />;
    case "Recycle": return <Recycle className="w-5 h-5" />;
    case "Package": return <Package className="w-5 h-5" />;
    case "MapPin": return <MapPin className="w-5 h-5" />;
    case "Calendar": return <Calendar className="w-5 h-5" />;
    default: return <Leaf className="w-5 h-5" />;
  }
};

export default function HomepageCMS() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Homepage CMS</h1>
        <p className="text-gray-500">Manage all dynamic content on your landing page</p>
      </div>

      <Tabs defaultValue="ethos" className="w-full">
        <TabsList className="grid w-full grid-cols-6 h-auto">
          <TabsTrigger value="ethos" className="text-xs py-2">Ethos Cards</TabsTrigger>
          <TabsTrigger value="stats" className="text-xs py-2">Stats</TabsTrigger>
          <TabsTrigger value="deals" className="text-xs py-2">Deals</TabsTrigger>
          <TabsTrigger value="faqs" className="text-xs py-2">FAQs</TabsTrigger>
          <TabsTrigger value="newsletter" className="text-xs py-2">Newsletter</TabsTrigger>
          <TabsTrigger value="footer" className="text-xs py-2">Footer</TabsTrigger>
        </TabsList>

        <TabsContent value="ethos"><EthosSection /></TabsContent>
        <TabsContent value="stats"><StatsSection /></TabsContent>
        <TabsContent value="deals"><DealsSection /></TabsContent>
        <TabsContent value="faqs"><FaqsSection /></TabsContent>
        <TabsContent value="newsletter"><NewsletterSection /></TabsContent>
        <TabsContent value="footer"><FooterSection /></TabsContent>
      </Tabs>
      </div>
    </AdminLayout>
  );
}

function EthosSection() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [editingCard, setEditingCard] = useState<any>(null);
  const [formData, setFormData] = useState({ title: "", description: "", icon: "Leaf", displayOrder: 0, isActive: true });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["/api/homepage/ethos"],
    queryFn: async () => {
      const res = await fetch("/api/homepage/ethos", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/homepage/ethos", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/homepage/ethos"] });
      toast({ title: "Success", description: "Card created" });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/homepage/ethos/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/homepage/ethos"] });
      toast({ title: "Success", description: "Card updated" });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/homepage/ethos/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/homepage/ethos"] });
      toast({ title: "Success", description: "Card deleted" });
    },
  });

  const resetForm = () => {
    setFormData({ title: "", description: "", icon: "Leaf", displayOrder: 0, isActive: true });
    setEditingCard(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (card: any) => {
    setEditingCard(card);
    setFormData({
      title: card.title,
      description: card.description,
      icon: card.icon,
      displayOrder: card.displayOrder,
      isActive: card.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCard) {
      updateMutation.mutate({ id: editingCard.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Leaf className="w-5 h-5" /> Ethos Cards</CardTitle>
          <CardDescription>Manage "Our Ethos" section cards</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700"><Plus className="w-4 h-4 mr-2" /> Add Card</Button>
          </DialogTrigger>
          <DialogContent className="bg-white text-gray-900 border-0 shadow-2xl rounded-3xl overflow-hidden p-0 max-w-lg">
            <div className="bg-green-600 p-6 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">{editingCard ? "Edit Ethos Card" : "Add Ethos Card"}</DialogTitle>
              </DialogHeader>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-700">Title</Label>
                <Input 
                  className="bg-gray-50 border-gray-200 focus:bg-white focus:border-green-500 transition-all rounded-xl h-12" 
                  value={formData.title} 
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-700">Description</Label>
                <Textarea 
                  className="bg-gray-50 border-gray-200 focus:bg-white focus:border-green-500 transition-all rounded-xl min-h-[100px]" 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-gray-700">Icon</Label>
                  <Select value={formData.icon} onValueChange={(v) => setFormData({ ...formData, icon: v })}>
                    <SelectTrigger className="bg-gray-50 border-gray-200 rounded-xl h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {iconOptions.map(icon => (
                        <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-gray-700">Display Order</Label>
                  <Input 
                    type="number" 
                    className="bg-gray-50 border-gray-200 focus:bg-white focus:border-green-500 transition-all rounded-xl h-12"
                    value={formData.displayOrder} 
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })} 
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                <Switch checked={formData.isActive} onCheckedChange={(c) => setFormData({ ...formData, isActive: c })} />
                <Label className="font-bold text-gray-700 cursor-pointer">Active on Website</Label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm} className="rounded-xl px-6 h-12">Cancel</Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-green-200 transition-all active:scale-95">
                  {editingCard ? "Update Card" : "Create Card"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-gray-500">Loading...</p>
        ) : cards.length === 0 ? (
          <p className="text-gray-500">No ethos cards yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cards.map((card: any) => (
              <div key={card.id} className={`p-4 border rounded-lg ${card.isActive ? 'bg-white' : 'bg-gray-100 opacity-60'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-lg text-green-600">
                      <IconComponent name={card.icon} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{card.title}</h3>
                      <p className="text-sm text-gray-500">{card.description}</p>
                      <p className="text-xs text-gray-400 mt-1">Order: {card.displayOrder}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(card)}><Pencil className="w-4 h-4" /></Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600" 
                      onClick={() => {
                        setItemToDelete(card.id);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="bg-white border-2 border-red-100 shadow-2xl rounded-3xl p-8">
            <AlertDialogHeader className="items-center text-center space-y-4">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-2">
                <AlertTriangle className="w-10 h-10 text-red-600 animate-pulse" />
              </div>
              <AlertDialogTitle className="text-3xl font-black text-gray-900">Delete Card?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-500 text-lg font-medium">This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-8 gap-4 sm:justify-center">
              <AlertDialogCancel className="h-14 px-8 rounded-2xl border-2 border-gray-100 hover:bg-gray-50 font-bold text-gray-600 transition-all">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => { if (itemToDelete) { deleteMutation.mutate(itemToDelete); setItemToDelete(null); } }}
                className="h-14 px-8 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black shadow-lg transition-all"
              >Confirm Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

function StatsSection() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [editingCounter, setEditingCounter] = useState<any>(null);
  const [formData, setFormData] = useState({ label: "", value: 0, suffix: "+", icon: "Users", displayOrder: 0, isActive: true });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: counters = [], isLoading } = useQuery({
    queryKey: ["/api/homepage/stats"],
    queryFn: async () => {
      const res = await fetch("/api/homepage/stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/homepage/stats", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/homepage/stats"] });
      toast({ title: "Success", description: "Counter created" });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/homepage/stats/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/homepage/stats"] });
      toast({ title: "Success", description: "Counter updated" });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/homepage/stats/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/homepage/stats"] });
      toast({ title: "Success", description: "Counter deleted" });
    },
  });

  const resetForm = () => {
    setFormData({ label: "", value: 0, suffix: "+", icon: "Users", displayOrder: 0, isActive: true });
    setEditingCounter(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (counter: any) => {
    setEditingCounter(counter);
    setFormData({ label: counter.label, value: counter.value, suffix: counter.suffix || "", icon: counter.icon || "Users", displayOrder: counter.displayOrder, isActive: counter.isActive });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCounter) {
      updateMutation.mutate({ id: editingCounter.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Stats Counters</CardTitle>
          <CardDescription>Manage achievement numbers section</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700"><Plus className="w-4 h-4 mr-2" /> Add Counter</Button>
          </DialogTrigger>
          <DialogContent className="bg-white text-gray-900 border-0 shadow-2xl rounded-3xl overflow-hidden p-0 max-w-lg">
            <div className="bg-green-600 p-6 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">{editingCounter ? "Edit Counter" : "Add Stats Counter"}</DialogTitle>
              </DialogHeader>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-700">Label</Label>
                <Input 
                  className="bg-gray-50 border-gray-200 focus:bg-white focus:border-green-500 transition-all rounded-xl h-12"
                  value={formData.label} 
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })} 
                  placeholder="Happy Customers" 
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-gray-700">Value</Label>
                  <Input 
                    type="number" 
                    className="bg-gray-50 border-gray-200 focus:bg-white focus:border-green-500 transition-all rounded-xl h-12"
                    value={formData.value} 
                    onChange={(e) => setFormData({ ...formData, value: parseInt(e.target.value) || 0 })} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-gray-700">Suffix</Label>
                  <Input 
                    className="bg-gray-50 border-gray-200 focus:bg-white focus:border-green-500 transition-all rounded-xl h-12"
                    value={formData.suffix} 
                    onChange={(e) => setFormData({ ...formData, suffix: e.target.value })} 
                    placeholder="+" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-gray-700">Icon</Label>
                  <Select value={formData.icon} onValueChange={(v) => setFormData({ ...formData, icon: v })}>
                    <SelectTrigger className="bg-gray-50 border-gray-200 rounded-xl h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {iconOptions.map(icon => (<SelectItem key={icon} value={icon}>{icon}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-gray-700">Display Order</Label>
                  <Input 
                    type="number" 
                    className="bg-gray-50 border-gray-200 focus:bg-white focus:border-green-500 transition-all rounded-xl h-12"
                    value={formData.displayOrder} 
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })} 
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                <Switch checked={formData.isActive} onCheckedChange={(c) => setFormData({ ...formData, isActive: c })} />
                <Label className="font-bold text-gray-700 cursor-pointer">Active</Label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm} className="rounded-xl px-6 h-12">Cancel</Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-green-200 transition-all active:scale-95">
                  {editingCounter ? "Update Counter" : "Create Counter"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-gray-500">Loading...</p>
        ) : counters.length === 0 ? (
          <p className="text-gray-500">No stats counters yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {counters.map((counter: any) => (
              <div key={counter.id} className={`p-4 border rounded-lg text-center ${counter.isActive ? 'bg-green-50' : 'bg-gray-100 opacity-60'}`}>
                <p className="text-3xl font-bold text-green-600">{counter.value}{counter.suffix}</p>
                <p className="text-sm text-gray-600">{counter.label}</p>
                <div className="flex justify-center gap-1 mt-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(counter)}><Pencil className="w-3 h-3" /></Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-600" 
                    onClick={() => {
                      setItemToDelete(counter.id);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="bg-white border-2 border-red-100 shadow-2xl rounded-3xl p-8">
            <AlertDialogHeader className="items-center text-center space-y-4">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-2">
                <AlertTriangle className="w-10 h-10 text-red-600 animate-pulse" />
              </div>
              <AlertDialogTitle className="text-3xl font-black text-gray-900">Delete Stat?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-500 text-lg font-medium">This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-8 gap-4 sm:justify-center">
              <AlertDialogCancel className="h-14 px-8 rounded-2xl border-2 border-gray-100 hover:bg-gray-50 font-bold text-gray-600 transition-all">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => { if (itemToDelete) { deleteMutation.mutate(itemToDelete); setItemToDelete(null); } }}
                className="h-14 px-8 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black shadow-lg transition-all"
              >Confirm Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

function DealsSection() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [editingDeal, setEditingDeal] = useState<any>(null);
  const [formData, setFormData] = useState({ productId: 0, dealType: "PERCENT", dealValue: 0, badgeText: "", priority: 0, isActive: true });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ["/api/homepage/deals"],
    queryFn: async () => {
      const res = await fetch("/api/homepage/deals", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/homepage/deals", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/homepage/deals"] });
      toast({ title: "Success", description: "Deal created" });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/homepage/deals/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/homepage/deals"] });
      toast({ title: "Success", description: "Deal updated" });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/homepage/deals/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/homepage/deals"] });
      toast({ title: "Success", description: "Deal deleted" });
    },
  });

  const resetForm = () => {
    setFormData({ productId: 0, dealType: "PERCENT", dealValue: 0, badgeText: "", priority: 0, isActive: true });
    setEditingDeal(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (deal: any) => {
    setEditingDeal(deal);
    setFormData({
      productId: deal.productId,
      dealType: deal.dealType,
      dealValue: parseFloat(deal.dealValue),
      badgeText: deal.badgeText || "",
      priority: deal.priority,
      isActive: deal.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDeal) {
      updateMutation.mutate({ id: editingDeal.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Package className="w-5 h-5" /> Product Deals</CardTitle>
          <CardDescription>Manage "Deals of the Month" section</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700"><Plus className="w-4 h-4 mr-2" /> Add Deal</Button>
          </DialogTrigger>
          <DialogContent className="bg-white text-gray-900 border-0 shadow-2xl rounded-3xl overflow-hidden p-0 max-w-lg">
            <div className="bg-green-600 p-6 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">{editingDeal ? "Edit Deal" : "Add Product Deal"}</DialogTitle>
              </DialogHeader>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-700">Product</Label>
                <Select value={String(formData.productId)} onValueChange={(v) => setFormData({ ...formData, productId: parseInt(v) })}>
                  <SelectTrigger className="bg-gray-50 border-gray-200 rounded-xl h-12">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {products.filter((p: any) => p.isActive).map((product: any) => (
                      <SelectItem key={product.id} value={String(product.id)}>{product.name} - ₹{product.price}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-gray-700">Deal Type</Label>
                  <Select value={formData.dealType} onValueChange={(v) => setFormData({ ...formData, dealType: v })}>
                    <SelectTrigger className="bg-gray-50 border-gray-200 rounded-xl h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="PERCENT">Percentage Off</SelectItem>
                      <SelectItem value="FIXED">Fixed Amount Off</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-gray-700">Value ({formData.dealType === "PERCENT" ? "%" : "₹"})</Label>
                  <Input 
                    type="number" 
                    className="bg-gray-50 border-gray-200 focus:bg-white focus:border-green-500 transition-all rounded-xl h-12"
                    value={formData.dealValue} 
                    onChange={(e) => setFormData({ ...formData, dealValue: parseFloat(e.target.value) || 0 })} 
                    required 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-gray-700">Badge Text</Label>
                  <Input 
                    className="bg-gray-50 border-gray-200 focus:bg-white focus:border-green-500 transition-all rounded-xl h-12"
                    value={formData.badgeText} 
                    onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })} 
                    placeholder="25% OFF" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-gray-700">Priority</Label>
                  <Input 
                    type="number" 
                    className="bg-gray-50 border-gray-200 focus:bg-white focus:border-green-500 transition-all rounded-xl h-12"
                    value={formData.priority} 
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })} 
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                <Switch checked={formData.isActive} onCheckedChange={(c) => setFormData({ ...formData, isActive: c })} />
                <Label className="font-bold text-gray-700 cursor-pointer">Active</Label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm} className="rounded-xl px-6 h-12">Cancel</Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-green-200 transition-all active:scale-95">
                  {editingDeal ? "Update Deal" : "Create Deal"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-gray-500">Loading...</p>
        ) : deals.length === 0 ? (
          <p className="text-gray-500">No deals configured. Add a deal to show products in "Deals of the Month".</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deals.map((deal: any) => (
              <div key={deal.id} className={`p-4 border rounded-lg ${deal.isActive ? 'bg-white' : 'bg-gray-100 opacity-60'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{deal.product?.name || `Product #${deal.productId}`}</h3>
                    <p className="text-sm text-green-600 font-medium">
                      {deal.dealType === "PERCENT" ? `${deal.dealValue}% OFF` : `₹${deal.dealValue} OFF`}
                    </p>
                    {deal.badgeText && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">{deal.badgeText}</span>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(deal)}><Pencil className="w-4 h-4" /></Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600" 
                      onClick={() => {
                        setItemToDelete(deal.id);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="bg-white border-2 border-red-100 shadow-2xl rounded-3xl p-8">
            <AlertDialogHeader className="items-center text-center space-y-4">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-2">
                <AlertTriangle className="w-10 h-10 text-red-600 animate-pulse" />
              </div>
              <AlertDialogTitle className="text-3xl font-black text-gray-900">Delete Deal?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-500 text-lg font-medium">This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-8 gap-4 sm:justify-center">
              <AlertDialogCancel className="h-14 px-8 rounded-2xl border-2 border-gray-100 hover:bg-gray-50 font-bold text-gray-600 transition-all">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => { if (itemToDelete) { deleteMutation.mutate(itemToDelete); setItemToDelete(null); } }}
                className="h-14 px-8 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black shadow-lg transition-all"
              >Confirm Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

function FaqsSection() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [editingFaq, setEditingFaq] = useState<any>(null);
  const [formData, setFormData] = useState({ question: "", answer: "", category: "General", displayOrder: 0, isActive: true });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: faqList = [], isLoading } = useQuery({
    queryKey: ["/api/homepage/faqs"],
    queryFn: async () => {
      const res = await fetch("/api/homepage/faqs", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/homepage/faqs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/homepage/faqs"] });
      toast({ title: "Success", description: "FAQ created" });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/homepage/faqs/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/homepage/faqs"] });
      toast({ title: "Success", description: "FAQ updated" });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/homepage/faqs/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/homepage/faqs"] });
      toast({ title: "Success", description: "FAQ deleted" });
    },
  });

  const resetForm = () => {
    setFormData({ question: "", answer: "", category: "General", displayOrder: 0, isActive: true });
    setEditingFaq(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (faq: any) => {
    setEditingFaq(faq);
    setFormData({ question: faq.question, answer: faq.answer, category: faq.category || "General", displayOrder: faq.displayOrder, isActive: faq.isActive });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFaq) {
      updateMutation.mutate({ id: editingFaq.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><HelpCircle className="w-5 h-5" /> FAQs</CardTitle>
          <CardDescription>Manage frequently asked questions</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700"><Plus className="w-4 h-4 mr-2" /> Add FAQ</Button>
          </DialogTrigger>
          <DialogContent className="bg-white text-gray-900 border-0 shadow-2xl rounded-3xl overflow-hidden p-0 max-w-lg">
            <div className="bg-green-600 p-6 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">{editingFaq ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
              </DialogHeader>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-700">Question</Label>
                <Input 
                  className="bg-gray-50 border-gray-200 focus:bg-white focus:border-green-500 transition-all rounded-xl h-12"
                  value={formData.question} 
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-700">Answer</Label>
                <Textarea 
                  className="bg-gray-50 border-gray-200 focus:bg-white focus:border-green-500 transition-all rounded-xl min-h-[100px]"
                  value={formData.answer} 
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })} 
                  rows={4} 
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-gray-700">Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger className="bg-gray-50 border-gray-200 rounded-xl h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {["General", "Products", "Delivery", "Subscription", "Payment", "Support"].map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-gray-700">Display Order</Label>
                  <Input 
                    type="number" 
                    className="bg-gray-50 border-gray-200 focus:bg-white focus:border-green-500 transition-all rounded-xl h-12"
                    value={formData.displayOrder} 
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })} 
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                <Switch checked={formData.isActive} onCheckedChange={(c) => setFormData({ ...formData, isActive: c })} />
                <Label className="font-bold text-gray-700 cursor-pointer">Active</Label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={resetForm} className="rounded-xl px-6 h-12">Cancel</Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-green-200 transition-all active:scale-95">
                  {editingFaq ? "Update FAQ" : "Create FAQ"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-gray-500">Loading...</p>
        ) : faqList.length === 0 ? (
          <p className="text-gray-500">No FAQs yet.</p>
        ) : (
          <div className="space-y-3">
            {faqList.map((faq: any) => (
              <div key={faq.id} className={`p-4 border rounded-lg ${faq.isActive ? 'bg-white' : 'bg-gray-100 opacity-60'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{faq.category}</span>
                      <span className="text-xs text-gray-400">#{faq.displayOrder}</span>
                    </div>
                    <h3 className="font-medium mt-1">{faq.question}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{faq.answer}</p>
                  </div>
                  <div className="flex gap-1 ml-4">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(faq)}><Pencil className="w-4 h-4" /></Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600" 
                      onClick={() => {
                        setItemToDelete(faq.id);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="bg-white border-2 border-red-100 shadow-2xl rounded-3xl p-8">
            <AlertDialogHeader className="items-center text-center space-y-4">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-2">
                <AlertTriangle className="w-10 h-10 text-red-600 animate-pulse" />
              </div>
              <AlertDialogTitle className="text-3xl font-black text-gray-900">Delete FAQ?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-500 text-lg font-medium">This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-8 gap-4 sm:justify-center">
              <AlertDialogCancel className="h-14 px-8 rounded-2xl border-2 border-gray-100 hover:bg-gray-50 font-bold text-gray-600 transition-all">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => { if (itemToDelete) { deleteMutation.mutate(itemToDelete); setItemToDelete(null); } }}
                className="h-14 px-8 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black shadow-lg transition-all"
              >Confirm Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

function NewsletterSection() {
  const [formData, setFormData] = useState({ title: "", subtitle: "", ctaText: "", placeholderText: "", isActive: true });
  const [isInitialized, setIsInitialized] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/homepage/newsletter"],
    queryFn: async () => {
      const res = await fetch("/api/homepage/newsletter", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  if (settings && !isInitialized) {
    setFormData({
      title: settings.title || "",
      subtitle: settings.subtitle || "",
      ctaText: settings.ctaText || "",
      placeholderText: settings.placeholderText || "",
      isActive: settings.isActive ?? true,
    });
    setIsInitialized(true);
  }

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/homepage/newsletter", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/homepage/newsletter"] });
      toast({ title: "Success", description: "Newsletter settings updated" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) return <p className="text-gray-500 mt-4">Loading...</p>;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Mail className="w-5 h-5" /> Newsletter Settings</CardTitle>
        <CardDescription>Configure the newsletter subscription section</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          <div>
            <Label>Title</Label>
            <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
          </div>
          <div>
            <Label>Subtitle</Label>
            <Textarea value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Button Text</Label>
              <Input value={formData.ctaText} onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })} />
            </div>
            <div>
              <Label>Placeholder Text</Label>
              <Input value={formData.placeholderText} onChange={(e) => setFormData({ ...formData, placeholderText: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={formData.isActive} onCheckedChange={(c) => setFormData({ ...formData, isActive: c })} />
            <Label>Show Section</Label>
          </div>
          <Button type="submit" className="bg-green-600 hover:bg-green-700">Save Changes</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function FooterSection() {
  const [formData, setFormData] = useState({
    companyName: "",
    tagline: "",
    description: "",
    phone: "",
    email: "",
    address: "",
    copyrightText: "",
    isActive: true,
    socialLinks: { facebook: "", instagram: "", twitter: "" },
    footerLinks: [] as any[],
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/homepage/footer"],
    queryFn: async () => {
      const res = await fetch("/api/homepage/footer", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  if (settings && !isInitialized) {
    setFormData({
      companyName: settings.companyName || "",
      tagline: settings.tagline || "",
      description: settings.description || "",
      phone: settings.phone || "",
      email: settings.email || "",
      address: settings.address || "",
      copyrightText: settings.copyrightText || "",
      isActive: settings.isActive ?? true,
      socialLinks: (typeof settings.socialLinks === 'string' ? JSON.parse(settings.socialLinks) : settings.socialLinks) || { facebook: "", instagram: "", twitter: "" },
      footerLinks: (typeof settings.footerLinks === 'string' ? JSON.parse(settings.footerLinks) : settings.footerLinks) || [],
    });
    setIsInitialized(true);
  }

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/homepage/footer", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/homepage/footer"] });
      toast({ title: "Success", description: "Footer settings updated" });
    },
  });

  const addSocial = () => {
    setFormData({
      ...formData,
      socialLinks: [...formData.socialLinks, { platform: "facebook", url: "" }]
    });
  };

  const updateSocial = (idx: number, field: string, value: string) => {
    const newSocials = [...formData.socialLinks];
    newSocials[idx] = { ...newSocials[idx], [field]: value };
    setFormData({ ...formData, socialLinks: newSocials });
  };

  const removeSocial = (idx: number) => {
    const newSocials = formData.socialLinks.filter((_, i) => i !== idx);
    setFormData({ ...formData, socialLinks: newSocials });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const addSection = () => {
    setFormData({
      ...formData,
      footerLinks: [...formData.footerLinks, { title: "New Section", links: [] }]
    });
  };

  const updateSectionTitle = (idx: number, title: string) => {
    const newLinks = [...formData.footerLinks];
    newLinks[idx].title = title;
    setFormData({ ...formData, footerLinks: newLinks });
  };

  const removeSection = (idx: number) => {
    const newLinks = formData.footerLinks.filter((_, i) => i !== idx);
    setFormData({ ...formData, footerLinks: newLinks });
  };

  const addLink = (sectionIdx: number) => {
    const newLinks = [...formData.footerLinks];
    newLinks[sectionIdx].links = [...newLinks[sectionIdx].links, { label: "New Link", url: "/" }];
    setFormData({ ...formData, footerLinks: newLinks });
  };

  const updateLink = (sectionIdx: number, linkIdx: number, field: string, value: string) => {
    const newLinks = [...formData.footerLinks];
    newLinks[sectionIdx].links[linkIdx] = { ...newLinks[sectionIdx].links[linkIdx], [field]: value };
    setFormData({ ...formData, footerLinks: newLinks });
  };

  const removeLink = (sectionIdx: number, linkIdx: number) => {
    const newLinks = [...formData.footerLinks];
    newLinks[sectionIdx].links = newLinks[sectionIdx].links.filter((_: any, i: number) => i !== linkIdx);
    setFormData({ ...formData, footerLinks: newLinks });
  };

  if (isLoading) return <p className="text-gray-500 mt-4">Loading...</p>;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5" /> Footer Settings</CardTitle>
        <CardDescription>Configure footer content, social links, and section menus</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4 max-w-xl">
            <h3 className="font-semibold text-lg border-b pb-2">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Company Name</Label>
                <Input value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} />
              </div>
              <div>
                <Label>Tagline</Label>
                <Input value={formData.tagline} onChange={(e) => setFormData({ ...formData, tagline: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>Copyright Text</Label>
              <Input value={formData.copyrightText} onChange={(e) => setFormData({ ...formData, copyrightText: e.target.value })} />
            </div>
          </div>

          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-semibold text-lg">Social Links</h3>
              <Button type="button" variant="outline" size="sm" onClick={addSocial}>
                <Plus className="w-4 h-4 mr-2" /> Add Social
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.isArray(formData.socialLinks) && formData.socialLinks.map((social, idx) => (
                <div key={idx} className="p-3 border rounded-lg bg-gray-50 space-y-3 relative">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="absolute top-1 right-1 h-7 w-7 text-red-500 p-0"
                    onClick={() => removeSocial(idx)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-gray-500">Platform</Label>
                      <select 
                        className="w-full h-8 text-xs border rounded px-2 bg-white"
                        value={social.platform}
                        onChange={(e) => updateSocial(idx, 'platform', e.target.value)}
                      >
                        <option value="facebook">Facebook</option>
                        <option value="instagram">Instagram</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="twitter">Twitter (X)</option>
                        <option value="website">Website</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase font-bold text-gray-500">URL / Link</Label>
                      <Input 
                        placeholder="Link" 
                        value={social.url} 
                        onChange={(e) => updateSocial(idx, 'url', e.target.value)} 
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-semibold text-lg">Footer Link Sections</h3>
              <Button type="button" variant="outline" size="sm" onClick={addSection}>
                <Plus className="w-4 h-4 mr-2" /> Add Section
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {formData.footerLinks.map((section, sIdx) => (
                <div key={sIdx} className="p-4 border rounded-lg bg-gray-50 space-y-4 relative">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    onClick={() => removeSection(sIdx)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  
                  <div>
                    <Label className="text-xs uppercase font-bold text-gray-500">Section Title</Label>
                    <Input 
                      value={section.title} 
                      onChange={(e) => updateSectionTitle(sIdx, e.target.value)} 
                      className="bg-white font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-gray-500">Links</Label>
                      <Button type="button" variant="ghost" size="xs" className="h-6 px-2 text-green-600" onClick={() => addLink(sIdx)}>
                        <Plus className="w-3 h-3 mr-1" /> Add Link
                      </Button>
                    </div>
                    
                    {section.links.map((link: any, lIdx: number) => (
                      <div key={lIdx} className="bg-white p-2 border rounded shadow-sm space-y-2">
                        <div className="flex items-center gap-2">
                          <Input 
                            placeholder="Label" 
                            value={link.label} 
                            onChange={(e) => updateLink(sIdx, lIdx, 'label', e.target.value)} 
                            className="h-8 text-sm"
                          />
                          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 text-gray-400 p-0" onClick={() => removeLink(sIdx, lIdx)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <Input 
                          placeholder="URL (e.g. /shop)" 
                          value={link.url || link.href} 
                          onChange={(e) => updateLink(sIdx, lIdx, 'url', e.target.value)} 
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Switch checked={formData.isActive} onCheckedChange={(c) => setFormData({ ...formData, isActive: c })} />
              <Label>Show Footer Section on Website</Label>
            </div>
            <Button type="submit" className="bg-green-600 hover:bg-green-700 ml-auto px-8" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save All Footer Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
