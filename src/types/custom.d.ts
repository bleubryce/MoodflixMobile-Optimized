declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.gif";
declare module "*.svg";

// Environment variables
declare module "@env" {
  export const APP_ENV: "development" | "staging" | "production";
  export const ENABLE_DARK_MODE: string;
}

// Extend the Window interface
declare interface Window {
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: any;
}
