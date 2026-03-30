import { colors } from "../design-tokens/colors";
import { components } from "../design-tokens/components";
import { layout } from "../design-tokens/layout";
import { spacing } from "../design-tokens/spacing";

export const exportTokens = {
  spacing: {
    xs: spacing.xs,
    sm: spacing.sm,
    md: spacing.lg,
    lg: spacing.xl,
    xl: spacing.xxl,
    pageX: layout.board.pagePaddingRight,
    pageY: layout.page.paddingTop,
  },
  radius: {
    sm: components.radius.sm,
    md: components.radius.lg,
    lg: components.radius.xl,
  },
  colors: {
    bg: colors.bg.page,
    panel: colors.bg.panel,
    panelAlt: colors.bg.panelSoft,
    border: colors.border.standard,
    ink: colors.text.primary,
    muted: colors.text.tertiary,
    accent: colors.accent.primary,
    accentAlt: colors.accent.secondary,
    stable: colors.accent.stable,
    attention: colors.accent.warning,
  },
} as const;
