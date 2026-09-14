import React from "react";
import { MessageCircleQuestion } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal, SectionHeading } from "@/components/motion/Reveal";

const ITEMS = [
  {
    q: "Is CaptionGrab really free?",
    a: "Yes — free forever, with no account and no usage tiers. Extraction runs on Cloudflare's edge network, which keeps costs near zero, so there is nothing to pay for and no trial to expire.",
  },
  {
    q: "Do I need a YouTube API key?",
    a: "No. Older versions of this app asked for one, but the current version extracts captions through our own backend service. Just paste a link — no keys, quotas or developer consoles involved.",
  },
  {
    q: "Which videos work?",
    a: "Any public YouTube video that has captions — including auto-generated ones, which cover the vast majority of uploads. Private videos, videos with captions disabled, and some age-restricted videos can't be processed.",
  },
  {
    q: "Which languages are supported?",
    a: "Whatever the video offers — often dozens. If your language isn't listed, turn on smart auto-translate in Preferences and we'll machine-translate the transcript for you. Turn it off and a missing language becomes a clear error instead of a silent substitution.",
  },
  {
    q: "What can I export?",
    a: "Plain text for notes and AI tools, timestamped text for reference, SubRip (.srt) and WebVTT (.vtt) subtitles for editors like Premiere and DaVinci Resolve, plus structured JSON for developers.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Your links are only used to fetch the transcript you asked for, and your history is stored exclusively in your own browser. No accounts, no analytics profiles, no cross-site tracking.",
  },
  {
    q: "Can I use transcripts commercially?",
    a: "Transcripts belong to the video's creator and inherit the video's rights. Short quotes with attribution are usually fine; republishing full transcripts or monetising someone else's content is not. When in doubt, ask the creator.",
  },
  {
    q: "Does it work on mobile?",
    a: "Absolutely — the whole studio is responsive. Paste a link from the YouTube app's Share menu, extract, and copy or download the transcript right on your phone.",
  },
];

const Faq: React.FC = () => (
  <section id="faq" className="container mt-32 max-w-3xl scroll-mt-24" aria-label="Frequently asked questions">
    <SectionHeading
      index="03"
      eyebrow="Questions"
      title={
        <>
          Everything else, <span className="font-editorial italic text-gradient">answered</span>
        </>
      }
    />

    <Reveal delay={140} y={24} className="mt-12">
      <div className="panel p-2 sm:p-3">
        <Accordion type="single" collapsible className="w-full">
          {ITEMS.map((item, i) => (
            <AccordionItem
              key={item.q}
              value={`item-${i}`}
              className="group border-b-border/60 px-3 last:border-0 sm:px-4"
            >
              <AccordionTrigger className="py-5 text-left font-display text-[0.98rem] font-semibold tracking-tight transition-colors hover:text-primary hover:no-underline">
                <span className="flex items-start gap-4">
                  <span className="num mt-[3px] shrink-0 text-[0.65rem] text-muted-foreground transition-colors group-hover:text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{item.q}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-5 pl-[2.4rem] pr-8 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Reveal>

    <Reveal delay={220} y={14}>
      <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        <MessageCircleQuestion className="h-3.5 w-3.5" aria-hidden="true" />
        Still stuck? Open an issue on the repository — it is public.
      </p>
    </Reveal>
  </section>
);

export default Faq;
