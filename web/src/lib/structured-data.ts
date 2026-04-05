export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ცამეტი",
  alternateName: "Tsamerti",
  url: "https://13.online.ge",
  logo: "https://13.online.ge/api/logo",
  description: "მამაკაცების კლასიკური ტანსაცმლის მაღაზია საქართველოში",
  address: {
    "@type": "PostalAddress",
    streetAddress: "თქვენი მისამართი", // შეცვალეთ რეალური მისამართით
    addressLocality: "თბილისი",
    addressRegion: "თბილისი",
    addressCountry: "GE",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+995574150531", // შეცვალეთ რეალური ნომრით
    contactType: "customer service",
    availableLanguage: ["Georgian", "English"],
  },
  sameAs: [
    "https://www.facebook.com/13.online.ge", // შეცვალეთ რეალური სოციალური ქსელებით
    "https://www.instagram.com/13.online.ge",
  ],
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ცამეტი",
  alternateName: "Tsamerti",
  url: "https://13.online.ge",
  description: "მამაკაცების კლასიკური ტანსაცმლის ონლაინ მაღაზია",
  inLanguage: ["ka", "en"],
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://13.online.ge/search/{search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

export const storeSchema = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: "ცამეტი",
  description: "მამაკაცების კლასიკური ტანსაცმლის მაღაზია",
  url: "https://13.online.ge",
  telephone: "+995574150531", // შეცვალეთ რეალური ნომრით
  address: {
    "@type": "PostalAddress",
    streetAddress: "თქვენი მისამართი", // შეცვალეთ რეალური მისამართით
    addressLocality: "თბილისი",
    addressRegion: "თბილისი",
    postalCode: "0100", // შეცვალეთ რეალური postal code-ით
    addressCountry: "GE",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: "41.7151",
    longitude: "44.8271",
  },
  openingHours: "Mo-Su 09:00-18:00", // შეცვალეთ რეალური საათებით
  priceRange: "$$",
};
