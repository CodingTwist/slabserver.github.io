class ChartManager {
  constructor() {
    this.charts = [];
    this.themeMap = { default: "default", slate: "dark" };
  }

  getTheme() {
    const palette = window.__md_get?.("__palette");
    return this.themeMap[palette?.color?.scheme] || "default";
  }

  register(chart) {
    this.charts.push(chart);
  }

  updateThemes() {
    console.log("changing themes");
    const theme = this.getTheme();
    this.charts.forEach((c) => c.setTheme(theme));
  }

  bindThemeListener() {
    document
      .querySelectorAll('input[name="__palette"]')
      .forEach((i) => i.addEventListener("change", () => this.updateThemes()));
  }

  bindToggleListener() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".chart-wrap .toggle");
      if (!btn) return;

      const wrap = btn.closest(".chart-wrap");
      const chart = wrap?.__chart;
      if (!chart?.toggle) return;

      btn.classList.toggle("active");
      chart.toggle(btn.classList.contains("active"));
    });
  }
}
class BaseChart {
  static defaultOption = {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    xAxis: {
      type: "value",
      name: "Count",
      nameLocation: "middle",
      nameGap: 30,
    },
    yAxis: {
      type: "category",
      nameLocation: "middle",
      nameGap: 50,
      inverse: true,
    },
  };

  constructor(el, manager, { threshold = 0.1 } = {}) {
    this.el = el;
    this.manager = manager;
    this.chart = null;

    el.closest(".chart-wrap").__chart = this;
    manager.register(this);

    this.observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || this.initialized) return;
        this.init();
        this.initialized = true;
        this.observer.disconnect();
      },
      { threshold },
    );

    this.observer.observe(el);
  }

  init() {
    if (!this.option) {
      console.warn("Warning: Null option passed in");
      return; // safety
    }

    this.chart = echarts.init(this.el, this.manager.getTheme());
    this.chart.setOption(this.option);
  }

  setTheme(theme) {
    if (!this.chart) return;

    this.chart.setTheme(theme);
  }
}

class WorldPlaytimeChart extends BaseChart {
  constructor(el, manager) {
    super(el, manager);

    const WORLD_PLAYTIME_DATA = [
      { name: "United Arab Emirates", value: 578483 },
      { name: "Austria", value: 2484028 },
      { name: "Russia", value: 2499618 },
      { name: "Indonesia", value: 2678124 },
      { name: "Türkiye", value: 5949646 },
      { name: "Lithuania", value: 6486866 },
      { name: "Israel", value: 8105998 },
      { name: "Ireland", value: 11673476 },
      { name: "Romania", value: 15441297 },
      { name: "Finland", value: 18463402 },
      { name: "Philippines", value: 35797511 },
      { name: "Slovakia", value: 50188243 },
      { name: "Bangladesh", value: 71565445 },
      { name: "Comoros", value: 203479085 },
      { name: "India", value: 245355740 },
      { name: "Nepal", value: 346448460 },
      { name: "Costa Rica", value: 396276304 },
      { name: "Hong Kong", value: 423838454 },
      { name: "Belgium", value: 494949968 },
      { name: "Thailand", value: 511640167 },
      { name: "Slovenia", value: 558287625 },
      { name: "Singapore", value: 686391249 },
      { name: "Australia", value: 755159061 },
      { name: "Spain", value: 830149772 },
      { name: "Hungary", value: 880940982 },
      { name: "Sweden", value: 967849250 },
      { name: "Denmark", value: 1591821822 },
      { name: "Germany", value: 1859037918 },
      { name: "France", value: 2220942582 },
      { name: "New Zealand", value: 2865935309 },
      { name: "Poland", value: 3180003778 },
      { name: "Canada", value: 4585107056 },
      { name: "The Netherlands", value: 11452667603 },
      { name: "United Kingdom", value: 22648465429 },
      { name: "United States", value: 64230774289 },
    ];

    this.mapOption = this.createMapOption(WORLD_PLAYTIME_DATA);
    this.barOption = this.createBarOption(WORLD_PLAYTIME_DATA);
    this.current = this.mapOption;
    this.option = this.current;
    this.init(this.current);
  }

  formatPlaytime(ms) {
    const d = Math.floor(ms / 86400000); // 1 day = 24*60*60*1000 ms
    const h = Math.floor((ms % 86400000) / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);

    return `${d ? d + "d " : ""}${h ? h + "h " : ""}${m ? m + "m " : ""}${
      s || (!d && !h && !m) ? s + "s" : ""
    }`.trim();
  }

  toggle(active) {
    this.current = active ? this.barOption : this.mapOption;
    this.chart.setOption(this.current, true);
  }

  createMapOption(data) {
    const format = this.formatPlaytime.bind(this);

    return {
      tooltip: {
        formatter: (p) =>
          p.value == null
            ? `${p.name}: no data`
            : `${p.name}: ${format(p.value)}`,
      },
      visualMap: {
        min: 0,
        max: Math.max(...data.map((d) => d.value)),
        left: "left",
        bottom: "bottom",
        formatter: (v) => (v / 3.6e6).toFixed(2) + " h",
      },
      series: [
        {
          id: "ping",
          type: "map",
          map: "world",
          roam: true,
          universalTransition: true,
          data,
        },
      ],
    };
  }

  createBarOption(data) {
    const min = Math.min(...data.map((d) => d.value).filter((v) => v > 0)) || 1;

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params) => {
          const p = params[0];
          return `${p.name}: ${this.formatPlaytime(p.value)}`;
        },
      },
      xAxis: {
        type: "log",
        min,
        name: "Playtime (logarithmic)",
        nameLocation: "middle",
        nameGap: 30,
        axisLabel: {
          formatter: (v) => this.formatPlaytime(v),
        },
      },
      yAxis: {
        type: "category",
        data: data.map((d) => d.name),
      },
      series: [
        {
          id: "ping",
          type: "bar",
          universalTransition: true,
          data: data.map((d) => (d.value > 0 ? d.value : min)),
        },
      ],
    };
  }
}
class Question1_Age extends BaseChart {
  constructor(el, manager) {
    super(el, manager);

    this.option = structuredClone(BaseChart.defaultOption);

    const data = [11, 40, 61, 50, 17, 9, 1, 1];
    const total = data.reduce((a, b) => a + b, 0);

    const ageRanges = [
      "14-17",
      "18-21",
      "22-25",
      "26-29",
      "30-33",
      "34-37",
      "38-41",
      "42-45",
    ];

    this.option.title = { text: "Age Distribution", left: "center" };
    this.option.yAxis.data = ageRanges;
    this.option.yAxis.name = "Age Range";

    this.option.series = [
      {
        name: "Count",
        type: "bar",
        data: data,
        itemStyle: { color: "#5470C6" },
        label: {
          show: true,
          position: "insideRight", // <-- inside the solid bar
          color: "#fff", // white text for contrast
          formatter: (params) => {
            if (params.value < 5) return "";
            const percent = ((params.value / total) * 100).toFixed(1);
            return `${params.value} (${percent}%)`;
          },
        },
      },
    ];

    this.option.tooltip = {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params) => {
        const p = params[0];
        const percent = ((p.value / total) * 100).toFixed(1);
        return `${p.name}: ${p.value} (${percent}%)`;
      },
    };
  }
}

class Question2_Gender extends BaseChart {
  constructor(el, manager) {
    super(el, manager);

    this.option = structuredClone(BaseChart.defaultOption);

    const data = [53, 116, 14, 4, 4];
    const total = data.reduce((a, b) => a + b, 0);

    const genders = [
      "Female",
      "Male",
      "Non-Binary",
      "Prefer not to say",
      "Other",
    ];

    this.option.title = { text: "Gender Distribution", left: "center" };
    this.option.yAxis.data = genders;
    this.option.yAxis.name = "Genders";

    this.option.series = [
      {
        name: "Count",
        type: "bar",
        data: data,
        label: {
          show: true,
          position: "insideRight",
          color: "#fff",
          formatter: (params) => {
            if (params.value < 5) return "";
            const percent = ((params.value / total) * 100).toFixed(1);
            return `${params.value} (${percent}%)`;
          },
        },
      },
    ];

    this.option.tooltip = {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params) => {
        const p = params[0];
        const percent = ((p.value / total) * 100).toFixed(1);
        return `${p.name}: ${p.value} (${percent}%)`;
      },
    };
  }
}

class Question3_Location extends BaseChart {
  constructor(el, manager) {
    super(el, manager);

    const DATA = [
      { name: "Argentina", value: 1 },
      { name: "Belgium", value: 1 },
      { name: "Bosnia and Herzegovina", value: 1 },
      { name: "Chile", value: 1 },
      { name: "China", value: 1 },
      { name: "Costa Rica", value: 1 },
      { name: "Cyprus", value: 1 },
      { name: "Czech Republic (Czechia)", value: 1 },
      { name: "Hungary", value: 1 },
      { name: "Norway", value: 1 },
      { name: "Philippines", value: 1 },
      { name: "Slovakia", value: 1 },
      { name: "Switzerland", value: 1 },
      { name: "Denmark", value: 2 },
      { name: "France", value: 2 },
      { name: "Israel", value: 2 },
      { name: "Poland", value: 2 },
      { name: "Russia", value: 2 },
      { name: "Spain", value: 2 },
      { name: "Finland", value: 3 },
      { name: "Australia", value: 4 },
      { name: "India", value: 4 },
      { name: "New Zealand", value: 4 },
      { name: "Germany", value: 7 },
      { name: "Netherlands", value: 12 },
      { name: "Canada", value: 18 },
      { name: "United Kingdom", value: 22 },
      { name: "United States", value: 87 },
    ];
    this.mapOption = this.createMapOption(DATA);
    this.barOption = this.createBarOption(DATA);
    this.current = this.mapOption;
    this.option = this.current;
  }

