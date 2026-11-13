import { OPCOES_ESTUDO_MIN } from "@/lib/perfil/schema";
import { cn } from "@/lib/utils";

/** Select nativo de 5 a 60 min (valor em segundos). Nativo: no iPad abre o seletor do sistema. */
export function SeletorEstudo({ className, ...props }: Omit<React.ComponentProps<"select">, "children">) {
  return (
    <select
      {...props}
      className={cn(
        "h-12 rounded-[14px] border border-line bg-sf px-4 text-base font-bold text-ink outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
    >
      {OPCOES_ESTUDO_MIN.map((m) => (
        <option key={m} value={m * 60}>
          {m} min
        </option>
      ))}
    </select>
  );
}
