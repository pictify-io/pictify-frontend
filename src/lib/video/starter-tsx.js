/**
 * The composition a brand-new Remotion template starts from.
 *
 * Extracted from the old code-view editor so the studio can use it too. It has
 * to compile on first paint: the live player transpiles and mounts immediately,
 * and a starter that throws would greet every new Remotion template with an
 * error panel instead of a picture.
 *
 * It declares a `schema`, because that is what the studio reads to populate the
 * Variables tab — a starter with no schema teaches that Remotion templates
 * cannot be parameterised, which is the opposite of the point.
 */
export const STARTER_TSX = `import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig
} from 'remotion';

export const schema = {
  title: { type: 'string', default: 'Hello from Pictify' },
  accentColor: { type: 'color', default: '#FACC15' }
};

export default function Scene({ title = 'Hello from Pictify', accentColor = '#FACC15' }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const pop = spring({ frame, fps, config: { damping: 14 } });
  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp'
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#111111',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: fadeOut
      }}
    >
      <h1
        style={{
          color: accentColor,
          fontSize: 120,
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center',
          transform: 'scale(' + pop + ')'
        }}
      >
        {title}
      </h1>
    </AbsoluteFill>
  );
}
`;
