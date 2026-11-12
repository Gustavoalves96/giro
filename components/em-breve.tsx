// Placeholder das páginas ainda não construídas.
export function EmBreve({ titulo, sessao }: { titulo: string; sessao: string }) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <h1 className="font-display text-[32px] font-extrabold md:text-[34px]">{titulo}</h1>
      <p className="mt-2 text-ink3">Em construção (sessão {sessao}).</p>
    </div>
  );
}
