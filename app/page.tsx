import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">
          Find My Gig 🎯
        </h1>
        <p className="text-xl text-muted-foreground">
          Automated job scanning for RevOps, Operations, and Program Management positions
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/dashboard">
            <Button size="lg">View Dashboard</Button>
          </Link>
          <Link href="/companies">
            <Button size="lg" variant="outline">Manage Companies</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

