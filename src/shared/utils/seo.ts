import { Metadata } from 'next'

interface SEOProps {
  title: string
  description: string
  keywords?: string
  canonicalUrl?: string
  ogImage?: string
  noIndex?: boolean
  alternates?: {
    canonical?: string
    languages?: Record<string, string>
  }
}

export function generateSiteMetadata({
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage = '/images/og-image.jpg',
  noIndex = false,
  alternates,
}: SEOProps): Metadata {
  const siteUrl = 'https://panoramic-solutions.com'
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`

  return {
    title,
    description,
    keywords,
    authors: [{ name: 'Matt Wagner', url: siteUrl }],
    creator: 'Panoramic Solutions',
    publisher: 'Panoramic Solutions',
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: canonicalUrl || siteUrl,
      ...alternates,
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: canonicalUrl || siteUrl,
      title,
      description,
      siteName: 'Panoramic Solutions',
      images: [
        {
          url: fullOgImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [fullOgImage],
      creator: '@panoramicsol',
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.GOOGLE_VERIFICATION || undefined,
    },
  }
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Panoramic Solutions',
    url: 'https://panoramic-solutions.com',
    logo: 'https://panoramic-solutions.com/images/Logo_Panoramic_Solutions.webp',
    description: 'SaaS Architecture, Enterprise Automations, and Digital Transformation consultancy',
    founder: {
      '@type': 'Person',
      name: 'Matt Wagner',
      jobTitle: 'Solutions Architect',
      hasCredential: ['PMP®', 'SAFe 6'],
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'matt.wagner@panoramic-solutions.com',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Utah',
      addressCountry: 'US',
    },
    sameAs: [
      'https://linkedin.com/company/panoramic-solutions',
      'https://twitter.com/panoramicsol',
    ],
  }
}

export function generatePersonSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Matt Wagner',
    jobTitle: 'Solutions Architect & Founder',
    worksFor: {
      '@type': 'Organization',
      name: 'Panoramic Solutions',
    },
    hasCredential: [
      'Project Management Professional (PMP®)',
      'SAFe 6 Certified',
      'Airtable Certified',
      'Smartsheet Certified',
    ],
    knowsAbout: [
      'SaaS Architecture',
      'Digital Transformation',
      'Project Portfolio Management',
      'Enterprise Automation',
      'Agile Methodologies',
    ],
    url: 'https://panoramic-solutions.com/about',
    image: 'https://panoramic-solutions.com/images/Wagner_Headshot_2024.webp',
  }
}

export function generateServiceSchema(service: {
  name: string
  description: string
  url: string
  price?: string
  category: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    url: service.url,
    provider: {
      '@type': 'Organization',
      name: 'Panoramic Solutions',
    },
    serviceType: service.category,
    ...(service.price && { offers: {
      '@type': 'Offer',
      price: service.price,
      priceCurrency: 'USD',
    }}),
  }
}
