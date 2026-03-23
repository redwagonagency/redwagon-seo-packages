export interface DiscoveryPlatform {
  value: string;
  label: string;
}

export const DISCOVERY_PLATFORM_OPTIONS: DiscoveryPlatform[] = [
  { value: "google", label: "Google" },
  { value: "shopping", label: "Google Shopping" },
  { value: "youtube", label: "YouTube" },
  { value: "amazon", label: "Amazon" },
  { value: "bing", label: "Bing" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "pinterest", label: "Pinterest" },
  { value: "chatgpt", label: "ChatGPT" },
];

export const DISCOVERY_SUPPORTED_PLATFORMS = new Set(
  DISCOVERY_PLATFORM_OPTIONS.map((option) => option.value)
);
