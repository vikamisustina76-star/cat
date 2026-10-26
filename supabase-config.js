/*
  Настройки клиента Supabase.
  Только URL и publishable/anon key разрешены в браузере.
  Никогда не добавляйте сюда service_role key, приватный VAPID key или OAuth client secret.
*/
window.PIXEL_CAT_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT_REF.supabase.co",
  supabaseAnonKey: "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY",
  vapidPublicKey: "PASTE_PUBLIC_VAPID_KEY_HERE",
  providers: {
    telegram: "custom:telegram",
    vk: "custom:vk-id"
  }
};
