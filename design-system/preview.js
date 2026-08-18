(() => {
  const sectionButtons = [...document.querySelectorAll('[data-section-target]')];
  const sectionPanels = [...document.querySelectorAll('[data-section-panel]')];
  const mobileSelect = document.querySelector('#mobile-section-select');

  const activateSection = (id) => {
    sectionPanels.forEach((panel) => panel.classList.toggle('is-active', panel.id === id));
    sectionButtons.forEach((button) => {
      const selected = button.dataset.sectionTarget === id;
      button.classList.toggle('is-active', selected);
      if (selected) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    if (mobileSelect) mobileSelect.value = id;
    document.querySelector('.trade-doc-main')?.scrollTo({ top: 0, behavior: 'instant' });
    requestAnimationFrame(drawAllCharts);
  };

  sectionButtons.forEach((button) => {
    button.addEventListener('click', () => activateSection(button.dataset.sectionTarget));
  });
  mobileSelect?.addEventListener('change', () => activateSection(mobileSelect.value));

  document.querySelectorAll('[data-direction-group]').forEach((group) => {
    group.querySelectorAll('.trade-direction').forEach((button) => {
      button.addEventListener('click', () => {
        group.querySelectorAll('.trade-direction').forEach((candidate) => {
          const selected = candidate === button;
          candidate.classList.toggle('is-selected', selected);
          candidate.setAttribute('aria-pressed', String(selected));
        });
      });
    });
  });

  document.querySelectorAll('.trade-tabs').forEach((tabs) => {
    tabs.querySelectorAll('.trade-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.querySelectorAll('.trade-tab').forEach((candidate) => {
          const selected = candidate === tab;
          candidate.classList.toggle('is-active', selected);
          candidate.setAttribute('aria-selected', String(selected));
        });
      });
    });
  });

  document.querySelectorAll('.trade-segmented').forEach((control) => {
    control.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', () => {
        control.querySelectorAll('button').forEach((candidate) => {
          const selected = candidate === button;
          candidate.classList.toggle('is-active', selected);
          candidate.setAttribute('aria-pressed', String(selected));
        });
      });
    });
  });

  const leverageSlider = document.querySelector('#leverage-slider');
  const leverageValue = document.querySelector('#leverage-value');
  leverageSlider?.addEventListener('input', () => {
    leverageValue.textContent = `${leverageSlider.value}×`;
    leverageSlider.setAttribute('aria-valuetext', `${leverageSlider.value} times`);
  });

  const tableFilter = document.querySelector('#table-filter');
  tableFilter?.addEventListener('input', () => {
    const query = tableFilter.value.trim().toLowerCase();
    document.querySelectorAll('#options-chain-table [data-filter-row]').forEach((row) => {
      row.hidden = query && !row.textContent.toLowerCase().includes(query);
    });
  });

  const commandPalette = document.querySelector('#command-palette');
  const commandInput = document.querySelector('#command-input');
  const openCommand = () => {
    commandPalette.hidden = false;
    requestAnimationFrame(() => commandInput?.focus());
  };
  const closeCommand = () => {
    commandPalette.hidden = true;
    document.querySelector('#command-open')?.focus();
  };
  document.querySelector('#command-open')?.addEventListener('click', openCommand);
  document.querySelector('#command-close')?.addEventListener('click', closeCommand);
  commandPalette?.addEventListener('click', (event) => {
    if (event.target === commandPalette) closeCommand();
  });
  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      openCommand();
    }
    if (event.key === 'Escape' && !commandPalette?.hidden) closeCommand();
  });

  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const datasets = {
    price: {
      type: 'multi-line',
      labels: ['Aug 4', 'Aug 9', 'Aug 14', 'Aug 19', 'Aug 24', 'Aug 29'],
      series: [
        { color: '--trade-accent', values: [0.171, 0.176, 0.173, 0.181, 0.184, 0.187] },
        { color: '--trade-warning', values: [0.170, 0.175, 0.174, 0.180, 0.183, 0.186], dashed: true },
      ],
      format: (value) => `$${value.toFixed(3)}`,
    },
    iv: {
      type: 'multi-line',
      labels: ['$0.18', '$0.20', '$0.22', '$0.24'],
      series: [
        { color: '--trade-positive', values: [68.2, 64.9, 62.5, 61.2] },
        { color: '--trade-negative', values: [71.4, 67.1, 65.8, 64.2] },
      ],
      format: (value) => `${Math.round(value)}%`,
    },
    volume: {
      type: 'bar',
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      values: [42, 88, 63, 141, 95, 58, 37],
      format: (value) => `$${Math.round(value)}K`,
    },
    portfolio: {
      type: 'area',
      labels: ['Aug 1', 'Aug 7', 'Aug 13', 'Aug 19', 'Aug 25', 'Aug 31'],
      values: [24.2, 24.9, 24.4, 26.1, 27.3, 28.4],
      format: (value) => `$${value.toFixed(1)}K`,
    },
  };

  function prepareCanvas(canvas) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return null;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const context = canvas.getContext('2d');
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    return { context, width, height };
  }

  function extent(values) {
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    const padding = Math.max((maximum - minimum) * 0.18, Math.abs(maximum || 1) * 0.03);
    return [minimum - padding, maximum + padding];
  }

  function drawGrid(context, width, height, labels, min, max, format) {
    const plot = { left: 42, right: width - 10, top: 14, bottom: height - 28 };
    context.font = "11px Inter, -apple-system, sans-serif";
    context.fillStyle = css('--trade-text-muted');
    context.strokeStyle = css('--trade-border-subtle');
    context.lineWidth = 1;
    context.setLineDash([4, 4]);

    for (let index = 0; index < 4; index += 1) {
      const ratio = index / 3;
      const y = plot.top + ratio * (plot.bottom - plot.top);
      context.beginPath();
      context.moveTo(plot.left, y);
      context.lineTo(plot.right, y);
      context.stroke();
      const value = max - ratio * (max - min);
      context.fillText(format(value), 0, y + 4);
    }

    context.setLineDash([]);
    labels.forEach((label, index) => {
      const ratio = labels.length === 1 ? 0 : index / (labels.length - 1);
      const x = plot.left + ratio * (plot.right - plot.left);
      context.textAlign = index === 0 ? 'left' : index === labels.length - 1 ? 'right' : 'center';
      context.fillText(label, x, height - 8);
    });
    context.textAlign = 'left';
    return plot;
  }

  function point(plot, index, count, value, min, max) {
    return {
      x: plot.left + (count === 1 ? 0 : index / (count - 1)) * (plot.right - plot.left),
      y: plot.bottom - ((value - min) / (max - min || 1)) * (plot.bottom - plot.top),
    };
  }

  function drawLine(context, plot, values, min, max, color, dashed = false) {
    context.beginPath();
    values.forEach((value, index) => {
      const p = point(plot, index, values.length, value, min, max);
      if (index === 0) context.moveTo(p.x, p.y);
      else context.lineTo(p.x, p.y);
    });
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.setLineDash(dashed ? [5, 4] : []);
    context.stroke();
    context.setLineDash([]);
  }

  function drawChart(canvas) {
    const spec = datasets[canvas.dataset.chart];
    const prepared = prepareCanvas(canvas);
    if (!spec || !prepared) return;
    const { context, width, height } = prepared;

    if (spec.type === 'multi-line') {
      const values = spec.series.flatMap((series) => series.values);
      const [min, max] = extent(values);
      const plot = drawGrid(context, width, height, spec.labels, min, max, spec.format);
      spec.series.forEach((series) => drawLine(context, plot, series.values, min, max, css(series.color), series.dashed));
      return;
    }

    if (spec.type === 'bar') {
      const min = 0;
      const max = Math.max(...spec.values) * 1.15;
      const plot = drawGrid(context, width, height, spec.labels, min, max, spec.format);
      const slot = (plot.right - plot.left) / spec.values.length;
      const barWidth = Math.min(slot * 0.56, 40);
      spec.values.forEach((value, index) => {
        const x = plot.left + slot * index + (slot - barWidth) / 2;
        const y = plot.bottom - (value / max) * (plot.bottom - plot.top);
        context.fillStyle = css('--trade-accent');
        context.fillRect(x, y, barWidth, plot.bottom - y);
      });
      return;
    }

    const [min, max] = extent(spec.values);
    const plot = drawGrid(context, width, height, spec.labels, min, max, spec.format);
    const gradient = context.createLinearGradient(0, plot.top, 0, plot.bottom);
    gradient.addColorStop(0, 'rgba(46, 92, 255, 0.18)');
    gradient.addColorStop(1, 'rgba(46, 92, 255, 0)');
    context.beginPath();
    spec.values.forEach((value, index) => {
      const p = point(plot, index, spec.values.length, value, min, max);
      if (index === 0) context.moveTo(p.x, p.y);
      else context.lineTo(p.x, p.y);
    });
    const last = point(plot, spec.values.length - 1, spec.values.length, spec.values.at(-1), min, max);
    const first = point(plot, 0, spec.values.length, spec.values[0], min, max);
    context.lineTo(last.x, plot.bottom);
    context.lineTo(first.x, plot.bottom);
    context.closePath();
    context.fillStyle = gradient;
    context.fill();
    drawLine(context, plot, spec.values, min, max, css('--trade-accent'));
  }

  function drawAllCharts() {
    document.querySelectorAll('.trade-chart-canvas').forEach(drawChart);
  }

  const observer = new ResizeObserver((entries) => {
    entries.forEach((entry) => drawChart(entry.target));
  });
  document.querySelectorAll('.trade-chart-canvas').forEach((canvas) => observer.observe(canvas));
  drawAllCharts();
})();
