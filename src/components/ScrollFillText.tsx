import React, { useRef } from 'react';
import { motion, MotionValue, useReducedMotion, useScroll, useTransform } from 'motion/react';

/** Letters never fade below this, so unrevealed text stays readable. */
const MIN_OPACITY = 0.4;

type Tag = 'h2' | 'h3';

const Letter: React.FC<{ char: string; index: number; total: number; progress: MotionValue<number> }> = ({ char, index, total, progress }) => {
  // Letters light up one after another, each over a window that overlaps its neighbours.
  const start = (index / total) * 0.8;
  const opacity = useTransform(progress, [start, start + 0.2], [MIN_OPACITY, 1]);
  return <motion.span aria-hidden="true" style={{ opacity }}>{char}</motion.span>;
};

const Animated = ({ text, as: Heading, className }: { text: string; as: Tag; className?: string }) => {
  const ref = useRef<HTMLHeadingElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 88%', 'start 52%'] });
  const words = text.split(/\s+/).filter(Boolean);
  const total = words.reduce((n, w) => n + w.length, 0) || 1;
  let seen = 0;

  return (
    <Heading ref={ref} aria-label={text} className={className}>
      {words.map((word, w) => {
        const first = seen;
        seen += word.length;
        return (
          <React.Fragment key={w}>
            {w > 0 && ' '}
            <span className="inline-block whitespace-nowrap">
              {Array.from(word).map((ch, i) => (
                <Letter key={i} char={ch} index={first + i} total={total} progress={scrollYProgress} />
              ))}
            </span>
          </React.Fragment>
        );
      })}
    </Heading>
  );
};

/** A heading whose letters light up one by one as it scrolls into view. Plain text when the visitor prefers reduced motion. */
export default function ScrollFillText({ text, as = 'h2', className }: { text: string; as?: Tag; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) {
    const Heading = as;
    return <Heading className={className}>{text}</Heading>;
  }
  return <Animated text={text} as={as} className={className} />;
}