  toggle(active) {
    this.current = active ? this.barOption : this.mapOption;
    this.chart.setOption(this.current, true);
  }

  createMapOption(data) {
    const values = data.map((d) => d.value);
    const min = Math.min(...values); // probably 1
    const max = Math.max(...values); // 87

    return {
      title: { text: "Country Distribution" },
      tooltip: {
        trigger: "item",
        formatter: (p) =>
          p.value == null ? `${p.name}: no data` : `${p.name}: ${p.value}`, // Or formatPlaytime(p.value)
      },
      visualMap: {
        left: "left",
        bottom: "bottom",
        min: 0,
        max: max,
        text: ["High", "Low"], // optional labels
        calculable: true, // allows users to drag the range
      },
      series: [
        {
          id: "count",
          type: "map",
          map: "world",
          roam: true,
          universalTransition: true,
          data,
        },
      ],
    };
  }

  createBarOption(data) {
    return {
      title: { text: "Location" },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
        formatter: (params) => {
          const p = params[0]; // First series
          return `${p.name}: ${p.value}`;
        },
      },
      xAxis: {
        min: 0,
        name: "Number of People",
        nameLocation: "middle",
        nameGap: 30,
        axisLabel: {
          formatter: (val) => val, // just show value normally
        },
      },

      yAxis: {
        type: "category",
        data: data.map((d) => d.name),
      },
      series: [
        {
          id: "count",
          type: "bar",
          universalTransition: true,
          data: data.map((d) => d.value),
        },
      ],
    };
  }
}

class Question4_US_Location extends BaseChart {
  constructor(el, manager) {
    super(el, manager);

    const DATA = [
      { name: "Alaska", value: 1 },
      { name: "Colorado", value: 1 },
      { name: "Hawaii", value: 1 },
      { name: "Illinois", value: 1 },
      { name: "Maryland", value: 1 },
      { name: "Montana", value: 1 },
      { name: "Nebraska", value: 1 },
      { name: "New Hampshire", value: 1 },
      { name: "Tennessee", value: 1 },
      { name: "Vermont", value: 1 },
      { name: "Arizona", value: 2 },
      { name: "Idaho", value: 2 },
      { name: "Indiana", value: 2 },
      { name: "Louisiana", value: 2 },
      { name: "Michigan", value: 2 },
      { name: "New York", value: 2 },
      { name: "Oregon", value: 2 },
      { name: "South Carolina", value: 2 },
      { name: "Virginia", value: 2 },
      { name: "Florida", value: 3 },
      { name: "Georgia", value: 3 },
      { name: "Kansas", value: 3 },
      { name: "Minnesota", value: 3 },
      { name: "Missouri", value: 3 },
      { name: "New Jersey", value: 3 },
      { name: "North Carolina", value: 3 },
      { name: "Ohio", value: 3 },
      { name: "Texas", value: 3 },
      { name: "Utah", value: 3 },
      { name: "Wisconsin", value: 3 },
      { name: "Pennsylvania", value: 6 },
      { name: "Washington", value: 6 },
      { name: "California", value: 9 },
    ];
    this.mapOption = this.createMapOption(DATA);
    this.barOption = this.createBarOption(DATA);
    this.current = this.mapOption;
    this.option = this.current;
    this.init(this.current);
  }

  toggle(active) {
    this.current = active ? this.barOption : this.mapOption;
    this.chart.setOption(this.current, true);
  }

  createMapOption(data) {
    const values = data.map((d) => d.value);
    const min = Math.min(...values); // probably 1
    const max = Math.max(...values); // 87

    return {
      title: { text: "US State Distribution" },
      tooltip: {
        trigger: "item",
        formatter: (p) =>
          p.value == null ? `${p.name}: no data` : `${p.name}: ${p.value}`, // Or formatPlaytime(p.value)
      },
      visualMap: {
        left: "left",
        bottom: "bottom",
        min: 0,
        max: max,
        text: ["High", "Low"], // optional labels
        calculable: true, // allows users to drag the range
      },
      series: [
        {
          id: "count",
          type: "map",
          map: "USA",
          roam: true,
          universalTransition: true,
          data,
        },
      ],
    };
  }

  createBarOption(data) {
    return {
      title: { text: "Location" },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
        formatter: (params) => {
          const p = params[0]; // First series
          return `${p.name}: ${p.value}`;
        },
      },
      xAxis: {
        min: 0,
        name: "Playtime (Log Scale)",
        nameLocation: "middle",
        nameGap: 30,
        axisLabel: {
          formatter: (val) => val, // just show value normally
        },
      },

      yAxis: {
        type: "category",
        data: data.map((d) => d.name),
        axisLabel: {
          interval: 0,
        },
      },
      series: [
        {
          id: "count",
          type: "bar",
          universalTransition: true,
          data: data.map((d) => d.value),
        },
      ],
    };
  }
}

class Question5_TZ extends BaseChart {
  constructor(el, manager) {
    super(el, manager);

    this.option = structuredClone(BaseChart.defaultOption);

    const data = [1, 1, 1, 2, 47, 22, 11, 21, 1, 23, 35, 4, 4, 6, 1, 5, 3];
    const total = data.reduce((a, b) => a + b, 0);

    const genders = [
      "UTC-10: e.g. Hawaii-Aleutian (HST)",
      "UTC-3",
      "UTC-3:30: Newfoundland",
      "UTC-4: e.g. Atlantic (AST)",
      "UTC-5: e.g. Eastern (EST)",
      "UTC-6: e.g. Central (CST)",
      "UTC-7: e.g. Mountain (MST)",
      "UTC-8: e.g. Pacific (PST)",
      "UTC-9: e.g. Alaska (AKST)",
      "UTC+0: e.g. GMT, Western Europe (WET)",
      "UTC+1: e.g. Central Europe (CET)",
      "UTC+10: e.g. Australian Eastern Standard Time (AEST)",
      "UTC+12: e.g. New Zealand (NZST)",
      "UTC+2: e.g. Eastern Europe (EET)",
      "UTC+4",
      "UTC+5:30: India and Sri Lanka",
      "UTC+8: e.g. Australian Western (AWST), China, the Philippines",
    ];

    this.option.title = { text: "Timezone Distribution", left: "center" };
    this.option.yAxis.data = genders;
    this.option.yAxis.name = "Timezones";

    this.option.series = [
      {
        name: "Count",
        type: "bar",
        data: data,
        label: {
          show: true,
          position: "insideRight",
          color: "#fff",
          formatter: (params) => {
            if (params.value <= 6) return "";
            const percent = ((params.value / total) * 100).toFixed(1);
            return `${params.value} (${percent}%)`;
          },
        },
      },
    ];

    this.option.tooltip = {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params) => {
        const p = params[0];
        const percent = ((p.value / total) * 100).toFixed(1);
        return `${p.name}: ${p.value} (${percent}%)`;
      },
    };
  }
}

