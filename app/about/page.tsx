const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="bg-[#1a1a27] border border-white/5 rounded-2xl p-6 shadow-2xl space-y-2">
    <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">{title}</h2>
    <div className="text-sm text-slate-300 leading-relaxed space-y-2">{children}</div>
  </section>
);

export default function About() {
  return (
    <main className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-center">How TickGuessr works</h1>
      <Card title="Goal">
        <p>Every round shows one frame of a Minecraft animated texture. Name the sprite sheet and the frame number. You get 3 guesses, then the next round starts straight away.</p>
      </Card>
      <Card title="Scoring">
        <p>Up to 1,000 points per round. Faster answers and fewer guesses score more (full, half, or quarter value for guess 1, 2, or 3). Each consecutive correct round adds 10% to a maximum of +100%. Taking over a minute resets your streak.</p>
      </Card>
      <Card title="Keyboard">
        <p>Type the frame number and press Enter. Press A, S, D... to pick sheet 0, 1, 2... without leaving the input.</p>
      </Card>
    </main>
  );
}
