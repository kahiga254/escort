import UserGrid from "@/app/components/UserGrid/UserGrid";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <section className="py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <UserGrid />
        </div>
      </section>
    </main>
  );
}