import type { IconProps } from '@phosphor-icons/react';
import type { ComponentType, ReactElement } from 'react';

export const ICON_SIZE = {
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
} as const;

type PhIconProps = {
  size?: number;
  weight?: IconProps['weight'];
};

/** Consistent Phosphor icon props for Ant Design Button / Menu. */
export function phIcon(
  IconComponent: ComponentType<IconProps>,
  props: PhIconProps = {},
): ReactElement {
  const { size = ICON_SIZE.md, weight = 'regular' } = props;
  return <IconComponent size={size} weight={weight} />;
}
