import s from "./public.module.css";

/**
 * Public developer attribution.
 * Approved public business number for calls and WhatsApp.
 * Not a church contact.
 */

const DEVELOPER_NAME = "Emmanuel Abolade";
const DEVELOPER_TITLE = "Software Developer";
const PHONE_DISPLAY = "+44 7876 010071";
const PHONE_TEL = "+447876010071";
const WHATSAPP = "https://wa.me/447876010071";

export default function DeveloperCredit() {
  return (
    <p className={s.developerCredit}>
      <span>Website designed & developed by </span>
      <span className={s.developerCreditName}>{DEVELOPER_NAME}</span>
      <span className={s.developerCreditTitle}> · {DEVELOPER_TITLE}</span>
      <span className={s.developerCreditLinks}>
        <a href={`tel:${PHONE_TEL}`} className={s.developerCreditLink}>
          Call Developer
          <span className={s.srOnly}> on {PHONE_DISPLAY}</span>
        </a>
        <a
          href={WHATSAPP}
          className={s.developerCreditLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp Developer
          <span className={s.srOnly}> at {PHONE_DISPLAY} (opens in a new tab)</span>
        </a>
        <span className={s.developerCreditNumber}>{PHONE_DISPLAY}</span>
      </span>
    </p>
  );
}
