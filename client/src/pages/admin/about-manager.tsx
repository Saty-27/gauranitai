import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Save, 
  Plus, 
  Trash2, 
  MoveUp, 
  MoveDown, 
  Image as ImageIcon,
  Layout,
  BookOpen,
  Heart,
  Settings2,
  CheckCircle2,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";
import ImageUploader from "@/components/admin/image-uploader";

export default function AboutPageManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<any>({
    heroTitle: "",
    heroSubtitle: "",
    heroImageUrl: "",
    heroCtaText: "",
    heroCtaLink: "",
    storyHeading: "",
    storyDescription: "",
    storyImageUrl: "",
    valuesTitle: "",
    values: [],
    processTitle: "",
    processSteps: [],
    ctaHeading: "",
    ctaSubheading: "",
    ctaButtonText: "",
    ctaButtonLink: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/cms/about-us");
      const json = await res.json();
      if (json && Object.keys(json).length > 0) {
        setData({
          ...json,
          values: Array.isArray(json.values) ? json.values : [],
          processSteps: Array.isArray(json.processSteps) ? json.processSteps : []
        });
      }
    } catch (error) {
      toast({ description: "Failed to fetch about us data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/cms/about-us", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast({ title: "Success! 🌿", description: "About page content updated successfully." });
      } else {
        throw new Error();
      }
    } catch (error) {
      toast({ description: "Failed to update content", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addValue = () => {
    setData({
      ...data,
      values: [...data.values, { icon: "Heart", title: "New Value", description: "Description here" }]
    });
  };

  const removeValue = (index: number) => {
    const newValues = [...data.values];
    newValues.splice(index, 1);
    setData({ ...data, values: newValues });
  };

  const updateValue = (index: number, field: string, value: string) => {
    const newValues = [...data.values];
    newValues[index] = { ...newValues[index], [field]: value };
    setData({ ...data, values: newValues });
  };

  const addStep = () => {
    setData({
      ...data,
      processSteps: [...data.processSteps, { icon: "CheckCircle2", title: "New Step", description: "Step description" }]
    });
  };

  const removeStep = (index: number) => {
    const newSteps = [...data.processSteps];
    newSteps.splice(index, 1);
    setData({ ...data, processSteps: newSteps });
  };

  const updateStep = (index: number, field: string, value: string) => {
    const newSteps = [...data.processSteps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setData({ ...data, processSteps: newSteps });
  };

  if (loading) return <AdminLayout><div>Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-12 pb-20">
        <div className="flex items-center justify-between sticky top-4 z-40 bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-lg border border-green-50">
          <div className="flex items-center gap-4">
            <Link href="/admin/pages">
              <Button variant="ghost" className="p-2"><ArrowLeft /></Button>
            </Link>
            <div>
              <h2 className="text-2xl font-black text-gray-900">About Page Manager</h2>
              <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Update story, values & process</p>
            </div>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 rounded-2xl font-black shadow-lg transition-all"
          >
            {saving ? "Saving..." : <><Save className="w-5 h-5 mr-2" /> Save All Changes</>}
          </Button>
        </div>

        {/* Section 1: Hero */}
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-green-50/50 p-10 border-b border-green-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-600 text-white rounded-xl shadow-lg"><Layout className="w-6 h-6" /></div>
              <CardTitle className="text-2xl font-black text-gray-900 uppercase tracking-tight">Section 1: Hero Section</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Main Title</label>
                <Input 
                  value={data.heroTitle} 
                  onChange={(e) => setData({...data, heroTitle: e.target.value})}
                  className="h-14 px-6 rounded-xl border-gray-200 font-bold text-lg"
                  placeholder="Ex: Our Story"
                />
              </div>
              <ImageUploader 
                label="Hero Background Image" 
                value={data.heroImageUrl} 
                onChange={(url) => setData({...data, heroImageUrl: url})} 
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Hero Subtitle</label>
              <Textarea 
                value={data.heroSubtitle} 
                onChange={(e) => setData({...data, heroSubtitle: e.target.value})}
                className="min-h-[100px] p-6 rounded-xl border-gray-200 font-bold"
                placeholder="Brief introduction..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">CTA Button Text</label>
                <Input 
                  value={data.heroCtaText} 
                  onChange={(e) => setData({...data, heroCtaText: e.target.value})}
                  className="h-14 px-6 rounded-xl border-gray-200 font-bold"
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">CTA Button Link</label>
                <Input 
                  value={data.heroCtaLink} 
                  onChange={(e) => setData({...data, heroCtaLink: e.target.value})}
                  className="h-14 px-6 rounded-xl border-gray-200 font-bold"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Story */}
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-blue-50/50 p-10 border-b border-blue-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg"><BookOpen className="w-6 h-6" /></div>
              <CardTitle className="text-2xl font-black text-gray-900 uppercase tracking-tight">Section 2: Company Story</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Story Heading</label>
                <Input 
                  value={data.storyHeading} 
                  onChange={(e) => setData({...data, storyHeading: e.target.value})}
                  className="h-14 px-6 rounded-xl border-gray-200 font-bold text-lg"
                />
              </div>
              <ImageUploader 
                label="Side Image" 
                value={data.storyImageUrl} 
                onChange={(url) => setData({...data, storyImageUrl: url})} 
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Story Description (Rich Text/Content)</label>
              <Textarea 
                value={data.storyDescription} 
                onChange={(e) => setData({...data, storyDescription: e.target.value})}
                className="min-h-[250px] p-6 rounded-xl border-gray-200 font-bold leading-relaxed"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Values */}
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-orange-50/50 p-10 border-b border-orange-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500 text-white rounded-xl shadow-lg"><Heart className="w-6 h-6" /></div>
              <CardTitle className="text-2xl font-black text-gray-900 uppercase tracking-tight">Section 3: Our Core Values</CardTitle>
            </div>
            <Button onClick={addValue} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold gap-2 shadow-md">
              <Plus className="w-4 h-4" /> Add Value
            </Button>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
            <div className="space-y-3 mb-8 pb-8 border-b border-gray-100">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Values Section Title</label>
              <Input 
                value={data.valuesTitle} 
                onChange={(e) => setData({...data, valuesTitle: e.target.value})}
                className="h-14 px-6 rounded-xl border-gray-200 font-bold text-lg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {data.values.map((val: any, idx: number) => (
                <div key={idx} className="p-8 bg-gray-50 rounded-3xl border border-gray-100 relative group">
                  <button 
                    onClick={() => removeValue(idx)}
                    className="absolute -top-3 -right-3 w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Icon Name</label>
                        <Input value={val.icon} onChange={(e) => updateValue(idx, "icon", e.target.value)} className="rounded-xl border-gray-200 font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Title</label>
                        <Input value={val.title} onChange={(e) => updateValue(idx, "title", e.target.value)} className="rounded-xl border-gray-200 font-bold" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</label>
                      <Textarea value={val.description} onChange={(e) => updateValue(idx, "description", e.target.value)} className="rounded-xl border-gray-200 font-bold" rows={3} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Process */}
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-purple-50/50 p-10 border-b border-purple-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-600 text-white rounded-xl shadow-lg"><Settings2 className="w-6 h-6" /></div>
              <CardTitle className="text-2xl font-black text-gray-900 uppercase tracking-tight">Section 4: How It Works</CardTitle>
            </div>
            <Button onClick={addStep} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold gap-2 shadow-md">
              <Plus className="w-4 h-4" /> Add Step
            </Button>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
            <div className="space-y-3 mb-8 pb-8 border-b border-gray-100">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Process Section Title</label>
              <Input 
                value={data.processTitle} 
                onChange={(e) => setData({...data, processTitle: e.target.value})}
                className="h-14 px-6 rounded-xl border-gray-200 font-bold text-lg"
              />
            </div>

            <div className="space-y-6">
              {data.processSteps.map((step: any, idx: number) => (
                <div key={idx} className="p-8 bg-gray-50 rounded-3xl border border-gray-100 flex gap-8 items-start group">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-black text-purple-600 shrink-0 shadow-sm border border-purple-100">
                    {idx + 1}
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Icon Name</label>
                      <Input value={step.icon} onChange={(e) => updateStep(idx, "icon", e.target.value)} className="rounded-xl border-gray-200 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Step Title</label>
                      <Input value={step.title} onChange={(e) => updateStep(idx, "title", e.target.value)} className="rounded-xl border-gray-200 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Step Description</label>
                      <Textarea value={step.description} onChange={(e) => updateStep(idx, "description", e.target.value)} className="rounded-xl border-gray-200 font-bold" rows={2} />
                    </div>
                  </div>
                  <button 
                    onClick={() => removeStep(idx)}
                    className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Section 5: CTA */}
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-red-50/50 p-10 border-b border-red-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500 text-white rounded-xl shadow-lg"><CheckCircle2 className="w-6 h-6" /></div>
              <CardTitle className="text-2xl font-black text-gray-900 uppercase tracking-tight">Section 5: Final Call to Action</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">CTA Heading</label>
              <Input 
                value={data.ctaHeading} 
                onChange={(e) => setData({...data, ctaHeading: e.target.value})}
                className="h-14 px-6 rounded-xl border-gray-200 font-bold text-lg"
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">CTA Subheading</label>
              <Textarea 
                value={data.ctaSubheading} 
                onChange={(e) => setData({...data, ctaSubheading: e.target.value})}
                className="h-24 p-6 rounded-xl border-gray-200 font-bold"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Button Text</label>
                <Input value={data.ctaButtonText} onChange={(e) => setData({...data, ctaButtonText: e.target.value})} className="h-14 rounded-xl border-gray-200 font-bold" />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Button Link</label>
                <Input value={data.ctaButtonLink} onChange={(e) => setData({...data, ctaButtonLink: e.target.value})} className="h-14 rounded-xl border-gray-200 font-bold" />
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </AdminLayout>
  );
}
