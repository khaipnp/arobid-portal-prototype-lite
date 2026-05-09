"use client";

import {
  Maximize2Icon,
  MessageCircleIcon,
  PlusCircleIcon,
  SearchIcon,
  SendIcon,
  XIcon,
} from "lucide-react";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ExpoDetailExhibitor } from "@/lib/tradexpo/db/platform-data";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

type Message = {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
};

type ChatPartner = {
  id: string;
  name: string;
  company: string;
  avatarUrl?: string;
};

type ConversationData = {
  id: string;
  partner: ChatPartner;
  lastMessage: string;
  unreadCount: number;
  lastActive: string;
};

type Props = {
  exhibitor: ExpoDetailExhibitor; // The current exhibitor the user clicked "Chat Now" on
  onClose: () => void;
};

export function FloatingChat({ exhibitor, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeExhibitor, setActiveExhibitor] = useState<ChatPartner>({
    id: exhibitor.id,
    name: exhibitor.name,
    company: exhibitor.company,
    avatarUrl: exhibitor.avatarUrl,
  });
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [_isLoading, setIsLoading] = useState(true);

  // Map to store messages for each conversation/exhibitor
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});

  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeMessages = messagesMap[activeExhibitor.id] || [];

  // Prefetch the deal room route to speed up redirection
  useEffect(() => {
    router.prefetch("/seller/deal-room");
  }, [router]);

  useEffect(() => {
    setActiveExhibitor({
      id: exhibitor.id,
      name: exhibitor.name,
      company: exhibitor.company,
      avatarUrl: exhibitor.avatarUrl,
    });
  }, [exhibitor]);

  useEffect(() => {
    async function fetchConversations() {
      try {
        const res = await fetch("/api/tradexpo/chat/conversations");
        const payload = await res.json();
        if (payload.data) {
          setConversations(payload.data);

          // If the current exhibitor isn't in the list, add a virtual entry
          const exists = payload.data.some(
            (c: ConversationData) => c.partner?.id === exhibitor.id,
          );
          if (!exists) {
            setMessagesMap((prev) => ({
              ...prev,
              [exhibitor.id]: [
                {
                  id: "welcome-1",
                  senderId: exhibitor.id,
                  text: `Hello! Welcome to ${exhibitor.company}. How can we help you today?`,
                  timestamp: new Date(),
                },
              ],
            }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch conversations", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchConversations();
  }, [exhibitor]);

  useEffect(() => {
    async function fetchMessages() {
      if (!activeExhibitor.id) return;

      // If it's a virtual entry (no real conversation ID yet), we might already have the welcome message
      const conversationId = conversations.find(
        (c) => c.partner?.id === activeExhibitor.id,
      )?.id;

      if (conversationId) {
        try {
          const res = await fetch(
            `/api/deal-room/conversations/${conversationId}/messages`,
          );
          const payload = await res.json();
          if (payload.messages) {
            setMessagesMap((prev) => ({
              ...prev,
              [activeExhibitor.id]: payload.messages.map((m: any) => ({
                id: m.id,
                senderId: m.senderId,
                text: m.content,
                timestamp: new Date(m.sentAt),
              })),
            }));
          }
        } catch (err) {
          console.error("Failed to fetch messages", err);
        }
      }
    }
    fetchMessages();
  }, [activeExhibitor.id, conversations]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeMessages]);

  const filteredConversations = [
    // Include current virtual conversation if not in list
    ...(!conversations.some((c) => c.partner?.id === exhibitor.id)
      ? [
          {
            id: exhibitor.id,
            partner: {
              id: exhibitor.id,
              name: exhibitor.name,
              company: exhibitor.company,
              avatarUrl: exhibitor.avatarUrl,
            },
            lastMessage:
              messagesMap[exhibitor.id]?.[0]?.text || "New conversation",
            unreadCount: 0,
            lastActive: new Date().toISOString(),
          },
        ]
      : []),
    ...conversations,
  ].filter(
    (c) =>
      c.partner?.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.partner?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      senderId: "user-khai",
      text: newMessage,
      timestamp: new Date(),
    };

    setMessagesMap((prev) => ({
      ...prev,
      [activeExhibitor.id]: [...(prev[activeExhibitor.id] || []), userMsg],
    }));
    setNewMessage("");

    // Simulate response
    setTimeout(() => {
      setMessagesMap((prev) => {
        const currentMsgs = prev[activeExhibitor.id] || [];
        return {
          ...prev,
          [activeExhibitor.id]: [
            ...currentMsgs,
            {
              id: (Date.now() + 1).toString(),
              senderId: activeExhibitor.id,
              text: "Our team will review your message and get back to you shortly.",
              timestamp: new Date(),
            },
          ],
        };
      });
    }, 1500);
  };

  return (
    <div
      className={cn(
        "fixed right-20 bottom-0 z-50 flex h-[550px] w-3xl flex-col overflow-hidden rounded-t-3xl border bg-legend shadow-2xl transition-all duration-500 ease-in-out",
      )}
    >
      {/* Header */}
      <div className="flex h-14 w-full items-center justify-between bg-legend px-4 text-primary-foreground">
        <div className="flex select-none items-center gap-3">
          <MessageCircleIcon className="size-5" />
          <span className="font-medium text-lg">Deal Room</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full"
            disabled={isPending}
            onClick={(e) => {
              e.stopPropagation();
              startTransition(() => {
                router.push("/seller/deal-room");
              });
            }}
          >
            {isPending ? <Spinner /> : <Maximize2Icon className="size-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <XIcon className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: Partners List */}
        <aside className="flex w-64 flex-col border-r bg-muted">
          <div className="p-3">
            <InputGroup className="rounded-full">
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search partners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
          </div>
          <ScrollArea className="flex-1">
            <div className="flex flex-col">
              {filteredConversations.map((conv) => {
                const isActive = conv.partner?.id === activeExhibitor.id;
                return (
                  <button
                    key={conv.id}
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-3 border-muted-foreground/10 border-b px-3 py-3 text-left transition-colors hover:bg-white",
                      isActive && "bg-white",
                    )}
                    onClick={() => setActiveExhibitor(conv.partner)}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="size-10 border border-muted/50">
                        <Image
                          src={
                            conv.partner?.avatarUrl ||
                            "/landing/figma-company-logo.png"
                          }
                          alt={conv.partner?.company || "Partner"}
                          width={40}
                          height={40}
                        />
                      </Avatar>
                      <span className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-white bg-green-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="truncate font-semibold text-sm leading-tight">
                          {conv.partner?.name}
                        </span>
                        {conv.unreadCount > 0 && (
                          <Badge className="h-4 min-w-4 rounded-full bg-primary px-1 text-[10px]">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 truncate">
                        {conv.partner?.company}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </aside>

        {/* Main Chat Area */}
        <main className="flex flex-1 flex-col bg-white">
          {/* Thread Header */}
          <div className="flex h-12 items-center justify-between border-b px-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">
                {activeExhibitor.company}
              </span>
              <span className="font-medium text-green-600 text-xs">
                • Online
              </span>
            </div>
            <Button variant="ghost" size="sm" className="h-8 text-xs">
              View Profile
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 bg-white p-4">
            <div className="flex flex-col gap-4">
              {activeMessages.map((msg) => {
                const isOwn = msg.senderId === "user-khai";
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col gap-1",
                      isOwn ? "items-end" : "items-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                        isOwn
                          ? "rounded-tr-none bg-primary text-primary-foreground shadow-sm"
                          : "rounded-tl-none bg-[#f1f3f5] text-foreground",
                      )}
                    >
                      {msg.text}
                    </div>
                    <span className="px-1 text-[9px] text-muted-foreground/60">
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                );
              })}
              <div ref={scrollRef} className="h-0" />
            </div>
          </ScrollArea>

          {/* Input Footer */}
          <div className="border-t p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <InputGroup className="rounded-full">
                <InputGroupAddon>
                  <PlusCircleIcon />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
              </InputGroup>

              <Button
                type="submit"
                size="icon"
                disabled={!newMessage.trim()}
                className="bg-legend shrink-0 rounded-full shadow-lg transition-transform active:scale-95"
              >
                <SendIcon className="size-4" />
              </Button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
