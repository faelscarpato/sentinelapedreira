import { useEffect } from "react";

interface SEOProps {
  title: string;
  description?: string;
  canonical?: string;
}

export function SEO({ title, description, canonical }: SEOProps) {
  const fullTitle = `${title} | Sentinela Pedreira`;
  const defaultDescription = "Portal de transparência radical e fiscalização cívica de Pedreira/SP. Inteligência de dados para controle social.";

  useEffect(() => {
    document.title = fullTitle;

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", description || defaultDescription);
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = description || defaultDescription;
      document.head.appendChild(meta);
    }

    if (canonical) {
      let linkCanonical = document.querySelector('link[rel="canonical"]');
      if (linkCanonical) {
        linkCanonical.setAttribute("href", canonical);
      } else {
        linkCanonical = document.createElement("link");
        linkCanonical.setAttribute("rel", "canonical");
        linkCanonical.setAttribute("href", canonical);
        document.head.appendChild(linkCanonical);
      }
    }
  }, [title, description, canonical, fullTitle]);

  return null;
}
