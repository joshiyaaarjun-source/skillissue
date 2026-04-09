import { useState } from "react";
import { useLocation } from "wouter";
import { useUploadVerificationDoc } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Loader2, UploadCloud } from "lucide-react";

const DOC_TYPES = ["Certificate", "Portfolio Link", "GitHub Profile", "LinkedIn"];

export default function Upload() {
  const [location, setLocation] = useLocation();
  const skill = new URLSearchParams(window.location.search).get("skill") || "";
  
  const uploadDoc = useUploadVerificationDoc();

  const [docType, setDocType] = useState("");
  const [docName, setDocName] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleUpload = () => {
    if (!docType || !docName || !skill) return;
    
    uploadDoc.mutate(
      { data: { skill, docType, docName } },
      {
        onSuccess: () => {
          setIsSuccess(true);
          setTimeout(() => {
            setLocation("/profile");
          }, 2000);
        }
      }
    );
  };

  if (!skill) {
    return <div className="p-4 text-[#ffd9d9] bg-[#4d0011] min-h-[100dvh]">Skill not specified</div>;
  }

  if (isSuccess) {
    return (
      <div className="min-h-[100dvh] bg-[#4d0011] flex flex-col items-center justify-center p-6 text-center text-[#ffd9d9]">
        <CheckCircle2 className="h-24 w-24 text-[#bd7880] mb-6" />
        <h1 className="text-3xl font-bold font-serif italic text-white mb-2">Document submitted for review!</h1>
        <p>Redirecting to profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#4d0011] text-[#ffd9d9] p-6 pb-24">
      <h1 className="text-3xl font-bold font-serif italic mb-2 text-white">Upload Verification Document</h1>
      <p className="text-[#ffd9d9]/70 mb-8">For {skill}</p>

      <div className="space-y-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center border-dashed">
          <UploadCloud className="h-12 w-12 mx-auto text-[#bd7880] mb-4" />
          <p className="font-medium text-white mb-1">Upload a certificate, portfolio, or GitHub profile</p>
          <p className="text-sm text-[#ffd9d9]/60">PNG, JPG, PDF up to 10MB</p>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2 text-[#ffd9d9]/80">Document Type</label>
          <div className="grid grid-cols-2 gap-3">
            {DOC_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setDocType(type)}
                className={`p-3 rounded-xl text-sm font-bold transition-all border ${
                  docType === type 
                    ? "bg-[#bd7880] border-[#bd7880] text-white" 
                    : "bg-transparent border-white/20 text-[#ffd9d9] hover:bg-white/5"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2 text-[#ffd9d9]/80">Document Name / URL</label>
          <Input
            value={docName}
            onChange={e => setDocName(e.target.value)}
            placeholder="e.g. React Advanced Certificate"
            className="bg-white/5 border-white/20 text-white placeholder:text-white/30 h-12 rounded-xl"
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#4d0011]">
        <Button 
          className="w-full h-14 bg-white text-[#4d0011] hover:bg-[#ffd9d9] text-lg font-bold rounded-2xl disabled:opacity-50"
          onClick={handleUpload}
          disabled={!docType || !docName || uploadDoc.isPending}
        >
          {uploadDoc.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Upload"}
        </Button>
      </div>
    </div>
  );
}
