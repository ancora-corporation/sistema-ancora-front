export default function Logo() {
  return (
    <div className="d-flex align-items-center gap-3" style={{ color: "#0B2A5B" }}>
      {/* Âncora provisória. Depois trocamos pela imagem oficial */}
      <svg
        width="56"
        height="56"
        viewBox="0 0 64 64"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="32" cy="10" r="6" />
        <line x1="32" y1="16" x2="32" y2="56" />
        <line x1="22" y1="25" x2="42" y2="25" />
        <path d="M8 38 C10 52 22 58 32 58 C42 58 54 52 56 38" />
        <path d="M6 41 L9 32 L17 38" />
        <path d="M58 41 L55 32 L47 38" />
      </svg>

      <div style={{ lineHeight: 1 }}>
        <div
          style={{
            fontWeight: 300,
            fontSize: "0.8rem",
            letterSpacing: "0.45em",
          }}
        >
          SISTEMA
        </div>
        <div style={{ fontWeight: 700, fontSize: "1.9rem", letterSpacing: "0.04em" }}>
          ÂNCORA
        </div>
      </div>
    </div>
  );
}