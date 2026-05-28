import { Role, StatusObra, StatusMedicao, StatusNota, TipoAlerta } from "@prisma/client";

export type { Role, StatusObra, StatusMedicao, StatusNota, TipoAlerta };

export interface ObraComRelacoes {
  id: string;
  codigo: string;
  descricao: string;
  valorContrato: string | number;
  saldoMaoDeObra: string | number;
  saldoMaterial: string | number;
  totalMedicoes: string | number;
  totalNotas: string | number;
  status: StatusObra;
  dataInicio: Date | null;
  dataFimPrevisto: Date | null;
  dataFimReal: Date | null;
  observacoes: string | null;
  contratante: { id: string; nome: string };
  _count?: { medicoes: number; notasMaterial: number; alertas: number };
}

export interface AlertaComObra {
  id: string;
  tipo: TipoAlerta;
  mensagem: string;
  lido: boolean;
  createdAt: Date;
  obra: { id: string; codigo: string; descricao: string };
}

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
