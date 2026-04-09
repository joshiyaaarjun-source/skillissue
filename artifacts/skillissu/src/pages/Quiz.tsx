import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGenerateQuiz, useSubmitQuiz } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight } from "lucide-react";
import type { Quiz as QuizType, QuizQuestion } from "@workspace/api-client-react";

export default function Quiz() {
  const [location, setLocation] = useLocation();
  const skill = new URLSearchParams(window.location.search).get("skill") || "";
  
  const generateQuiz = useGenerateQuiz();
  const submitQuiz = useSubmitQuiz();

  const [quiz, setQuiz] = useState<QuizType | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<{ passed: boolean; score: number } | null>(null);

  useEffect(() => {
    if (skill && !quiz && !generateQuiz.isPending) {
      generateQuiz.mutate(
        { data: { skill } },
        {
          onSuccess: (data) => {
            setQuiz(data);
            setAnswers(new Array(data.questions.length).fill(-1));
          }
        }
      );
    }
  }, [skill]);

  const handleSelectAnswer = (qIndex: number, optIndex: number) => {
    setAnswers(prev => {
      const next = [...prev];
      next[qIndex] = optIndex;
      return next;
    });
  };

  const handleSubmit = () => {
    if (!quiz) return;
    submitQuiz.mutate(
      { data: { skill, answers, questions: quiz.questions } },
      {
        onSuccess: (data) => {
          setResult({ passed: data.passed, score: data.score });
        }
      }
    );
  };

  if (!skill) {
    return <div className="p-4 text-[#ffd9d9] bg-[#4d0011] min-h-[100dvh]">Skill not specified</div>;
  }

  if (result) {
    return (
      <div className={`min-h-[100dvh] flex flex-col items-center justify-center p-6 text-white ${result.passed ? 'bg-[#102B1F]' : 'bg-[#4d0011]'}`}>
        <h1 className="text-4xl font-bold font-serif italic mb-4 text-center">
          {result.passed ? "Skill Verified!" : "Keep Practicing"}
        </h1>
        <p className="text-xl mb-8">You got {result.score}/3 correct.</p>
        
        {result.passed ? (
          <Button 
            className="w-full max-w-sm h-14 bg-white text-[#102B1F] hover:bg-gray-200 text-lg font-bold rounded-2xl"
            onClick={() => setLocation(`/upload?skill=${encodeURIComponent(skill)}`)}
          >
            Upload Document <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        ) : (
          <div className="flex flex-col gap-4 w-full max-w-sm">
            <Button 
              className="w-full h-14 bg-white text-[#4d0011] hover:bg-[#ffd9d9] text-lg font-bold rounded-2xl"
              onClick={() => {
                setResult(null);
                setQuiz(null);
              }}
            >
              Try Again
            </Button>
            <Button 
              variant="outline"
              className="w-full h-14 border-white text-white hover:bg-white/10 text-lg font-bold rounded-2xl"
              onClick={() => setLocation("/profile")}
            >
              Back to Profile
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (!quiz || generateQuiz.isPending) {
    return (
      <div className="min-h-[100dvh] bg-[#4d0011] flex flex-col items-center justify-center text-[#ffd9d9] p-6">
        <Loader2 className="h-12 w-12 animate-spin mb-4 text-[#bd7880]" />
        <h2 className="text-2xl font-bold font-serif italic text-center">Generating quiz for {skill}...</h2>
      </div>
    );
  }

  const isAllAnswered = answers.every(a => a !== -1);

  return (
    <div className="min-h-[100dvh] bg-[#4d0011] text-[#ffd9d9] p-6 pb-24">
      <h1 className="text-3xl font-bold font-serif italic mb-2 text-white">Skill Quiz: {skill}</h1>
      <p className="text-[#ffd9d9]/70 mb-8">Answer all questions to verify your skill.</p>
      
      <div className="space-y-8">
        {quiz.questions.map((q, qIndex) => (
          <div key={qIndex} className="bg-white/5 border border-white/10 p-5 rounded-2xl">
            <h3 className="text-lg font-bold mb-4 text-white">{qIndex + 1}. {q.question}</h3>
            <div className="space-y-3">
              {q.options.map((opt, optIndex) => {
                const isSelected = answers[qIndex] === optIndex;
                return (
                  <button
                    key={optIndex}
                    onClick={() => handleSelectAnswer(qIndex, optIndex)}
                    className={`w-full p-4 rounded-xl text-left font-medium transition-all ${
                      isSelected 
                        ? "bg-[#bd7880] text-white border-2 border-[#bd7880]" 
                        : "bg-white/5 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#4d0011] border-t border-white/10">
        <Button 
          className="w-full h-14 bg-white text-[#4d0011] hover:bg-[#ffd9d9] text-lg font-bold rounded-2xl disabled:opacity-50"
          onClick={handleSubmit}
          disabled={!isAllAnswered || submitQuiz.isPending}
        >
          {submitQuiz.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Submit Answers"}
        </Button>
      </div>
    </div>
  );
}
