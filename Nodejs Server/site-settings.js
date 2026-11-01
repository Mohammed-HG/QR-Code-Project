const { HttpError } = require('./lib/errors');
const defaults = {
  content: {
    en: { title: 'Your next QR code starts here.', welcome: 'Welcome! Turn your ideas into a QR code that feels like you.', subtitle: 'Share links, text, Wi-Fi and locations. Style your code and download it instantly.', instructionsTitle: 'From an idea to a scan in three steps', steps: ['Choose the information you want to share.', 'Pick a pattern, colors and an optional logo.', 'Generate, download and test your QR code before sharing.'], benefitsTitle: 'Designed for your everyday moments', benefits: ['Six distinct patterns', 'Two-color gradients and transparent backgrounds', 'Your own icon or logo', 'No generated codes stored on the server'], aboutTitle: 'Small codes. Endless possibilities.', about: 'QR Code Project helps you share links, text, network details and locations in a beautifully customized code. Generated images are returned directly to your browser. Test the final result on the background where you will use it.', footer: 'Create. Customize. Share.' },
    ar: { title: 'رمزك القادم يبدأ من هنا.', welcome: 'أهلًا بك! حوّل أفكارك إلى رمز QR يعكس ذوقك.', subtitle: 'شارك الروابط والنصوص وشبكات Wi-Fi والمواقع، وخصّص رمزك وحمّله فورًا.', instructionsTitle: 'من الفكرة إلى المسح في ثلاث خطوات', steps: ['اختر المعلومات التي تريد مشاركتها.', 'خصّص النمط والألوان وأضف شعارك إن رغبت.', 'ولّد الرمز وحمّله واختبره قبل مشاركته.'], benefitsTitle: 'خيارات تناسب تفاصيل يومك', benefits: ['ستة أنماط متنوعة', 'تدرجات بلونين وخلفيات شفافة', 'إضافة أيقونتك أو شعارك', 'لا تُحفظ الرموز المولّدة على الخادم'], aboutTitle: 'رموز صغيرة، وإمكانات واسعة.', about: 'يساعدك QR Code Project على مشاركة الروابط والنصوص وبيانات الشبكات والمواقع برمز يعكس ذوقك. تُرسل الصور المولّدة مباشرة إلى متصفحك. اختبر النتيجة على الخلفية التي ستستخدمها عليها.', footer: 'أنشئ. خصّص. شارك.' },
  },
  appearance: { defaultTheme: 'light', lightBackground: '#f2f5fa', darkBackground: '#0d1422', accent: '#2457d6', maxWidth: 1184, gap: 24, radius: 18, headingSize: 42, panelPadding: 28 },
  sections: [{ id: 'welcome', visible: true }, { id: 'instructions', visible: true }, { id: 'generator', visible: true }, { id: 'benefits', visible: true }],
  features: { registration: true, logos: true, gradients: true, transparency: true, location: true },
};
const copyDefaults = () => structuredClone(defaults);
function validateSettings(input) {
  const fail = () => { throw new HttpError(400, 'Invalid site settings.'); };
  if (!input || typeof input !== 'object') fail();
  const output = copyDefaults();
  for (const lang of ['en', 'ar']) {
    const content = input.content?.[lang];
    if (!content || typeof content !== 'object') fail();
    for (const key of ['title','welcome','subtitle','instructionsTitle','benefitsTitle','aboutTitle','about','footer']) {
      if (typeof content[key] !== 'string' || !content[key].trim() || content[key].length > (key === 'about' ? 2000 : 400)) fail();
      output.content[lang][key] = content[key].trim();
    }
    for (const key of ['steps','benefits']) {
      if (!Array.isArray(content[key]) || content[key].length < 1 || content[key].length > 6 ||
          content[key].some(text => typeof text !== 'string' || !text.trim() || text.length > 300)) fail();
      output.content[lang][key] = content[key].map(text => text.trim());
    }
  }
  const appearance = input.appearance;
  if (!appearance || !['light','dark'].includes(appearance.defaultTheme)) fail();
  output.appearance.defaultTheme = appearance.defaultTheme;
  for (const key of ['lightBackground','darkBackground','accent']) {
    if (typeof appearance[key] !== 'string' || !/^#[a-f0-9]{6}$/i.test(appearance[key])) fail();
    output.appearance[key] = appearance[key];
  }
  for (const [key,min,max] of [['maxWidth',900,1440],['gap',12,48],['radius',8,28],['headingSize',28,56],['panelPadding',16,40]]) {
    if (!Number.isInteger(appearance[key]) || appearance[key] < min || appearance[key] > max) fail();
    output.appearance[key] = appearance[key];
  }
  if (!Array.isArray(input.sections) || input.sections.length !== 4 ||
      new Set(input.sections.map(section => section.id)).size !== 4) fail();
  const ids = defaults.sections.map(section => section.id);
  output.sections = input.sections.map(section => {
    if (!ids.includes(section.id) || typeof section.visible !== 'boolean' || (section.id === 'generator' && !section.visible)) fail();
    return { id: section.id, visible: section.visible };
  });
  for (const key of Object.keys(defaults.features)) {
    if (typeof input.features?.[key] !== 'boolean') fail();
    output.features[key] = input.features[key];
  }
  return output;
}
module.exports = { copyDefaults, validateSettings };
