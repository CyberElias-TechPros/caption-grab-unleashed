import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Eye, Gauge, HeartHandshake, Infinity as InfinityIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackgroundFX from "@/components/BackgroundFX";

const VALUES = [
  {
    icon: InfinityIcon,
    title: "Free means free",
    body: "No tiers, no credits, no trials. Caption extraction is a utility — it should work like one.",
  },
  {
    icon: Eye,
    title: "Private by design",
    body: "No accounts and no tracking profiles. Your history never leaves your browser.",
  },
  {
    icon: Gauge,
    title: "Fast on purpose",
    body: "An edge-cached API and a lean frontend mean transcripts in seconds, even on slow connections.",
  },
  {
    icon: HeartHandshake,
    title: "Respect creators",
    body: "Transcripts belong to video creators. We surface attribution and fair-use guidance everywhere.",
  },
];

const About: React.FC = () => (
  <div className="flex min-h-screen flex-col">
    <BackgroundFX />
    <Header />
    <main className="container max-w-3xl flex-1 py-14">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">About</p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
        Video is hard to skim. <span className="text-gradient">We fix that.</span>
      </h1>
      <div className="prose-lg mt-6 space-y-4 text-[1.02rem] leading-relaxed text-muted-foreground">
        <p>
          An hour-long lecture, podcast or tutorial holds the answer you need — buried at minute
          47. Skipping around a timeline to find it is slow, and auto-generated captions locked
          inside a video player aren't searchable, quotable or reusable.
        </p>
        <p>
          <strong className="text-foreground">CaptionGrab turns any public YouTube video into a clean,
          timestamped transcript</strong> you can search, read, copy and export. Students pull study
          notes from lectures. Creators repurpose videos into articles. Researchers quote talks
          accurately. Developers feed transcripts into their own tools.
        </p>
        <p>
          The project is open source and runs on a simple, honest stack: a React frontend on Vercel
          and a serverless API on Cloudflare's edge. There are no accounts to create, no API keys to
          manage and no data to sell — the architecture makes surveillance capitalism impossible,
          not just impolite.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {VALUES.map((v) => (
          <article key={v.title} className="rounded-2xl border border-border/60 bg-card/60 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <v.icon className="h-5 w-5" />
            </div>
            <h2 className="mt-3 font-display text-lg font-bold">{v.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{v.body}</p>
          </article>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild className="caption-button btn-shine rounded-2xl">
          <Link to="/#extractor">
            Try the extractor <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-2xl">
          <a
            href="https://github.com/CyberElias-TechPros/caption-grab-unleashed"
            target="_blank"
            rel="noopener noreferrer"
          >
            View source code
          </a>
        </Button>
      </div>
    </main>
    <Footer />
  </div>
);

export default About;
