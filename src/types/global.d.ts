// Global type declarations for the MeetNow Webapp

// Environment variables
interface ImportMetaEnv {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_WASABI_REGION?: string;
  VITE_WASABI_ENDPOINT?: string;
  VITE_WASABI_BUCKET_NAME?: string;
  VITE_WASABI_ACCESS_KEY_ID?: string;
  VITE_WASABI_SECRET_ACCESS_KEY?: string;
  VITE_WASABI_PUBLIC_ACCESS_KEY_ID?: string;
  VITE_WASABI_PUBLIC_SECRET_KEY?: string;
  [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  readonly url: string;
  readonly main?: boolean;
}

// Navigator extensions
interface INetworkInformation {
  type: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
}

interface INavigator {
  connection?: NetworkInformation;
}

// Common types
interface ILocation {
  latitude: number;
  longitude: number;
  address?: string;
}

interface IUser {
  id: string;
  [key: string]: any;
}

interface IResource {
  id: string;
  user_id: string;
  [key: string]: any;
}

// Logger types
interface ILogger {
  info(component: string, message: string, data?: any): void;
  warn(component: string, message: string, data?: any): void;
  error(component: string, message: string, data?: any): void;
  debug(component: string, message: string, data?: any): void;
}

// Test result types
interface ITestResult {
  success: boolean;
  message?: string;
  uploadUrl?: string | null;
  signedUrl?: string | null;
  error?: any;
}

interface IUploadResult {
  success: boolean;
  url?: string;
  error?: any;
}

// Declare global variables
declare const logger: Logger;
