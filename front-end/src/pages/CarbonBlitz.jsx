import React from 'react';
import XPWindow from '../components/XPWindow.jsx';

const highlights = [
  {
    title: 'Why CarbonBlitz Exists',
    summary:
      'Credits that should be the cleanest assets on earth still crawl through spreadsheets and unverifiable PDFs. CarbonBlitz welds every tonne to a live registry + retirement trail.',
    note:
      'We treat carbon like a high-frequency asset: batches get minted, deep-linked, and retired with the same confidence you expect from an exchange order book.'
  },
  {
    title: 'Field Hardware Advantage',
    summary:
      'Our team designs custom PCB boards that plug into devices in the field. They run an embedded stack that signs telemetry inside a hardware security module (HSM) enclosure.',
    note:
      'HSM components let us sign the readings at the edge, so when the energy payload\'s authenticity is already sealed in silicon.'
  },
  {
    title: 'Stack + Execution Model',
    summary:
      'Monad smart contracts coordinate the registry, React XP desktop wraps user flows, and explorer hooks give every participant verifiable audit breadcrumbs.',
    note:
      'We intentionally keep the interface playful—because compliance work is lighter when it feels like booting Windows XP after school.'
  }
];

const roadmap = [
  {
    title: 'HSM rollout',
    detail:
      'Integrate the CarbonBlitz secure element with on-site devices so attestation keys never leave the module. That means true tamper-evident data before it ever touches the chain.'
  },
  {
    title: 'Regulation roundtable',
    detail:
      'Meet with regulators and voluntary market councils to pair smart-contract rails with the compliance language they expect. We want CarbonBlitz dashboards to pass audits without translators.'
  },
  {
    title: 'Anomaly detection mesh',
    detail:
      'Enable machine-to-machine chatter between our boards so they compare production curves in real time. Embedded ML models surface anomalies and push signed alerts on-chain before bad data touches the registry.'
  }
];

export default function CarbonBlitz() {
  return (
    <XPWindow
      title="CarbonBlitz Desk"
      icon="/logo/monad_rwa_logo.png"
      bodyClassName="p-0"
      footer="Built for Monad Blitz - Contributions Welcome"
    >
      <div className="space-y-5 p-6 text-[#1b1b1b]">
        <section className="rounded border border-xpGray bg-white/95 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
          <h2 className="text-[16px] font-semibold text-[#0c3a94]">CarbonBlitz at a Glance</h2>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          {highlights.map((item) => (
            <article
              key={item.title}
              className="flex flex-col gap-2 rounded border border-[#d0d7ea] bg-white/90 p-4 text-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
            >
              <h3 className="text-[13px] font-semibold text-[#0c3a94]">{item.title}</h3>
              <p className="leading-relaxed">{item.summary}</p>
              <p className="rounded border border-dashed border-[#9aa6c5] bg-[#f3f7ff] px-3 py-2 text-[11px] text-[#0c3a94]">
                {item.note}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded border border-xpGray bg-white/95 p-4 text-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
          <h3 className="text-[14px] font-semibold text-[#0c3a94]">Roadmap → what we build next</h3>
          <ul className="mt-2 space-y-2">
            {roadmap.map((item) => (
              <li key={item.title} className="rounded border border-[#d0d7ea] bg-[#f3f7ff] px-4 py-3">
                <strong className="block text-[#0c3a94]">{item.title}</strong>
                <span className="block text-[#4b4b4b]">{item.detail}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded border border-xpGray bg-white/95 p-4 text-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
          <h3 className="text-[14px] font-semibold text-[#0c3a94]">Invite to build with us</h3>
          <p className="mt-2 leading-relaxed">
            CarbonBlitz is intentionally compact: one repo, a handful of contracts, and XP windows packed with purpose.
            Bring your gas optimisations, UX polish, or MRV wizardry, we will ship fast, document obsessively, and keep the
            hardware quirky so climate tech finally feels fun.
          </p>
        </section>
      </div>
    </XPWindow>
  );
}
