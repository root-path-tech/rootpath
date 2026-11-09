import type { DiagramDefinition } from "@/components/sections/services/diagram";

export interface Service {
  /** Anchors the row at `#service-${id}`, linked from llms.txt and the structured data. */
  id: "web" | "mobile" | "cloud" | "consult";
  path: string;
  name: string;
  /** The one line shown under the name in the services index. */
  summary: string;
  title: string;
  description: string;
  tags: string[];
  /**
   * How the work is done, in the terms a technical reviewer would look for. Listed in
   * llms.txt; kept off the page so the services read at a glance.
   */
  practices: string[];
  diagram: DiagramDefinition;
}

/*
 * Diagrams share a 560 x 380 drawing space. Labels come from the service copy itself:
 * they illustrate how the work fits together, not claims about results.
 */

const web: DiagramDefinition = {
  width: 560,
  height: 380,
  description:
    "A web platform built in layers: a typed component system, a performance baseline, motion and 3D, and a clear handoff, all feeding the next release.",
  frames: [
    {
      kind: "browser",
      x: 16,
      y: 20,
      w: 384,
      h: 340,
      label: "your-product.com",
      at: 0,
    },
  ],
  nodes: [
    {
      id: "components",
      x: 44,
      y: 283,
      w: 328,
      label: "component system",
      sub: "React · TypeScript",
      at: 0.16,
    },
    {
      id: "performance",
      x: 44,
      y: 217,
      w: 328,
      label: "performance baseline",
      sub: "SSR · edge · Core Web Vitals",
      at: 0.28,
    },
    {
      id: "motion",
      x: 44,
      y: 151,
      w: 328,
      label: "motion and 3D",
      sub: "GSAP · Three.js · WebGL",
      at: 0.4,
    },
    {
      id: "handoff",
      x: 44,
      y: 85,
      w: 328,
      label: "clear handoff",
      sub: "documented for your team",
      at: 0.52,
    },
    {
      id: "release",
      x: 426,
      y: 38,
      w: 132,
      label: "next release",
      accent: true,
      at: 0.84,
    },
  ],
  edges: [
    {
      from: "components",
      to: "release",
      points: [
        [372, 307],
        [410, 307],
        [410, 62],
        [426, 62],
      ],
      at: [0.56, 0.78],
      signal: true,
    },
    {
      from: "performance",
      to: "release",
      points: [
        [372, 241],
        [410, 241],
        [410, 62],
        [426, 62],
      ],
      at: [0.58, 0.8],
      signal: true,
    },
    {
      from: "motion",
      to: "release",
      points: [
        [372, 175],
        [410, 175],
        [410, 62],
        [426, 62],
      ],
      at: [0.6, 0.81],
      signal: true,
    },
    {
      from: "handoff",
      to: "release",
      points: [
        [372, 109],
        [410, 109],
        [410, 62],
        [426, 62],
      ],
      at: [0.62, 0.82],
      signal: true,
    },
  ],
};

const mobile: DiagramDefinition = {
  width: 560,
  height: 380,
  description:
    "Three app screens joined by one path, built for iOS, Android, React Native or Flutter.",
  frames: [
    { kind: "phone", x: 20, y: 12, w: 150, h: 272, at: 0 },
    { kind: "phone", x: 205, y: 12, w: 150, h: 272, at: 0.08 },
    { kind: "phone", x: 390, y: 12, w: 150, h: 272, at: 0.16 },
  ],
  nodes: [
    {
      id: "s1",
      x: 36,
      y: 204,
      w: 118,
      label: "screen 01",
      sub: "entry",
      at: 0.28,
    },
    {
      id: "s2",
      x: 221,
      y: 204,
      w: 118,
      label: "screen 02",
      sub: "core flow",
      at: 0.48,
    },
    {
      id: "s3",
      x: 406,
      y: 204,
      w: 118,
      label: "screen 03",
      sub: "result",
      accent: true,
      at: 0.66,
    },
    { id: "ios", x: 20, y: 314, w: 92, h: 40, label: "iOS", at: 0.76 },
    { id: "android", x: 124, y: 314, w: 112, h: 40, label: "Android", at: 0.8 },
    {
      id: "rn",
      x: 248,
      y: 314,
      w: 148,
      h: 40,
      label: "React Native",
      at: 0.84,
    },
    {
      id: "flutter",
      x: 408,
      y: 314,
      w: 132,
      h: 40,
      label: "Flutter",
      at: 0.88,
    },
  ],
  edges: [
    {
      from: "s1",
      to: "s2",
      points: [
        [154, 228],
        [221, 228],
      ],
      at: [0.34, 0.48],
      signal: true,
    },
    {
      from: "s2",
      to: "s3",
      points: [
        [339, 228],
        [406, 228],
      ],
      at: [0.54, 0.66],
      signal: true,
    },
  ],
};

