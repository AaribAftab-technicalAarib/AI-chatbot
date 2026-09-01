export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-3xl font-semibold">404</h1>
      <p className="text-muted">That page doesn’t exist.</p>
      <a className="mt-2 text-accent underline" href="/">Go home</a>
    </main>
  );
}
