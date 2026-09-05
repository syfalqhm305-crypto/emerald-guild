// إعدادات Tailwind الموحّدة لكل صفحات موقع نقابة الزمرد
// تم استخراجها من ملفات التصميم الأصلية بدون أي تغيير في الألوان أو الخطوط أو المقاسات
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'secondary-container': '#00a572',
        'tertiary': '#cdfff4',
        'on-secondary-fixed-variant': '#005236',
        'on-surface': '#dde4e2',
        'inverse-surface': '#dde4e2',
        'on-error-container': '#ffdad6',
        'surface-tint': '#00e1a9',
        'on-primary-fixed': '#002116',
        'error-container': '#93000a',
        'secondary-fixed': '#6ffbbe',
        'on-secondary-container': '#00311f',
        'outline': '#84958b',
        'background': '#0e1514',
        'error': '#ffb4ab',
        'tertiary-fixed': '#6ef9e2',
        'surface': '#0e1514',
        'primary-fixed': '#39ffc3',
        'surface-container-lowest': '#090f0e',
        'secondary-fixed-dim': '#4edea3',
        'secondary': '#4edea3',
        'on-surface-variant': '#b9cbc0',
        'on-primary-fixed-variant': '#00513b',
        'surface-container-low': '#161d1c',
        'on-tertiary-container': '#006a5e',
        'tertiary-fixed-dim': '#4ddcc6',
        'outline-variant': '#3a4a42',
        'surface-bright': '#333b39',
        'on-error': '#690005',
        'on-primary': '#003828',
        'inverse-on-surface': '#2b3230',
        'surface-container': '#1a2120',
        'on-tertiary': '#003730',
        'tertiary-container': '#63eed8',
        'on-secondary': '#003824',
        'surface-dim': '#0e1514',
        'surface-container-highest': '#2f3635',
        'on-background': '#dde4e2',
        'primary-container': '#00f5b8',
        'on-secondary-fixed': '#002113',
        'on-tertiary-fixed': '#00201b',
        'primary': '#d1ffe8',
        'surface-variant': '#2f3635',
        'on-primary-container': '#006b4f',
        'on-tertiary-fixed-variant': '#005047',
        'surface-container-high': '#242b2a',
        'inverse-primary': '#006c4f',
        'primary-fixed-dim': '#00e1a9'
      },
      borderRadius: { DEFAULT: '0.25rem', lg: '0.5rem', xl: '0.75rem', full: '9999px' },
      spacing: {
        'gutter-sm': '0.5rem', 'max-content-width': '88rem', 'gutter-xl': '2rem',
        'gutter-xs': '0.25rem', 'vault-rail-width': '22rem', 'gutter-md': '1rem',
        'sidebar-width': '17.5rem', 'gutter-lg': '1.5rem'
      },
      fontFamily: {
        'body-md': ['beVietnamPro'], 'headline-md': ['sora'], 'body-lg': ['beVietnamPro'],
        'headline-lg': ['sora'], 'label-counter': ['spaceGrotesk'], 'display-hero-mobile': ['sora'],
        'display-hero': ['sora'], 'body-sm': ['beVietnamPro'], 'headline-sm': ['sora'],
        'label-cyber': ['spaceGrotesk']
      },
      fontSize: {
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'headline-lg': ['32px', { lineHeight: '40px', fontWeight: '600' }],
        'label-counter': ['11px', { lineHeight: '14px', letterSpacing: '0.12em', fontWeight: '500' }],
        'display-hero-mobile': ['32px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '700' }],
        'display-hero': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'body-sm': ['12px', { lineHeight: '18px', fontWeight: '400' }],
        'headline-sm': ['18px', { lineHeight: '26px', fontWeight: '600' }],
        'label-cyber': ['13px', { lineHeight: '16px', letterSpacing: '0.08em', fontWeight: '600' }]
      }
    }
  }
};
