import { typography } from "../design-tokens/typography";

export const exportTypography = {
  title: {
    fontSize: typography.title.fontSize,
    lineHeight: typography.title.lineHeight,
    letterSpacing: typography.title.letterSpacing,
    fontWeight: typography.title.fontWeight,
  },
  sectionTitle: {
    fontSize: typography.heading.fontSize,
    lineHeight: typography.heading.lineHeight,
    letterSpacing: typography.heading.letterSpacing,
    fontWeight: typography.heading.fontWeight,
  },
  cardTitle: {
    fontSize: typography.subheading.fontSize,
    lineHeight: typography.subheading.lineHeight,
    letterSpacing: typography.subheading.letterSpacing,
    fontWeight: typography.subheading.fontWeight,
  },
  body: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  meta: {
    fontSize: typography.meta.fontSize,
    lineHeight: typography.meta.lineHeight,
    letterSpacing: typography.meta.letterSpacing,
    fontWeight: typography.meta.fontWeight,
  },
} as const;
