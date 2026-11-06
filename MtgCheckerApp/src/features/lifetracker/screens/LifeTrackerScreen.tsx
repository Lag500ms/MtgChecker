import React, { useState } from 'react';
import { useRouter } from 'expo-router';

import { LifeTrackerModal } from '../components/LifeTrackerModal';

export function LifeTrackerScreen() {
  const router = useRouter();
  const [visible, setVisible] = useState(true);

  const handleClose = () => {
    setVisible(false);
    router.back();
  };

  return (
    <LifeTrackerModal
      visible={visible}
      onClose={handleClose}
      initialPlayerCount={4}
      initialLife={40}
    />
  );
}
