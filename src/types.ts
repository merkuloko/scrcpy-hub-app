/**
 * Scrcpy Hub Type Definitions
 */

export interface Device {
  id: string;
  serial: string;
  model: string;
  product?: string;
  transportId?: string;
  state: 'device' | 'offline' | 'unauthorized' | string;
  isWireless: boolean;
  isMirroring?: boolean;
  battery?: number;
  androidVersion?: string;
  screenResolution?: string;
  isSimulated?: boolean;
}

export type AudioSourceOption = 'internal' | 'mic' | 'disabled';
export type VideoCodecOption = 'h264' | 'h265' | 'av1' | 'default';

export interface ScrcpyConfig {
  serial: string;
  maxSize: number; // e.g. 1920, 1080, 720, 480, 0 for original
  maxFps: number; // 30, 60, 90, 120
  audioSource: AudioSourceOption;
  videoBitRate: number; // Mbps
  videoCodec: VideoCodecOption;
  turnScreenOff: boolean;
  stayAwake: boolean;
  alwaysOnTop: boolean;
  showTouches: boolean;
  readOnly: boolean;
  record: boolean;
  recordFileName: string;
  customArgs: string;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'stdout' | 'stderr';
  message: string;
  serial?: string | null;
}

export interface BinaryStatus {
  available: boolean;
  version: string | null;
}

export interface SystemStatus {
  adb: BinaryStatus;
  scrcpy: BinaryStatus;
}
