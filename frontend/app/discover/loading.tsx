export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-900 p-4 max-w-2xl mx-auto">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-800 rounded w-1/3" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-24 bg-gray-800 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-gray-800 rounded-lg" />
          ))}
        </div>
      </div>
    </main>
  );
}
