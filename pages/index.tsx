import { Chat } from "@/components/Chat/Chat";
import { useQueryClient } from "@tanstack/react-query";
import { Footer } from "@/components/Layout/Footer";
import { Navbar } from "@/components/Layout/Navbar";
import { Message, InsertPayload, APIMessage, Role } from "@/types";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { useUser } from "@clerk/clerk-react";
import axios from "axios";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { user, isLoaded } = useUser();
  const [userId, setUserId] = useState("unknown_user");

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
  const replaceCache = (cache: Message[]) => {
    queryClient.setQueryData(["history"], (oldData: Message[] | undefined) => {
      return oldData ? oldData : cache;
    });
  };

  const setMessagesFromReactQuery = (history: APIMessage[]) => {
    console.log(history);
    (queryClient.getQueryData(["history"]) as APIMessage[]) || [];
    setMessages([
      {
        role: "assistant", // TODO, should be system
        content: `Hi there! I'm Chatbot UI, an AI assistant. I can help you with things like answering questions, providing information, and helping with tasks. How can I help you?`,
      },
      ...history
        .map((item) => [
          { role: "user" as Role, content: item.user_query },
          { role: "assistant" as Role, content: item.completion },
        ])
        .flat(),
    ]);
  };

  useEffect(() => {
    if (isLoaded && user) {
      setUserId(user.id);
      // TODO make this configurable; ${window} cannot be evaluated here
      axios
        .get(`http://localhost/api/v1/database/chat-history?user_id=${user.id}`)
        .then((response) => {
          replaceCache(response.data);
          setMessagesFromReactQuery(response.data);
        })
        .catch((error) => console.log(error));
      setMessagesFromReactQuery([]);
    }
  }, [isLoaded, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setMessagesFromReactQuery([]);
  }, []);

  const handleSend = async (message: Message) => {
    setMessages([...messages, message]);
    setLoading(true);

    const eventSource = new EventSource(
      `${window.location.protocol}//${window.location.host}/api/v1/completions?query=${message.content}`,
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
      addItemToCache({ role: "assistant", content: event.data } as Message);
      const payload: InsertPayload = {
        user_id: userId,
        user_query: message.content,
        completion: event.data,
      };
      axios
        .post(
          `${window.location.protocol}//${window.location.host}/api/v1/database/chat-history`,
          payload,
          {
            headers: {
              accept: "application/json",
              "Content-Type": "application/json",
            },
          },
        )
        .then((response) => console.log(response.data))
        .catch((error) => console.log(error));
      eventSource.close();
      setLoading(false);
    });
  };

  const handleReset = () => {
    axios
      .delete(
        `${window.location.protocol}//${window.location.host}/api/v1/database/chat-history/${userId}`,
      )
      .then((response) => console.log(response.data))
      .catch((error) => console.log(error));
    setMessagesFromReactQuery([]);
  };

  if (isLoaded) {
    return (
      <>
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <Head>
            <title>Chatbot UI</title>
            <meta
              name="description"
              content="A simple chatbot starter kit for OpenAI's chat model using Next.js, TypeScript, and Tailwind CSS."
            />

            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            />
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
}
