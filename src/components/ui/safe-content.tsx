import React from 'react';
import { sanitizeHTML, sanitizeText } from '@/lib/security';

interface SafeContentProps {
  content: string;
  allowHTML?: boolean;
  className?: string;
  tag?: keyof React.JSX.IntrinsicElements;
  context?: string;
}

export const SafeContent: React.FC<SafeContentProps> = ({
  content,
  allowHTML = false,
  className,
  tag: Tag = 'div',
  context = 'SafeContent'
}) => {
  if (!content) {
    return null;
  }

  if (allowHTML) {
    const sanitizedHTML = sanitizeHTML(content, context, 'SafeContent_HTML');
    return (
      <Tag
        className={className}
        dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
      />
    );
  }

  const sanitizedText = sanitizeText(content, context, 'SafeContent_Text');
  return <Tag className={className}>{sanitizedText}</Tag>;
};

// Componentes especializados para casos de uso específicos
export const SafeText: React.FC<Omit<SafeContentProps, 'allowHTML'> & { allowHTML?: false }> = (props) => {
  return <SafeContent {...props} allowHTML={false} context={props.context || 'SafeText'} />;
};

export const SafeHTML: React.FC<Omit<SafeContentProps, 'allowHTML'> & { allowHTML: true }> = (props) => {
  return <SafeContent {...props} allowHTML={true} context={props.context || 'SafeHTML'} />;
}; 