import React from "react";
import LegalPage from "@/components/LegalPage";

const SECTIONS: Array<{ title: string; body: string[] }> = [
  {
    title: "The short version",
    body: [
      "CaptionGrab collects essentially nothing. There are no accounts, no analytics profiles, no advertising trackers and no cookies for marketing. Your extraction history and preferences are stored only in your own browser's local storage.",
    ],
  },
  {
    title: "What happens when you extract a transcript",
    body: [
      "Your browser sends the YouTube video id and requested language to the CaptionGrab API (hosted on Cloudflare Workers) so it can fetch the transcript from YouTube on your behalf. This operational data is processed in memory to serve your request and is not stored, sold or shared.",
      "Like any internet service, Cloudflare may process standard technical metadata (such as IP addresses in edge logs) to operate and secure its network. See Cloudflare's privacy policy for details.",
    ],
  },
  {
    title: "Local storage",
    body: [
      "If you keep history enabled (the default), transcripts you extract are saved in your browser's local storage so you can reopen them offline. Clearing your browser's site data permanently deletes this history. Disable history anytime in Settings — previously stored entries can be removed with “Clear all”.",
      "Your theme and preferences (default language, layout, export format) are likewise stored locally and never transmitted anywhere except as needed to fulfil your requests (for example, your chosen language).",
    ],
  },
  {
    title: "Embedded content",
    body: [
      "Transcript pages embed YouTube's privacy-enhanced player (youtube-nocookie.com). Interacting with the player is subject to Google's privacy policy and YouTube's terms of service.",
    ],
  },
  {
    title: "Your rights",
    body: [
      "Because we hold no personal data about you, there is nothing to access, export or delete on our servers. Everything attributable to you lives in your browser, under your control. If you contact us (for example via a GitHub issue), we will use your message only to respond.",
    ],
  },
  {
    title: "Changes",
    body: [
      "If this policy changes materially, the updated version will be published on this page with a new revision date.",
    ],
  },
];

const Privacy: React.FC = () => (
  <LegalPage
    eyebrow="Legal"
    title="Privacy Policy"
    updated="September 2026"
    intro={
      'The short version: we collect essentially nothing. No accounts, no analytics profiles, no advertising trackers, no marketing cookies. The full policy is below.'
    }
    sections={SECTIONS}
  />
);

export default Privacy;