const cloud: DiagramDefinition = {
  width: 560,
  height: 380,
  description:
    "An open architecture: clients reach a GraphQL gateway that fronts containerised services, Temporal workflows, a Redis cache and PostgreSQL, all on AWS infrastructure defined as code.",
  nodes: [
    {
      id: "client",
      x: 8,
      y: 138,
      w: 120,
      h: 56,
      label: "client",
      sub: "web · mobile",
      at: 0.1,
    },
    {
      id: "graphql",
      x: 172,
      y: 138,
      w: 148,
      h: 56,
      label: "GraphQL",
      sub: "API gateway",
      accent: true,
      at: 0.26,
    },
    {
      id: "services",
      x: 372,
      y: 8,
      w: 180,
      h: 52,
      label: "services",
      sub: "Docker · Kubernetes",
      at: 0.44,
    },
    {
      id: "workflows",
      x: 372,
      y: 74,
      w: 180,
      h: 52,
      label: "workflows",
      sub: "Temporal",
      at: 0.48,
    },
    {
      id: "cache",
      x: 372,
      y: 140,
      w: 180,
      h: 52,
      label: "cache",
      sub: "Redis",
      at: 0.52,
    },
    {
      id: "data",
      x: 372,
      y: 206,
      w: 180,
      h: 52,
      label: "data",
      sub: "PostgreSQL",
      at: 0.56,
    },
    {
      id: "aws",
      x: 8,
      y: 300,
      w: 544,
      h: 52,
      label: "AWS",
      sub: "infrastructure as code · Terraform",
      at: 0.76,
    },
  ],
  edges: [
    {
      from: "client",
      to: "graphql",
      points: [
        [128, 166],
        [172, 166],
      ],
      at: [0.14, 0.26],
      signal: true,
    },
    {
      from: "graphql",
      to: "services",
      points: [
        [320, 166],
        [346, 166],
        [346, 34],
        [372, 34],
      ],
      at: [0.32, 0.44],
      signal: true,
    },
    {
      from: "graphql",
      to: "workflows",
      points: [
        [320, 166],
        [346, 166],
        [346, 100],
        [372, 100],
      ],
      at: [0.34, 0.48],
      signal: true,
    },
    {
      from: "graphql",
      to: "cache",
      points: [
        [320, 166],
        [372, 166],
      ],
      at: [0.36, 0.52],
      signal: true,
    },
    {
      from: "graphql",
      to: "data",
      points: [
        [320, 166],
        [346, 166],
        [346, 232],
        [372, 232],
      ],
      at: [0.38, 0.56],
      signal: true,
    },
    {
      from: "graphql",
      to: "aws",
      points: [
        [246, 194],
        [246, 300],
      ],
      at: [0.62, 0.76],
    },
    {
      from: "data",
      to: "aws",
      points: [
        [462, 258],
        [462, 300],
      ],
      at: [0.64, 0.76],
    },
  ],
};

