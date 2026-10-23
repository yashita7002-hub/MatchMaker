import MessagesClient from './MessagesClient';

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string; project?: string }>;
}) {
  const { conversation, project } = await searchParams;
  return <MessagesClient initialConversationId={conversation || ''} initialProjectId={project || ''} />;
}
