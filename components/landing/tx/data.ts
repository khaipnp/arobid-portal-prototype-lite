export const asset = (name: string) => `/landing/${name}`

export type HomeExpoCard = {
  id: string
  title: string
  image: string | null
  status: "Live" | "Upcoming" | "Archived"
  tags: string[]
  stats: [string, string, string]
  action: string
  disabled?: boolean
  href: string
  detailHref: string
  durationLabel: string
  countdown: string
  segment: string
  isWishlisted?: boolean
}

export type Plan = {
  name: string
  image: string
  description: string
  features: string[]
  featured?: boolean
}

export const plans: Plan[] = [
  {
    name: "Basic",
    image: "booth-basic.jpg",
    description:
      "Ideal for businesses establishing a professional digital presence to connect with global partners.",
    features: [
      "Standard Floor Area",
      "3 Display Products",
      "1 Logo Placement",
      "1 Banner Placement",
      "1 Video Placement"
    ]
  },
  {
    name: "Professional",
    image: "booth-pro.jpg",
    description:
      "Designed for businesses transforming their virtual booth into a powerful marketing engine to attract high-value partners.",
    features: [
      "150% Standard Floor Area",
      "5 Display Products",
      "1 Logo Placement",
      "1 Banner Placement",
      "1 Video Placement"
    ]
  },
  {
    name: "Premium",
    image: "booth-premium.jpg",
    description:
      "The ultimate choice for industry leaders aiming to become the exhibition's centerpiece while asserting global prestige.",
    features: [
      "300% Standard Floor Area",
      "8 Display Products",
      "1 Logo Placement",
      "1 Banner Placement",
      "1 Video Placement"
    ]
  }
] as const

export const faqs = [
  {
    question: "How long does it take to set up my Virtual Booth after booking?",
    answer:
      "Most booths can be prepared within a few working days once booth content, brand assets, and product information are provided."
  },
  {
    question: "How does booking a booth activate the AI Matching feature?",
    answer:
      "Once your booth is live, our engine scans your product data and automatically recommends your booth to 95% of high-intent buyers with matching sourcing needs."
  },
  {
    question:
      "How does a Virtual Booth compare to a physical one in terms of cost?",
    answer:
      "A Virtual Booth reduces setup, travel, logistics, and staffing costs while keeping the core exposure and lead-generation workflow online."
  },
  {
    question: "Do I get technical support if I'm not tech-savvy?",
    answer:
      "Yes. Arobid support can guide booth content preparation, publishing, and daily operation so teams can focus on trading activity."
  }
] as const
