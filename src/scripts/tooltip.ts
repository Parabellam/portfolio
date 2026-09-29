// Tooltip compartido: cualquier elemento con data-tip lo muestra al pasar el mouse o al tocarlo.
const tip = document.getElementById('tip')!;

function show(target: HTMLElement) {
  tip.textContent = '';
  const [title, ...rest] = (target.dataset.tip ?? '').split('\n');
  const strong = document.createElement('strong');
  strong.textContent = title;
  tip.append(strong);
  for (const line of rest) {
    const p = document.createElement('span');
    p.textContent = line;
    tip.append(p);
  }
  tip.hidden = false;

  const r = target.getBoundingClientRect();
  const t = tip.getBoundingClientRect();
  const left = Math.min(Math.max(8, r.left + r.width / 2 - t.width / 2), window.innerWidth - t.width - 8);
  const top = r.top - t.height - 8 < 8 ? r.bottom + 8 : r.top - t.height - 8;
  tip.style.left = `${left + window.scrollX}px`;
  tip.style.top = `${top + window.scrollY}px`;
}

function hide() {
  tip.hidden = true;
}

document.addEventListener('pointerover', (e) => {
  const target = (e.target as HTMLElement).closest<HTMLElement>('[data-tip]');
  if (target) show(target);
  else hide();
});
document.addEventListener('scroll', hide, { passive: true, capture: true });
