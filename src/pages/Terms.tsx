import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackgroundFX from "@/components/BackgroundFX";

const SECTIONS: Array<{ title: string; body: string[] }> = [
  {
    title: "The service",
    body: [
      "CaptionGrab provides a free tool that retrieves publicly available captions for YouTube videos you request, and presents them as searchable, exportable transcripts. The service is provided “as is”, without warranties of any kind, and may change or be discontinued at any time.",
    ],
  },
  {
    title: "Acceptable use",
    body: [
      "You agree to use CaptionGrab for lawful purposes only: study, research, accessibility, quotation and other fair-use purposes. You agree not to abuse the service — including automated scraping at unreasonable rates, attempts to circumvent rate limits, or any use that violates YouTube's Terms of Service.",
      "We may rate-limit or block clients that degrade the service for others.",
    ],
  },
  {
    title: "Intellectual property",
    body: [
      "Transcripts are derived from video captions and remain the intellectual property of the respective video creators (and YouTube, where applicable). CaptionGrab claims no ownership over transcript content.",
      "Short quotations with attribution are generally fair use; republishing entire transcripts, re-uploading them as your own content, or building competing caption databases from this service is not permitted without the creator's consent.",
    ],
  },
  {
    title: "Third-party services",
    body: [
      "The service relies on YouTube to provide caption data. If YouTube changes, restricts or removes access, some or all functionality may stop working. CaptionGrab is an independent project and is not affiliated with, endorsed by, or sponsored by YouTube or Google.",
    ],
  },
  {
    title: "Limitation of liability",
    body: [
      "To the maximum extent permitted by law, CaptionGrab and its contributors are not liable for any indirect, incidental or consequential damages arising from your use of the service — including inaccurate auto-generated captions, which you should verify against the original video before quoting.",
    ],
  },
  {
    title: "Contact",
    body: [
      "Questions about these terms? Open an issue on the project's GitHub repository and we'll respond as soon as we can.",
    ],
  },
];

const Terms: React.FC = () => (
  <div className="flex min-h-screen flex-col">
    <BackgroundFX />
    <Header />
    <main className="container max-w-3xl flex-1 py-14">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Legal</p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: September 2026</p>

      <div className="mt-8 space-y-8">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="font-display text-xl font-bold">{s.title}</h2>
            {s.body.map((p, i) => (
              <p key={i} className="mt-2.5 leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
    </main>
    <Footer />
  </div>
);

export default Terms;