class Question6_Langs extends BaseChart {
  constructor(el, manager) {
    super(el, manager);

    this.option = {
      title: {
        text: "Languages Spoken",
        left: "center",
      },
      tooltip: {
        trigger: "item",
        formatter: "{b}: {c} users ({d}%)", // clearer tooltip
      },
      legend: {
        orient: "vertical",
        right: "right", //ove legend to the right
        top: "center",
      },
      series: [
        {
          name: "Languages",
          type: "pie",
          radius: "65%",
          center: ["50%", "55%"],
          data: [
            { name: "1 language", value: 106 },
            { name: "2 languages", value: 104 },
            { name: "3 languages", value: 66 },
            { name: "4 languages", value: 24 },
            { name: "5+ languages", value: 0 },
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
    };
  }
}

class Question7_WhatVersion extends BaseChart {
  constructor(el, manager) {
    super(el, manager);

    this.option = {
      title: {
        text: "Minecraft Versions Played (including overlap)",
        left: "center",
      },

      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (items) => {
          const total = items.reduce((s, i) => s + i.value, 0);
          return `
            <b>${items[0].axisValue}</b><br/>
            ${items
              .filter((i) => i.value > 0)
              .map((i) => `${i.marker} ${i.seriesName}: ${i.value}`)
              .join("<br/>")}
            <br/><b>Total: ${total}</b>
          `;
        },
      },

      legend: {
        right: 10,
        top: "middle",
        orient: "vertical",
      },

      grid: {
        left: 40,
        right: 140,
        bottom: 40,
        containLabel: true,
      },

      yAxis: {
        type: "category",
        data: ["Java", "Bedrock"],
      },

      xAxis: {
        type: "value",
        name: "Players",
      },

      series: [
        {
          name: "Java only",
          type: "bar",
          stack: "total",
          label: {
            show: true,
            formatter: ({ value }) => (value ? value : ""),
          },
          data: [159, 0],
        },
        {
          name: "Bedrock only",
          type: "bar",
          stack: "total",
          label: {
            show: true,
            formatter: ({ value }) => (value ? value : ""),
          },
          data: [0, 7],
        },
        {
          name: "Java + Bedrock",
          type: "bar",
          stack: "total",
          label: {
            show: true,
            formatter: ({ value }) => (value ? value : ""),
          },
          data: [20, 20],
        },
      ],
    };
  }
}

class Question8_WhatPlatform extends BaseChart {
  constructor(el, manager) {
    super(el, manager);

    this.devices = ["Desktop PC", "Laptop", "Mobile", "Console"];

    // Hardcoded values: rows = primary device, cols = overlap device
    this.matrixData = [
      [1, 0.36, 0.08, 0.11],
      [0.36, 1, 0.27, 0.17],
      [0.08, 0.27, 1, 0.3],
      [0.11, 0.17, 0.3, 1],
    ];

    // Max value for visualMap
    this.maxVal = Math.max(...this.matrixData.flat());

    // Create both options
    this.heatmapOption = this.createHeatmapOption();
    this.barOption = this.createBarOption();

    this.current = this.barOption;
    this.option = this.current;
  }

  // Toggle between heatmap (false) and bar (true)
  toggle(active) {
    this.current = active ? this.heatmapOption : this.barOption;
    this.chart.setOption(this.current, true);
  }

  createHeatmapOption() {
    // Total of all matrix values for percentages
    const grandTotal = this.matrixData.flat().reduce((a, b) => a + b, 0);

    return {
      title: {
        text: "Device Usage Matrix",
        left: "center",
      },
      tooltip: {
        formatter: (p) => {
          const [row, col, val] = p.data;
          return `${this.devices[row]} x ${this.devices[col]}: ${val}`;
        },
      },
      xAxis: {
        type: "category",
        data: this.devices,
      },
      yAxis: {
        type: "category",
        data: this.devices,
      },
      visualMap: {
        min: 0,
        max: this.maxVal,
        calculable: true,
      },
      series: [
        {
          type: "heatmap",
          data: this.matrixData.flatMap((row, r) =>
            row.map((val, c) => [r, c, val]),
          ),
          label: {
            show: true,
          },
        },
      ],
    };
  }

  createBarOption() {
    // Sum totals for each device (sum across the row)
    const totals = [46, 52, 14, 12];

    // Total of all devices for percentages
    const grandTotal = totals.reduce((a, b) => a + b, 0);

    // Pair totals with device names
    const paired = this.devices.map((name, i) => ({ name, value: totals[i] }));

    // Sort descending
    paired.sort((a, b) => b.value - a.value);

    return {
      title: { text: "Minecraft Device Usage" },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params) => {
          const p = params[0];
          const percent = ((p.value / grandTotal) * 100).toFixed(1);
          return `${p.name}: ${p.value} (${percent}%)`;
        },
      },
      xAxis: {
        type: "value",
        min: 0,
        max: paired[0].value,
        name: "Total Users",
        nameLocation: "middle",
        nameGap: 30,
      },
      yAxis: {
        type: "category",
        data: paired.map((d) => d.name),
      },
      series: [
        {
          type: "bar",
          data: paired.map((d) => d.value),
          label: {
            show: true,
            position: "right",
            formatter: (params) => {
              const percent = ((params.value / grandTotal) * 100).toFixed(1);
              return `${params.value} (${percent}%)`;
            },
          },
        },
      ],
    };
  }
}

class Question9_Tenure extends BaseChart {
  constructor(el, manager) {
    super(el, manager);

    this.option = structuredClone(BaseChart.defaultOption);

    const data = [3, 6, 12, 13, 30, 17, 10, 13, 37, 15, 11, 12, 3];
    const total = data.reduce((a, b) => a + b, 0);

    const label = [
      "Less than a month",
      "Between 1 - 3 months",
      "Between 3 - 6 months",
      "Between 6 - 12 months",
      "More than one year",
      "More than two years",
      "More than three years",
      "More than four years",
      "More than five years",
      "More than six years",
      "More than seven years",
      "More than eight years",
      "More than nine years",
    ];

    this.option.title = {
      text: "Etho Discord / Slabserver Tenure",
      left: "center",
    };
    this.option.yAxis.data = label;
    this.option.yAxis.name = "Time";

    this.option.series = [
      {
        name: "Count",
        type: "bar",
        data: data,
        barWidth: "50%",
        label: {
          show: true,
          position: "insideRight",
          color: "#fff",
          formatter: (params) => {
            if (params.value < 5) return "";
            const percent = ((params.value / total) * 100).toFixed(1);
            return `${params.value} (${percent}%)`;
          },
        },
      },
    ];

    this.option.tooltip = {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params) => {
        const p = params[0];
        const percent = ((p.value / total) * 100).toFixed(1);
        return `${p.name}: ${p.value} (${percent}%)`;
      },
    };
  }
}

class Question10_Join extends BaseChart {
  constructor(el, manager) {
    super(el, manager);

    const total = 188; // sum of all values

    this.option = {
      title: {
        text: "Etho Discord / Slabserver Discovery Method",
        left: "center",
      },

      tooltip: {
        formatter: (p) => {
          if (!p.value) return p.name;
          const pct = ((p.value / total) * 100).toFixed(1);
          return `${p.name}<br/>${p.value} (${pct}%)`;
        },
      },

      series: [
        {
          type: "sunburst",
          // radius: ["18%", "90%"],
          radius: [0, "95%"],

          sort: null,
          top: 20,
          nodeClick: false,
          emphasis: {
            focus: "ancestor",
          },
          labelLayout: {
            hideOverlap: true,
          },

          label: {
            fontSize: 11,
          },

          levels: [
            {},

            // Level 1 — main categories
            {
              r0: "25%",
              r: "50%",
              label: {
                fontSize: 13,
                fontWeight: "bold",
              },
            },

            // Level 2 — specific sources
            {
              r0: "50%",
              r: "90%",
              label: {
                fontSize: 11,
                formatter: (p) => (p.value >= 3 ? p.name : ""),
              },
            },
          ],

          data: [
            {
              name: "Social Media",
              children: [
                { name: "Reddit", value: 110 },
                { name: "Twitter", value: 3 },
                { name: "Twitch", value: 4 },
              ],
            },
            {
              name: "Community / Platforms",
              children: [
                { name: "Search Engine", value: 19 },
                { name: "MCCI Fishing", value: 1 },
                { name: "Discord", value: 1 },
              ],
            },
            {
              name: "Events / Videos",
              children: [
                { name: "10 Years of Etho (2018)", value: 6 },
                { name: "10 Years of Etho LP (2020)", value: 9 },
                { name: "2M Subscribers (2020)", value: 4 },
                { name: "VintageBeef UHC (2017)", value: 3 },
                { name: "Decked Out Collab", value: 1 },
                { name: "Music Video", value: 1 },
              ],
            },
            {
              name: "Word of Mouth",
              children: [{ name: "Friend / Family", value: 22 }],
            },
            {
              name: "Other",
              children: [{ name: "Other", value: 4 }],
            },
          ],
        },
      ],
    };
  }
}

