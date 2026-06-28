import { useState, useEffect } from "react";
import MainPageLayout from "@/components/layout/main-page-layout";

export default function TermsPage() {
  const [terms, setTerms] = useState<any>(null);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const response = await fetch("/api/cms/terms-of-service/public");
        const data = await response.json();
        setTerms(data);
      } catch (error) {
        console.error("Error fetching terms data:", error);
      }
    };
    fetchTerms();
  }, []);

  if (!terms)
    return (
      <MainPageLayout>
        <div className="flex items-center justify-center min-h-96">
          <span className="text-4xl">⏳</span>
        </div>
      </MainPageLayout>
    );

  return (
    <MainPageLayout>
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-16 lg:py-24">
          <div className="text-center mb-12">
            <h1 className="text-5xl lg:text-6xl font-bold text-green-900 mb-4">
              {terms.title || "Terms of Service"}
            </h1>
            <p className="text-gray-600 text-sm">
              Last Updated: {terms.lastUpdated ? new Date(terms.lastUpdated).toLocaleDateString() : ""}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12 mb-8">
            <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
              {terms.content}
            </p>
          </div>

          {terms.sections && (
            <div className="space-y-6">
              {(Array.isArray(terms.sections) ? terms.sections : JSON.parse(terms.sections || "[]")).map((section: any, idx: number) => (
                <div key={idx} className="bg-white rounded-xl shadow p-8 border-l-4 border-green-500">
                  <h2 className="text-2xl font-bold text-green-900 mb-4">{section.title}</h2>
                  <p className="text-gray-700 leading-relaxed">{section.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainPageLayout>
  );
}
