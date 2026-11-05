import React from 'react';
import { findNodeHandle, Platform, requireNativeComponent, UIManager, ViewProps } from 'react-native';

export type CardLockedEvent = {
  base64: string;
  width: number;
  height: number;
};

type NativeCardOutlineProps = ViewProps & {
  enabled?: boolean;
  torch?: boolean;
  onCardLocked?: (event: { nativeEvent: CardLockedEvent }) => void;
};

export const isCardOutlineAvailable =
  Platform.OS === 'android' && UIManager.getViewManagerConfig('CardOutlineCamera') != null;

const NativeCardOutlineCamera = isCardOutlineAvailable
  ? requireNativeComponent<NativeCardOutlineProps>('CardOutlineCamera')
  : null;

export const CardOutlineCamera = React.forwardRef<any, NativeCardOutlineProps>(
  function CardOutlineCamera(props, ref) {
    if (!NativeCardOutlineCamera) return null;
    return <NativeCardOutlineCamera ref={ref} collapsable={false} {...props} />;
  },
);

export function captureCardOutline(ref: React.RefObject<any>) {
  const tag = findNodeHandle(ref.current);
  if (tag == null) return;
  const command =
    (UIManager.getViewManagerConfig('CardOutlineCamera') as any)?.Commands?.capture ?? 'capture';
  UIManager.dispatchViewManagerCommand(tag, command, []);
}