class Question11_WatchEtho extends BaseChart {
  constructor(el, manager) {
    super(el, manager);
    // Pie chart data
    const data = [
      { name: "Never", value: 7 },
      { name: "Regularly", value: 162 },
      { name: "Sometimes", value: 22 },
    ];

    this.option = {
      title: {
        text: "Etho Viewing Frequency",
        left: "center",
      },
      tooltip: {
        trigger: "item",
        formatter: "{b}: {c} users ({d}%)", // clearer tooltip
      },
      legend: {
        orient: "vertical",
        right: "right", //ove legend to the right
        top: "center",
      },
      series: [
        {
          name: "Languages",
          type: "pie",
          radius: "65%",
          center: ["50%", "55%"],
          data: [
            { name: "Never", value: 7 },
            { name: "Regularly", value: 162 },
            { name: "Sometimes", value: 22 },
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
    };
  }
}

class Question12_EthoSeries extends BaseChart {
  constructor(el, manager) {
    super(el, manager);

    this.series = [
      "Etho Plays Minecraft",
      "Hermitcraft S10",
      "Hermitcraft S11",
      "Past Life",
    ];

    // Hardcoded values: rows = primary show, cols = overlap show
    this.matrixData = [
      [1, 0.93, 0.92, 0.89],
      [0.93, 1, 0.98, 0.94],
      [0.92, 0.98, 1, 0.92],
      [0.89, 0.94, 0.92, 1],
    ];

    // Max value for visualMap
    this.maxVal = Math.max(...this.matrixData.flat());

    // Create both options
    this.heatmapOption = this.createHeatmapOption();
    this.barOption = this.createBarOption();

    this.current = this.barOption;
    this.option = this.current;
  }

  // Toggle between heatmap (false) and bar (true)
  toggle(active) {
    this.current = active ? this.heatmapOption : this.barOption;
    this.chart.setOption(this.current, true);
  }

  createHeatmapOption() {
    // Total of all matrix values for percentages
    const grandTotal = this.matrixData.flat().reduce((a, b) => a + b, 0);

    return {
      title: {
        text: "Etho Series Matrix",
        left: "center",
      },
      tooltip: {
        formatter: (p) => {
          const [row, col, val] = p.data;
          return `${this.series[row]} × ${this.series[col]}: ${val}`;
        },
      },
      xAxis: {
        type: "category",
        data: this.series,
      },
      yAxis: {
        type: "category",
        data: this.series,
      },
      visualMap: {
        min: 0,
        max: this.maxVal,
        calculable: true,
      },
      series: [
        {
          type: "heatmap",
          data: this.matrixData.flatMap((row, r) =>
            row.map((val, c) => [r, c, val]),
          ),
          label: {
            show: true,
            formatter: (params) => {
              const val = params.value[2];
              return `${val}`;
            },
          },
        },
      ],
    };
  }
  createBarOption() {
    const data = [167, 162, 163, 150];

    const total = data.reduce((a, b) => a + b, 0);

    let option = structuredClone(BaseChart.defaultOption);

    option.title = { text: "Most Watched Etho Series", left: "center" };
    option.yAxis.data = this.series;
    option.yAxis.name = "Series";

    option.series = [
      {
        name: "Count",
        type: "bar",
        data: data,
        barWidth: "50%",
        label: {
          show: true,
          position: "insideRight",
          color: "#fff",
          formatter: (params) => {
            if (params.value < 5) return "";
            const percent = ((params.value / total) * 100).toFixed(1);
            return `${params.value} (${percent}%)`;
          },
        },
      },
    ];

    option.tooltip = {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params) => {
        const p = params[0];
        const percent = ((p.value / total) * 100).toFixed(1);
        return `${p.name}: ${p.value} (${percent}%)`;
      },
    };
    return option;
  }
}

class Question13_OtherHermits extends BaseChart {
  constructor(el, manager) {
    super(el, manager);

    this.devices = [
      "Etho",
      "BdoubleO",
      "Cubfan135",
      "Docm77",
      "FalseSymmetry",
      "GeminiTay",
      "GoodTimesWithScar",
      "Grian",
      "Hypnotizd",
      "iJevin",
      "ImpulseSV",
      "JoeHills",
      "Keralis",
      "MumboJumbo",
      "PearlescentMoon",
      "Rendog",
      "Skizzleman",
      "SmallishBeans",
      "TangoTek",
      "VintageBeef",
      "Welsknight",
      "xBCrafted",
      "Xisumavoid",
      "Zedaph",
      "ZombieCleo",
    ];

    // Hardcoded values: rows = primary hermit, cols = overlap hermit
    this.matrixData = [
      [
        1, 0.82, 0.38, 0.45, 0.27, 0.73, 0.6, 0.68, 0.22, 0.23, 0.55, 0.33,
        0.36, 0.69, 0.58, 0.38, 0.44, 0.63, 0.81, 0.36, 0.32, 0.32, 0.42, 0.52,
        0.38,
      ],
      [
        0.82, 1, 0.41, 0.47, 0.27, 0.67, 0.59, 0.61, 0.26, 0.27, 0.49, 0.32,
        0.39, 0.67, 0.55, 0.38, 0.43, 0.57, 0.74, 0.39, 0.26, 0.26, 0.39, 0.5,
        0.38,
      ],
      [
        0.38, 0.41, 1, 0.34, 0.38, 0.35, 0.47, 0.38, 0.22, 0.57, 0.5, 0.49,
        0.28, 0.42, 0.42, 0.44, 0.44, 0.39, 0.43, 0.28, 0.32, 0.47, 0.47, 0.37,
        0.38,
      ],
      [
        0.45, 0.47, 0.34, 1, 0.25, 0.4, 0.39, 0.37, 0.1, 0.25, 0.29, 0.37, 0.31,
        0.35, 0.23, 0.34, 0.29, 0.35, 0.44, 0.37, 0.28, 0.28, 0.33, 0.37, 0.22,
      ],
      [
        0.27, 0.27, 0.38, 0.25, 1, 0.24, 0.3, 0.19, 0.34, 0.43, 0.41, 0.42,
        0.42, 0.25, 0.38, 0.47, 0.25, 0.35, 0.33, 0.52, 0.36, 0.48, 0.39, 0.42,
        0.38,
      ],
      [
        0.73, 0.67, 0.35, 0.4, 0.24, 1, 0.59, 0.69, 0.11, 0.19, 0.61, 0.25,
        0.28, 0.68, 0.63, 0.38, 0.45, 0.62, 0.65, 0.28, 0.32, 0.28, 0.4, 0.43,
        0.42,
      ],
      [
        0.6, 0.59, 0.47, 0.39, 0.3, 0.59, 1, 0.63, 0.21, 0.3, 0.58, 0.39, 0.31,
        0.6, 0.53, 0.51, 0.45, 0.64, 0.59, 0.35, 0.2, 0.45, 0.33, 0.44, 0.43,
      ],
      [
        0.68, 0.61, 0.38, 0.37, 0.19, 0.69, 0.63, 1, 0.23, 0.29, 0.54, 0.28,
        0.32, 0.78, 0.56, 0.42, 0.53, 0.7, 0.64, 0.28, 0.28, 0.28, 0.4, 0.4,
        0.42,
      ],
      [
        0.22, 0.26, 0.22, 0.1, 0.34, 0.11, 0.21, 0.23, 1, 0.34, 0.24, 0.25,
        0.37, 0.23, 0.23, 0.34, 0.29, 0.28, 0.22, 0.37, 0.42, 0.42, 0.19, 0.33,
        0.22,
      ],
      [
        0.23, 0.27, 0.57, 0.25, 0.43, 0.19, 0.3, 0.29, 0.34, 1, 0.28, 0.63,
        0.42, 0.3, 0.32, 0.38, 0.33, 0.24, 0.23, 0.52, 0.36, 0.48, 0.39, 0.35,
        0.38,
      ],
      [
        0.55, 0.49, 0.5, 0.29, 0.41, 0.61, 0.58, 0.54, 0.24, 0.28, 1, 0.3, 0.35,
        0.55, 0.62, 0.59, 0.6, 0.63, 0.59, 0.35, 0.4, 0.52, 0.46, 0.47, 0.5,
      ],
      [
        0.33, 0.32, 0.49, 0.37, 0.42, 0.25, 0.39, 0.28, 0.25, 0.63, 0.3, 1,
        0.46, 0.32, 0.33, 0.42, 0.36, 0.3, 0.31, 0.46, 0.35, 0.44, 0.46, 0.36,
        0.42,
      ],
      [
        0.36, 0.39, 0.28, 0.31, 0.42, 0.28, 0.31, 0.32, 0.37, 0.42, 0.35, 0.46,
        1, 0.29, 0.38, 0.42, 0.42, 0.3, 0.41, 0.54, 0.35, 0.35, 0.35, 0.36,
        0.35,
      ],
      [
        0.69, 0.67, 0.42, 0.35, 0.25, 0.68, 0.6, 0.78, 0.23, 0.3, 0.55, 0.32,
        0.29, 1, 0.59, 0.46, 0.48, 0.71, 0.68, 0.29, 0.37, 0.33, 0.49, 0.46,
        0.42,
      ],
      [
        0.58, 0.55, 0.42, 0.23, 0.38, 0.63, 0.53, 0.56, 0.23, 0.32, 0.62, 0.33,
        0.38, 0.59, 1, 0.46, 0.55, 0.63, 0.57, 0.38, 0.37, 0.37, 0.35, 0.38,
        0.55,
      ],
      [
        0.38, 0.38, 0.44, 0.34, 0.47, 0.38, 0.51, 0.42, 0.34, 0.38, 0.59, 0.42,
        0.42, 0.46, 0.46, 1, 0.49, 0.51, 0.43, 0.42, 0.47, 0.63, 0.52, 0.32,
        0.44,
      ],
      [
        0.44, 0.43, 0.44, 0.29, 0.25, 0.45, 0.45, 0.53, 0.29, 0.33, 0.6, 0.36,
        0.42, 0.48, 0.55, 0.49, 1, 0.58, 0.49, 0.3, 0.35, 0.35, 0.46, 0.45,
        0.55,
      ],
      [
        0.63, 0.57, 0.39, 0.35, 0.35, 0.62, 0.64, 0.7, 0.28, 0.24, 0.63, 0.3,
        0.3, 0.71, 0.63, 0.51, 0.58, 1, 0.64, 0.43, 0.35, 0.4, 0.39, 0.49, 0.51,
      ],
      [
        0.81, 0.74, 0.43, 0.44, 0.33, 0.65, 0.59, 0.64, 0.22, 0.23, 0.59, 0.31,
        0.41, 0.68, 0.57, 0.43, 0.49, 0.64, 1, 0.34, 0.31, 0.35, 0.41, 0.53,
        0.37,
      ],
      [
        0.36, 0.39, 0.28, 0.37, 0.52, 0.28, 0.35, 0.28, 0.37, 0.52, 0.35, 0.46,
        0.54, 0.29, 0.38, 0.42, 0.3, 0.43, 0.34, 1, 0.35, 0.35, 0.29, 0.52,
        0.35,
      ],
      [
        0.32, 0.26, 0.32, 0.28, 0.36, 0.32, 0.2, 0.28, 0.42, 0.36, 0.4, 0.35,
        0.35, 0.37, 0.37, 0.47, 0.35, 0.35, 0.31, 0.35, 1, 0.4, 0.4, 0.29, 0.16,
      ],
      [
        0.32, 0.26, 0.47, 0.28, 0.48, 0.28, 0.45, 0.28, 0.42, 0.48, 0.52, 0.44,
        0.35, 0.33, 0.37, 0.63, 0.35, 0.4, 0.35, 0.35, 0.4, 1, 0.46, 0.29, 0.47,
      ],
      [
        0.42, 0.39, 0.47, 0.33, 0.39, 0.4, 0.33, 0.4, 0.19, 0.39, 0.46, 0.46,
        0.35, 0.49, 0.35, 0.52, 0.46, 0.39, 0.41, 0.29, 0.4, 0.46, 1, 0.43,
        0.42,
      ],
      [
        0.52, 0.5, 0.37, 0.37, 0.42, 0.43, 0.44, 0.4, 0.33, 0.35, 0.47, 0.36,
        0.36, 0.46, 0.38, 0.32, 0.45, 0.49, 0.53, 0.52, 0.29, 0.29, 0.43, 1,
        0.32,
      ],
      [
        0.38, 0.38, 0.38, 0.22, 0.38, 0.42, 0.43, 0.42, 0.22, 0.38, 0.5, 0.42,
        0.35, 0.42, 0.55, 0.44, 0.55, 0.51, 0.37, 0.35, 0.16, 0.47, 0.42, 0.32,
        1,
      ],
    ];

    // Max value for visualMap
    this.maxVal = Math.max(...this.matrixData.flat());

    // Create both options
    this.heatmapOption = this.createHeatmapOption();
    this.barOption = this.createBarOption();

    this.current = this.barOption;
    this.option = this.current;
  }

  // Toggle between heatmap (false) and bar (true)
  toggle(active) {
    this.current = active ? this.heatmapOption : this.barOption;
    this.chart.setOption(this.current, true);
  }

  createHeatmapOption() {
    // Total of all matrix values for percentages
    const grandTotal = this.matrixData.flat().reduce((a, b) => a + b, 0);

    return {
      title: {
        text: "Hermitcraft Viewing Matrix",
        left: "center",
      },
      tooltip: {
        formatter: (p) => {
          const [row, col, val] = p.data;
          return `${this.devices[row]} × ${this.devices[col]}: ${val}`;
        },
      },
      xAxis: {
        type: "category",
        data: this.devices,
        axisLabel: {
          rotate: -90, // or -90
          interval: 0, // show all labels
        },
      },
      yAxis: {
        type: "category",
        data: this.devices,
      },
      visualMap: {
        min: 0,
        max: this.maxVal,
        calculable: true,
      },
      series: [
        {
          type: "heatmap",
          data: this.matrixData.flatMap((row, r) =>
            row.map((val, c) => [r, c, val]),
          ),
        },
      ],
    };
  }

  createBarOption() {
    const data = [
      73, 65, 61, 61, 59, 41, 40, 35, 30, 29, 23, 21, 20, 16, 16, 16, 13, 13,
      13, 10, 10, 7, 7, 7, 5,
    ];

    const total = data.reduce((a, b) => a + b, 0);

    const hermits = [
      "BdoubleO",
      "Cubfan135",
      "Docm77",
      "FalseSymmetry",
      "GeminiTay",
      "GoodTimesWithScar",
      "Grian",
      "Hypnotizd",
      "iJevin",
      "ImpulseSV",
      "JoeHills",
      "Keralis",
      "MumboJumbo",
      "PearlescentMoon",
      "Rendog",
      "Skizzleman",
      "SmallishBeans",
      "TangoTek",
      "VintageBeef",
      "Welsknight",
      "xBCrafted",
      "Xisumavoid",
      "Zedaph",
      "ZombieCleo",
    ];

    let option = structuredClone(BaseChart.defaultOption);

    option.title = { text: "Most Watched Hermits", left: "center" };
    option.yAxis.data = hermits;
    option.yAxis.name = "Series";

    option.series = [
      {
        name: "Count",
        type: "bar",
        data: data,
        label: {
          show: true,
          position: "insideRight",
          color: "#fff",
          formatter: (params) => {
            if (params.value < 5) return "";
            const percent = ((params.value / total) * 100).toFixed(1);
            return `${params.value} (${percent}%)`;
          },
        },
      },
    ];

    option.tooltip = {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params) => {
        const p = params[0];
        const percent = ((p.value / total) * 100).toFixed(1);
        return `${p.name}: ${p.value} (${percent}%)`;
      },
    };
    return option;
  }
}

class Question16_FavChannel extends BaseChart {
  constructor(el, manager) {
    super(el, manager);

    this.option = structuredClone(BaseChart.defaultOption);

    const data = [53, 20, 17, 14, 11, 10, 10, 8, 4, 3, 2, 2, 1, 1, 1, 1, 1];
    const total = data.reduce((a, b) => a + b, 0);

    const labels = [
      "#etho",
      "#ingamechat",
      "#slabserver",
      "#general",
      "#gamenight",
      "#announcements",
      "#technology",
      "#vctext",
      "#minecraft",
      "#community-bulletin",
      "#books",
      "#photos-and-art",
      "#creative",
      "#nexus-ingamechat",
      "#rules",
      "#s4-puzzle",
      "#wiki",
    ];

    this.option.title = { text: "Favourite Discord Channel", left: "center" };
    this.option.yAxis.data = labels;
    this.option.yAxis.name = "Channels";

    this.option.series = [
      {
        name: "Count",
        type: "bar",
        data: data,
        itemStyle: { color: "#5470C6" },

        label: {
          show: true,
          position: "insideRight", // <-- inside the solid bar
          color: "#fff", // white text for contrast
          formatter: (params) => {
            if (params.value < 5) return "";
            const percent = ((params.value / total) * 100).toFixed(1);
            return `${params.value} (${percent}%)`;
          },
        },
      },
    ];

    this.option.tooltip = {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params) => {
        const p = params[0];
        const percent = ((p.value / total) * 100).toFixed(1);
        return `${p.name}: ${p.value} (${percent}%)`;
      },
    };
  }
}

