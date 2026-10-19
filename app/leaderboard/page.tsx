import Leaderboard from "@/components/Leaderboard";

export default function LeaderboardPage() {
  return (
    <main className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-center">Leaderboards</h1>
      <Leaderboard tabs limit={10} />
    </main>
  );
}
