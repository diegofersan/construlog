import * as storage from './storage'
import type { Proposta } from '../../shared/types'

export function seedAll(): void {
  const clienteIds = seedClientes()
  seedPropostas(clienteIds)
}

function seedClientes(): Record<string, string> {
  const existing = storage.list<any>('clientes')
  if (existing.length > 0) return {}

  const clientes = [
    { nome: 'CASA NOYA', endereco: 'Rua da Praia, 45 – Frade, Angra dos Reis/RJ', tabelaPrecoId: '' },
    { nome: 'CONDOMÍNIO PORTO BALI', endereco: 'Praia do Dentista, Mangaratiba/RJ', tabelaPrecoId: '' },
    { nome: 'PREFEITURA DE ANGRA DOS REIS', endereco: 'Estrada do Frade, Angra dos Reis/RJ', tabelaPrecoId: '' },
    { nome: 'HOTEL FAZENDA PONTAL', endereco: 'Estrada do Pontal, 1200 – Angra dos Reis/RJ', tabelaPrecoId: '' },
    { nome: 'SR. MARCOS ANDRADE', endereco: 'Rua das Palmeiras, 78 – Bracuí, Angra dos Reis/RJ', tabelaPrecoId: '' },
    { nome: 'CONSTRUTORA LITORAL SUL', endereco: 'Av. Reis Magos, 320 – Centro, Angra dos Reis/RJ', tabelaPrecoId: '' },
    { nome: 'SRA. REGINA CAMPOS', endereco: 'Condomínio Portogalo, casa 15 – Angra dos Reis/RJ', tabelaPrecoId: '' },
    { nome: 'POUSADA ÁGUAS CLARAS', endereco: 'Praia de Araçatiba, Ilha Grande – Angra dos Reis/RJ', tabelaPrecoId: '' }
  ]

  const ids: Record<string, string> = {}
  for (const c of clientes) {
    const created = storage.create('clientes', c)
    ids[c.nome] = created.id
  }
  return ids
}

