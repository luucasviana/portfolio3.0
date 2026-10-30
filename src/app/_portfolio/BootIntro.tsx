const BOOT_LINES = ["montando /home/lucas", "iniciando gatas.service", "carregando portfolio v3.0"];

/**
 * First-visit boot overlay (markup only). Shown while html[data-boot="1"]; the timer and
 * skip listeners live in PREBOOT_SCRIPT so they work before (or without) hydration.
 */
export function BootIntro() {
  return (
    <div className="t-boot" aria-hidden="true">
      <div className="t-boot__log">
        {BOOT_LINES.map((line, index) => (
          <p key={line} className="t-boot__line" style={{ animationDelay: `${index * 450}ms` }}>
            <span className="t-boot__ok">[ OK ]</span> {line}
          </p>
        ))}
        <p className="t-boot__line t-boot__hint" style={{ animationDelay: `${BOOT_LINES.length * 450}ms` }}>
          toque ou pressione qualquer tecla para pular
        </p>
      </div>
      <div className="t-boot__crt"></div>
    </div>
  );
}
