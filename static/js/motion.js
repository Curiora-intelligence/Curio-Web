// Presentation only: one interruptible volume, with no frame loop or transport state.
export function initLiquidSelection(control) {
  const indicator = control.querySelector('.mode-indicator');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let active = null;
  const origin = () => control.getBoundingClientRect().left + control.clientLeft;
  const destination = () => {
    const tab = control.querySelector(`#${control.dataset.workspace}-tab`);
    const rect = tab.getBoundingClientRect();
    return {x: rect.left - origin(), width: rect.width};
  };
  const rest = ({x, width}) => ({transform: `translateX(${x}px) scaleY(1)`, width: `${width}px`, borderRadius: '999px'});
  function settle() {
    active?.cancel();
    active = null;
    Object.assign(indicator.style, rest(destination()));
    control.dataset.motion = 'rest';
  }
  function select(name) {
    if (control.dataset.workspace === name) return;
    // Read before cancel: reversals inherit the rendered edges and curvature.
    const rect = indicator.getBoundingClientRect(), css = getComputedStyle(indicator);
    const start = {x: rect.left - origin(), width: rect.width};
    const first = {transform: css.transform, width: css.width, borderRadius: css.borderRadius, offset: 0};
    active?.cancel();
    active = null;
    control.dataset.workspace = name;
    const end = destination();
    const duration = parseFloat(getComputedStyle(control).getPropertyValue('--duration-mode'));
    if (reduced.matches || !duration || !indicator.animate) { settle(); return; }
    const rightward = end.x + end.width / 2 > start.x + start.width / 2;
    const mix = (a, b, t) => a + (b - a) * t;
    function shape(offset, leading, trailing, height, radius) {
      const left = mix(start.x, end.x, rightward ? trailing : leading);
      const right = mix(start.x + start.width, end.x + end.width, rightward ? leading : trailing);
      return {offset, transform: `translateX(${left}px) scaleY(${height})`, width: `${right - left}px`, borderRadius: radius};
    }
    // Stretch the leading edge; flow across the center; let the tail catch up.
    // Both edges stay between their starting and destination positions.
    const round = rightward ? '22px 30px 26px 18px / 48% 52% 48% 52%' : '30px 22px 18px 26px / 52% 48% 52% 48%';
    const frames = [first,
      shape(.22, .40, .035, .94, round),
      shape(.56, .88, .43, .96, round),
      shape(.82, .995, .84, .99, '24px 24px 24px 24px / 50% 50% 50% 50%'),
      {...rest(end), offset: 1}
    ];
    // Underlying style is already the destination; finishing/canceling cannot leave a stale shape.
    Object.assign(indicator.style, rest(end));
    control.dataset.motion = 'flowing';
    const animation = indicator.animate(frames, {duration, easing: 'linear', fill: 'none'});
    active = animation;
    animation.onfinish = () => { if (active === animation) settle(); };
  }
  reduced.addEventListener('change', settle);
  new ResizeObserver(settle).observe(control);
  window.addEventListener('pagehide', settle);
  settle();
  return select;
}
