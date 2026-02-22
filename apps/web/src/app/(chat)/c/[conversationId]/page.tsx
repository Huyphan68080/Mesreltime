import { ChatClient } from "@/components/chat/ChatClient";

interface Props {
  params: {
    conversationId: string;
  };
}

export default async function ConversationPage({ params }: Props) {
  return (
    <main className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-5xl">
        <ChatClient conversationId={params.conversationId} />
      </div>
    </main>
  );
}