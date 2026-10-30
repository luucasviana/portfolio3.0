/** localStorage key: "1" means the visitor asked for reduced motion. */
export const MOTION_KEY = "lv-reduce-motion";
/** sessionStorage key: set once the boot intro has played in this session. */
export const BOOT_KEY = "lv-booted";
/** Boot intro length; also dismissed by any key, click or touch. */
export const BOOT_MS = 2500;

/**
 * Runs inline in <head> before first paint (root layout; boot only on "/") so the first paint already
 * knows the motion mode and whether the boot intro should cover the page.
 * It also owns the boot's timer and skip listeners, so the intro ends on time even if
 * hydration is slow or JS fails to load.
 * Storage can throw (Safari private mode): any failure falls back to full motion, no boot.
 */
export const PREBOOT_SCRIPT = `(function(){var d=document.documentElement;try{var r=window.matchMedia("(prefers-reduced-motion: reduce)").matches||localStorage.getItem("${MOTION_KEY}")==="1";d.dataset.motion=r?"reduced":"full";if(!r&&!sessionStorage.getItem("${BOOT_KEY}")&&!location.hash&&location.pathname==="/"){d.dataset.boot="1";var ev=["keydown","pointerdown","touchstart"];var done=function(){clearTimeout(t);ev.forEach(function(n){removeEventListener(n,done)});delete d.dataset.boot;try{sessionStorage.setItem("${BOOT_KEY}","1")}catch(e){}};var t=setTimeout(done,${BOOT_MS});ev.forEach(function(n){addEventListener(n,done,{passive:true})});}}catch(e){d.dataset.motion="full";delete d.dataset.boot;}})();`;
