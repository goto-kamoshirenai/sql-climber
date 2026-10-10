import { STORAGE_KEY } from "@/features/storage/progress-schema";

/**
 * 描画前にテーマを当てる（ちらつき防止）。学習記録の theme を読む。
 * "system" のときは属性を付けず、prefers-color-scheme に任せる。
 */
export const THEME_INIT_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(
  STORAGE_KEY,
)})||"{}");var t=p.theme;if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t);document.documentElement.setAttribute("data-dotterel-theme",t);}}catch(e){}})();`;

export function applyTheme(theme: "light" | "dark" | "system") {
  const root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-theme");
    root.removeAttribute("data-dotterel-theme");
  } else {
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-dotterel-theme", theme);
  }
}
