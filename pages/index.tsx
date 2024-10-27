import { Chat } from "@/components/Chat/Chat";
import { useQueryClient } from "@tanstack/react-query";
import { Footer } from "@/components/Layout/Footer";
import { Navbar } from "@/components/Layout/Navbar";
import { Message } from "@/types";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";

export default function Home() {
  // TODO implement fetching of persisted messages from api per uid
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const queryClient = useQueryClient();
  const addItemToCache = (newItem: Message) => {
    queryClient.setQueryData(["history"], (oldData: Message[] | undefined) => {
      return [...(oldData || []), newItem];
    });
  };

  const handleSend = async (message: Message) => {
    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    setLoading(true);

    const eventSource = new EventSource(
      `http://${window.location.host}/api/v1/streaming?query=${message.content}`,
    );

    eventSource.addEventListener("on_chat_model_stream", function (event) {
      const chunkValue = event.data;
      setMessages((messages) => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === "assistant") {
          const updatedMessage = {
            ...lastMessage,
            content: lastMessage.content + chunkValue,
          };
          return [...messages.slice(0, -1), updatedMessage];
        } else {
          return [
            ...messages,
            {
              role: "assistant",
              content: chunkValue,
            },
          ];
        }
      });
    });

    eventSource.addEventListener("on_chat_model_end", function (event) {
      addItemToCache(message);
      // NOTE history is store on client side, but api not yet implemented history
      addItemToCache({ role: "assistant", content: event.data } as Message);
      eventSource.close();
      setLoading(false);
    });
  };

  const handleReset = () => {
    setMessages([
      {
        role: "assistant", // TODO, should be system
        content: `Hi there! I'm Chatbot UI, an AI assistant. I can help you with things like answering questions, providing information, and helping with tasks. How can I help you?`,
      },
    ]);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setMessages([
      {
        role: "assistant", // TODO, should be system
        content: `Hi there! I'm Chatbot UI, an AI assistant. I can help you with things like answering questions, providing information, and helping with tasks. How can I help you?`,
      },
    ]);
  }, []);

  return (
    <>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
        <Head>
          <title>Chatbot UI</title>
          <meta
            name="description"
            content="A simple chatbot starter kit for OpenAI's chat model using Next.js, TypeScript, and Tailwind CSS."
          />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div className="flex flex-col h-screen">
          <Navbar />

          <div className="flex-1 overflow-auto sm:px-10 pb-4 sm:pb-10">
            <div className="max-w-[800px] mx-auto mt-4 sm:mt-12">
              <Chat
                messages={messages}
                loading={loading}
                onSend={handleSend}
                onReset={handleReset}
              />
              <div ref={messagesEndRef} />
            </div>
          </div>
          <Footer />
        </div>
      </SignedIn>
    </>
  );
}