function seedPropostas(clienteIds: Record<string, string>): void {
  const existing = storage.list<Proposta>('propostas')
  if (existing.length > 0) return

  const propostas: Omit<Proposta, 'id' | 'createdAt' | 'updatedAt'>[] = [
    // 1 – Terraplanagem residencial
    {
      numero: 'P-2026-001',
      data_emissao: '2026-01-10',
      cliente: {
        id: clienteIds['CASA NOYA'] || '',
        nome: 'CASA NOYA',
        endereco_entrega: 'Rua da Praia, 45 – Frade, Angra dos Reis/RJ'
      },
      itens: [
        {
          descricao: 'TERRAPLANAGEM COM RETROESCAVADEIRA',
          descricao_detalhada: 'Execução de terraplanagem em terreno de 800m² para preparação de platô residencial, incluindo corte, aterro e nivelamento do solo conforme projeto aprovado.',
          data_servico: '2026-01-20',
          unidade: 'DIÁRIA',
          quantidade: 4,
          valor_unitario: 1950.00,
          valor_total_sem_desconto: 7800.00,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: 7800.00
        },
        {
          descricao: 'RETIRADA DE ENTULHO CAMINHÃO TRUCADO',
          descricao_detalhada: 'Transporte e descarte legal de material excedente da terraplanagem em bota-fora licenciado, com caminhão trucado capacidade 14m³.',
          data_servico: '2026-01-20',
          unidade: 'VIAGEM',
          quantidade: 6,
          valor_unitario: 450.00,
          valor_total_sem_desconto: 2700.00,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: 2700.00
        },
        {
          descricao: 'CAMINHÃO DE ATERRO',
          descricao_detalhada: 'Fornecimento e transporte de material de aterro selecionado para complementação de nível do platô, compactação inclusa.',
          data_servico: '2026-01-22',
          unidade: 'MT',
          quantidade: 10,
          valor_unitario: 70.00,
          valor_total_sem_desconto: 700.00,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: 700.00
        }
      ],
      total_geral: 11200.00,
      observacao: 'Prazo de execução estimado: 5 dias úteis, sujeito a condições climáticas.',
      status: 'aceita'
    },

    // 2 – Muro de arrimo condomínio
    {
      numero: 'P-2026-002',
      data_emissao: '2026-01-25',
      cliente: {
        id: clienteIds['CONDOMÍNIO PORTO BALI'] || '',
        nome: 'CONDOMÍNIO PORTO BALI',
        endereco_entrega: 'Praia do Dentista, Mangaratiba/RJ'
      },
      itens: [
        {
          descricao: 'MURO DE ARRIMO EM PEDRA ARGAMASSADA',
          descricao_detalhada: 'Construção de muro de contenção em pedra argamassada com 1,20m de largura na base e 0,60m no topo, altura média de 2,50m, incluindo fundação em concreto armado e drenos de alívio a cada 2m.',
          data_servico: '2026-02-03',
          unidade: 'M³',
          quantidade: 18,
          valor_unitario: 950.00,
          valor_total_sem_desconto: 17100.00,
          desconto_percentual: 8,
          desconto_valor: 1368.00,
          valor_total: 15732.00
        },
        {
          descricao: 'PEDRA RACHÃO',
          descricao_detalhada: 'Fornecimento de pedra rachão selecionada para execução do muro de arrimo, tamanho médio 20-40cm, entregue no local da obra.',
          data_servico: '2026-02-03',
          unidade: 'MT',
          quantidade: 14,
          valor_unitario: 350.00,
          valor_total_sem_desconto: 4900.00,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: 4900.00
        },
        {
          descricao: 'CAMINHÃO DE AREIA GROSSA',
          descricao_detalhada: 'Areia grossa lavada para preparo de argamassa de assentamento das pedras, granulometria conforme norma ABNT.',
          data_servico: '2026-02-03',
          unidade: 'MT',
          quantidade: 8,
          valor_unitario: 175.00,
          valor_total_sem_desconto: 1400.00,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: 1400.00
        },
        {
          descricao: 'DIÁRIA DE RETROESCAVADEIRA',
          descricao_detalhada: 'Utilização de retroescavadeira para escavação de vala de fundação do muro e movimentação de pedras no canteiro.',
          data_servico: '2026-02-03',
          unidade: 'DIÁRIA',
          quantidade: 3,
          valor_unitario: 1800.00,
          valor_total_sem_desconto: 5400.00,
          desconto_percentual: 5,
          desconto_valor: 270.00,
          valor_total: 5130.00
        }
      ],
      total_geral: 27162.00,
      observacao: 'Prazo de execução: 20 dias úteis. Material e mão de obra inclusos. Garantia de 5 anos.',
      status: 'aceita'
    },

    // 3 – Limpeza de terreno público
    {
      numero: 'P-2026-003',
      data_emissao: '2026-02-10',
      cliente: {
        id: clienteIds['PREFEITURA DE ANGRA DOS REIS'] || '',
        nome: 'PREFEITURA DE ANGRA DOS REIS',
        endereco_entrega: 'Estrada do Frade, Angra dos Reis/RJ'
      },
      itens: [
        {
          descricao: 'LIMPEZA DE TERRENO COM MÁQUINA',
          descricao_detalhada: 'Limpeza mecanizada de terreno público de 2.000m² com remoção de vegetação rasteira, entulho e resíduos sólidos, utilizando pá carregadeira e retroescavadeira.',
          data_servico: '2026-02-20',
          unidade: 'DIÁRIA',
          quantidade: 5,
          valor_unitario: 2200.00,
          valor_total_sem_desconto: 11000.00,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: 11000.00
        },
        {
          descricao: 'RETIRADA DE ENTULHO CAMINHÃO TRUCADO',
          descricao_detalhada: 'Coleta, transporte e destinação final de entulho e resíduos classe A em aterro licenciado pelo INEA, com emissão de CTR.',
          data_servico: '2026-02-20',
          unidade: 'VIAGEM',
          quantidade: 12,
          valor_unitario: 450.00,
          valor_total_sem_desconto: 5400.00,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: 5400.00
        },
        {
          descricao: 'CAMINHÃO DE ATERRO',
          descricao_detalhada: 'Fornecimento de material de aterro para regularização do terreno após limpeza, com compactação mecânica por rolo compactador.',
          data_servico: '2026-02-25',
          unidade: 'MT',
          quantidade: 20,
          valor_unitario: 70.00,
          valor_total_sem_desconto: 1400.00,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: 1400.00
        }
      ],
      total_geral: 17800.00,
      observacao: 'Proposta conforme edital de licitação nº 045/2026. Validade: 60 dias.',
      status: 'rejeitada'
    },

    // 4 – Pavimentação hotel
    {
      numero: 'P-2026-004',
      data_emissao: '2026-02-18',
      cliente: {
        id: clienteIds['HOTEL FAZENDA PONTAL'] || '',
        nome: 'HOTEL FAZENDA PONTAL',
        endereco_entrega: 'Estrada do Pontal, 1200 – Angra dos Reis/RJ'
      },
      itens: [
        {
          descricao: 'PAVIMENTAÇÃO EM PARALELEPÍPEDO',
          descricao_detalhada: 'Execução de pavimentação em paralelepípedo granítico sobre colchão de areia em estacionamento de 400m², incluindo meio-fio em concreto pré-moldado e caimento para escoamento pluvial.',
          data_servico: '2026-03-01',
          unidade: 'M²',
          quantidade: 400,
          valor_unitario: 85.00,
          valor_total_sem_desconto: 34000.00,
          desconto_percentual: 5,
          desconto_valor: 1700.00,
          valor_total: 32300.00
        },
        {
          descricao: 'CAMINHÃO DE AREIA MÉDIA',
          descricao_detalhada: 'Areia média para colchão de assentamento dos paralelepípedos, camada de 10cm devidamente nivelada.',
          data_servico: '2026-03-01',
          unidade: 'MT',
          quantidade: 15,
          valor_unitario: 160.00,
          valor_total_sem_desconto: 2400.00,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: 2400.00
        },
        {
          descricao: 'MEIO-FIO PRÉ-MOLDADO',
          descricao_detalhada: 'Fornecimento e assentamento de meio-fio em concreto pré-moldado 100x15x30cm no perímetro do estacionamento.',
          data_servico: '2026-03-05',
          unidade: 'ML',
          quantidade: 80,
          valor_unitario: 45.00,
          valor_total_sem_desconto: 3600.00,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: 3600.00
        },
        {
          descricao: 'DIÁRIA DE CAMINHÃO TOCO 8M',
          descricao_detalhada: 'Caminhão toco para transporte de paralelepípedos e materiais do depósito até o local da obra dentro do hotel.',
          data_servico: '2026-03-01',
          unidade: 'DIÁRIA',
          quantidade: 3,
          valor_unitario: 1450.00,
          valor_total_sem_desconto: 4350.00,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: 4350.00
        }
      ],
      total_geral: 42650.00,
      observacao: 'Prazo de execução: 25 dias úteis. Início condicionado à liberação da área pelo contratante.',
      status: 'pendente'
    },

    // 5 – Fundação residencial
    {
      numero: 'P-2026-005',
      data_emissao: '2026-02-28',
      cliente: {
        id: clienteIds['SR. MARCOS ANDRADE'] || '',
        nome: 'SR. MARCOS ANDRADE',
        endereco_entrega: 'Rua das Palmeiras, 78 – Bracuí, Angra dos Reis/RJ'
      },
      itens: [
        {
          descricao: 'ESCAVAÇÃO DE FUNDAÇÃO',
          descricao_detalhada: 'Escavação mecânica de valas para fundação tipo sapata corrida, profundidade média de 1,00m e largura de 0,60m, em solo de primeira categoria.',
          data_servico: '2026-03-10',
          unidade: 'M³',
          quantidade: 12,
          valor_unitario: 120.00,
          valor_total_sem_desconto: 1440.00,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: 1440.00
        },
        {
          descricao: 'CONCRETO USINADO FCK 25 MPA',
          descricao_detalhada: 'Fornecimento de concreto usinado fck 25 MPa, slump 10±2, bombeado, para preenchimento das sapatas e vigas baldrame da residência.',
          data_servico: '2026-03-12',
          unidade: 'M³',
          quantidade: 8,
          valor_unitario: 580.00,
          valor_total_sem_desconto: 4640.00,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: 4640.00
        },
        {
          descricao: 'AÇO CA-50 E CA-60',
          descricao_detalhada: 'Fornecimento de aço para armação das sapatas e vigas baldrame, incluindo corte, dobra e montagem conforme projeto estrutural.',
          data_servico: '2026-03-11',
          unidade: 'KG',
          quantidade: 450,
          valor_unitario: 12.50,
          valor_total_sem_desconto: 5625.00,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: 5625.00
        },
        {
          descricao: 'CAMINHÃO DE BRITA 1',
          descricao_detalhada: 'Brita nº 1 para lastro de concreto magro sob as sapatas, camada de 5cm.',
          data_servico: '2026-03-10',
          unidade: 'MT',
          quantidade: 4,
          valor_unitario: 280.00,
          valor_total_sem_desconto: 1120.00,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: 1120.00
        }
      ],
      total_geral: 12825.00,
      observacao: 'Valores incluem material e mão de obra. Projeto estrutural fornecido pelo contratante.',
      status: 'pendente'
    },

    // 6 – Drenagem pluvial
    {
      numero: 'P-2026-006',
      data_emissao: '2026-03-01',
      cliente: {
        id: clienteIds['CONSTRUTORA LITORAL SUL'] || '',
        nome: 'CONSTRUTORA LITORAL SUL',
        endereco_entrega: 'Loteamento Mar Azul, Angra dos Reis/RJ'
      },
      itens: [
        {
          descricao: 'ESCAVAÇÃO DE VALA PARA DRENAGEM',
          descricao_detalhada: 'Escavação mecanizada de vala com seção trapezoidal para implantação de rede de drenagem pluvial, profundidade de 1,20m, largura de 0,80m na base.',
          data_servico: '2026-03-15',
          unidade: 'ML',
          quantidade: 120,
          valor_unitario: 45.00,
          valor_total_sem_desconto: 5400.00,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: 5400.00
        },
        {
          descricao: 'TUBO DE CONCRETO Ø400MM',
          descricao_detalhada: 'Fornecimento e assentamento de tubo de concreto armado Ø400mm, classe PA-2, com junta elástica, sobre berço de brita.',
          data_servico: '2026-03-17',
          unidade: 'ML',
          quantidade: 120,
          valor_unitario: 95.00,
          valor_total_sem_desconto: 11400.00,
          desconto_percentual: 10,
          desconto_valor: 1140.00,
          valor_total: 10260.00
        },
        {
          descricao: 'CAIXA DE PASSAGEM EM CONCRETO',
          descricao_detalhada: 'Execução de caixa de passagem/inspeção em concreto armado 60x60cm com tampa em ferro fundido, a cada 30m de rede.',
          data_servico: '2026-03-20',
          unidade: 'UN',
          quantidade: 4,
          valor_unitario: 1800.00,
          valor_total_sem_desconto: 7200.00,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: 7200.00
        },
        {
          descricao: 'CAMINHÃO DE BRITA 1',
          descricao_detalhada: 'Brita nº 1 para envolvimento dos tubos de drenagem, garantindo permeabilidade e proteção mecânica da tubulação.',
          data_servico: '2026-03-15',
          unidade: 'MT',
          quantidade: 10,
          valor_unitario: 280.00,
          valor_total_sem_desconto: 2800.00,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: 2800.00
        },
        {
          descricao: 'REATERRO COMPACTADO',
          descricao_detalhada: 'Reaterro das valas com material selecionado e compactação mecânica em camadas de 20cm, atingindo grau de compactação mínimo de 95% do Proctor Normal.',
          data_servico: '2026-03-22',
          unidade: 'M³',
          quantidade: 60,
          valor_unitario: 35.00,
          valor_total_sem_desconto: 2100.00,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: 2100.00
        }
      ],
      total_geral: 27760.00,
      observacao: 'Proposta para o lote 3 do loteamento. Topografia e projeto de drenagem fornecidos pela construtora.',
      status: 'aceita'
    },

    // 7 – Reforma de piscina
    {
      numero: 'P-2026-007',
      data_emissao: '2026-03-03',
      cliente: {
        id: clienteIds['SRA. REGINA CAMPOS'] || '',
        nome: 'SRA. REGINA CAMPOS',
        endereco_entrega: 'Condomínio Portogalo, casa 15 – Angra dos Reis/RJ'
      },
      itens: [
        {
          descricao: 'DEMOLIÇÃO DE REVESTIMENTO DE PISCINA',
          descricao_detalhada: 'Remoção completa do revestimento cerâmico existente na piscina de 6x12m, incluindo limpeza da superfície e descarte do material demolido.',
          data_servico: '2026-03-15',
          unidade: 'M²',
          quantidade: 120,
          valor_unitario: 35.00,
          valor_total_sem_desconto: 4200.00,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: 4200.00
        },
        {
          descricao: 'IMPERMEABILIZAÇÃO COM MANTA ASFÁLTICA',
          descricao_detalhada: 'Aplicação de manta asfáltica aluminizada 4mm em toda a área interna da piscina, com sobreposição de 10cm e arremates nos ralos e retornos.',
          data_servico: '2026-03-18',
          unidade: 'M²',
          quantidade: 120,
          valor_unitario: 75.00,
          valor_total_sem_desconto: 9000.00,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: 9000.00
        },
        {
          descricao: 'REVESTIMENTO EM PASTILHA DE VIDRO',
          descricao_detalhada: 'Fornecimento e assentamento de pastilha de vidro azul 2,5x2,5cm em toda a área interna da piscina, com rejunte epóxi branco.',
          data_servico: '2026-03-22',
          unidade: 'M²',
          quantidade: 120,
          valor_unitario: 180.00,
          valor_total_sem_desconto: 21600.00,
          desconto_percentual: 5,
          desconto_valor: 1080.00,
          valor_total: 20520.00
        }
      ],
      total_geral: 33720.00,
      observacao: 'Garantia de 3 anos contra infiltração. Piscina deve estar vazia no início dos serviços.',
      status: 'pendente'
    },

    // 8 – Acesso e infraestrutura pousada
    {
      numero: 'P-2026-008',
      data_emissao: '2026-03-04',
      cliente: {
        id: clienteIds['POUSADA ÁGUAS CLARAS'] || '',
        nome: 'POUSADA ÁGUAS CLARAS',
        endereco_entrega: 'Praia de Araçatiba, Ilha Grande – Angra dos Reis/RJ'
      },
      itens: [
        {
          descricao: 'TRANSPORTE MARÍTIMO DE MATERIAIS',
          descricao_detalhada: 'Frete marítimo para transporte de materiais de construção do cais de Angra dos Reis até a Praia de Araçatiba, Ilha Grande, incluindo carga e descarga.',
          data_servico: '2026-03-20',
          unidade: 'VIAGEM',
          quantidade: 4,
          valor_unitario: 2800.00,
          valor_total_sem_desconto: 11200.00,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: 11200.00
        },
        {
          descricao: 'ESCADARIA EM CONCRETO',
          descricao_detalhada: 'Construção de escadaria de acesso em concreto armado com 45 degraus, largura 1,20m, corrimão em tubo galvanizado, desde o píer até a recepção da pousada.',
          data_servico: '2026-03-25',
          unidade: 'UN',
          quantidade: 1,
          valor_unitario: 28000.00,
          valor_total_sem_desconto: 28000.00,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: 28000.00
        },
        {
          descricao: 'MURO DE ARRIMO EM GABIÃO',
          descricao_detalhada: 'Execução de muro de contenção em gabião caixa 2x1x1m com pedra de mão, revestido com tela galvanizada dupla torção, para estabilização do talude junto à escadaria.',
          data_servico: '2026-04-01',
          unidade: 'M³',
          quantidade: 10,
          valor_unitario: 650.00,
          valor_total_sem_desconto: 6500.00,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: 6500.00
        }
      ],
      total_geral: 45700.00,
      observacao: 'Obra na Ilha Grande — logística marítima inclusa. Prazo sujeito a condições do mar.',
      status: 'pendente'
    },

    // 9 – Concretagem de laje
    {
      numero: 'P-2026-009',
      data_emissao: '2026-03-05',
      cliente: {
        id: clienteIds['SR. MARCOS ANDRADE'] || '',
        nome: 'SR. MARCOS ANDRADE',
        endereco_entrega: 'Rua das Palmeiras, 78 – Bracuí, Angra dos Reis/RJ'
      },
      itens: [
        {
          descricao: 'CONCRETO USINADO FCK 30 MPA',
          descricao_detalhada: 'Fornecimento de concreto usinado fck 30 MPa, slump 12±2, bombeado, para concretagem de laje maciça do pavimento superior da residência, área de 110m².',
          data_servico: '2026-03-20',
          unidade: 'M³',
          quantidade: 14,
          valor_unitario: 620.00,
          valor_total_sem_desconto: 8680.00,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: 8680.00
        },
        {
          descricao: 'BOMBEAMENTO DE CONCRETO',
          descricao_detalhada: 'Serviço de bombeamento de concreto com bomba lança de 28m, incluindo tubulação e operador, para lançamento na laje a 6m de altura.',
          data_servico: '2026-03-20',
          unidade: 'DIÁRIA',
          quantidade: 1,
          valor_unitario: 3500.00,
          valor_total_sem_desconto: 3500.00,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: 3500.00
        },
        {
          descricao: 'DIÁRIA DE CAMINHÃO TOCO 8M',
          descricao_detalhada: 'Caminhão toco para apoio logístico no dia da concretagem, transporte de formas, escoras e ferramentas.',
          data_servico: '2026-03-20',
          unidade: 'DIÁRIA',
          quantidade: 1,
          valor_unitario: 1450.00,
          valor_total_sem_desconto: 1450.00,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: 1450.00
        },
        {
          descricao: 'AÇO CA-50 E CA-60',
          descricao_detalhada: 'Fornecimento de aço para armação positiva e negativa da laje, incluindo corte, dobra e amarração conforme projeto estrutural.',
          data_servico: '2026-03-18',
          unidade: 'KG',
          quantidade: 380,
          valor_unitario: 12.50,
          valor_total_sem_desconto: 4750.00,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: 4750.00
        }
      ],
      total_geral: 18380.00,
      observacao: 'Concretagem deve ser realizada em etapa única. Forma e escoramento por conta do contratante.',
      status: 'aceita'
    },

    // 10 – Urbanização loteamento
    {
      numero: 'P-2026-010',
      data_emissao: '2026-03-07',
      cliente: {
        id: clienteIds['CONSTRUTORA LITORAL SUL'] || '',
        nome: 'CONSTRUTORA LITORAL SUL',
        endereco_entrega: 'Loteamento Mar Azul, fase 2 – Angra dos Reis/RJ'
      },
      itens: [
        {
          descricao: 'TERRAPLANAGEM GERAL DO LOTEAMENTO',
          descricao_detalhada: 'Serviço de terraplanagem em área de 5.000m² para abertura de vias e platôs dos lotes, incluindo corte e aterro compensado com máquinas pesadas.',
          data_servico: '2026-03-20',
          unidade: 'DIÁRIA',
          quantidade: 10,
          valor_unitario: 2200.00,
          valor_total_sem_desconto: 22000.00,
          desconto_percentual: 10,
          desconto_valor: 2200.00,
          valor_total: 19800.00
        },
        {
          descricao: 'CAMINHÃO DE BARRO',
          descricao_detalhada: 'Fornecimento de saibro compactável para regularização e sub-base das vias internas do loteamento.',
          data_servico: '2026-03-25',
          unidade: 'MT',
          quantidade: 30,
          valor_unitario: 190.00,
          valor_total_sem_desconto: 5700.00,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: 5700.00
        },
        {
          descricao: 'CAMINHÃO DE BRITA 0 (PÓ DE PEDRA)',
          descricao_detalhada: 'Pó de pedra para camada de acabamento e compactação final das vias do loteamento, espessura de 5cm.',
          data_servico: '2026-03-28',
          unidade: 'MT',
          quantidade: 20,
          valor_unitario: 250.00,
          valor_total_sem_desconto: 5000.00,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: 5000.00
        },
        {
          descricao: 'DIÁRIA DE ROLO COMPACTADOR',
          descricao_detalhada: 'Rolo compactador vibratório liso de 10 toneladas para compactação das camadas de aterro e sub-base das vias.',
          data_servico: '2026-03-26',
          unidade: 'DIÁRIA',
          quantidade: 5,
          valor_unitario: 1600.00,
          valor_total_sem_desconto: 8000.00,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: 8000.00
        },
        {
          descricao: 'MEIO-FIO PRÉ-MOLDADO',
          descricao_detalhada: 'Fornecimento e assentamento de meio-fio de concreto 100x15x30cm em todas as vias do loteamento, sobre base de concreto magro.',
          data_servico: '2026-04-01',
          unidade: 'ML',
          quantidade: 200,
          valor_unitario: 45.00,
          valor_total_sem_desconto: 9000.00,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: 9000.00
        },
        {
          descricao: 'CAMINHÃO DE ATERRO',
          descricao_detalhada: 'Material de aterro complementar para nivelamento de lotes com cota abaixo do greide projetado.',
          data_servico: '2026-03-22',
          unidade: 'MT',
          quantidade: 40,
          valor_unitario: 70.00,
          valor_total_sem_desconto: 2800.00,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: 2800.00
        }
      ],
      total_geral: 50300.00,
      observacao: 'Proposta referente à fase 2 do loteamento. Valores válidos por 30 dias. Pagamento: 30/60/90 dias.',
      status: 'pendente'
    }
  ]

  for (const proposta of propostas) {
    storage.create('propostas', proposta)
  }
}
