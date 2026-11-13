import FormActionButton from "./form-action-button";
import MediaStatusButton from "./media-status-button";
import {
  clearDisplayAction,
  nextSlideAction,
  previousSlideAction,
  resumeAutomaticAction,
  showLyricsAction,
  showVerseAction,
  showWelcomeAction,
} from "./form-actions";

export default function MediaControls() {
  return (
    <>
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <MediaStatusButton
          action={showWelcomeAction}
          label="Show Welcome"
          hint="Manual presentation"
          className="w-full rounded-2xl bg-purple-700 p-6 text-left text-white transition hover:bg-purple-800 btn-primary"
        />
        <MediaStatusButton
          action={resumeAutomaticAction}
          label="Resume automatic rotation"
          hint="Display mode"
          className="app-card w-full p-6 text-left transition hover:border-purple-300"
        />
        <MediaStatusButton
          action={clearDisplayAction}
          label="Clear auditorium display"
          hint="Emergency control"
          className="w-full rounded-2xl border border-red-200 bg-red-50 p-6 text-left text-red-900 transition hover:border-red-300"
        />
      </section>

      <section className="app-card mt-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700">
              Automatic presentation
            </p>
            <h2 className="mt-2 text-xl font-bold">Slide navigation</h2>
            <p className="mt-2 text-sm text-slate-600">
              Move through the automatic presentation without interrupting the live display.
            </p>
          </div>
          <div className="flex w-full gap-3 sm:w-auto">
            <MediaStatusButton
              action={previousSlideAction}
              label="← Previous"
              className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
            />
            <MediaStatusButton
              action={nextSlideAction}
              label="Next →"
              className="w-full rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white btn-primary"
            />
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <FormActionButton
          action={showVerseAction}
          label="Show verse on screen"
          className="mt-5 rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white btn-primary"
        >
          <div className="app-card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700">
              Bible presentation
            </p>
            <h2 className="mt-2 text-xl font-bold">Show Bible verse</h2>
            <label className="mt-5 block">
              <span className="text-sm font-semibold text-slate-700">Reference</span>
              <input
                name="reference"
                type="text"
                required
                maxLength={100}
                placeholder="John 3:16"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-500"
              />
            </label>
            <label className="mt-4 block">
              <span className="text-sm font-semibold text-slate-700">Verse text</span>
              <textarea
                name="verse"
                required
                maxLength={2000}
                rows={7}
                placeholder="Enter the verse text to display..."
                className="mt-2 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-500"
              />
            </label>
          </div>
        </FormActionButton>

        <FormActionButton
          action={showLyricsAction}
          label="Show lyrics on screen"
          className="mt-5 rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white btn-primary"
        >
          <div className="app-card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-purple-700">
              Worship presentation
            </p>
            <h2 className="mt-2 text-xl font-bold">Show song lyrics</h2>
            <label className="mt-5 block">
              <span className="text-sm font-semibold text-slate-700">Song title</span>
              <input
                name="songTitle"
                type="text"
                required
                maxLength={150}
                placeholder="Song title"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-500"
              />
            </label>
            <label className="mt-4 block">
              <span className="text-sm font-semibold text-slate-700">Lyrics</span>
              <textarea
                name="lyrics"
                required
                maxLength={2000}
                rows={7}
                placeholder="Enter lyrics to display..."
                className="mt-2 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-purple-500"
              />
            </label>
          </div>
        </FormActionButton>
      </section>
    </>
  );
}
