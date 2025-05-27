// src/components/SimpleControls.tsx

import React, { useState } from 'react';

interface LightingSettings {
  envPreset: string;
  envBackground: boolean;
  envRotation: number;
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
  toneMappingExposure: number;
}

interface ModelSettings {
  scale: number;
  modelPosX: number;
  modelPosY: number;
  modelPosZ: number;
  modelRotX: number;
  modelRotY: number;
  modelRotZ: number;
}

interface CameraSettings {
  distance: number;
  azimuth: number;
  polar: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  fov: number;
}

interface SimpleControlsProps {
  lightingSettings: LightingSettings;
  modelSettings: ModelSettings;
  cameraSettings: CameraSettings;
  onLightingChange: (settings: LightingSettings) => void;
  onModelChange: (settings: ModelSettings) => void;
  onCameraChange: (settings: CameraSettings) => void;
}

export default function SimpleControls({
  lightingSettings,
  modelSettings,
  cameraSettings,
  onLightingChange,
  onModelChange,
  onCameraChange,
}: SimpleControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'lighting' | 'model' | 'camera'>('lighting');

  const envPresets = [
    'sunset', 'dawn', 'night', 'warehouse', 'forest', 
    'apartment', 'studio', 'city', 'park', 'lobby'
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-20 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
      >
        ⚙️ Controls
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-20 bg-gray-800 text-white p-4 rounded-lg max-w-sm w-full max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Scene Controls</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-4">
        {(['lighting', 'model', 'camera'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 rounded text-sm capitalize ${
              activeTab === tab 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Lighting Controls */}
      {activeTab === 'lighting' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Environment</label>
            <select
              value={lightingSettings.envPreset}
              onChange={(e) => onLightingChange({ ...lightingSettings, envPreset: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
            >
              {envPresets.map((preset) => (
                <option key={preset} value={preset}>{preset}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={lightingSettings.envBackground}
                onChange={(e) => onLightingChange({ ...lightingSettings, envBackground: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Environment Background</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Environment Rotation: {(lightingSettings.envRotation * 180 / Math.PI).toFixed(0)}°
            </label>
            <input
              type="range"
              min={-Math.PI}
              max={Math.PI}
              step="0.1"
              value={lightingSettings.envRotation}
              onChange={(e) => onLightingChange({ ...lightingSettings, envRotation: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Light Intensity: {lightingSettings.lightIntensity.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={lightingSettings.lightIntensity}
              onChange={(e) => onLightingChange({ ...lightingSettings, lightIntensity: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Tone Mapping Exposure: {lightingSettings.toneMappingExposure.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={lightingSettings.toneMappingExposure}
              onChange={(e) => onLightingChange({ ...lightingSettings, toneMappingExposure: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium mb-1">Light X: {lightingSettings.lightPosX}</label>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.5"
                value={lightingSettings.lightPosX}
                onChange={(e) => onLightingChange({ ...lightingSettings, lightPosX: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Light Y: {lightingSettings.lightPosY}</label>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.5"
                value={lightingSettings.lightPosY}
                onChange={(e) => onLightingChange({ ...lightingSettings, lightPosY: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Light Z: {lightingSettings.lightPosZ}</label>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.5"
                value={lightingSettings.lightPosZ}
                onChange={(e) => onLightingChange({ ...lightingSettings, lightPosZ: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Model Controls */}
      {activeTab === 'model' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              Scale: {modelSettings.scale.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={modelSettings.scale}
              onChange={(e) => onModelChange({ ...modelSettings, scale: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium mb-1">Pos X: {modelSettings.modelPosX}</label>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.1"
                value={modelSettings.modelPosX}
                onChange={(e) => onModelChange({ ...modelSettings, modelPosX: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Pos Y: {modelSettings.modelPosY}</label>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.1"
                value={modelSettings.modelPosY}
                onChange={(e) => onModelChange({ ...modelSettings, modelPosY: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Pos Z: {modelSettings.modelPosZ}</label>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.1"
                value={modelSettings.modelPosZ}
                onChange={(e) => onModelChange({ ...modelSettings, modelPosZ: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium mb-1">Rot X: {(modelSettings.modelRotX * 180 / Math.PI).toFixed(0)}°</label>
              <input
                type="range"
                min={-Math.PI}
                max={Math.PI}
                step="0.1"
                value={modelSettings.modelRotX}
                onChange={(e) => onModelChange({ ...modelSettings, modelRotX: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Rot Y: {(modelSettings.modelRotY * 180 / Math.PI).toFixed(0)}°</label>
              <input
                type="range"
                min={-Math.PI}
                max={Math.PI}
                step="0.1"
                value={modelSettings.modelRotY}
                onChange={(e) => onModelChange({ ...modelSettings, modelRotY: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Rot Z: {(modelSettings.modelRotZ * 180 / Math.PI).toFixed(0)}°</label>
              <input
                type="range"
                min={-Math.PI}
                max={Math.PI}
                step="0.1"
                value={modelSettings.modelRotZ}
                onChange={(e) => onModelChange({ ...modelSettings, modelRotZ: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Camera Controls */}
      {activeTab === 'camera' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              FOV: {cameraSettings.fov}°
            </label>
            <input
              type="range"
              min="20"
              max="120"
              step="1"
              value={cameraSettings.fov}
              onChange={(e) => onCameraChange({ ...cameraSettings, fov: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Distance: {cameraSettings.distance.toFixed(1)}
            </label>
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={cameraSettings.distance}
              onChange={(e) => onCameraChange({ ...cameraSettings, distance: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium mb-1">Azimuth: {(cameraSettings.azimuth * 180 / Math.PI).toFixed(0)}°</label>
              <input
                type="range"
                min={-Math.PI}
                max={Math.PI}
                step="0.1"
                value={cameraSettings.azimuth}
                onChange={(e) => onCameraChange({ ...cameraSettings, azimuth: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Polar: {(cameraSettings.polar * 180 / Math.PI).toFixed(0)}°</label>
              <input
                type="range"
                min="0.1"
                max={Math.PI - 0.1}
                step="0.1"
                value={cameraSettings.polar}
                onChange={(e) => onCameraChange({ ...cameraSettings, polar: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium mb-1">Target X: {cameraSettings.targetX}</label>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.1"
                value={cameraSettings.targetX}
                onChange={(e) => onCameraChange({ ...cameraSettings, targetX: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Target Y: {cameraSettings.targetY}</label>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.1"
                value={cameraSettings.targetY}
                onChange={(e) => onCameraChange({ ...cameraSettings, targetY: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Target Z: {cameraSettings.targetZ}</label>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.1"
                value={cameraSettings.targetZ}
                onChange={(e) => onCameraChange({ ...cameraSettings, targetZ: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Reset Button */}
      <div className="mt-4 pt-3 border-t border-gray-600">
        <button
          onClick={() => {
            // Reset to defaults
            onLightingChange({
              envPreset: "city",
              envBackground: false,
              envRotation: 0,
              lightIntensity: 0.5,
              lightPosX: 5,
              lightPosY: 5,
              lightPosZ: 5,
              lightTargetX: 0,
              lightTargetY: 0,
              lightTargetZ: 0,
              hemisphereIntensity: 0.3,
              skyColor: "#adccec",
              groundColor: "#606060",
              toneMappingExposure: 1.0,
            });
            onModelChange({
              scale: 1,
              modelPosX: 0,
              modelPosY: 0,
              modelPosZ: 0,
              modelRotX: 0,
              modelRotY: 0,
              modelRotZ: 0,
            });
            onCameraChange({
              distance: 5,
              azimuth: 0,
              polar: Math.PI / 2,
              targetX: 0,
              targetY: 0,
              targetZ: 0,
              fov: 75,
            });
          }}
          className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm transition-colors"
        >
          Reset All
        </button>
      </div>
    </div>
  );
}