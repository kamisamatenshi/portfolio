let cleanupController = new AbortController();

function bootSite() {
  cleanupController.abort();
  cleanupController = new AbortController();
  const { signal } = cleanupController;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const progress = document.querySelector<HTMLElement>('[data-progress]');
  const revealNodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  const driftNodes = Array.from(document.querySelectorAll<HTMLElement>('[data-drift]'));
  const pointer = document.querySelector<HTMLElement>('[data-pointer]');
  const pointerLabel = document.querySelector<HTMLElement>('[data-pointer-label]');

  const updateScroll = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const ratio = Math.min(1, Math.max(0, window.scrollY / max));
    if (progress) progress.style.transform = `scaleX(${ratio})`;

    if (!reducedMotion) {
      driftNodes.forEach((node) => {
        const rect = node.getBoundingClientRect();
        const centerOffset = (rect.top + rect.height * 0.5 - window.innerHeight * 0.5) / window.innerHeight;
        const strength = Number(node.dataset.drift || 18);
        node.style.setProperty('--drift-y', `${centerOffset * strength}px`);
      });
    }
  };

  let scrollFrame = 0;
  const onScroll = () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = 0;
      updateScroll();
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true, signal });
  window.addEventListener('resize', onScroll, { passive: true, signal });
  updateScroll();

  if (reducedMotion) {
    revealNodes.forEach((node) => node.classList.add('is-inview'));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add('is-inview');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );

    revealNodes.forEach((node) => observer.observe(node));
    signal.addEventListener('abort', () => observer.disconnect(), { once: true });
  }

  document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((stage) => {
    const reset = () => {
      stage.style.setProperty('--rx', '0deg');
      stage.style.setProperty('--ry', '0deg');
    };

    if (!finePointer || reducedMotion) {
      reset();
      return;
    }

    stage.addEventListener(
      'pointermove',
      (event) => {
        const rect = stage.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        stage.style.setProperty('--ry', `${x * 4}deg`);
        stage.style.setProperty('--rx', `${y * -4}deg`);
      },
      { signal },
    );
    stage.addEventListener('pointerleave', reset, { signal });
  });

  if (pointer && pointerLabel && finePointer && !reducedMotion) {
    document.body.classList.add('has-custom-pointer');

    window.addEventListener(
      'pointermove',
      (event) => {
        pointer.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      },
      { signal },
    );

    document.querySelectorAll<HTMLElement>('[data-cursor]').forEach((target) => {
      target.addEventListener(
        'pointerenter',
        () => {
          pointer.dataset.active = 'true';
          pointerLabel.textContent = target.dataset.cursor || 'OPEN';
        },
        { signal },
      );
      target.addEventListener(
        'pointerleave',
        () => {
          pointer.dataset.active = 'false';
        },
        { signal },
      );
    });
  } else {
    document.body.classList.remove('has-custom-pointer');
  }
}

bootSite();
document.addEventListener('astro:page-load', bootSite);
