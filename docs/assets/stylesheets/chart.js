document.addEventListener("DOMContentLoaded", () => {
  const charts = [];

  const themeMap = {
    default: 'light',
    slate: 'dark'
  };
  function getCurrentScheme() {
    const palette = __md_get("__palette");
    return palette?.color?.scheme || 'default';
  }
  function createChart(el, cfg, theme) {
    const chart = echarts.init(el, theme);
    let option = { title: { text: cfg.title }, tooltip: {} };

    if (cfg.type === 'line' || cfg.type === 'bar') {
      option.tooltip = { trigger: 'axis' };
      option.xAxis = { type: 'category', data: cfg.x };
      option.yAxis = { type: 'value' };
      option.series = [{ type: cfg.type, data: cfg.y, smooth: cfg.type === 'line' }];
    }

    if (cfg.type === 'pie') {
      option.tooltip = { trigger: 'item' };
      option.series = [{ type: 'pie', radius: '60%', data: cfg.data }];
    }

    if (cfg.type === 'world-map') {
      option.tooltip = { trigger: 'item' };
      option.visualMap = {
        min: 0,
        max: 100,
        left: 'left',
        bottom: 'bottom',
        calculable: true
      };
      option.series = [{
        name: cfg.title,
        type: 'map',
        map: 'world',
        roam: true,
        emphasis: { label: { show: false } },
        data: [
          { name: 'United Kingdom', value: 42 },
          { name: 'United States', value: 88 },
          { name: 'France', value: 67 },
          { name: 'Germany', value: 71 },
          { name: 'Japan', value: 55 }
        ]
      }];
    }

    chart.setOption(option);
    return chart;
  }


  function applyTheme() {
    const scheme = getCurrentScheme();
    const theme = themeMap[scheme] || 'light';
    console.log("Theme applied:", scheme, theme);

    charts.forEach(c => {
      c.chart.dispose(); // remove old chart
      c.chart = createChart(c.el, c.cfg, theme);
    });
  }

  const inputs = document.querySelectorAll('input[name="__palette"]');
  inputs.forEach(input => input.addEventListener("change", applyTheme));

  // Load charts
  (async function () {
    const res = await fetch('/stats/2024.json');
    const chartConfigs = await res.json();

    // Load world geojson once
    const world = await fetch(
      'https://raw.githubusercontent.com/apache/echarts-www/refs/heads/master/asset/map/json/world.json'
    ).then(r => r.json());
    echarts.registerMap('world', world);

    document.querySelectorAll('.chart').forEach(el => {
      const cfg = chartConfigs[el.dataset.chart];
      if (!cfg) return;
      const theme = themeMap[getCurrentScheme()] || 'light';
      const chart = createChart(el, cfg, theme);
      charts.push({ chart, el, cfg });
    });
  })();
});
