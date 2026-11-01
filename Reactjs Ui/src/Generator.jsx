import { useEffect, useRef, useState } from 'react';
import { request } from './api';
import LocationMap from './LocationMap';
import QRDesign from './QRDesign';
import { usePreferences } from './preferences';
const services = [['url', 'Link'], ['text', 'Text'], ['wifi', 'Wi-Fi'], ['location', 'Location']];
const initial = { text: '', ssid: '', password: '', encryption: 'WPA', latitude: '25.383', longitude: '49.586', dotColor: '#000000', bgColor: '#ffffff', size: 480, dotColor2: '#5929a3', bgColor2:'#eaf0ff', dotGradient:false,bgGradient:false,transparent:false,dotShape:'square',gradientAngle:'45',logo:'', iconId:'', iconColor:'#000000', caption:'' };
export default function Generator({features: featureSettings, preview=false}) {
  const {t}=usePreferences();
  const features={logos:true,gradients:true,transparency:true,location:true,...featureSettings};
  const [kind, setKind] = useState('url');
  const [values, setValues] = useState(initial);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [blob, setBlob] = useState(null);
  const [url, setUrl] = useState('');
  const current = useRef(0);
  const controller = useRef(null);
  useEffect(() => () => { current.current += 1; controller.current?.abort(); }, []);
  useEffect(() => {
    if (!blob) { setUrl(''); return; }
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);
  function invalidate() {
    current.current += 1;
    controller.current?.abort();
    setBusy(false); setBlob(null); setError('');
  }
  function update(patch) { invalidate(); setValues(old => ({ ...old, ...patch })); }
  function changeKind(next) { invalidate(); if ((next==='wifi')!==(kind==='wifi')) setValues(old=>({...old,iconId:''})); setKind(next); }
  async function generate(event) {
    event.preventDefault();
    controller.current?.abort();
    const requestController = new AbortController();
    controller.current = requestController;
    const id = ++current.current;
    setBusy(true); setError(''); setBlob(null);
    const payload = { kind, dotColor: values.dotColor, bgColor: values.bgColor, size: Number(values.size), dotColor2:values.dotColor2,bgColor2:values.bgColor2,dotGradient:features.gradients&&values.dotGradient,bgGradient:features.gradients&&values.bgGradient,transparent:features.transparency&&values.transparent,dotShape:values.dotShape,gradientAngle:Number(values.gradientAngle),logo:features.logos?values.logo:'', iconId:features.logos?values.iconId:'', iconColor:values.iconColor, caption:values.caption,
      ...(kind === 'wifi' ? { ssid: values.ssid, password: values.encryption === 'nopass' ? '' : values.password, encryption: values.encryption } :
        kind === 'location' ? { latitude: Number(values.latitude), longitude: Number(values.longitude) } : { text: values.text }) };
    try {
      const image = await request('/qr/generate-qr', { method: 'POST', body: payload, signal: requestController.signal });
      if (id === current.current) setBlob(image);
    } catch (err) {
      if (id === current.current && !requestController.signal.aborted) setError(t(err.message));
    } finally { if (id === current.current) setBusy(false); }
  }
  let complete = false;
  if (kind === 'text') complete = Boolean(values.text.trim());
  if (kind === 'url') {
    try { const parsed = new URL(values.text); complete = ['http:', 'https:'].includes(parsed.protocol) && !parsed.username && !parsed.password; } catch { /* Keep editing freely. */ }
  }
  if (kind === 'wifi') complete = Boolean(values.ssid && (values.encryption === 'nopass' || values.password));
  if (preview) complete = false;
  if (kind === 'location') complete = values.latitude !== '' && values.longitude !== '' && Number.isFinite(Number(values.latitude)) && Number.isFinite(Number(values.longitude)) && Math.abs(Number(values.latitude)) <= 90 && Math.abs(Number(values.longitude)) <= 180;
  const field = key => ({ value: values[key], onChange: event => update({ [key]: event.target.value }) });
  return <>
    <div className="service-tabs" role="group" aria-label={t('QR code type')}>
      {services.filter(([key])=>key!=='location'||features.location).map(([value, label]) => <button type="button" key={value} aria-pressed={kind === value} onClick={() => changeKind(value)}>{t(label)}</button>)}
    </div>
    <div className="generator-grid">
      <form className="panel" onSubmit={generate} aria-label={t('QR code generator')}>
        <h2>{t(services.find(([key]) => key === kind)[1])} {t('QR code')}</h2>
        {(kind === 'url' || kind === 'text') && <div className="field">
          <label htmlFor="qr-text">{t(kind === 'url' ? 'Website link' : 'Your text')}</label>
          {kind === 'url' ? <input id="qr-text" type="url" placeholder="https://example.com" required maxLength={1500} {...field('text')} /> :
            <textarea id="qr-text" rows={4} required maxLength={1500} placeholder={t('Enter the text to share')} {...field('text')} />}
          <small>{t(kind === 'url' ? 'Include http:// or https://. Validation happens when you generate.' : 'Use a larger QR size for longer text.')}</small>
        </div>}
        {kind === 'wifi' && <>
          <div className="field"><label htmlFor="ssid">{t("Network name (SSID)")}</label><input id="ssid" required maxLength={32} autoComplete="off" {...field('ssid')} /></div>
          <div className="field"><label htmlFor="encryption">{t("Security type")}</label><select id="encryption" {...field('encryption')}><option value="WPA">{t("WPA / WPA2-Personal")}</option><option value="WEP">{t("WEP (legacy)")}</option><option value="nopass">{t("No password")}</option></select></div>
          {values.encryption !== 'nopass' && <div className="field"><label htmlFor="wifi-password">{t("Wi-Fi password")}</label><div className="password-field"><input id="wifi-password" type={showPassword ? 'text' : 'password'} required maxLength={128} autoComplete="off" {...field('password')} /><button className="text-button" type="button" aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{t(showPassword ? 'Hide password' : 'Show password')}</button></div></div>}
          <p className="hint">{t("Anyone who scans this code can read the network details. Share it with people you trust.")}</p>
        </>}
        {kind === 'location' && <>
          <div className="two-columns"><div className="field"><label htmlFor="latitude">{t("Latitude")}</label><input id="latitude" type="number" min="-90" max="90" step="any" required {...field('latitude')} /></div><div className="field"><label htmlFor="longitude">{t("Longitude")}</label><input id="longitude" type="number" min="-180" max="180" step="any" required {...field('longitude')} /></div></div>
          <LocationMap latitude={Number(values.latitude)} longitude={Number(values.longitude)} onChange={update} />
          <p className="hint">{t("Enter coordinates or select a point on the map. The map uses OpenStreetMap.")}</p>
        </>}
        <QRDesign values={values} update={update} features={features} kind={kind} />
        {error && <p role="alert" className="alert error">{error}</p>}
        <button className="button primary" type="submit" disabled={preview || busy || !complete}>{t(busy ? 'Generating…' : 'Generate QR code')}</button>
      </form>
      <section className="panel preview-panel" aria-labelledby="preview-title" aria-busy={busy}>
        <h2 id="preview-title">{t("Your QR code")}</h2>
        <div className="qr-preview">{blob && url ? <img src={url} alt={t('Generated QR code for the selected service')} /> : <div className="empty-preview"><span aria-hidden="true">▦</span><p>{t(busy ? 'Creating your code…' : 'Your preview will appear here.')}</p></div>}</div>
        <p className="hint" role="status">{t(blob ? 'Ready. Test the code with your phone before sharing.' : 'Changing any setting clears the old preview.')}</p>
        {blob && url ? <a className="button secondary" href={url} download={'qr-code-' + kind + '.png'}>{t("Download PNG")}</a> : <button className="button secondary" type="button" disabled>{t("Download PNG")}</button>}
      </section>
    </div>
  </>;
}
