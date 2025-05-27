import { useEffect, useRef } from 'react';
import { debounce } from 'lodash';

interface LevaSettings {
  camera?: {
    posX: number;
    posY: number;
    posZ: number;
    targetX: number;
    targetY: number;
    targetZ: number;
    fov: number;
    enableZoom: boolean;
    enablePan: boolean;
    enableRotate: boolean;
  };
  lighting?: {
    envPreset: string;
    envBackground: boolean;
    lightIntensity: number;
    lightPosX: number;
    lightPosY: number;
    lightPosZ: number;
    lightTargetX: number;
    lightTargetY: number;
    lightTargetZ: number;
    hemisphereIntensity: number;
    skyColor: string;
    groundColor: string;
  };
  model?: {
    scale: number;
    modelPosX: number;
    modelPosY: number;
    modelPosZ: number;
    modelRotX: number;
    modelRotY: number;
    modelRotZ: number;
  };
}

export const useLevaSettings = () => {
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced save function to avoid too many API calls
  const debouncedSave = useRef(
    debounce(async (key: string, value: any) => {
      try {
        await fetch('/api/leva-settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key, value }),
        });
        console.log(`Saved ${key} settings to database`);
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    }, 1000) // Wait 1 second after last change before saving
  ).current;

  // Load settings from database
  const loadSettings = async (): Promise<LevaSettings> => {
    try {
      const response = await fetch('/api/leva-settings');
      const data = await response.json();
      
      if (data.success) {
        return data.settings;
      }
      return {};
    } catch (error) {
      console.error('Failed to load settings:', error);
      return {};
    }
  };

  // Save settings to database
  const saveSettings = (key: string, value: any) => {
    debouncedSave(key, value);
  };

  // Save all settings at once
  const saveAllSettings = async (settings: LevaSettings) => {
    try {
      await fetch('/api/leva-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });
      console.log('Saved all settings to database');
    } catch (error) {
      console.error('Failed to save all settings:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    loadSettings,
    saveSettings,
    saveAllSettings,
  };
};