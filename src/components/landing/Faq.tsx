import React from "react";
import { MessageCircleQuestion } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ITEMS = [
  {
    q: "Is CaptionGrab really free?",
    a: "Yes — free forever, with no account and no usage tiers. Extraction runs on Cloudflare's edge network, which keeps costs near zero, so there's nothing to pay for and no trial to expire.",
  },
  {
    q: "Do I need a YouTube API key?",
    a: "No. Older versions of this app asked for one, but the current version extracts captions through our own backend service. Just paste a link — there are no keys, quotas or developer consoles involved.",
  },
  {
    q: "Which videos work?",
    a: "Any public YouTube video that has captions — including auto-generated ones, which cover the vast majority of videos. Private videos, videos that disabled captions, and some age-restricted videos can't be processed.",
  },
  {
    q: "Which languages are supported?",
    a: "Whatever the video offers — often dozens of languages. If your language isn't listed, enable smart auto-translate and we'll machine-translate the transcript for you.",
  },
  {
    q: "What can I export?",
    a: "Plain text for notes and AI tools, timestamped text for reference, SubRip (.srt) and WebVTT (.vtt) subtitles for editors like Premiere and DaVinci Resolve, plus structured JSON for developers.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Your links are only used to fetch the transcript you asked for, and your history is stored exclusively in your own browser. We run no accounts, no analytics profiles and no cross-site tracking.",
  },
  {
    q: "Can I use transcripts commercially?",
    a: "Transcripts belong to the video's creator and inherit the video's rights. Short quotes with attribution are usually fine; republishing full transcripts or monetizing someone else's content is not. When in doubt, ask the creator.",
  },
  {
    q: "Does it work on mobile?",
    a: "Absolutely — the whole studio is responsive. Paste a link from the YouTube app's Share menu, extract, and copy or download the transcript right on your phone.",
  },
];

const Faq: React.FC = () => (
  <section id="faq" className="container mt-24 max-w-3xl scroll-mt-24" aria-label="Frequently asked questions">
    <div data-reveal className="text-center">
      <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
        <MessageCircleQuestion className="h-3.5 w-3.5" /> FAQ
      </p>
      <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        Questions, <span className="text-gradient">answered</span>
      </h2>
    </div>

    <div data-reveal className="mt-8 rounded-3xl border border-border/60 bg-card/60 p-2 backdrop-blur-sm sm:p-4">
      <Accordion type="single" collapsible className="w-full">
        {ITEMS.map((item, i) => (
          <AccordionItem key={item.q} value={`item-${i}`} className="border-b-border/60 px-3 last:border-0">
            <AccordionTrigger className="py-4 text-left text-[0.95rem] font-semibold hover:text-primary">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

export default Faq;
