import { useState } from "react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { EyeOff, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { invokeWithAuth } from "@/lib/invokeWithAuth";
import { useChat } from "@/contexts/ChatContext";

interface Props {
  session: { id: string; title: string; lastUpdated?: number | null; sessionSummary?: string };
  onSelect: (id: string) => void;
}

export default function ChatSessionRow({ session, onSelect }: Props) {
  const [show, setShow] = useState(false);
  const [hiding, setHiding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const toggle = () => setShow((v) => !v);
  const { hideSession, removeSessionLocal } = useChat();
  const { isAdult } = useFeatureAccess();

  const hide = async () => {
    setHiding(true);
    const { error } = await invokeWithAuth("hideSession", { id: session.id });
    if (error) {
      toast({
        title: "Failed to hide chat",
        description: error.message,
        variant: "destructive",
      });
    } else {
      hideSession(session.id);
      toast({ title: "Chat hidden" });
    }
    setHiding(false);
  };

  const remove = async () => {
    setDeleting(true);

    // Optimistically remove the session so the row disappears immediately
    removeSessionLocal(session.id);

    const { error } = await invokeWithAuth("deleteSession", { id: session.id });
    if (error) {
      toast({
        title: "Failed to delete chat",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Chat deleted" });
    }
    setDeleting(false);
  };

  return (
    <li
      className="relative flex items-center px-3 py-2 rounded-md cursor-pointer hover:bg-muted group"
      onClick={() => onSelect(session.id)}
      onTouchStart={toggle}
    >
      <div className="flex flex-col flex-1 overflow-hidden">
        <span className="truncate font-bold">{session.title}</span>
        {session.lastUpdated && (
          <span className="text-xs text-muted-foreground">
            {new Date(session.lastUpdated).toLocaleDateString()}
          </span>
        )}
        {isAdult && session.sessionSummary && (
          <span className="text-xs text-muted-foreground truncate">
            {session.sessionSummary}
          </span>
        )}
      </div>

      <div
        className={`absolute right-1 top-1 flex gap-2 transition-opacity duration-200 pointer-events-none opacity-0 group-hover:opacity-100 focus-within:opacity-100 ${show ? "opacity-100 pointer-events-auto" : ""}`}
      >
        <button
          aria-label="Hide session"
          onClick={(e) => {
            e.stopPropagation();
            hide();
          }}
          disabled={hiding}
          className="p-1 rounded hover:bg-muted pointer-events-auto"
        >
          <EyeOff size={16} />
        </button>
        <button
          aria-label="Delete session"
          onClick={(e) => {
            e.stopPropagation();
            remove();
          }}
          disabled={deleting}
          className="p-1 rounded hover:bg-destructive/20 pointer-events-auto"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </li>
  );
}
