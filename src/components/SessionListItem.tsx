import { useNavigate } from 'react-router-dom';

interface Props {
  session: { id: string; title: string; description: string | null; createdAt: string };
}

export default function SessionListItem({ session }: Props) {
  const navigate = useNavigate();
  return (
    <li
      className="p-3 rounded-md border cursor-pointer hover:bg-muted"
      onClick={() => navigate(`/sessions/${session.id}`)}
    >
      <p className="font-medium truncate">{session.title}</p>
      <p className="text-xs text-muted-foreground truncate">
        {session.description ?? ''} · {session.createdAt.slice(0,10)}
      </p>
    </li>
  );
}
