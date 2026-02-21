document.addEventListener("DOMContentLoaded", async () => {
  const charts = [];

  const themeMap = { default: 'default', slate: 'dark' };
  function getTheme() {
    const palette = __md_get("__palette");
    theme = themeMap[palette?.color?.scheme] || 'default'
    return theme;
  }

  function updateChartThemes() {
    const theme = getTheme();
    charts.forEach(c => {
      c.instance.setTheme(theme);
    });
  }

  document.querySelectorAll('input[name="__palette"]').forEach(i => {
    i.addEventListener('change', updateChartThemes);
  });


  document.addEventListener('click', e => {
    const btn = e.target.closest('.chart-wrap .toggle');
    if (!btn) return;

    const wrap = btn.closest('.chart-wrap');
    const chart = wrap.__chart;
    if (!chart) return;

    btn.classList.toggle('active');
    chart.toggle(btn.classList.contains('active'));
  });

  function parseCSV(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const keys = lines[0].split(',');
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const obj = {};
      keys.forEach((k, i) => obj[k] = values[i]);
      return obj;
    });
  }

  function ms(value) {
    const n = Number(value.replace('ms', '').trim());
    return Number.isFinite(n) ? n : 0;
  }

  function formatPlaytime(ms) {
    const d = Math.floor(ms / 86400000); // 1 day = 24*60*60*1000 ms
    const h = Math.floor((ms % 86400000) / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);

    return `${d ? d + 'd ' : ''}${h ? h + 'h ' : ''}${m ? m + 'm ' : ''}${s || (!d && !h && !m) ? s + 's' : ''}`.trim();
  }

  const worldGeoJson = await fetch(
    'https://raw.githubusercontent.com/apache/echarts-www/refs/heads/master/asset/map/json/world.json'
  ).then(r => r.json());
  echarts.registerMap('world', worldGeoJson);

  const playtimePath = '/polls/2026.csv';
  const csv = await fetch(playtimePath).then(r => r.text());
  const rows = parseCSV(csv);

  const byCountry = {};
  rows.forEach(r => {
    const c = r.country;
    byCountry[c] ??= { playtime: 0, avg: [], min: [], max: [] };
    byCountry[c].playtime += Number(r.activePlaytime);
    byCountry[c].avg.push(ms(r.pingAverageFormatted));
    byCountry[c].min.push(ms(r.pingMinFormatted));
    byCountry[c].max.push(ms(r.pingMaxFormatted));
  });

  const countries = Object.keys(byCountry);
  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

  function worldPlayTimeChart() {
    const el = document.querySelector('[data-chart="world_ping"]');
    if (!el) return;

    const wrapper = el.closest('.chart-wrap');
    const btn = wrapper?.querySelector('.toggle');

    const chart = echarts.init(el, getTheme());

    const data = countries.map(c => ({
      name: c,
      value: byCountry[c].playtime,
      label: formatPlaytime(byCountry[c].playtime)
    }));

    const minValue = Math.min(...data.map(d => d.value).filter(v => v > 0)) || 1;

    const mapOption = {
      tooltip: {
        trigger: 'item',
        formatter: params =>
          params.value == null
            ? `${params.name}: no data`
            : `${params.name}: ${formatPlaytime(params.value)}`
      },
      visualMap: {
        min: 0,
        max: Math.max(...data.map(d => d.value)),
        left: 'left',
        bottom: 'bottom',
        calculable: true,
        // Convert the raw value to hours for the legend
        formatter: value => (value / (1000 * 60 * 60)).toFixed(2) + ' h'
      },
      series: [
        {
          id: 'ping',
          type: 'map',
          map: 'world',
          roam: true,
          universalTransition: true,
          animationDurationUpdate: 1000,
          data
        }
      ]
    };

    const barOption = {
      xAxis: {
        type: 'log',
        name: 'Playtime',
        min: minValue,
        axisLabel: { formatter: value => formatPlaytime(value) }
      },
      yAxis: {
        type: 'category',
        data: data.map(d => d.name),
        axisLabel: { rotate: 30 }
      },
      tooltip: {
        trigger: 'axis',
        formatter: params => `${params[0].name}: ${formatPlaytime(params[0].value)}`
      },
      series: [
        {
          id: 'ping',
          type: 'bar',
          universalTransition: true,
          animationDurationUpdate: 1000,
          data: data.map(d => d.value > 0 ? d.value : minValue)
        }
      ]
    };
    let currentOption = mapOption;
    chart.setOption(currentOption);

    function toggle() {
      currentOption = currentOption === mapOption ? barOption : mapOption;
      chart.setOption(currentOption, true);
    }

    const entry = {
      id: 'world-ping',
      instance: chart,
    };
    charts.push(entry);
    el.closest('.chart-wrap').__chart = entry;

  }

  function nexusPlaytimeChart() {
    const el = document.querySelector('[data-chart="nexus_play"]');
    if (!el) return;

    const chart = echarts.init(el, getTheme());


    const option = {
      title: {
        text: 'Nexus Server Awareness & Engagement',
        subtext: '154 responses',
        left: 'center'
      },
      tooltip: {
        formatter: (info) => {
          return `${info.name}: ${info.value}%`;
        }
      },
      series: [
        {
          type: 'sunburst',
          radius: ['15%', '80%'],
          data: [
            {
              name: 'Played on Nexus',
              value: 26.6,
              children: [
                {
                  name: 'Played recently (≤ 3 months)',
                  value: 11
                },
                {
                  name: 'Played before (not recent)',
                  value: 15.6
                }
              ]
            },
            {
              name: 'Never played on Nexus',
              value: 73.4,
              children: [
                {
                  name: 'Knew Nexus existed',
                  value: 38.3
                },
                {
                  name: "Didn’t know Nexus existed",
                  value: 35.1
                }
              ]
            }
          ],
          label: {
            rotate: 'radial',
            formatter: '{b}'
          },
          emphasis: {
            focus: 'ancestor'
          },
          levels: [
            {},
            {
              r0: '15%',
              r: '40%',
              label: {
                rotate: 0,
                fontSize: 14
              }
            },
            {
              r0: '40%',
              r: '80%',
              label: {
                fontSize: 12
              }
            }
          ]
        }
      ]
    };


    chart.setOption(option);

    const entry = {
      id: 'world-ping',
      instance: chart,
    };
    charts.push(entry);

  }

  function nexusPlaytimeChart2() {
    const el = document.querySelector('[data-chart="nexus_play2"]');
    if (!el) return;

    let chart;


    const option = {
      title: {
        text: 'Nexus Server Awareness & Engagement',
        subtext: '154 responses',
        left: 'center'
      },
      tooltip: {
        formatter: (info) => {
          return `${info.name}: ${info.value}%`;
        }
      },
      series: [
        {
          type: 'sunburst',
          radius: ['15%', '80%'],
          data: [
            {
              name: 'Played on Nexus',
              value: 26.6,
              children: [
                {
                  name: 'Played recently (≤ 3 months)',
                  value: 11
                },
                {
                  name: 'Played before (not recent)',
                  value: 15.6
                }
              ]
            },
            {
              name: 'Never played on Nexus',
              value: 73.4,
              children: [
                {
                  name: 'Knew Nexus existed',
                  value: 38.3
                },
                {
                  name: "Didn’t know Nexus existed",
                  value: 35.1
                }
              ]
            }
          ],
          label: {
            rotate: 'radial',
            formatter: '{b}'
          },
          emphasis: {
            focus: 'ancestor'
          },
          levels: [
            {},
            {
              r0: '15%',
              r: '40%',
              label: {
                rotate: 0,
                fontSize: 14
              }
            },
            {
              r0: '40%',
              r: '80%',
              label: {
                fontSize: 12
              }
            }
          ],
        }
      ]
    };



    // Intersection Observer to animate when visible
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Enable animation and re-set the chart
          chart = echarts.init(el, getTheme())
          chart.setOption(option);
          const entry = {
            id: 'world-ping',
            instance: chart,
          };
          charts.push(entry);
          observer.unobserve(el); // animate only once
        }
      });
    }, { threshold: 0.1 });

    observer.observe(el);




  }


  worldPlayTimeChart();
  nexusPlaytimeChart();
  nexusPlaytimeChart2();
});
