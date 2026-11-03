import type { ElementType, ReactNode } from 'react';

type Props = {
  /** The element to render; a panel is often a section, an article or a list item. */
  as?: ElementType;
  /** plain: the book's page. raised: a lighter page. note: cream paper. dim: sunk into the desk. */
  tone?: 'plain' | 'raised' | 'note' | 'dim';
  className?: string;
  children: ReactNode;
} & Record<string, unknown>;

/**
 * A hard-edged panel with stepped corners and a one-step border, the same
 * recipe as the game's dialogue and journal boxes. It never rounds anything.
 */
export function PixelPanel({ as: Tag = 'div', tone = 'plain', className, children, ...rest }: Props) {
  return (
    <Tag className={className ? `j-panel ${className}` : 'j-panel'} data-tone={tone} {...rest}>
      {children}
    </Tag>
  );
}
