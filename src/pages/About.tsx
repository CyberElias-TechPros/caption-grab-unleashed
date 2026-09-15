import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Eye, Gauge, Github, HeartHandshake, Infinity as InfinityIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackgroundFX from "@/components/BackgroundFX";
import SpotlightCard from "@/components/motion/Spotlight";
import { MaskLines, Reveal } from "@/components/motion/Reveal";

const VALUES = [
  {
    icon: InfinityIcon,
    title: "Free means free",
    body: "No tiers, no credits, no trials. Caption extraction is a utility — it should behave like one.",
  },
  {
    icon: Eye,
    title: "Private by design",
    body: "No accounts and no tracking profiles. Your history never leaves your browser, and there is nothing on our servers to leak.",
  },
  {
    icon: Gauge,
    title: "Fast on purpose",
    body: "An edge-cached API and a lean frontend mean transcripts in seconds, even on a slow connection.",
  },
  {
    icon: HeartHandshake,
    title: "Respect creators",
    body: "Transcripts belong to the people who made the videos. We surface attribution and fair-use guidance everywhere they matter.",
  },
];

const STACK = [
  { label: "Frontend", value: "React 18 · Vite · Tailwind" },
  { label: "Hosting", value: "Vercel edge" },
  { label: "API", value: "Cloudflare Workers" },
  { label: "Secrets", value: "None required" },
  { label: "Storage", value: "Your browser only" },
];

const About: React.FC = () => (
  <div className="flex min-h-screen flex-col">
    <BackgroundFX />
    <Header />
    <main className="container max-w-4xl flex-1 py-16 sm:py-24">
      <Reveal y={12}>
        <p className="font-mono-label text-[0.62rem] uppercase tracking-ultra text-primary">
          About the project
        </p>
      </Reveal>

      <MaskLines
        className="mt-5 font-display text-display-sm"
        lines={[
          <>Video is hard to skim.</>,
          <>
            <span className="font-editorial italic text-gradient">We fix that.</span>
          </>,
        ]}
      />

      <div className="mt-10 space-y-5 text-[1.02rem] leading-relaxed text-muted-foreground">
        <Reveal y={18}>
          <p>
            An hour-long lecture, podcast or tutorial usually holds the answer you need buried at
            minute forty-seven. Skipping around a timeline to find it is slow, and auto-generated
            captions locked inside a video player aren't searchable, quotable or reusable.
          </p>
        </Reveal>
        <Reveal y={18} delay={70}>
          <p>
            <strong className="text-foreground">
              CaptionGrab turns any public YouTube video into a clean, timestamped transcript
            </strong>{" "}
            you can search, read, copy and export. Students pull study notes out of lectures.
            Creators repurpose videos into articles. Researchers quote talks accurately. Developers
            feed transcripts into their own tools.
          </p>
        </Reveal>
        <Reveal y={18} delay={140}>
          <p>
            The project is open source and runs on a deliberately boring stack: a React frontend on
            Vercel and a serverless API on Cloudflare's edge. There are no accounts to create, no
            API keys to manage and no data to sell — the architecture makes surveillance capitalism
            impossible, not merely impolite.
          </p>
        </Reveal>
      </div>

      {/* Stack table */}
      <Reveal y={20} delay={80}>
        <div className="panel mt-12 overflow-hidden">
          <div className="border-b border-border/60 px-5 py-3">
            <p className="font-mono-label text-[0.6rem] uppercase tracking-ultra text-muted-foreground">
              The whole stack
            </p>
          </div>
          <dl>
            {STACK.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-[8.5rem_1fr] gap-4 px-5 py-3 text-sm transition-colors duration-300 hover:bg-primary/5 ${
                  i < STACK.length - 1 ? "border-b border-border/40" : ""
                }`}
              >
                <dt className="font-mono-label text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
                  {row.label}
                </dt>
                <dd className="font-medium text-foreground">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Reveal>

      {/* Values */}
      <div className="mt-14 grid gap-4 sm:grid-cols-2">
        {VALUES.map((v, i) => (
          <Reveal key={v.title} delay={i * 80} y={22}>
            <SpotlightCard tilt={3} className="panel h-full p-6">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, hsl(var(--brand-1)), hsl(var(--brand-3)))",
                  boxShadow: "0 10px 26px -12px hsl(var(--brand-2) / 0.9)",
                }}
              >
                <v.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="mt-4 font-display text-[1.1rem] font-bold tracking-tight">
                {v.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.body}</p>
            </SpotlightCard>
          </Reveal>
        ))}
      </div>

      <Reveal y={16} delay={100}>
        <div className="mt-12 flex flex-wrap gap-3">
          <Button asChild className="caption-button btn-shine rounded-2xl">
            <Link to="/#extractor">
              Try the extractor <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-2xl border-border/70 bg-card/40 backdrop-blur-md"
          >
            <a
              href="https://github.com/CyberElias-TechPros/caption-grab-unleashed"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-4 w-4" aria-hidden="true" /> View source code
            </a>
          </Button>
        </div>
      </Reveal>
    </main>
    <Footer />
  </div>
);

export default About;
