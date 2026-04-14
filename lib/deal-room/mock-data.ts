import type { ChatUser, Conversation, Message } from "@/lib/deal-room/types"

const now = new Date()

function isoOffset(minutes: number): string {
  return new Date(now.getTime() - minutes * 60 * 1000).toISOString()
}

// ─── Current user ─────────────────────────────────────────────────────────────

export const CURRENT_USER_ID = "user-current"

// ─── Users ────────────────────────────────────────────────────────────────────

export const mockChatUsers: ChatUser[] = [
  {
    id: "user-current",
    name: "Khai Pham",
    email: "khaipham@arobid.com",
    company: "Arobid",
    jobTitle: "Co-founder & CEO",
    phone: "+84 90 123 4567",
    website: "arobid.com",
    location: "Ho Chi Minh City, Vietnam",
    isActive: true,
  },
  {
    id: "user-nguyen",
    name: "Nguyen Van A",
    email: "nguyen.van.a@viettech.vn",
    company: "VietTech Solutions",
    jobTitle: "Head of Business Development",
    phone: "+84 91 234 5678",
    website: "viettech.vn",
    location: "Hanoi, Vietnam",
    isActive: true,
  },
  {
    id: "user-nina",
    name: "Nina Tran",
    email: "admin@medworld.asia",
    company: "MedWorld Asia",
    jobTitle: "Expo Organizer & Partnership Lead",
    phone: "+65 8123 4567",
    website: "medworld.asia",
    location: "Singapore",
    isActive: true,
  },
  {
    id: "user-minh",
    name: "Minh Do",
    email: "contact@foodfarminc.com",
    company: "Food Farm Inc",
    jobTitle: "Chief Commercial Officer",
    phone: "+84 93 345 6789",
    website: "foodfarminc.com",
    location: "Can Tho, Vietnam",
    isActive: true,
  },
  {
    id: "user-sarah",
    name: "Sarah Chen",
    email: "press@fashionforward.vn",
    company: "AutoDrive SEA",
    jobTitle: "Regional Sales Director",
    phone: "+84 94 456 7890",
    location: "Ho Chi Minh City, Vietnam",
    isActive: true,
  },
  {
    id: "user-tommy",
    name: "Tommy Nguyen",
    email: "dev@cloudconnect.io",
    company: "Cloud Connect Vietnam",
    jobTitle: "CTO",
    phone: "+84 98 567 8901",
    website: "cloudconnect.io",
    location: "Da Nang, Vietnam",
    isActive: true,
  },
]

// ─── Conversations ─────────────────────────────────────────────────────────────

export const mockConversations: Conversation[] = [
  {
    id: "conv-001",
    type: "direct",
    members: [
      { userId: "user-current", joinedAt: isoOffset(120), isArchived: false },
      { userId: "user-nguyen", joinedAt: isoOffset(120), isArchived: false },
    ],
    createdAt: isoOffset(120),
    isReadOnly: false,
  },
  {
    id: "conv-002",
    type: "direct",
    members: [
      { userId: "user-current", joinedAt: isoOffset(200), isArchived: false },
      { userId: "user-nina", joinedAt: isoOffset(200), isArchived: false },
    ],
    createdAt: isoOffset(200),
    isReadOnly: false,
  },
  {
    id: "conv-003",
    type: "direct",
    members: [
      { userId: "user-current", joinedAt: isoOffset(1500), isArchived: false },
      { userId: "user-minh", joinedAt: isoOffset(1500), isArchived: false },
    ],
    createdAt: isoOffset(1500),
    isReadOnly: false,
  },
  {
    // Food & Farm Global Fair Deal Room (expo-003, Live)
    id: "conv-004",
    type: "expo_group",
    name: "Food & Farm Global Fair — Deal Room",
    contextType: "expo",
    contextId: "expo-003",
    members: [
      { userId: "user-current", joinedAt: isoOffset(3000), isArchived: false },
      { userId: "user-minh", joinedAt: isoOffset(3000), isArchived: false },
      { userId: "user-sarah", joinedAt: isoOffset(2900), isArchived: false },
      { userId: "user-tommy", joinedAt: isoOffset(2800), isArchived: false },
    ],
    createdAt: isoOffset(4000),
    isReadOnly: false,
  },
  {
    // AI & Robotics Showcase Deal Room (expo-009, Live)
    id: "conv-005",
    type: "expo_group",
    name: "AI & Robotics Showcase — Deal Room",
    contextType: "expo",
    contextId: "expo-009",
    members: [
      { userId: "user-current", joinedAt: isoOffset(5000), isArchived: false },
      { userId: "user-nguyen", joinedAt: isoOffset(4800), isArchived: false },
    ],
    createdAt: isoOffset(5500),
    isReadOnly: false,
  },
]

