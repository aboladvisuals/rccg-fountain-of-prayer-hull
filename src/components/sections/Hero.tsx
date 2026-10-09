import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-white to-purple-50">
      <div className="mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:px-10">
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-purple-700">
            Redeemed Christian Church of God
          </p>

          <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Welcome to Fountain of Prayer Hull
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            A Christ-centred family where people grow in faith, prayer,
            worship, fellowship and service.
          </p>

          <p className="mt-4 text-base font-medium text-purple-800">
            “Jesus Christ is the same yesterday and today and forever.”
            <span className="ml-2 text-slate-500">Hebrews 13:8</span>
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/visit"
              className="rounded-xl bg-purple-700 px-6 py-3 text-center font-semibold text-white transition hover:bg-purple-800"
            >
              Plan Your Visit
            </Link>

            <Link
              href="/login"
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-center font-semibold text-slate-900 transition hover:border-purple-300 hover:bg-purple-50"
            >
              Member Login
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-purple-100 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700">
            Join us
          </p>

          <h2 className="mt-3 text-2xl font-bold text-slate-950">
            Worship with us in Hull
          </h2>

          <div className="mt-6 space-y-5 text-slate-700">
            <div>
              <p className="font-semibold text-slate-950">Sunday Worship</p>
              <p className="mt-1 text-sm text-slate-600">
                Service information will be published here.
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-950">Prayer & Fellowship</p>
              <p className="mt-1 text-sm text-slate-600">
                Weekly church gatherings and ministry activities.
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-950">First time with us?</p>
              <p className="mt-1 text-sm text-slate-600">
                We would love to welcome you and help you feel at home.
              </p>
            </div>
          </div>

          <Link
            href="/visit"
            className="mt-8 inline-flex font-semibold text-purple-700"
          >
            I’m new here →
          </Link>
        </div>
      </div>
    </section>
  );
}
