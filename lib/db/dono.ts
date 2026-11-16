import { sql, type SQL, type SQLWrapper } from "drizzle-orm";

// Cada e-mail é uma conta: disciplinas, sessões e perfil têm `dono`; o resto chega a ele pela FK.
// Estes filtros entram no where de quem lê ou escreve por id: id de outra conta = "não encontrado".

export const disciplinaDoDono = (dono: string, col: SQLWrapper): SQL =>
  sql`${col} in (select d.id from disciplinas d where d.dono = ${dono})`;

export const topicoDoDono = (dono: string, col: SQLWrapper): SQL =>
  sql`${col} in (select t.id from topicos t join disciplinas d on d.id = t.disciplina_id where d.dono = ${dono})`;

export const questaoDoDono = (dono: string, col: SQLWrapper): SQL =>
  sql`${col} in (select q.id from questoes q join topicos t on t.id = q.topico_id join disciplinas d on d.id = t.disciplina_id where d.dono = ${dono})`;
