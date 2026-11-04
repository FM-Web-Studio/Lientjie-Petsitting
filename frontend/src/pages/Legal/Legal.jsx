import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../../context/ContentContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import { LEGAL_UPDATED, privacyPolicy, termsOfUse } from '../../content/legal.js';
import PageHero from '../../components/PageHero';
import styles from './Legal.module.css';
import usePageMeta from '../../hooks/usePageMeta.js';

const LINK = /\[([^\]]+)\]\(([^)]+)\)/g;

// Plain text with [text](url) links. Site paths stay in the app, the rest open as normal links.
function Inline({ text }) {
  const parts = [];
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    parts.push(text.slice(last, m.index));
    const [, label, href] = m;
    parts.push(href.startsWith('/')
      ? <Link key={m.index} to={href}>{label}</Link>
      : <a key={m.index} href={href} {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{label}</a>);
    last = m.index + m[0].length;
  }
  parts.push(text.slice(last));
  return parts.map((p, i) => <Fragment key={i}>{p}</Fragment>);
}

function Legal({ build, other }) {
  const { copy } = useContent();
  const { bio } = useData();
  const brand = copy('brand').brandName;
  const info = copy('contact');
  const doc = build({
    brand,
    owner: bio?.name || 'Lientjie',
    email: info.email,
    phone: info.phone,
    location: info.location || bio?.location || 'Pretoria, South Africa',
    site: window.location.host,
  });

  usePageMeta({ title: doc.title });

  return (
    <div>
      <PageHero title={doc.title} subtitle={`Last updated ${LEGAL_UPDATED}`} emoji="📜" tone="teal" />

      <section className="section-tight">
        <div className="container">
          <article className={styles.sheet}>
            <p className={styles.intro}>{doc.intro}</p>

            {doc.sections.map((s, i) => (
              <section key={s.heading} className={styles.block}>
                <h2 className={styles.heading}><span className={styles.num}>{i + 1}</span>{s.heading}</h2>
                {s.blocks.map((b, j) => (Array.isArray(b)
                  ? <ul key={j}>{b.map((item) => <li key={item}><Inline text={item} /></li>)}</ul>
                  : <p key={j}><Inline text={b} /></p>))}
              </section>
            ))}

            <p className={styles.other}>See also the <Link to={other.to} className="link">{other.label}</Link>.</p>
          </article>
        </div>
      </section>
    </div>
  );
}

export function Privacy() {
  return <Legal build={privacyPolicy} other={{ to: '/terms', label: 'terms of use' }} />;
}

export function Terms() {
  return <Legal build={termsOfUse} other={{ to: '/privacy', label: 'privacy policy' }} />;
}
