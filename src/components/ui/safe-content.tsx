import React from 'react';
import { sanitizeHTML, sanitizeText } from '@/lib/security';

interface SafeContentProps {
  content: string;
  allowHTML?: boolean;
  className?: string;
  tag?: keyof React.JSX.IntrinsicElements;
}

export const SafeContent: React.FC<SafeContentProps> = ({
  content,
  allowHTML = false,
  className,
  tag: Tag = 'div'
}) => {
  if (!content) {
    return null;
  }

  if (allowHTML) {
    const sanitizedHTML = sanitizeHTML(content);
    return (
      <Tag
        className={className}
        dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
      />
    );
  }

  const sanitizedText = sanitizeText(content);
  return <Tag className={className}>{sanitizedText}</Tag>;
};

// Componente específico para texto plano
export const SafeText: React.FC<Omit<SafeContentProps, 'allowHTML'> & { tag?: keyof React.JSX.IntrinsicElements }> = (props) => {
  return <SafeContent {...props} allowHTML={false} />;
};

// Componente específico para HTML seguro
export const SafeHTML: React.FC<Omit<SafeContentProps, 'allowHTML'> & { tag?: keyof React.JSX.IntrinsicElements }> = (props) => {
  return <SafeContent {...props} allowHTML={true} />;
}; 