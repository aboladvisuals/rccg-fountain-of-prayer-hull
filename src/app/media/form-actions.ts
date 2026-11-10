"use server";

import {
  navigateAutomaticSlides,
  setPresentationMode,
  showManualSlide,
} from "./actions";

export async function showVerseAction(formData: FormData) {
  const reference = String(formData.get("reference") ?? "").trim();
  const verse = String(formData.get("verse") ?? "").trim();

  if (!reference || !verse) {
    return { ok: false, message: "Reference and verse text are required." };
  }

  return showManualSlide({
    slideType: "verse",
    title: reference,
    content: verse,
  });
}

export async function showLyricsAction(formData: FormData) {
  const songTitle = String(formData.get("songTitle") ?? "").trim();
  const lyrics = String(formData.get("lyrics") ?? "").trim();

  if (!songTitle || !lyrics) {
    return { ok: false, message: "Song title and lyrics are required." };
  }

  return showManualSlide({
    slideType: "lyrics",
    title: songTitle,
    content: lyrics,
  });
}

export async function showWelcomeAction() {
  return showManualSlide({
    slideType: "welcome",
    title: "Welcome to Fountain of Prayer Hull",
    content: "Jesus Christ the same yesterday, and today, and forever.",
  });
}

export async function resumeAutomaticAction() {
  return setPresentationMode("auto");
}

export async function clearDisplayAction() {
  return setPresentationMode("blank");
}

export async function previousSlideAction() {
  return navigateAutomaticSlides("previous");
}

export async function nextSlideAction() {
  return navigateAutomaticSlides("next");
}
