import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { LifeTrackerModal } from '../components/LifeTrackerModal';

export function LifeTrackerScreen() {
  const router = useRouter();
  const { life } = useLocalSearchParams<{ life?: string }>();
  const [visible, setVisible] = useState(true);

  const handleClose = () => {
    setVisible(false);
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <LifeTrackerModal
      visible={visible}
      onClose={handleClose}
      initialPlayerCount={4}
      initialLife={life === '20' ? 20 : life === '30' ? 30 : 40}
    />
  );
}
