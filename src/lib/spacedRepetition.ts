import { RepetitionData, ReviewRating } from '../types/flashcard';

export function createDefaultRepetition(): RepetitionData {
  return {
    state: 'new',
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    lapses: 0,
    dueDate: Date.now(),
  };
}

export function calculateNextReview(
  current: RepetitionData,
  rating: ReviewRating
): RepetitionData {
  let { state, interval, easeFactor, repetitions, lapses } = current;
  const now = Date.now();

  switch (rating) {
    case 'again': {
      lapses += 1;
      repetitions = 0;
      state = 'learning';
      // Next review in ~1 minute
      interval = 1 / (24 * 60); // 1 minute in days
      easeFactor = Math.max(1.3, easeFactor - 0.2);
      break;
    }
    case 'hard': {
      repetitions += 1;
      state = state === 'new' ? 'learning' : state;
      // Interval ~10 minutes if new/learning, or interval * 1.2 if in review
      interval = interval < 1 ? 10 / (24 * 60) : Math.max(1, interval * 1.2);
      easeFactor = Math.max(1.3, easeFactor - 0.15);
      break;
    }
    case 'good': {
      repetitions += 1;
      if (repetitions === 1) {
        interval = 1; // 1 day
        state = 'review';
      } else if (repetitions === 2) {
        interval = 3; // 3 days
        state = 'review';
      } else {
        interval = Math.round(interval * easeFactor);
        state = 'review';
      }
      break;
    }
    case 'easy': {
      repetitions += 1;
      state = 'review';
      if (repetitions === 1) {
        interval = 4; // 4 days
      } else {
        interval = Math.round(Math.max(4, interval * easeFactor * 1.3));
      }
      easeFactor = Math.min(3.0, easeFactor + 0.15);
      break;
    }
  }

  const dueDate = now + Math.round(interval * 24 * 60 * 60 * 1000);

  return {
    state,
    interval,
    easeFactor: Number(easeFactor.toFixed(2)),
    repetitions,
    lapses,
    dueDate,
    lastReviewed: now,
  };
}

export function formatIntervalPreview(
  current: RepetitionData,
  rating: ReviewRating
): string {
  const next = calculateNextReview(current, rating);
  const minutes = next.interval * 24 * 60;
  if (minutes < 2) return '1m';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = next.interval;
  if (days < 30) return `${Math.round(days)}d`;
  const months = days / 30;
  return `${months.toFixed(1)}mo`;
}
