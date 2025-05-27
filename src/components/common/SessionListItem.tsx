import { format } from 'date-fns';

interface Props {
  session: { id: string; name: string | null; description: string | null; lastUpdated: string };
  onSelect: (id: string) => void;
}

export default function SessionListItem({ session, onSelect }: Props) {
  return (
    <li
      className="px-3 py-2 rounded-md cursor-pointer hover:bg-muted"
      onClick={() => onSelect(session.id)}
    >
      <div className="flex flex-col overflow-hidden">
        <span className="truncate font-medium">{session.name || 'New chat'}</span>
        <span className="text-xs text-muted-foreground truncate">
          {session.description || ''} · {format(new Date(session.lastUpdated), 'yyyy-MM-dd')}
        </span>
      </div>
    </li>
  );
}