const consult: DiagramDefinition = {
  width: 560,
  height: 380,
  description:
    "A path from the current system through an architecture review and a modernization plan to a technical roadmap and a clear next move.",
  nodes: [
    {
      id: "current",
      x: 8,
      y: 16,
      w: 184,
      label: "current system",
      sub: "today",
      at: 0.1,
    },
    {
      id: "review",
      x: 64,
      y: 104,
      w: 204,
      label: "architecture review",
      sub: "assess",
      at: 0.3,
    },
    {
      id: "options",
      x: 312,
      y: 104,
      w: 240,
      label: "keep / refactor / replace",
      sub: "per component",
      at: 0.44,
    },
    {
      id: "plan",
      x: 120,
      y: 192,
      w: 200,
      label: "modernization plan",
      sub: "decide",
      at: 0.56,
    },
    {
      id: "roadmap",
      x: 176,
      y: 280,
      w: 196,
      label: "technical roadmap",
      sub: "sequence",
      at: 0.72,
    },
    {
      id: "next",
      x: 412,
      y: 280,
      w: 140,
      label: "next move",
      accent: true,
      at: 0.86,
    },
  ],
  edges: [
    {
      from: "current",
      to: "review",
      points: [
        [32, 64],
        [32, 128],
        [64, 128],
      ],
      at: [0.16, 0.3],
      signal: true,
    },
    {
      from: "review",
      to: "options",
      points: [
        [268, 128],
        [312, 128],
      ],
      at: [0.36, 0.44],
    },
    {
      from: "review",
      to: "plan",
      points: [
        [88, 152],
        [88, 216],
        [120, 216],
      ],
      at: [0.42, 0.56],
      signal: true,
    },
    {
      from: "plan",
      to: "roadmap",
      points: [
        [144, 240],
        [144, 304],
        [176, 304],
      ],
      at: [0.6, 0.72],
      signal: true,
    },
    {
      from: "roadmap",
      to: "next",
      points: [
        [372, 304],
        [412, 304],
      ],
      at: [0.76, 0.86],
      signal: true,
    },
  ],
};

export const services: Service[] = [
  {
    id: "web",
    path: "/web",
    name: "Web development",
    summary:
      "Marketing sites to enterprise platforms, built for the next release.",
    title: "Web platforms built for the next release",
    description:
      "From marketing sites to enterprise platforms, we make the structure, content, and performance work together.",
    tags: ["Next.js", "React", "TypeScript", "GSAP", "Three.js", "WebGL"],
    practices: [
      "Rendering strategy chosen per route: static, server or client",
      "Typed component system with design tokens shared with design",
      "Motion and 3D with GSAP and Three.js, held to the performance budget",
      "Performance budgets for Core Web Vitals, measured before release",
      "Accessible to WCAG\u00a02.2\u00a0AA",
    ],
    diagram: web,
  },
  {
    id: "mobile",
    path: "/mobile",
    name: "Mobile app development",
    summary:
      "Core flows shaped and built for iOS and Android, native or cross-platform.",
    title: "Mobile apps with a clear path from screen to screen",
    description:
      "We shape the core flows and build the app for iOS, Android, React Native, or Flutter.",
    tags: ["Swift", "Kotlin", "React Native", "Expo", "Flutter"],
    practices: [
      "Native (Swift, Kotlin) or cross-platform (React Native, Flutter), chosen on product needs",
      "Offline behaviour and data sync designed in where needed",
      "Release pipelines for the App Store and Google Play",
      "Crash reporting and analytics from the first build",
    ],
    diagram: mobile,
  },
  {
    id: "cloud",
    path: "/cloud",
    name: "Cloud and API engineering",
    summary:
      "Clear APIs, infrastructure and integrations, without the black box.",
    title: "APIs and infrastructure without the black box",
    description:
      "Clear APIs, infrastructure, and integrations for products that need to move without unnecessary complexity.",
    tags: [
      "Docker",
      "Kubernetes",
      "Temporal",
      "Redis",
      "PostgreSQL",
      "GraphQL",
      "AWS",
      "Terraform",
    ],
    practices: [
      "Contract-first APIs: schemas agreed before implementation",
      "Containerised services and infrastructure as code (Docker, Terraform)",
      "Durable, retryable workflows with Temporal; caching with Redis",
      "Logs, metrics, tracing and alerting from day one",
      "Least-privilege access and managed secrets",
    ],
    diagram: cloud,
  },
  {
    id: "consult",
    path: "/consult",
    name: "Technical consulting",
    summary:
      "Architecture reviews, legacy modernization and a clear next move.",
    title: "Turn technical complexity into a clear next move",
    description:
      "Architecture reviews, legacy modernization, and product strategy for teams deciding what to build next.",
    tags: ["C4 model", "ADRs", "OpenTelemetry", "DORA metrics"],
    practices: [
      "Architecture and code review with written findings, mapped in C4",
      "Keep, refactor or replace, decided per component",
      "Decision records (ADRs) your team can revisit",
      "Delivery health measured with DORA metrics",
      "A roadmap sequenced by risk and dependency",
    ],
    diagram: consult,
  },
];
