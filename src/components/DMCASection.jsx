import React, { useState } from 'react';

const PLATFORMS = [
  { name: 'Facebook',   icon: 'fa-brands fa-facebook',  color: '#1877f2', url: 'https://www.facebook.com/help/contact/174210519303259' },
  { name: 'Instagram',  icon: 'fa-brands fa-instagram', color: '#e1306c', url: 'https://help.instagram.com/contact/926243567375788' },
  { name: 'X (Twitter)',icon: 'fa-brands fa-x-twitter', color: '#ffffff', url: 'https://help.twitter.com/forms/private_information' },
  { name: 'YouTube',    icon: 'fa-brands fa-youtube',   color: '#ff0000', url: 'https://www.youtube.com/reportabuse' },
  { name: 'Google',     icon: 'fa-brands fa-google',    color: '#4285f4', url: 'https://support.google.com/legal/troubleshooter/1114905' },
  { name: 'Snapchat',   icon: 'fa-brands fa-snapchat',  color: '#fffc00', url: 'https://www.snapchat.com/safety/report' },
];

function generateNotice(name, email, url) {
  const today = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  const n = name  || '[Your Full Name]';
  const e = email || '[Your Email]';
  const u = url   || '[URL of infringing content]';
  return `DMCA TAKEDOWN NOTICE
Date: ${today}

To Whom It May Concern,

I, ${n} (${e}), hereby submit this formal DMCA Takedown Notice under the Digital Millennium Copyright Act (17 U.S.C. § 512).

INFRINGING CONTENT:
The following URL contains a AI-generated deepfake image that uses my likeness without consent:
${u}

STATEMENT:
I have a good faith belief that the use of this material is not authorized by the copyright owner, its agent, or the law. This content was identified as a deepfake by DeepEx AI with high confidence.

I request the immediate removal of the above content from your platform.

I declare, under penalty of perjury, that the information in this notice is accurate and that I am the person whose rights are being violated.

Sincerely,
${n}
${e}`;
}

export default function DMCASection({ mediaType = 'image' }) {
  const [open, setOpen] = useState(false);
  const [dmcaName, setDmcaName] = useState('');
  const [dmcaEmail, setDmcaEmail] = useState('');
  const [dmcaURL, setDmcaURL] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const notice = generateNotice(dmcaName, dmcaEmail, dmcaURL);

  function copyDMCA() {
    navigator.clipboard.writeText(notice).then(() => {
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 3000);
    });
  }

  return (
    <div className="takedown-section">
      <div className="takedown-title">🚨 Take Action Against This Deepfake</div>
      <div className="takedown-subtitle">
        Report this {mediaType} directly on major platforms or generate a legal DMCA takedown notice
      </div>

      <div className="platform-grid">
        {PLATFORMS.map(p => (
          <a key={p.name} className="platform-btn" href={p.url} target="_blank" rel="noreferrer">
            <i className={p.icon} style={{ color: p.color, fontSize: '18px' }}></i>
            {p.name}
          </a>
        ))}
      </div>

      <button className="dmca-toggle-btn" onClick={() => setOpen(o => !o)}>
        📄 Generate DMCA Takedown Notice
      </button>

      {open && (
        <div className="dmca-box">
          <label>Your Full Name</label>
          <input type="text" placeholder="e.g. Yogesh Rana" value={dmcaName} onChange={e => setDmcaName(e.target.value)} />

          <label>Your Email Address</label>
          <input type="email" placeholder="e.g. you@email.com" value={dmcaEmail} onChange={e => setDmcaEmail(e.target.value)} />

          <label>URL where the deepfake is posted</label>
          <input type="text" placeholder="e.g. https://instagram.com/p/abc123" value={dmcaURL} onChange={e => setDmcaURL(e.target.value)} />

          <label>Generated DMCA Notice (copy &amp; send to platform)</label>
          <textarea readOnly value={notice} />

          <button className="dmca-copy-btn" onClick={copyDMCA}>📋 Copy DMCA Notice</button>
          {toastVisible && <div className="copy-toast">✅ Copied to clipboard!</div>}
        </div>
      )}
    </div>
  );
}
