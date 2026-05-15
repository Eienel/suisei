import { useEffect } from 'react';
import { useApp } from '@/state/app';
import { useWorld } from '@/state/world';
import { LESSON_BY_ID, nextLessonId } from '@/data/lessons';
import { LessonRead } from './LessonRead';
import { LessonCheck } from './LessonCheck';
import { LessonDone } from './LessonDone';

export function LessonScreen() {
  const currentLessonId = useApp((s) => s.currentLessonId);
  const stage = useApp((s) => s.lessonStage);
  const setStage = useApp((s) => s.setLessonStage);
  const closeLesson = useApp((s) => s.closeLesson);
  const completeLesson = useApp((s) => s.completeLesson);
  const openLesson = useApp((s) => s.openLesson);
  const setMode = useWorld((s) => s.setMode);

  // Lessons operate on the lesson-only world so they don't disturb the
  // user's sandbox creation.
  useEffect(() => {
    setMode('lessons');
  }, [setMode]);

  if (!currentLessonId) return null;
  const lesson = LESSON_BY_ID[currentLessonId];
  if (!lesson) return null;

  if (stage === 'read') {
    return <LessonRead lesson={lesson} onAdvance={() => setStage('check')} />;
  }

  if (stage === 'check') {
    return (
      <LessonCheck
        lesson={lesson}
        onPass={() => {
          completeLesson(lesson.id);
          setStage('done');
        }}
        onReread={() => setStage('read')}
      />
    );
  }

  const next = nextLessonId(lesson.id);
  return (
    <LessonDone
      lesson={lesson}
      onNext={next ? () => openLesson(next) : null}
      onHome={closeLesson}
    />
  );
}
