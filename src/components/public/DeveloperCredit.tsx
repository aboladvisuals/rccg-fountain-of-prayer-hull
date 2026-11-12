import s from "./public.module.css";

/**
 * Public developer attribution.
 *
 * Contact is inactive until the owner supplies an approved public number.
 * Set NEXT_PUBLIC_DEVELOPER_PHONE to an international number (e.g. +447700900000)
 * only after explicit approval. Do not invent a number.
 */

const DEVELOPER_NAME = "Emmanuel Abolade";
const DEVELOPER_TITLE = "Software Developer";

function approvedPhone(): string | null {
  const raw = process.env.NEXT_PUBLIC_DEVELOPER_PHONE?.trim();
  if (!raw || !raw.startsWith("+") || raw.length < 8) {
    return null;
  }
  return raw;
}

export default function DeveloperCredit() {
  const phone = approvedPhone();
  const telHref = phone ? `tel:${phone.replace(/\s+/g, "")}` : null;

  return (
    <p className={s.developerCredit}>
      <span>Website designed & developed by </span>
      {telHref ? (
        <a href={telHref} className={s.developerCreditLink}>
          {DEVELOPER_NAME}
          <span className={s.srOnly}>
            , {DEVELOPER_TITLE}. Call to discuss websites and software.
          </span>
        </a>
      ) : (
        <span className={s.developerCreditName}>{DEVELOPER_NAME}</span>
      )}
      <span className={s.developerCreditTitle}> · {DEVELOPER_TITLE}</span>
    </p>
  );
}