// ─── Messages ─────────────────────────────────────────────────────────────────

export const mockMessages: Record<string, Message[]> = {
  "conv-001": [
    {
      id: "msg-001-1",
      conversationId: "conv-001",
      senderId: "user-nguyen",
      content:
        "Hi Khai! I heard you're interested in a supply partnership with Food Farm Inc?",
      attachments: [],
      status: "read",
      sentAt: isoOffset(118),
      isDeleted: false,
      isSystemMessage: false,
    },
    {
      id: "msg-001-2",
      conversationId: "conv-001",
      senderId: "user-current",
      content:
        "Yes! I visited your booth at the expo earlier. Very impressed with your organic certification process and the range of products.",
      attachments: [],
      status: "read",
      sentAt: isoOffset(115),
      isDeleted: false,
      isSystemMessage: false,
    },
    {
      id: "msg-001-3",
      conversationId: "conv-001",
      senderId: "user-nguyen",
      content:
        "Thank you! We've been certified since 2019. Here's our latest product catalog with bulk pricing.",
      attachments: [
        {
          id: "att-001-1",
          fileName: "FoodFarmInc_Catalog_2025.pdf",
          fileUrl: "#",
          fileSize: 2_450_000,
          fileType: "pdf",
        },
      ],
      status: "read",
      sentAt: isoOffset(110),
      isDeleted: false,
      isSystemMessage: false,
    },
    {
      id: "msg-001-4",
      conversationId: "conv-001",
      senderId: "user-current",
      content:
        "Perfect, I'll review the catalog and share it with our procurement team. Should have feedback by end of week.",
      attachments: [],
      status: "read",
      sentAt: isoOffset(105),
      isDeleted: false,
      isSystemMessage: false,
    },
    {
      id: "msg-001-5",
      conversationId: "conv-001",
      senderId: "user-nguyen",
      content:
        "Sounds great! Feel free to reach out if you have any questions about minimum order quantities or logistics.",
      attachments: [],
      status: "read",
      sentAt: isoOffset(100),
      isDeleted: false,
      isSystemMessage: false,
    },
  ],

  "conv-002": [
    {
      id: "msg-002-1",
      conversationId: "conv-002",
      senderId: "user-nina",
      content:
        "Hi Khai! I'm the organizer for MedWorld Asia Expo coming up in 60 days. We'd love to have Arobid as an exhibitor — your AI solutions would be a great fit for our healthcare audience.",
      attachments: [],
      status: "read",
      sentAt: isoOffset(195),
      isDeleted: false,
      isSystemMessage: false,
    },
    {
      id: "msg-002-2",
      conversationId: "conv-002",
      senderId: "user-current",
      content:
        "Hi Nina! That sounds very interesting. Can you share more details about the booth tiers and what's included?",
      attachments: [],
      status: "read",
      sentAt: isoOffset(180),
      isDeleted: false,
      isSystemMessage: false,
    },
    {
      id: "msg-002-3",
      conversationId: "conv-002",
      senderId: "user-nina",
      content:
        "Of course! We have three tiers:\n• Basic ($2,000) — 9m² booth, 2 staff passes, listing in expo catalog\n• Pro ($5,000) — 18m² corner booth, 5 staff passes, featured listing + speaking slot\n• Premium ($10,000) — 36m² island booth, unlimited passes, keynote slot, logo on all materials",
      attachments: [],
      status: "read",
      sentAt: isoOffset(160),
      isDeleted: false,
      isSystemMessage: false,
    },
    {
      id: "msg-002-4",
      conversationId: "conv-002",
      senderId: "user-nina",
      content:
        "Also — we have an early-bird discount of 15% off for registrations confirmed before end of this month!",
      attachments: [],
      status: "delivered",
      sentAt: isoOffset(45),
      isDeleted: false,
      isSystemMessage: false,
    },
    {
      id: "msg-002-5",
      conversationId: "conv-002",
      senderId: "user-nina",
      content:
        "Would love to jump on a quick call this week to walk you through the floor plan and available slots. Are you free Thursday afternoon?",
      attachments: [],
      status: "delivered",
      sentAt: isoOffset(30),
      isDeleted: false,
      isSystemMessage: false,
    },
  ],

  "conv-003": [
    {
      id: "msg-003-1",
      conversationId: "conv-003",
      senderId: "user-current",
      content:
        "Hi Minh, I wanted to follow up on the Agricultural IoT data partnership we discussed briefly at the expo last month.",
      attachments: [],
      status: "read",
      sentAt: isoOffset(1450),
      isDeleted: false,
      isSystemMessage: false,
    },
    {
      id: "msg-003-2",
      conversationId: "conv-003",
      senderId: "user-minh",
      content:
        "Hello Khai! Great to hear from you. Yes, I remember that conversation. What specifically did you have in mind?",
      attachments: [],
      status: "read",
      sentAt: isoOffset(1430),
      isDeleted: false,
      isSystemMessage: false,
    },
    {
      id: "msg-003-3",
      conversationId: "conv-003",
      senderId: "user-current",
      content:
        "We're looking to integrate our Arobid AI platform with field sensor data from your farms to provide predictive yield analytics. The data partnership would be mutually beneficial — you get AI insights, we expand our dataset.",
      attachments: [],
      status: "read",
      sentAt: isoOffset(1420),
      isDeleted: false,
      isSystemMessage: false,
    },
    {
      id: "msg-003-4",
      conversationId: "conv-003",
      senderId: "user-minh",
      content:
        "That's an interesting proposition. Our CTO would need to evaluate the technical integration. Can you share a technical brief or API documentation?",
      attachments: [],
      status: "read",
      sentAt: isoOffset(1400),
      isDeleted: false,
      isSystemMessage: false,
    },
  ],

  "conv-004": [
    {
      id: "msg-004-sys-1",
      conversationId: "conv-004",
      senderId: "system",
      content: "Khai Pham joined the Deal Room.",
      attachments: [],
      status: "read",
      sentAt: isoOffset(3000),
      isDeleted: false,
      isSystemMessage: true,
    },
    {
      id: "msg-004-sys-2",
      conversationId: "conv-004",
      senderId: "system",
      content: "Minh Do joined the Deal Room.",
      attachments: [],
      status: "read",
      sentAt: isoOffset(2998),
      isDeleted: false,
      isSystemMessage: true,
    },
    {
      id: "msg-004-sys-3",
      conversationId: "conv-004",
      senderId: "system",
      content: "Sarah Chen joined the Deal Room.",
      attachments: [],
      status: "read",
      sentAt: isoOffset(2900),
      isDeleted: false,
      isSystemMessage: true,
    },
    {
      id: "msg-004-1",
      conversationId: "conv-004",
      senderId: "user-minh",
      content:
        "Welcome everyone! Really excited for Food & Farm Global Fair. Hope we can all make valuable connections here.",
      attachments: [],
      status: "read",
      sentAt: isoOffset(2890),
      isDeleted: false,
      isSystemMessage: false,
    },
    {
      id: "msg-004-2",
      conversationId: "conv-004",
      senderId: "user-sarah",
      content:
        "Same here! Looking forward to connecting with fellow exhibitors. Our team is showcasing sustainable packaging solutions.",
      attachments: [],
      status: "read",
      sentAt: isoOffset(2870),
      isDeleted: false,
      isSystemMessage: false,
    },
    {
      id: "msg-004-sys-4",
      conversationId: "conv-004",
      senderId: "system",
      content: "Tommy Nguyen joined the Deal Room.",
      attachments: [],
      status: "read",
      sentAt: isoOffset(2800),
      isDeleted: false,
      isSystemMessage: true,
    },
    {
      id: "msg-004-3",
      conversationId: "conv-004",
      senderId: "user-current",
      content:
        "Great to be here! Arobid is exhibiting at Booth A01. We'll be demonstrating our AI-powered supply chain platform. Would love to connect with anyone interested in agri-tech.",
      attachments: [],
      status: "read",
      sentAt: isoOffset(2750),
      isDeleted: false,
      isSystemMessage: false,
    },
    {
      id: "msg-004-4",
      conversationId: "conv-004",
      senderId: "user-minh",
      content:
        "@Khai — Would love to visit! We're at C01. Might be some interesting synergies between your AI platform and our produce data.",
      attachments: [],
      status: "delivered",
      sentAt: isoOffset(60),
      isDeleted: false,
      isSystemMessage: false,
    },
    {
      id: "msg-004-5",
      conversationId: "conv-004",
      senderId: "user-sarah",
      content:
        "Anyone interested in organizing a networking lunch on Day 2? Could be a great way to explore B2B opportunities outside the booth.",
      attachments: [],
      status: "delivered",
      sentAt: isoOffset(45),
      isDeleted: false,
      isSystemMessage: false,
    },
    {
      id: "msg-004-6",
      conversationId: "conv-004",
      senderId: "user-tommy",
      content:
        "Count me in for the lunch! Also sharing our expo schedule here.",
      attachments: [
        {
          id: "att-004-1",
          fileName: "Expo_Day_Schedule.xlsx",
          fileUrl: "#",
          fileSize: 48_000,
          fileType: "xlsx",
        },
      ],
      status: "delivered",
      sentAt: isoOffset(30),
      isDeleted: false,
      isSystemMessage: false,
    },
  ],

  "conv-005": [
    {
      id: "msg-005-sys-1",
      conversationId: "conv-005",
      senderId: "system",
      content: "Khai Pham joined the Deal Room.",
      attachments: [],
      status: "read",
      sentAt: isoOffset(5000),
      isDeleted: false,
      isSystemMessage: true,
    },
    {
      id: "msg-005-sys-2",
      conversationId: "conv-005",
      senderId: "system",
      content: "Nguyen Van A joined the Deal Room.",
      attachments: [],
      status: "read",
      sentAt: isoOffset(4800),
      isDeleted: false,
      isSystemMessage: true,
    },
    {
      id: "msg-005-1",
      conversationId: "conv-005",
      senderId: "user-current",
      content:
        "Hello AI & Robotics community! Looking forward to an incredible showcase. Our team will be at Booth B01 demonstrating agricultural AI — stop by!",
      attachments: [],
      status: "read",
      sentAt: isoOffset(4790),
      isDeleted: false,
      isSystemMessage: false,
    },
    {
      id: "msg-005-2",
      conversationId: "conv-005",
      senderId: "user-nguyen",
      content:
        "Looking forward to seeing the demos, Khai! VietTech will be showcasing our computer vision solutions for manufacturing QA. Should be complementary to your work.",
      attachments: [],
      status: "read",
      sentAt: isoOffset(4750),
      isDeleted: false,
      isSystemMessage: false,
    },
  ],
}

// ─── Initial unread counts (per current user) ─────────────────────────────────

export const mockInitialUnreadCounts: Record<string, number> = {
  "conv-001": 0,
  "conv-002": 2, // msg-002-4 and msg-002-5
  "conv-003": 0,
  "conv-004": 3, // msg-004-4, msg-004-5, msg-004-6
  "conv-005": 0,
}
