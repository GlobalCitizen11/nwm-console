export const tokens = {
  colors: {
    background: {
      primary: "#05070b",
      secondary: "rgba(15, 19, 26, 0.96)",
      tertiary: "rgba(20, 26, 36, 0.94)",
      preview: "#060a10",
      page: "#0a0d13",
      pageAlt: "#0c1118",
      panelWash: "rgba(9, 13, 20, 0.72)",
      panelRaised: "rgba(13, 18, 27, 0.84)",
      chip: "rgba(14, 19, 28, 0.82)",
    },
    text: {
      primary: "#f3f6fb",
      secondary: "#c8d2df",
      tertiary: "#9ba9bb",
      muted: "#7f90a3",
      subtle: "#6f8093",
      inverse: "#05070b",
    },
    accent: {
      signal: "#4da3ff",
      warning: "#f0b35e",
      risk: "#ef6b63",
      stable: "#8fbf9f",
      positive: "#46c59d",
    },
    signal: {
      coordination: "#4da3ff",
      allocation: "#f0b35e",
      infrastructure: "#46c59d",
      markets: "#90a9c4",
    },
    category: {
      strategy: "#4da3ff",
      pressure: "#f0b35e",
      risk: "#ef6b63",
      infrastructure: "#46c59d",
      market: "#90a9c4",
      evidence: "#7f90a3",
    },
    border: {
      subtle: "rgba(255, 255, 255, 0.07)",
      standard: "rgba(255, 255, 255, 0.1)",
      strong: "rgba(255, 255, 255, 0.16)",
      emphasis: "rgba(77, 163, 255, 0.36)",
    },
  },
  typography: {
    families: {
      sans: `"IBM Plex Sans", "Inter", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
      mono: `"IBM Plex Mono", "SFMono-Regular", "SF Mono", Menlo, Consolas, monospace`,
    },
    display: {
      fontSize: "30px",
      lineHeight: "1.02",
      letterSpacing: "-0.032em",
      fontWeight: 640,
    },
    h1: {
      fontSize: "18px",
      lineHeight: "1.2",
      letterSpacing: "-0.02em",
      fontWeight: 620,
    },
    h2: {
      fontSize: "14px",
      lineHeight: "1.28",
      letterSpacing: "-0.012em",
      fontWeight: 600,
    },
    body: {
      fontSize: "12.5px",
      lineHeight: "1.46",
      fontWeight: 400,
    },
    caption: {
      fontSize: "9px",
      lineHeight: "1.18",
      letterSpacing: "0.045em",
      fontWeight: 650,
    },
    meta: {
      fontSize: "10px",
      lineHeight: "1.3",
      letterSpacing: "0.018em",
      fontWeight: 560,
    },
    mono: {
      fontSize: "10.4px",
      lineHeight: "1.08",
      fontWeight: 650,
    },
    bodyCompact: {
      fontSize: "11px",
      lineHeight: "1.24",
      fontWeight: 560,
    },
  },
  spacing: {
    4: "4px",
    8: "8px",
    12: "12px",
    16: "16px",
    24: "24px",
    32: "32px",
    48: "48px",
  },
  radius: {
    small: "6px",
    medium: "10px",
    large: "16px",
    pill: "999px",
  },
  shadows: {
    subtle: "0 10px 30px rgba(0, 0, 0, 0.18)",
    elevated: "0 18px 48px rgba(0, 0, 0, 0.28)",
  },
  layout: {
    page: {
      portraitWidth: "8.5in",
      portraitHeight: "11in",
      landscapeWidth: "11in",
      landscapeHeight: "8.5in",
      paddingTop: "40px",
      paddingRight: "40px",
      paddingBottom: "44px",
      paddingLeft: "40px",
      footerHeight: "28px",
    },
    grid: {
      columns: 12,
      gutter: "16px",
      compactGutter: "8px",
    },
    board: {
      pagePaddingTop: "12px",
      pagePaddingRight: "18px",
      pagePaddingBottom: "8px",
      pagePaddingLeft: "18px",
    },
  },
  components: {
    panel: {
      padding: "12px",
      compactPadding: "8px",
      insetHighlight: "inset 0 1px 0 rgba(255, 255, 255, 0.03)",
    },
    border: {
      width: "1px",
    },
  },
} as const;

export const colors = {
  bg: {
    preview: tokens.colors.background.preview,
    page: tokens.colors.background.page,
    pageAlt: tokens.colors.background.pageAlt,
    panel: tokens.colors.background.secondary,
    panelSoft: tokens.colors.background.tertiary,
    panelWash: tokens.colors.background.panelWash,
    panelRaised: tokens.colors.background.panelRaised,
    chip: tokens.colors.background.chip,
  },
  text: tokens.colors.text,
  border: {
    subtle: tokens.colors.border.subtle,
    standard: tokens.colors.border.standard,
    strong: tokens.colors.border.strong,
    emphasis: tokens.colors.border.emphasis,
  },
  accent: {
    primary: tokens.colors.accent.signal,
    secondary: tokens.colors.accent.positive,
    warning: tokens.colors.accent.warning,
    risk: tokens.colors.accent.risk,
    stable: tokens.colors.accent.stable,
  },
  signal: tokens.colors.signal,
  category: tokens.colors.category,
} as const;

export const typography = {
  fontFamily: tokens.typography.families.sans,
  title: tokens.typography.display,
  heading: tokens.typography.h1,
  subheading: tokens.typography.h2,
  body: tokens.typography.body,
  bodyCompact: tokens.typography.bodyCompact,
  meta: tokens.typography.meta,
  label: tokens.typography.caption,
  signalValue: tokens.typography.mono,
} as const;

export const spacing = {
  micro: tokens.spacing[4],
  xs: tokens.spacing[8],
  sm: tokens.spacing[12],
  md: tokens.spacing[16],
  lg: tokens.spacing[24],
  xl: tokens.spacing[32],
  xxl: tokens.spacing[48],
} as const;

export const layout = tokens.layout;

export const components = {
  radius: {
    sm: tokens.radius.small,
    md: tokens.radius.medium,
    lg: tokens.radius.medium,
    xl: tokens.radius.large,
    pill: tokens.radius.pill,
  },
  border: tokens.components.border,
  panel: tokens.components.panel,
  shadow: {
    none: "none",
    subtle: tokens.shadows.subtle,
    elevated: tokens.shadows.elevated,
  },
} as const;
