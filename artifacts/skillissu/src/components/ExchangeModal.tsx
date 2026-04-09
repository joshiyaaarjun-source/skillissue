import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useCreateExchange, useGetMe } from "@workspace/api-client-react";
import { getGetMeQueryKey } from "@workspace/api-client-react";
import type { ExploreUser } from "@workspace/api-client-react/src/generated/api.schemas";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner: ExploreUser | null;
  matchId: string;
}

export default function ExchangeModal({ isOpen, onClose, partner, matchId }: ExchangeModalProps) {
  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const createExchange = useCreateExchange();
  const queryClient = useQueryClient();

  const [teachSkill, setTeachSkill] = useState<string>("");
  const [learnSkill, setLearnSkill] = useState<string>("");
  const [credits, setCredits] = useState<number[]>([5]);

  if (!partner || !me) return null;

  const handleConfirm = () => {
    if (!teachSkill || !learnSkill) {
      toast.error("Please select skills for the exchange");
      return;
    }

    createExchange.mutate(
      {
        data: {
          matchId,
          teachSkill,
          learnSkill,
          creditsPerSession: credits[0],
        },
      },
      {
        onSuccess: () => {
          toast.success("Exchange proposed!");
          queryClient.invalidateQueries({ queryKey: ["/api/exchange"] });
          queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
          onClose();
        },
        onError: () => {
          toast.error("Failed to create exchange");
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Propose Exchange with {partner.name}</DialogTitle>
          <DialogDescription>
            Set up the terms of your skill exchange session.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label>I will teach</Label>
            <Select value={teachSkill} onValueChange={setTeachSkill}>
              <SelectTrigger>
                <SelectValue placeholder="Select a skill to teach" />
              </SelectTrigger>
              <SelectContent>
                {me.skillsOffered.map((skill) => (
                  <SelectItem key={skill} value={skill}>
                    {skill}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>I want to learn</Label>
            <Select value={learnSkill} onValueChange={setLearnSkill}>
              <SelectTrigger>
                <SelectValue placeholder="Select a skill to learn" />
              </SelectTrigger>
              <SelectContent>
                {partner.skillsOffered.map((skill) => (
                  <SelectItem key={skill} value={skill}>
                    {skill}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between">
              <Label>Credits per session</Label>
              <span className="font-bold text-primary">{credits[0]} C</span>
            </div>
            <Slider
              value={credits}
              onValueChange={setCredits}
              max={20}
              min={1}
              step={1}
              className="py-2"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={createExchange.isPending}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={createExchange.isPending}>
            {createExchange.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Exchange
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
