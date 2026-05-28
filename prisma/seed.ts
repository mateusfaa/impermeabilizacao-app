import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@impermeabilizacao.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@impermeabilizacao.com",
      password: hashedPassword,
      role: Role.ADMINISTRADOR,
    },
  });

  await prisma.user.upsert({
    where: { email: "financeiro@impermeabilizacao.com" },
    update: {},
    create: {
      name: "Usuário Financeiro",
      email: "financeiro@impermeabilizacao.com",
      password: await bcrypt.hash("fin123", 10),
      role: Role.FINANCEIRO,
    },
  });

  const contratante = await prisma.contratante.upsert({
    where: { cpfCnpj: "12.345.678/0001-90" },
    update: {},
    create: {
      nome: "Construtora Exemplo Ltda",
      cpfCnpj: "12.345.678/0001-90",
      email: "contato@construtora.com",
      telefone: "(11) 99999-9999",
      cidade: "São Paulo",
      estado: "SP",
    },
  });

  await prisma.fornecedor.upsert({
    where: { cpfCnpj: "98.765.432/0001-10" },
    update: {},
    create: {
      nome: "Materiais Impermeabilização SA",
      cpfCnpj: "98.765.432/0001-10",
      email: "vendas@materiais.com",
      telefone: "(11) 88888-8888",
      cidade: "São Paulo",
      estado: "SP",
    },
  });

  await prisma.obra.upsert({
    where: { codigo: "OBR-2024-001" },
    update: {},
    create: {
      codigo: "OBR-2024-001",
      descricao: "Impermeabilização Cobertura Edifício Central",
      contratanteId: contratante.id,
      valorContrato: 150000.0,
      saldoMaoDeObra: 90000.0,
      saldoMaterial: 60000.0,
      dataInicio: new Date("2024-01-15"),
      dataFimPrevisto: new Date("2024-06-30"),
    },
  });

  console.log("Seed concluído com sucesso.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
