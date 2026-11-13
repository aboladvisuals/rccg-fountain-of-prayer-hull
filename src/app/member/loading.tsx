export default function Loading() {
  return (
    <main className="app-page">
      <div className="mx-auto max-w-6xl" aria-busy="true">
        <p role="status" className="sr-only">Loading your member dashboard…</p>
        <div className="skeleton h-44 sm:h-52" />
        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          <div className="skeleton h-56 lg:col-span-7" />
          <div className="skeleton h-56 lg:col-span-5" />
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="skeleton h-40" />
          ))}
        </div>
      </div>
    </main>
  );
}