class Question17_Bot extends BaseChart {
  constructor(el, manager) {
    super(el, manager);

    this.option = {
      title: {
        text: "Favourite Etho Discord Bot",
        left: "center",
      },
      tooltip: {
        trigger: "item",
        formatter: "{b}: {c} count ({d}%)", // clearer tooltip
      },
      legend: {
        orient: "vertical",
        right: 10,
        left: "left",
        textStyle: {
          width: 260, // control wrapping width
          overflow: "break",
          lineHeight: 18,
        },
        formatter: (name) => {
          const descriptions = {
            Chester: "Chester - Staff modmail and report handling",
            Music: "Music - Plays music in voice channels",
            NexusBot:
              "NexusBot - Syncs Minecraft <-> Discord chat for #nexus-ingamechat",
            Sethwing:
              "Sethwing - Handles #vctext, roles, whitelists, and message moving",
            Slabbot:
              "Slabbot - Syncs Minecraft <-> Discord chat for #ingamechat and #creative-ingamechat",
          };

          return descriptions[name] || name;
        },
      },

      series: [
        {
          name: "Bot",
          type: "pie",
          data: [
            { name: "Chester", value: 24 },
            { name: "Music", value: 10 },
            { name: "NexusBot", value: 3 },
            { name: "Sethwing", value: 79 },
            { name: "Slabbot", value: 29 },
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
    };
  }
}

class Question18_PlayedGamenight extends BaseChart {
  constructor(el, manager) {
    super(el, manager);

    this.option = {
      title: {
        text: "Taken Part in a Gamenight?",
        left: "center",
      },
      tooltip: {
        trigger: "item",
        formatter: (i) => `${i.name}: ${i.value} (${i.percent}%)`,
      },
      series: [
        {
          name: "Taken part in a Gamenight?",
          type: "pie",
          radius: "65%",
          center: ["50%", "55%"],
          data: [
            { name: "Never taken part", value: 94 },
            { name: "Yes - within the past 3 months", value: 41 },
            { name: "Yes - not in the past 3 months", value: 50 },
          ],
          label: {
            formatter: "{b}\n{d}%",
          },
        },
      ],
    };
  }
}

class Question19_OrganizedGamenight extends BaseChart {
  constructor(el, manager) {
    super(el, manager);

    this.option = {
      title: {
        text: "Organized a Gamenight (if taken part)",
        left: "center",
      },
      tooltip: {
        trigger: "item",
        formatter: (i) => `${i.name}: ${i.value} (${i.percent}%)`,
      },
      series: [
        {
          name: "Taken part in a Gamenight?",
          type: "pie",
          radius: "65%",
          center: ["50%", "55%"],
          data: [
            { name: "No", value: 64 },
            { name: "Yes", value: 27 },
          ],
          label: {
            formatter: "{b}\n{d}%",
          },
        },
      ],
    };
  }
}

class Question21_GN_rating extends BaseChart {
  constructor(el, manager) {
    super(el, manager);

    const label = ["#gamenight"];

    // Scale definition (authoritative)
    const scale = {
      1: "Very poor",
      2: "Poor",
      3: "Adequate",
      4: "Good",
      5: "Excellent",
    };

    // Raw response counts (example values — replace as needed)
    const rawData = {
      1: 0, // Very poor
      2: 7, // Poor
      3: 26, // Adequate
      4: 30, // Good
      5: 15, // Excellent
    };

    const total = Object.values(rawData).reduce((a, b) => a + b, 0);

    const toPercentage = (value) => +((value / total) * 100).toFixed(2);

    this.option = {
      title: {
        text: "How well does #gamenight function currently?",
        left: "center",
      },

      tooltip: {
        trigger: "item",
        formatter: (p) => {
          const scaleValue = p.seriesName.split(" ")[0];
          const rawValue = rawData[scaleValue];

          return `
            <strong>${p.seriesName}</strong><br/>
            ${rawValue} responses (${p.value}%)
          `;
        },
      },

      xAxis: {
        type: "value",
        max: 100,
        axisLabel: {
          formatter: "{value}%",
        },
      },

      yAxis: {
        type: "category",
        data: label,
      },

      legend: {
        top: 45,
        left: "center",
      },

      series: Object.entries(scale).map(([key, labelText]) => ({
        name: `${key} = ${labelText}`,
        type: "bar",
        stack: "total",
        data: [toPercentage(rawData[key])],
      })),
    };
  }
}

class Question22_GNAsForum extends BaseChart {
  constructor(el, manager) {
    super(el, manager);

    this.option = {
      title: {
        text: "Gamenight as a Forum Channel?",
        left: "center",
      },
      tooltip: {
        trigger: "item",
        formatter: "{b}: {c} users ({d}%)", // clearer tooltip
      },
      legend: {
        orient: "vertical",
        right: "right", //ove legend to the right
        top: "center",
      },
      series: [
        {
          name: "Languages",
          type: "pie",
          radius: "65%",
          data: [
            { name: "Yes", value: 37 },
            { name: "No", value: 39 },
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
    };
  }
}

class Question23_GNSlow extends BaseChart {
  constructor(el, manager) {
    super(el, manager);

    this.option = {
      title: {
        text: "Gamenight Slowmode?",
        left: "center",
      },
      tooltip: {
        trigger: "item",
        formatter: "{b}: {c} users ({d}%)", // clearer tooltip
      },
      legend: {
        orient: "vertical",
        right: "right", //ove legend to the right
        top: "center",
      },
      series: [
        {
          name: "Slowmo",
          type: "pie",
          radius: "65%",
          data: [
            { name: "Yes - a long one", value: 1 },
            { name: "Yes - a short one", value: 13 },
            { name: "No", value: 63 },
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
    };
  }
}

class Question24_FavChannel extends BaseChart {
  constructor(el, manager) {
    super(el, manager);

    const categories = [
      "Information",
      "General",
      "Interests",
      "Slabserver",
      "Community",
      "Voice",
      "Archived",
    ];

    const categoryDescriptions = {
      Information: "#announcements, #welcome, #rules, #help",
      General: "#general, #etho, #minecraft, #feedback",
      Interests: "#books, #food, #games, #music, #photos-and-art, #technology",
      Slabserver:
        "#slabserver, #ingamechat, #community-bulletin, #creative, #creative-ingamechat, #s3-puzzle, #resource-world-poll",
      Community: "#gamenight, #nexus-ingamechat, #wiki",
      Voice: "#vctext and voice channels",
      Archived: "All archived channels",
    };

    const rawData = {
      Never: [22, 19, 58, 49, 73, 83, 124],
      Sometimes: [51, 34, 45, 39, 44, 34, 32],
      "Somewhat Regularly": [48, 32, 27, 23, 28, 14, 6],
      Often: [19, 28, 15, 13, 12, 19, 3],
      "Very Often": [26, 53, 19, 42, 9, 15, 0],
    };

    // 1. Calculate totals per category
    const totals = categories.map((_, i) =>
      Object.values(rawData).reduce((sum, arr) => sum + arr[i], 0),
    );

    // 2. Convert raw values → percentages
    function toPercentages(values) {
      return values.map((v, i) => +((v / totals[i]) * 100).toFixed(2));
    }

    this.option = {
      title: {
        text: "Etho Discord Channel Category Usage",
        left: "center",
      },
      tooltip: {
        trigger: "item",
        formatter: (p) => {
          const category = p.name;
          const rawValue = rawData[p.seriesName][p.dataIndex];
          const desc = categoryDescriptions[category] ?? "";

          return `
      <strong>${category}</strong><br/>
      <em>${desc}</em><br/>
      ${p.seriesName}: ${rawValue} (${p.value}%)
    `;
        },
      },

      xAxis: {
        type: "value",
        max: 100,
        axisLabel: {
          formatter: "{value}%",
        },
      },
      yAxis: {
        type: "category",
        data: categories,
        inverse: true,
      },
      legend: {
        top: "45",
        left: "center",
        orient: "horizontal",
        itemGap: 20, // space between items
        textStyle: {
          fontSize: 12,
        },
      },

      series: [
        {
          name: "Never",
          type: "bar",
          stack: "total",
          data: toPercentages(rawData.Never),
        },
        {
          name: "Sometimes",
          type: "bar",
          stack: "total",
          data: toPercentages(rawData.Sometimes),
        },
        {
          name: "Somewhat Regularly",
          type: "bar",
          stack: "total",
          data: toPercentages(rawData["Somewhat Regularly"]),
        },
        {
          name: "Often",
          type: "bar",
          stack: "total",
          data: toPercentages(rawData.Often),
        },
        {
          name: "Very Often",
          type: "bar",
          stack: "total",
          data: toPercentages(rawData["Very Often"]),
        },
      ],
    };
  }
}

class Question39_Wiki extends BaseChart {
  constructor(el, manager) {
    super(el, manager);

    const links = [
      { source: "Aware of the project: No", target: "Used: No", value: 60 },
      { source: "Used: No", target: "Plan to Contribute: No", value: 107 },
      { source: "Aware of the project: Yes", target: "Used: No", value: 61 },
      { source: "Aware of the project: Yes", target: "Used: Yes", value: 62 },
      { source: "Used: Yes", target: "Plan to Contribute: Yes", value: 25 },
      { source: "Used: Yes", target: "Plan to Contribute: No", value: 37 },
      { source: "Used: No", target: "Plan to Contribute: Yes", value: 14 },
    ];

    // Hardcoded totals for each question
    const questionTotals = {
      Aware: 123 + 60, // Aware: Yes + No
      Used: 62 + 121, // Used: Yes + No
      Contribute: 39 + 144, // Contribute: Yes + No
    };

    // Node → question mapping
    const nodeQuestions = {
      "Aware of the project: Yes": "Aware",
      "Aware of the project: No": "Aware",
      "Used: Yes": "Used",
      "Used: No": "Used",
      "Plan to Contribute: Yes": "Contribute",
      "Plan to Contribute: No": "Contribute",
    };

    this.option = {
      title: {
        text: "Slabserver Wiki Awareness & Engagement",
        left: "center",
      },
      tooltip: {
        trigger: "item",
        triggerOn: "mousemove",
        formatter: (params) => {
          const questions = {
            "Aware of the project: Yes":
              "Were you already aware of the Slabserver Wiki project?",
            "Aware of the project: No":
              "Were you already aware of the Slabserver Wiki project?",
            "Used: Yes": "Have you used the Wiki in the past year?",
            "Used: No": "Have you used the Wiki in the past year?",
            "Plan to Contribute: Yes":
              "Do you see yourself contributing to the Slabserver Wiki in the next year?",
            "Plan to Contribute: No":
              "Do you see yourself contributing to the Slabserver Wiki in the next year?",
          };

          if (params.node) {
            const question = nodeQuestions[params.name];
            const total = questionTotals[question];
            const pct = ((params.value / total) * 100).toFixed(1);
            return `${params.name}<br>${questions[params.name] || ""}<br>${params.value} (${pct}%) of ${question}`;
          }

          if (params.data.source) {
            const sourceQuestion = nodeQuestions[params.data.source];
            const total = questionTotals[sourceQuestion];
            const pct = ((params.data.value / total) * 100).toFixed(1);
            return `${params.data.source} → ${params.data.target}: ${params.data.value} (${pct}%) of ${sourceQuestion}`;
          }

          return params.name;
        },
      },
      series: [
        {
          type: "sankey",
          layout: "none",
          emphasis: {
            focus: "adjacency",
          },
          data: [
            { name: "Aware of the project: Yes" },
            { name: "Aware of the project: No" },
            { name: "Used: Yes" },
            { name: "Used: No" },
            { name: "Plan to Contribute: Yes" },
            { name: "Plan to Contribute: No" },
          ],
          links: links,
          lineStyle: {
            color: "gradient",
            curveness: 0.5,
          },
          label: {
            show: true,
            formatter: (params) => {
              const question = nodeQuestions[params.name];
              const total = questionTotals[question];
              const pct = ((params.value / total) * 100).toFixed(1);
              return `${params.name}\n${pct}%`;
            },
          },
        },
      ],
    };
  }
}

class Question43_NexusPlay extends BaseChart {
  constructor(el, manager) {
    super(el, manager);

    this.option = {
      title: {
        text: "Nexus Server Awareness & Engagement",
        left: "center",
      },
      tooltip: {
        formatter: (i) => `${i.name}: ${i.value}%`,
      },
      series: [
        {
          type: "sunburst",
          radius: ["15%", "80%"],
          data: [
            {
              name: "Played on\n Nexus",
              value: 26.6,
              children: [
                { name: "Played recently\n(≤ 3 months)", value: 11 },
                { name: "Played before", value: 15.6 },
              ],
            },
            {
              name: "Never played\n on Nexus",
              value: 73.4,
              children: [
                { name: "Knew Nexus\n existed", value: 38.3 },
                { name: "Didn’t know\n Nexus existed", value: 35.1 },
              ],
            },
          ],
        },
      ],
      levels: [
        {},
        {
          label: {
            rotate: "tangential",
          },
        },
      ],
    };
  }
}
class Question44_FavGame extends BaseChart {
  constructor(el, manager) {
    super(el, manager);

    this.option = structuredClone(BaseChart.defaultOption);

    const data = [22, 19, 11, 2, 2];
    const total = data.reduce((a, b) => a + b, 0);

    const labels = [
      "S3 Archive",
      "Decked Out",
      "Hurtin' Slabbers",
      "S1 Archive",
      "S2 Archive",
    ];

    this.option.title = { text: "Favourite Nexus Server", left: "center" };
    this.option.yAxis.data = labels;
    this.option.yAxis.name = "Servers";

    this.option.series = [
      {
        name: "Count",
        type: "bar",
        data: data,
        label: {
          show: true,
          position: "insideRight",
          color: "#fff",
          formatter: (params) => {
            if (params.value < 5) return "";
            const percent = ((params.value / total) * 100).toFixed(1);
            return `${params.value} (${percent}%)`;
          },
        },
      },
    ];

    this.option.tooltip = {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params) => {
        const p = params[0];
        const percent = ((p.value / total) * 100).toFixed(1);
        return `${p.name}: ${p.value} (${percent}%)`;
      },
    };
  }
}

class Question47_S4Engagement extends BaseChart {
  constructor(el, manager) {
    super(el, manager);

    const ROOT_TOTAL = 118 + 68; // or compute dynamically

    this.option = {
      title: {
        text: "Survival Server Engagement",
        left: "center",
      },
      tooltip: {
        formatter: (info) => {
          const percent = ((info.value / ROOT_TOTAL) * 100).toFixed(1);
          return `${info.name}\n${percent}%`;
        },
      },

      series: [
        {
          type: "sunburst",
          radius: ["15%", "80%"],
          data: [
            {
              name: "Yes",
              value: 118,
              children: [
                {
                  name: "Currently active",
                  value: 58,
                },
                {
                  name: "Not currently\n active",
                  value: 41,
                },
                {
                  name: "Used to play\n in S3",
                  value: 19,
                },
              ],
            },
            {
              name: "No",
              value: 68,
              children: [
                {
                  name: "Interested in\n joining",
                  value: 30,
                },
                {
                  name: "Not interested",
                  value: 38,
                },
              ],
            },
          ],
          emphasis: {
            focus: "ancestor",
          },
        },
      ],
      levels: [
        {},
        {
          label: {
            rotate: "tangential",
          },
        },
        {
          label: {
            rotate: "radial",
          },
        },
      ],
    };
  }
}

class Question51_PhantomGamerule extends BaseChart {
  constructor(el, manager) {
    super(el, manager);

    this.statuses = ["Not active on S4", "Currently active on S4"];

    this.explosionOptions = [
      "Keep as is",
      "Resource World Only",
      "Shorter or vanilla",
      "Slightly longer",
      "Significantly longer",
    ];

    this.values = {
      "Not active on S4": [21, 8, 2, 3, 0],
      "Currently active on S4": [33, 15, 4, 3, 3],
    };

    const labelThreshold = 2; // hide labels below 2%

    this.option = {
      title: {
        text: "Phantom Behaviour Sentiment on Slabserver",
        left: "center",
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (items) =>
          items.map((i) => `${i.seriesName}: ${i.value}%`).join("<br>"),
      },
      legend: { top: 38 },
      grid: { left: 120, right: 40, bottom: 40 },
      xAxis: {
        type: "category",
        data: this.explosionOptions, // now the bars are categories
        axisLabel: {
          interval: 0, // 0 = show all labels
          rotate: 0, // you can rotate to avoid overlap, e.g., 30 or 45 degrees
        },
      },
      yAxis: {
        type: "value",
        axisLabel: { formatter: "{value}" },
      },
      series: this.statuses.map((status) => ({
        name: status,
        type: "bar",
        stack: "total",
        data: this.explosionOptions.map((opt, j) => this.values[status][j]),
        label: {
          show: true,
          position: "insideTop", // labels inside bars
          overflow: "truncate", // ensures long labels don’t disappear
          formatter: (params) =>
            params.value >= labelThreshold ? `${params.value}` : "",
        },
      })),
    };
  }
}

class Question56_ResourcePacks extends BaseChart {
  constructor(el, manager) {
    super(el, manager);

    this.option = {
      title: {
        text: "Use of Resource Packs on Slabserver",
        left: "center",
      },
      tooltip: {
        trigger: "item",
        formatter: (i) => `${i.name}: ${i.value} (${i.percent}%)`,
      },
      series: [
        {
          name: "Use a Resource Pack",
          type: "pie",
          radius: "65%",
          center: ["50%", "55%"],
          data: [
            { name: "No", value: 54 },
            { name: "Yes", value: 61 },
          ],
          label: {
            formatter: "{b}\n{d}%",
          },
        },
      ],
    };
  }
}

class Question58_MakingFarms extends BaseChart {
  constructor(el, manager) {
    super(el, manager);

    this.statuses = ["Never played", "Played, not active", "Active on S4"];

    this.explosionOptions = [
      "No",
      "Unsure",
      "Yes, both block\n explosions and \nmob explosions",
      "Yes, only\nblock explosions",
      "Yes, only\nmob explosions",
    ];

    this.values = {
      "Never played": [14, 2, 0, 0, 0],
      "Played, not active": [33, 15, 4, 3, 0],
      "Active on S4": [33, 15, 4, 3, 0],
    };

    const labelThreshold = 2; // hide labels below 2

    this.option = {
      title: {
        text: "Making Farms for Explosion Decay gamerule by S4 Activity",
        left: "center",
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (items) =>
          items.map((i) => `${i.seriesName}: ${i.value}`).join("<br>"),
      },
      legend: { top: 38 },
      grid: { left: 150, right: 40, bottom: 40 },
      xAxis: {
        type: "category",
        data: this.explosionOptions,
        axisLabel: {
          interval: 0,
          rotate: 0,
        },
      },
      yAxis: {
        type: "value",
        axisLabel: { formatter: "{value}" },
      },
      series: this.statuses.map((status) => ({
        name: status,
        type: "bar",
        stack: "total",
        data: this.explosionOptions.map((opt, j) => this.values[status][j]),
        label: {
          show: true,
          position: "insideTop",
          formatter: (params) =>
            params.value >= labelThreshold ? `${params.value}` : "",
        },
      })),
    };
  }
}

class Question59_RWTrailed extends BaseChart {
  constructor(el, manager) {
    super(el, manager);

    this.statuses = ["Never played", "Played, not active", "Active on S4"];

    this.explosionOptions = ["No", "Unsure", "Yes"];

    this.values = {
      "Never played": [1, 9, 5],
      "Played, not active": [3, 12, 23],
      "Active on S4": [15, 17, 24],
    };

    const labelThreshold = 2; // hide labels below 2

    this.option = {
      title: {
        text: "Explosion Decay gamerule trial in RW by S4 Activity",
        left: "center",
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (items) =>
          items.map((i) => `${i.seriesName}: ${i.value}`).join("<br>"),
      },
      legend: { top: 38 },
      grid: { left: 150, right: 40, bottom: 40 },
      xAxis: {
        type: "category",
        data: this.explosionOptions,
        axisLabel: {
          interval: 0,
          rotate: 0,
        },
      },
      yAxis: {
        type: "value",
        axisLabel: { formatter: "{value}" },
      },
      series: this.statuses.map((status) => ({
        name: status,
        type: "bar",
        stack: "total",
        data: this.explosionOptions.map((opt, j) => this.values[status][j]),
        label: {
          show: true,
          position: "insideTop",
          formatter: (params) =>
            params.value >= labelThreshold ? `${params.value}` : "",
        },
      })),
    };
  }
}

class Question54_Client extends BaseChart {
  constructor(el, manager) {
    super(el, manager);

    this.option = {
      title: {
        text: "Preferred Minecraft Client on Slabserver",
        left: "center",
      },
      tooltip: {
        trigger: "item",
        formatter: "{b}: {c} users ({d}%)", // clearer tooltip
      },
      legend: {
        orient: "vertical",
        right: "right", //ove legend to the right
        top: "center",
      },
      series: [
        {
          name: "Type",
          type: "pie",
          radius: "65%",
          center: ["50%", "55%"],
          data: [
            { name: "Vanilla", value: 31 },
            { name: "Modded", value: 89 },
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
    };
  }
}

class Question69_CJ extends BaseChart {
  constructor(el, manager) {
    super(el, manager);

    const nodeColors = {
      Chris: "#5470C6",
      Didy: "#EE6666",
      Jade: "#FAC858",
      Marb: "#73C0DE",
      Marine: "#3BA272",
      Twist: "#9A60B4",
    };

    const nodes = [
      { id: "Chris", name: "Chris", x: 0, y: 0 },
      { id: "Didy", name: "Didy", x: 0, y: 1 },
      { id: "Jade", name: "Jade", x: 0, y: 2 },
      { id: "Marb", name: "Marb", x: 0, y: 3 },
      { id: "Marine", name: "Marine", x: 0, y: 4 },
      { id: "Didy_R", name: "Didy", x: 7, y: 0 },
      { id: "Jade_R", name: "Jade", x: 7, y: 1 },
      { id: "Marb_R", name: "Marb", x: 7, y: 2 },
      { id: "Marine_R", name: "Marine", x: 7, y: 3 },
      { id: "Chris_R", name: "Chris", x: 7, y: 4 },
      { id: "Twist_R", name: "Twist", x: 7, y: 6 },
    ].map((n) => ({
      ...n,
      itemStyle: { color: nodeColors[n.name] || "#fefefeff" },
      label: { show: true, fontWeight: "bold" },
      symbolSize: 24,
    }));

    const links = [
      { source: "Chris", target: "Didy_R", value: 4 },
      { source: "Chris", target: "Jade_R", value: 5 },
      { source: "Chris", target: "Marb_R", value: 6 },
      { source: "Chris", target: "Marine_R", value: 4 },
      { source: "Didy", target: "Chris_R", value: 1 },
      { source: "Didy", target: "Marb_R", value: 1 },
      { source: "Didy", target: "Marine_R", value: 2 },
      { source: "Jade", target: "Chris_R", value: 1 },
      { source: "Jade", target: "Didy_R", value: 1 },
      { source: "Jade", target: "Marb_R", value: 2 },
      { source: "Jade", target: "Marine_R", value: 2 },
      { source: "Marb", target: "Chris_R", value: 11 },
      { source: "Marb", target: "Didy_R", value: 8 },
      { source: "Marb", target: "Jade_R", value: 5 },
      { source: "Marb", target: "Marine_R", value: 13 },
      { source: "Marb", target: "Twist_R", value: 1 },
      { source: "Marine", target: "Chris_R", value: 2 },
      { source: "Marine", target: "Didy_R", value: 5 },
      { source: "Marine", target: "Jade_R", value: 3 },
      { source: "Marine", target: "Marb_R", value: 4 },
    ].map((l) => ({
      ...l,
      lineStyle: {
        width: 2 + l.value,
        opacity: 0.7,
        curveness: 0.1,
        color: nodeColors[l.source] || "#999",
      },
    }));

    this.option = {
      tooltip: {
        formatter: (params) => {
          if (params.dataType === "edge") {
            return `${params.data.source} → ${params.data.target}<br/>Count: ${params.data.value}`;
          }
          return params.name;
        },
      },
      xAxis: { show: false },
      yAxis: { show: false },
      series: [
        {
          type: "graph",
          layout: "none",
          data: nodes,
          links: links,
          roam: true,
          focusNodeAdjacency: true,
          label: { show: true },
          edgeSymbol: ["none", "arrow"],
          edgeSymbolSize: 8,
          lineStyle: { opacity: 0.7, curveness: 0.1 },
        },
      ],
      // Plain text labels for the groups
      graphic: [
        {
          type: "text",
          left: "5%", // position above left column
          top: "5%",
          style: {
            text: "Chicken",
            fill: "#333",
            font: "bold 14px sans-serif",
          },
        },
        {
          type: "text",
          left: "85%", // position above right column
          top: "5%",
          style: { text: "Jockey", fill: "#333", font: "bold 14px sans-serif" },
        },
      ],
    };
  }
}

class Question57_MobdropGamerule extends BaseChart {
  constructor(el, manager) {
    super(el, manager);

    this.statuses = [
      "Used to but not on S4",
      "Not active on S4",
      "Currently active on S4",
    ];

    this.explosionOptions = [
      "No",
      "Unsure",
      "Yes, both block\n explosions and \nmob explosions",
      "Yes, only\nblock explosions",
      "Yes, only\nmob explosions",
    ];

    this.values = {
      "Used to but not on S4": [2, 6, 5, 1, 2],
      "Not active on S4": [7, 13, 17, 1, 2],
      "Currently active on S4": [6, 13, 33, 1, 4],
    };

    const labelThreshold = 2; // hide labels below 2%

    this.option = {
      title: {
        text: "Explosion Decay gamerule preference by S4 Activity",
        left: "center",
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (items) =>
          items.map((i) => `${i.seriesName}: ${i.value}%`).join("<br>"),
      },
      legend: { top: 38 },
      grid: { left: 120, right: 40, bottom: 40 },
      xAxis: {
        type: "category",
        data: this.explosionOptions, // now the bars are categories
        axisLabel: {
          interval: 0,
          rotate: 0,
        },
      },
      yAxis: {
        type: "value",
        axisLabel: { formatter: "{value}" },
      },
      series: this.statuses.map((status) => ({
        name: status,
        type: "bar",
        stack: "total",
        data: this.explosionOptions.map((opt, j) => this.values[status][j]),
        label: {
          show: true,
          position: "insideTop",
          formatter: (params) =>
            params.value >= labelThreshold ? `${params.value}` : "",
        },
      })),
    };
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const manager = new ChartManager();
  manager.bindThemeListener();
  manager.bindToggleListener();

  // Register map once
  const geo = await fetch(
    "https://raw.githubusercontent.com/apache/echarts-www/refs/heads/master/asset/map/json/world.json",
  ).then((r) => r.json());
  echarts.registerMap("world", geo);

  const us = await fetch("/polls/USA.json").then((r) => r.json());
  echarts.registerMap("USA", us, {
    Alaska: {
      left: -131,
      top: 25,
      width: 15,
    },
    Hawaii: {
      left: -110,
      top: 28,
      width: 5,
    },
    "Puerto Rico": {
      left: -76,
      top: 26,
      width: 2,
    },
  });

  let svg = await fetch(
    "https://upload.wikimedia.org/wikipedia/commons/4/4e/World_time_zones.svg",
  ).then((r) => r.text());

  echarts.registerMap("tz", { svg });
  // echarts.registerMap("tz", svg);

  new WorldPlaytimeChart(
    document.querySelector('[data-chart="world_ping"]'),
    manager,
  );

  new Question1_Age(document.querySelector('[data-chart="q1_age"]'), manager);

  new Question2_Gender(
    document.querySelector('[data-chart="q2_gender"]'),
    manager,
  );

  new Question3_Location(
    document.querySelector('[data-chart="q3_location"]'),
    manager,
  );
  new Question4_US_Location(
    document.querySelector('[data-chart="q4_us_location"]'),
    manager,
  );

  new Question5_TZ(document.querySelector('[data-chart="q5"]'), manager);

  new Question6_Langs(
    document.querySelector('[data-chart="q6_lang"]'),
    manager,
  );

  new Question7_WhatVersion(
    document.querySelector('[data-chart="q7_version"]'),
    manager,
  );

  new Question8_WhatPlatform(
    document.querySelector('[data-chart="q8_platform"]'),
    manager,
  );

  new Question9_Tenure(
    document.querySelector('[data-chart="q9_tenure"]'),
    manager,
  );

  new Question10_Join(document.querySelector('[data-chart="q10"]'), manager);

  new Question11_WatchEtho(
    document.querySelector('[data-chart="q11"]'),
    manager,
  );

  new Question12_EthoSeries(
    document.querySelector('[data-chart="q12"]'),
    manager,
  );

  new Question13_OtherHermits(
    document.querySelector('[data-chart="q13_otherhermits"]'),
    manager,
  );

  new Question16_FavChannel(
    document.querySelector('[data-chart="q16"]'),
    manager,
  );

  new Question17_Bot(document.querySelector('[data-chart="q17"]'), manager);

  new Question18_PlayedGamenight(
    document.querySelector('[data-chart="q18"]'),
    manager,
  );

  new Question19_OrganizedGamenight(
    document.querySelector('[data-chart="q19"]'),
    manager,
  );

  new Question21_GN_rating(
    document.querySelector('[data-chart="q21"]'),
    manager,
  );

  new Question22_GNAsForum(
    document.querySelector('[data-chart="q22"]'),
    manager,
  );

  new Question23_GNSlow(document.querySelector('[data-chart="q23"]'), manager);

  new Question24_FavChannel(
    document.querySelector('[data-chart="q24"]'),
    manager,
  );

  new Question39_Wiki(document.querySelector('[data-chart="q39"]'), manager);

  new Question43_NexusPlay(
    document.querySelector('[data-chart="q43"]'),
    manager,
  );

  new Question44_FavGame(document.querySelector('[data-chart="q44"]'), manager);

  new Question47_S4Engagement(
    document.querySelector('[data-chart="q47"]'),
    manager,
  );

  new Question54_Client(document.querySelector('[data-chart="q54"]'), manager);

  new Question51_PhantomGamerule(
    document.querySelector('[data-chart="q51"]'),
    manager,
  );

  new Question57_MobdropGamerule(
    document.querySelector('[data-chart="q57"]'),
    manager,
  );
  new Question56_ResourcePacks(
    document.querySelector('[data-chart="q56"]'),
    manager,
  );

  new Question58_MakingFarms(
    document.querySelector('[data-chart="q58"]'),
    manager,
  );

  new Question59_RWTrailed(
    document.querySelector('[data-chart="q59"]'),
    manager,
  );

  new Question69_CJ(document.querySelector('[data-chart="q69"]'), manager);
});
