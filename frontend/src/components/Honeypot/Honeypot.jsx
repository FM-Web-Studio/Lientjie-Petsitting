import { forwardRef, useState } from 'react';
import styles from './Honeypot.module.css';

// A field people never see or reach. Bots that fill every input fill this one too.
// It also notes when the form appeared: the server drops anything sent faster than a person can type.
const Honeypot = forwardRef(function Honeypot(_props, ref) {
  const [openedAt] = useState(() => Date.now());
  return (
    <div className={styles.trap} aria-hidden="true">
      <label>
        Leave this empty
        <input ref={ref} type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" data-opened={openedAt} />
      </label>
    </div>
  );
});

export default Honeypot;

/** True when the trap field was filled in, i.e. the submission is almost certainly a bot. */
export const caughtBot = (ref) => Boolean(ref.current?.value);

/** The trap value and how long the form was open, for the server's own bot check. */
export const trapFields = (ref) => ({
  website: ref.current?.value ?? '',
  elapsed: Date.now() - Number(ref.current?.dataset.opened ?? Date.now()),
});
