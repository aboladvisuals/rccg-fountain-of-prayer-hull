import ShowOnScreenButton from "./show-on-screen-button";

type Props = {
  names: string[];
};

export default function BirthdayPanel({ names }: Props) {
  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700">
          Presentation-safe content
        </p>

        <h2 className="mt-2 text-xl font-bold">
          Today&apos;s birthdays
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          Only people who have allowed their name to appear on the church display are included.
        </p>
      </div>

      {names.length === 0 ? (
        <div className="mt-5 rounded-xl bg-slate-50 p-5 text-sm text-slate-600">
          No display-approved birthdays today.
        </div>
      ) : (
        <div className="mt-5">
          <div className="flex flex-wrap gap-3">
            {names.map((name) => (
              <span
                key={name}
                className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900"
              >
                🎉 {name}
              </span>
            ))}
          </div>

          <ShowOnScreenButton
            slideType="birthday"
            title="Happy Birthday!"
            payload={{
              names,
            }}
          />
        </div>
      )}
    </section>
  );
}