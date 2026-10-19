import Game from "@/components/Game";
import Leaderboard from "@/components/Leaderboard";

export default function Home() {
  return (
    <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex items-center justify-center">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start max-w-6xl">
        <Game />
        <div className="lg:col-span-4"><Leaderboard /></div>
      </div>
    </main>
  );
}
